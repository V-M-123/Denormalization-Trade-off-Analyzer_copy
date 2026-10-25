import { Client } from 'pg';
import { ParsedSchema, TableDefinition, ColumnDefinition } from './ddlParser';

export interface PostgresIntrospectionResult {
  schema: ParsedSchema;
  totalRowCount: number;
  tableStats: Array<{
    name: string;
    columnCount: number;
    estimatedRows: number;
  }>;
  generatedDDL: string;
}

/**
 * Normalizes PostgreSQL data types into standard SQL types
 */
export function formatPostgresType(col: {
  data_type: string;
  udt_name: string;
  character_maximum_length: number | null;
  numeric_precision: number | null;
  numeric_scale: number | null;
}): string {
  const dt = col.data_type.toLowerCase();
  const udt = col.udt_name ? col.udt_name.toLowerCase() : '';

  if (dt === 'character varying' || dt === 'varchar') {
    return col.character_maximum_length ? `VARCHAR(${col.character_maximum_length})` : 'VARCHAR(255)';
  }
  if (dt === 'character' || dt === 'char') {
    return col.character_maximum_length ? `CHAR(${col.character_maximum_length})` : 'CHAR(1)';
  }
  if (dt === 'integer' || dt === 'int' || udt === 'int4') return 'INT';
  if (dt === 'bigint' || udt === 'int8') return 'BIGINT';
  if (dt === 'smallint' || udt === 'int2') return 'SMALLINT';
  if (dt === 'numeric' || dt === 'decimal') {
    if (col.numeric_precision && col.numeric_scale) {
      return `DECIMAL(${col.numeric_precision},${col.numeric_scale})`;
    }
    return 'DECIMAL(12,2)';
  }
  if (dt === 'boolean' || udt === 'bool') return 'BOOLEAN';
  if (dt.includes('timestamp')) return 'TIMESTAMP';
  if (dt === 'date') return 'DATE';
  if (dt === 'time' || dt.includes('time without')) return 'TIME';
  if (dt === 'json' || dt === 'jsonb') return 'JSONB';
  if (dt === 'uuid') return 'UUID';
  if (dt === 'text') return 'TEXT';

  return dt.toUpperCase();
}

/**
 * Connects to a live PostgreSQL / Supabase instance, introspects schema metadata,
 * foreign keys, and row counts, and returns a ParsedSchema AST.
 */
export async function introspectPostgres(
  connectionString: string,
  targetSchema: string = 'public'
): Promise<PostgresIntrospectionResult> {
  const trimmedUri = connectionString.trim();
  if (!trimmedUri) {
    throw new Error('Connection string cannot be empty.');
  }

  // Enforce SSL for cloud hosted PostgreSQL (e.g. Supabase, Neon, RDS)
  const client = new Client({
    connectionString: trimmedUri,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 15000,
  });

  try {
    await client.connect();

    // 1. Fetch user tables
    const tablesRes = await client.query<{ table_name: string }>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = $1 AND table_type = 'BASE TABLE'
       ORDER BY table_name;`,
      [targetSchema]
    );

    if (tablesRes.rows.length === 0) {
      throw new Error(`No tables found in schema "${targetSchema}". Verify your schema name or database permissions.`);
    }

    // 2. Fetch all columns
    const columnsRes = await client.query<{
      table_name: string;
      column_name: string;
      data_type: string;
      udt_name: string;
      character_maximum_length: number | null;
      numeric_precision: number | null;
      numeric_scale: number | null;
      is_nullable: string;
    }>(
      `SELECT 
         table_name,
         column_name,
         data_type,
         udt_name,
         character_maximum_length,
         numeric_precision,
         numeric_scale,
         is_nullable
       FROM information_schema.columns
       WHERE table_schema = $1
       ORDER BY table_name, ordinal_position;`,
      [targetSchema]
    );

    // 3. Fetch primary keys
    const pkRes = await client.query<{
      table_name: string;
      column_name: string;
    }>(
      `SELECT 
         tc.table_name,
         kcu.column_name
       FROM information_schema.table_constraints tc
       JOIN information_schema.key_column_usage kcu
         ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
       WHERE tc.constraint_type = 'PRIMARY KEY'
         AND tc.table_schema = $1
       ORDER BY tc.table_name, kcu.ordinal_position;`,
      [targetSchema]
    );

    // 4. Fetch foreign key referential constraints
    const fkRes = await client.query<{
      source_table: string;
      source_column: string;
      target_table: string;
      target_column: string;
    }>(
      `SELECT
         tc.table_name AS source_table,
         kcu.column_name AS source_column,
         ccu.table_name AS target_table,
         ccu.column_name AS target_column
       FROM information_schema.table_constraints AS tc
       JOIN information_schema.key_column_usage AS kcu
         ON tc.constraint_name = kcu.constraint_name
         AND tc.table_schema = kcu.table_schema
       JOIN information_schema.constraint_column_usage AS ccu
         ON ccu.constraint_name = tc.constraint_name
         AND ccu.table_schema = tc.table_schema
       WHERE tc.constraint_type = 'FOREIGN KEY'
         AND tc.table_schema = $1;`,
      [targetSchema]
    );

    // 5. Fetch live row count estimates from pg_stat_user_tables
    const statsRes = await client.query<{
      table_name: string;
      row_count: string | number;
    }>(
      `SELECT 
         relname AS table_name,
         n_live_tup AS row_count
       FROM pg_stat_user_tables
       WHERE schemaname = $1;`,
      [targetSchema]
    );

    const rowCountsMap = new Map<string, number>();
    statsRes.rows.forEach(r => {
      rowCountsMap.set(r.table_name, Math.max(0, Number(r.row_count) || 0));
    });

    // Organize Primary Keys by table
    const pksByTable = new Map<string, string[]>();
    pkRes.rows.forEach(r => {
      if (!pksByTable.has(r.table_name)) pksByTable.set(r.table_name, []);
      pksByTable.get(r.table_name)!.push(r.column_name);
    });

    // Organize Foreign Keys by table
    const fksByTable = new Map<string, Array<{ column: string; referencedTable: string; referencedColumn: string }>>();
    fkRes.rows.forEach(r => {
      if (!fksByTable.has(r.source_table)) fksByTable.set(r.source_table, []);
      fksByTable.get(r.source_table)!.push({
        column: r.source_column,
        referencedTable: r.target_table,
        referencedColumn: r.target_column,
      });
    });

    // Organize Columns by table
    const colsByTable = new Map<string, ColumnDefinition[]>();
    columnsRes.rows.forEach(col => {
      if (!colsByTable.has(col.table_name)) colsByTable.set(col.table_name, []);
      const pks = pksByTable.get(col.table_name) || [];
      const isPk = pks.includes(col.column_name);
      const fks = fksByTable.get(col.table_name) || [];
      const fkMatch = fks.find(f => f.column === col.column_name);

      colsByTable.get(col.table_name)!.push({
        name: col.column_name,
        type: formatPostgresType(col),
        isNullable: col.is_nullable.toUpperCase() === 'YES' && !isPk,
        isPrimaryKey: isPk,
        isForeignKey: !!fkMatch,
        references: fkMatch ? { table: fkMatch.referencedTable, column: fkMatch.referencedColumn } : undefined,
      });
    });

    // Build Tables
    const tables: TableDefinition[] = [];
    const tableStats: Array<{ name: string; columnCount: number; estimatedRows: number }> = [];
    let totalRowCount = 0;

    for (const tRow of tablesRes.rows) {
      const tName = tRow.table_name;
      const columns = colsByTable.get(tName) || [];
      const primaryKeys = pksByTable.get(tName) || [];
      const foreignKeys = fksByTable.get(tName) || [];
      const rowCount = rowCountsMap.get(tName) || 1000;

      totalRowCount += rowCount;

      tables.push({
        name: tName,
        columns,
        primaryKeys,
        foreignKeys,
      });

      tableStats.push({
        name: tName,
        columnCount: columns.length,
        estimatedRows: rowCount,
      });
    }

    const schema: ParsedSchema = {
      tables,
      dialect: 'postgres',
      rawStatementCount: tables.length,
    };

    // Generate clean SQL DDL
    const ddlBlocks: string[] = [
      `-- Introspected Live PostgreSQL Schema (Supabase)`,
      `-- Schema: "${targetSchema}" | Tables: ${tables.length} | Estimated Total Rows: ${totalRowCount.toLocaleString()}`,
    ];

    for (const t of tables) {
      const lines = [`CREATE TABLE ${t.name} (`];
      const colDefs = t.columns.map(c => {
        let line = `  ${c.name} ${c.type}`;
        if (c.isPrimaryKey) line += ' PRIMARY KEY';
        if (!c.isNullable && !c.isPrimaryKey) line += ' NOT NULL';
        if (c.references) line += ` REFERENCES ${c.references.table}(${c.references.column})`;
        return line;
      });
      lines.push(colDefs.join(',\n'));
      lines.push(');');
      ddlBlocks.push(lines.join('\n'));
    }

    return {
      schema,
      totalRowCount: Math.max(1000, totalRowCount),
      tableStats,
      generatedDDL: ddlBlocks.join('\n\n'),
    };
  } finally {
    await client.end().catch(() => {});
  }
}
