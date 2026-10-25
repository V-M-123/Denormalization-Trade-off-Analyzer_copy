import { ParsedSchema, TableDefinition } from '../parser/ddlParser';
import { SchemaTableRecord, SchemaRelationshipRecord } from '../db/supabaseClient';

export interface SchemaDiffResult {
  hasChanges: boolean;
  summary: string;
  addedTables: string[];
  removedTables: string[];
  modifiedTables: Array<{
    tableName: string;
    addedColumns: Array<{ name: string; type: string }>;
    removedColumns: string[];
    rowCountDelta: number;
    oldRowCount: number;
    newRowCount: number;
  }>;
  addedRelationships: Array<{
    sourceTable: string;
    sourceColumn: string;
    targetTable: string;
    targetColumn: string;
  }>;
  removedRelationships: Array<{
    sourceTable: string;
    sourceColumn: string;
    targetTable: string;
    targetColumn: string;
  }>;
  metricsDiff: {
    tableCount: { old: number; new: number };
    foreignKeysCount: { old: number; new: number };
    maxJoinDepth: { old: number; new: number };
  };
}

/**
 * Compares stored snapshot metadata (from schema_tables & schema_relationships)
 * against a live introspected schema AST.
 */
export function computeSchemaDiff(params: {
  storedTables: SchemaTableRecord[];
  storedRelationships: SchemaRelationshipRecord[];
  storedMetrics: {
    tableCount: number;
    foreignKeysCount: number;
    maxJoinDepth: number;
  };
  liveSchema: ParsedSchema;
  liveStats: Array<{ name: string; columnCount: number; estimatedRows: number }>;
  liveMaxJoinDepth: number;
}): SchemaDiffResult {
  const storedTableMap = new Map<string, SchemaTableRecord>();
  for (const t of params.storedTables) {
    storedTableMap.set(t.table_name.toLowerCase(), t);
  }

  const liveTableMap = new Map<string, TableDefinition>();
  for (const t of params.liveSchema.tables) {
    liveTableMap.set(t.name.toLowerCase(), t);
  }

  const liveStatsMap = new Map<string, { columnCount: number; estimatedRows: number }>();
  for (const s of params.liveStats) {
    liveStatsMap.set(s.name.toLowerCase(), s);
  }

  const addedTables: string[] = [];
  const removedTables: string[] = [];
  const modifiedTables: SchemaDiffResult['modifiedTables'] = [];

  // 1. Detect added and modified tables
  for (const [lowerName, liveTable] of liveTableMap.entries()) {
    const storedTable = storedTableMap.get(lowerName);
    const liveStat = liveStatsMap.get(lowerName) || { columnCount: liveTable.columns.length, estimatedRows: 100000 };

    if (!storedTable) {
      addedTables.push(liveTable.name);
    } else {
      const liveColCount = liveTable.columns.length;
      const storedColCount = storedTable.column_count;
      const rowCountDelta = liveStat.estimatedRows - storedTable.estimated_row_count;

      // Note: We detect column additions / modifications
      // If column count changed or row count changed significantly
      const colCountChanged = liveColCount !== storedColCount;
      const rowCountChanged = Math.abs(rowCountDelta) > 0;

      if (colCountChanged || rowCountChanged) {
        modifiedTables.push({
          tableName: liveTable.name,
          addedColumns: liveColCount > storedColCount ? liveTable.columns.slice(storedColCount).map(c => ({ name: c.name, type: c.type })) : [],
          removedColumns: [],
          rowCountDelta,
          oldRowCount: storedTable.estimated_row_count,
          newRowCount: liveStat.estimatedRows
        });
      }
    }
  }

  // 2. Detect removed tables
  for (const [lowerName, storedTable] of storedTableMap.entries()) {
    if (!liveTableMap.has(lowerName)) {
      removedTables.push(storedTable.table_name);
    }
  }

  // 3. Detect relationship changes
  const storedRelKeys = new Set(
    params.storedRelationships.map(r => `${r.source_table.toLowerCase()}.${r.source_column.toLowerCase()}->${r.target_table.toLowerCase()}.${r.target_column.toLowerCase()}`)
  );

  const liveRelationships: Array<{ sourceTable: string; sourceColumn: string; targetTable: string; targetColumn: string }> = [];
  for (const t of params.liveSchema.tables) {
    for (const fk of t.foreignKeys) {
      liveRelationships.push({
        sourceTable: t.name,
        sourceColumn: fk.column,
        targetTable: fk.referencedTable,
        targetColumn: fk.referencedColumn
      });
    }
  }

  const liveRelKeys = new Set(
    liveRelationships.map(r => `${r.sourceTable.toLowerCase()}.${r.sourceColumn.toLowerCase()}->${r.targetTable.toLowerCase()}.${r.targetColumn.toLowerCase()}`)
  );

  const addedRelationships = liveRelationships.filter(r => 
    !storedRelKeys.has(`${r.sourceTable.toLowerCase()}.${r.sourceColumn.toLowerCase()}->${r.targetTable.toLowerCase()}.${r.targetColumn.toLowerCase()}`)
  );

  const removedRelationships = params.storedRelationships.filter(r =>
    !liveRelKeys.has(`${r.source_table.toLowerCase()}.${r.source_column.toLowerCase()}->${r.target_table.toLowerCase()}.${r.target_column.toLowerCase()}`)
  ).map(r => ({
    sourceTable: r.source_table,
    sourceColumn: r.source_column,
    targetTable: r.target_table,
    targetColumn: r.target_column
  }));

  // 4. Metrics diff
  const liveFkCount = liveRelationships.length;
  const metricsDiff = {
    tableCount: { old: params.storedMetrics.tableCount, new: params.liveSchema.tables.length },
    foreignKeysCount: { old: params.storedMetrics.foreignKeysCount, new: liveFkCount },
    maxJoinDepth: { old: params.storedMetrics.maxJoinDepth, new: params.liveMaxJoinDepth }
  };

  const hasChanges = (
    addedTables.length > 0 ||
    removedTables.length > 0 ||
    modifiedTables.length > 0 ||
    addedRelationships.length > 0 ||
    removedRelationships.length > 0 ||
    metricsDiff.maxJoinDepth.old !== metricsDiff.maxJoinDepth.new
  );

  // 5. Construct concise human-readable summary
  const summaryParts: string[] = [];
  if (addedTables.length > 0) summaryParts.push(`${addedTables.length} new table(s) added (${addedTables.join(', ')})`);
  if (removedTables.length > 0) summaryParts.push(`${removedTables.length} table(s) removed (${removedTables.join(', ')})`);
  if (modifiedTables.length > 0) summaryParts.push(`${modifiedTables.length} table(s) modified with column or row count updates`);
  if (addedRelationships.length > 0) summaryParts.push(`${addedRelationships.length} new foreign key relationship(s) detected`);
  if (removedRelationships.length > 0) summaryParts.push(`${removedRelationships.length} foreign key relationship(s) removed`);
  if (metricsDiff.maxJoinDepth.old !== metricsDiff.maxJoinDepth.new) {
    summaryParts.push(`Max join depth shifted from ${metricsDiff.maxJoinDepth.old} to ${metricsDiff.maxJoinDepth.new}`);
  }

  const summary = hasChanges 
    ? summaryParts.join('. ') + '.' 
    : 'No structural or relational changes detected in the database.';

  return {
    hasChanges,
    summary,
    addedTables,
    removedTables,
    modifiedTables,
    addedRelationships,
    removedRelationships,
    metricsDiff
  };
}
