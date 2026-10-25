import pkg from 'node-sql-parser';

export interface ColumnDefinition {
  name: string;
  type: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  references?: {
    table: string;
    column: string;
  };
}

export interface TableDefinition {
  name: string;
  columns: ColumnDefinition[];
  primaryKeys: string[];
  foreignKeys: Array<{
    column: string;
    referencedTable: string;
    referencedColumn: string;
  }>;
}

export interface ParsedSchema {
  tables: TableDefinition[];
  dialect: string;
  rawStatementCount: number;
}

const ParserClass = (pkg as any).Parser || pkg;
const parser = new ParserClass();

/**
 * Parses raw DDL SQL into a structured schema definition.
 * Employs node-sql-parser with regex fallback for vendor-specific DDL clauses.
 */
export function parseDDL(sqlContent: string, dialect: string = 'generic'): ParsedSchema {
  const tablesMap = new Map<string, TableDefinition>();
  const sqlDialect = dialect === 'postgres' ? 'postgresql' : dialect === 'sqlite' ? 'sqlite' : 'mysql';

  try {
    const ast = parser.astify(sqlContent, { database: sqlDialect });
    const statements = Array.isArray(ast) ? ast : [ast];

    for (const stmt of statements) {
      if (!stmt || typeof stmt !== 'object') continue;

      // Handle CREATE TABLE statements
      if ((stmt as any).type === 'create' && (stmt as any).keyword === 'table') {
        const createStmt = stmt as any;
        const rawTableName = createStmt.table?.[0]?.table || createStmt.table;
        if (!rawTableName) continue;

        const tableName = cleanIdentifier(rawTableName);
        const columns: ColumnDefinition[] = [];
        const primaryKeys: string[] = [];
        const foreignKeys: Array<{ column: string; referencedTable: string; referencedColumn: string }> = [];

        if (Array.isArray(createStmt.create_definitions)) {
          for (const def of createStmt.create_definitions) {
            // Column definition
            if (def.resource === 'column') {
              const colName = cleanIdentifier(def.column?.column || def.column);
              const colType = def.definition?.dataType || 'VARCHAR';
              const isNullable = !def.nullable || def.nullable.value !== 'not null';
              const isPk = !!def.primary_key;
              if (isPk) primaryKeys.push(colName);

              // Inline column references: e.g. customer_id INT REFERENCES Customers(customer_id)
              if (def.reference_definition) {
                const refTable = cleanIdentifier(def.reference_definition.table?.[0]?.table || def.reference_definition.table);
                const refCol = cleanIdentifier(def.reference_definition.definition?.[0]?.column || def.reference_definition.columns?.[0] || colName);
                if (refTable) {
                  foreignKeys.push({ column: colName, referencedTable: refTable, referencedColumn: refCol });
                }
              }

              columns.push({
                name: colName,
                type: colType,
                isNullable,
                isPrimaryKey: isPk,
                isForeignKey: false,
              });
            }

            // Primary Key constraint
            if (def.constraint_type === 'primary key' || def.resource === 'primary key') {
              const pkCols = def.definition || def.columns || [];
              for (const pk of pkCols) {
                const pkColName = cleanIdentifier(pk.column || pk);
                if (!primaryKeys.includes(pkColName)) primaryKeys.push(pkColName);
              }
            }

            // Foreign Key constraint
            if (def.constraint_type === 'foreign key' || def.resource === 'foreign key' || def.reference_definition) {
              const localCol = cleanIdentifier(def.definition?.[0]?.column || def.columns?.[0]?.column || def.columns?.[0] || def.column?.column || def.column);
              const refTable = cleanIdentifier(def.reference_definition?.table?.[0]?.table || def.reference_definition?.table);
              const refCol = cleanIdentifier(def.reference_definition?.definition?.[0]?.column || def.reference_definition?.columns?.[0]);

              if (localCol && refTable) {
                foreignKeys.push({
                  column: localCol,
                  referencedTable: refTable,
                  referencedColumn: refCol || localCol,
                });
              }
            }
          }
        }

        // Sync flags
        for (const col of columns) {
          if (primaryKeys.includes(col.name)) col.isPrimaryKey = true;
          const fk = foreignKeys.find(f => f.column === col.name);
          if (fk) {
            col.isForeignKey = true;
            col.references = { table: fk.referencedTable, column: fk.referencedColumn };
          }
        }

        tablesMap.set(tableName.toLowerCase(), {
          name: tableName,
          columns,
          primaryKeys,
          foreignKeys,
        });
      }
    }
  } catch {
    // AST parser encountered syntax token, regex will handle
  }

  // Always run regex enrichment to capture vendor-specific inline REFERENCES and constraints
  parseDDLWithRegex(sqlContent, tablesMap);

  return {
    tables: Array.from(tablesMap.values()),
    dialect,
    rawStatementCount: tablesMap.size,
  };
}

/**
 * Regex-based DDL parser fallback.
 * Ensures parsing succeeds even with exotic vendor syntax, enums, comments, or procedural blocks.
 */
function parseDDLWithRegex(sql: string, tablesMap: Map<string, TableDefinition>) {
  // Strip block and inline comments
  const cleanSql = sql
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/--.*$/gm, '')
    .replace(/#.*$/gm, '');

  const createTableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"']?[\w_]+[`"']?)\s*\(([\s\S]*?)\)(?:\s*;|\s*$|\s*(?=CREATE\s+TABLE))/gi;
  let match;

  while ((match = createTableRegex.exec(cleanSql)) !== null) {
    const rawTableName = cleanIdentifier(match[1]);
    const body = match[2];
    const columns: ColumnDefinition[] = [];
    const primaryKeys: string[] = [];
    const foreignKeys: Array<{ column: string; referencedTable: string; referencedColumn: string }> = [];

    const lines = splitTableDefinitions(body);

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Table-level PRIMARY KEY constraint
      const pkMatch = line.match(/^PRIMARY\s+KEY\s*\(([^)]+)\)/i);
      if (pkMatch) {
        const cols = pkMatch[1].split(',').map(c => cleanIdentifier(c.trim()));
        primaryKeys.push(...cols);
        continue;
      }

      // Table-level FOREIGN KEY constraint
      const fkMatch = line.match(/FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+([`"']?[\w_]+[`"']?)\s*\(([^)]+)\)/i);
      if (fkMatch) {
        const localCol = cleanIdentifier(fkMatch[1].trim());
        const refTable = cleanIdentifier(fkMatch[2].trim());
        const refCol = cleanIdentifier(fkMatch[3].trim());
        foreignKeys.push({ column: localCol, referencedTable: refTable, referencedColumn: refCol });
        continue;
      }

      // Inline FOREIGN KEY / REFERENCES
      const inlineFkMatch = line.match(/^([`"']?[\w_]+[`"']?)\s+([\w_]+(?:\([^)]+\))?)[^,]*\bREFERENCES\s+([`"']?[\w_]+[`"']?)\s*(?:\(([^)]+)\))?/i);
      if (inlineFkMatch) {
        const colName = cleanIdentifier(inlineFkMatch[1]);
        const colType = inlineFkMatch[2];
        const refTable = cleanIdentifier(inlineFkMatch[3]);
        const refCol = cleanIdentifier(inlineFkMatch[4] || colName);
        const isPk = /\bPRIMARY\s+KEY\b/i.test(line);
        if (isPk) primaryKeys.push(colName);

        foreignKeys.push({ column: colName, referencedTable: refTable, referencedColumn: refCol });
        columns.push({
          name: colName,
          type: colType,
          isNullable: !/\bNOT\s+NULL\b/i.test(line),
          isPrimaryKey: isPk,
          isForeignKey: true,
          references: { table: refTable, column: refCol }
        });
        continue;
      }

      // Standard Column Definition
      const colMatch = line.match(/^([`"']?[\w_]+[`"']?)\s+([\w_]+(?:\([^)]+\))?)/);
      if (colMatch) {
        const colName = cleanIdentifier(colMatch[1]);
        const colType = colMatch[2];
        const isPk = /\bPRIMARY\s+KEY\b/i.test(line);
        if (isPk) primaryKeys.push(colName);

        columns.push({
          name: colName,
          type: colType,
          isNullable: !/\bNOT\s+NULL\b/i.test(line),
          isPrimaryKey: isPk,
          isForeignKey: false,
        });
      }
    }

    // Harmonize keys
    for (const col of columns) {
      if (primaryKeys.includes(col.name)) col.isPrimaryKey = true;
      const fk = foreignKeys.find(f => f.column === col.name);
      if (fk) {
        col.isForeignKey = true;
        col.references = { table: fk.referencedTable, column: fk.referencedColumn };
      }
    }

    tablesMap.set(rawTableName.toLowerCase(), {
      name: rawTableName,
      columns,
      primaryKeys,
      foreignKeys,
    });
  }

  // If no tables matched formal CREATE TABLE syntax, try relaxed schema extraction
  if (tablesMap.size === 0) {
    parseLenientDDL(cleanSql, tablesMap);
  }
}

/**
 * Lenient fallback for informal table definitions (e.g. table_name(col1, col2) or field lists)
 */
function parseLenientDDL(sql: string, tablesMap: Map<string, TableDefinition>) {
  // Pattern 1: table_name ( col1 type, col2 type ) without explicit CREATE TABLE keyword
  const relaxedTableRegex = /(?:TABLE\s+)?([`"']?[\w_]+[`"']?)\s*\(([\s\S]*?)\)/gi;
  let match;

  while ((match = relaxedTableRegex.exec(sql)) !== null) {
    const rawTableName = cleanIdentifier(match[1]);
    // Skip common SQL functions or non-table keywords
    if (/^(SELECT|INSERT|UPDATE|DELETE|COUNT|AVG|SUM|MAX|MIN|WHERE|GROUP|ORDER|HAVING|VALUES|JOIN)$/i.test(rawTableName)) {
      continue;
    }

    const body = match[2];
    const columns: ColumnDefinition[] = [];
    const lines = splitTableDefinitions(body);

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      const colMatch = line.match(/^([`"']?[\w_]+[`"']?)(?:\s+([\w_]+(?:\([^)]+\))?))?/);
      if (colMatch && colMatch[1]) {
        const colName = cleanIdentifier(colMatch[1]);
        if (!/^(PRIMARY|FOREIGN|KEY|CONSTRAINT|INDEX|UNIQUE|CHECK)$/i.test(colName)) {
          columns.push({
            name: colName,
            type: colMatch[2] || 'VARCHAR(255)',
            isNullable: true,
            isPrimaryKey: /id$/i.test(colName),
            isForeignKey: false,
          });
        }
      }
    }

    if (columns.length > 0) {
      tablesMap.set(rawTableName.toLowerCase(), {
        name: rawTableName,
        columns,
        primaryKeys: columns.filter(c => c.isPrimaryKey).map(c => c.name),
        foreignKeys: [],
      });
    }
  }
}

function splitTableDefinitions(body: string): string[] {
  const result: string[] = [];
  let start = 0;
  let parenDepth = 0;

  for (let i = 0; i < body.length; i++) {
    const char = body[i];
    if (char === '(') parenDepth++;
    else if (char === ')') parenDepth--;

    if (char === ',' && parenDepth === 0) {
      const segment = body.slice(start, i).trim();
      if (segment) result.push(segment);
      start = i + 1;
    }
  }
  const lastSegment = body.slice(start).trim();
  if (lastSegment) result.push(lastSegment);
  return result;
}

function cleanIdentifier(id: string): string {
  if (!id) return '';
  return id.replace(/[`"'[\]]/g, '').trim();
}
