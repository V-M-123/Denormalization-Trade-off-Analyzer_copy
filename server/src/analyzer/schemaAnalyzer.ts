import { ParsedSchema, TableDefinition } from '../parser/ddlParser';

export interface RedundancyDiagnostic {
  tables: string[];
  column: string;
  severity: 'low' | 'medium' | 'high';
  insight: string;
}

export interface DenormalizationOpportunity {
  sourceTable: string;
  targetTable: string;
  candidateColumns: string[];
  estimatedReadSpeedup: string;
  writePenaltyRisk: string;
}

export interface SchemaAnalysisResult {
  summary: {
    tableCount: number;
    totalColumns: number;
    foreignKeysCount: number;
    estimatedNormalForm: '1NF' | '2NF' | '3NF' | 'Denormalized';
    maxJoinDepth: number;
    detectedRelations: Array<{ from: string; to: string; type: string }>;
  };
  diagnostics: {
    detectedRedundancies: RedundancyDiagnostic[];
    denormalizationOpportunities: DenormalizationOpportunity[];
    writeAmplificationRisks: Array<{ table: string; warning: string; score: number }>;
  };
}

/**
 * Analyzes parsed table schemas to calculate join graph depth,
 * detect duplicated attributes, and find denormalization opportunities.
 */
export function analyzeSchema(schema: ParsedSchema): SchemaAnalysisResult {
  const { tables } = schema;
  const tableCount = tables.length;
  let totalColumns = 0;
  let foreignKeysCount = 0;
  const detectedRelations: Array<{ from: string; to: string; type: string }> = [];

  // 1. Build adjacency graph for Foreign Keys
  const adj = new Map<string, string[]>();
  for (const t of tables) {
    totalColumns += t.columns.length;
    adj.set(t.name.toLowerCase(), []);
  }

  for (const t of tables) {
    for (const fk of t.foreignKeys) {
      foreignKeysCount++;
      const fromTable = t.name.toLowerCase();
      const toTable = fk.referencedTable.toLowerCase();

      detectedRelations.push({
        from: `${t.name}.${fk.column}`,
        to: `${fk.referencedTable}.${fk.referencedColumn}`,
        type: 'many-to-one',
      });

      if (adj.has(fromTable)) {
        adj.get(fromTable)!.push(toTable);
      }
    }
  }

  // 2. Compute Maximum Join Depth (Longest Path in DAG)
  const maxJoinDepth = calculateMaxJoinDepth(adj);

  // 3. Detect Redundancies / Duplications
  const detectedRedundancies = detectRedundantColumns(tables);

  // 4. Identify Denormalization Candidates
  const denormalizationOpportunities = findDenormalizationOpportunities(tables);

  // 5. Detect Write Amplification Hazards
  const writeAmplificationRisks = detectWriteAmplificationRisks(tables, detectedRedundancies);

  // 6. Estimate Current Normal Form
  const estimatedNormalForm = estimateNormalForm(tables, detectedRedundancies, maxJoinDepth);

  return {
    summary: {
      tableCount,
      totalColumns,
      foreignKeysCount,
      estimatedNormalForm,
      maxJoinDepth,
      detectedRelations,
    },
    diagnostics: {
      detectedRedundancies,
      denormalizationOpportunities,
      writeAmplificationRisks,
    },
  };
}

function calculateMaxJoinDepth(adj: Map<string, string[]>): number {
  if (adj.size === 0) return 0;
  let maxDepth = 0;

  const memo = new Map<string, number>();
  const visited = new Set<string>();

  function dfs(node: string): number {
    if (memo.has(node)) return memo.get(node)!;
    if (visited.has(node)) return 0; // Prevent cycle infinite loop

    visited.add(node);
    let currentMax = 0;

    const neighbors = adj.get(node) || [];
    for (const neighbor of neighbors) {
      currentMax = Math.max(currentMax, 1 + dfs(neighbor));
    }
    visited.delete(node);

    memo.set(node, currentMax);
    return currentMax;
  }

  for (const node of adj.keys()) {
    maxDepth = Math.max(maxDepth, dfs(node));
  }

  return Math.min(maxDepth + 1, 8); // +1 table count in chain
}

function detectRedundantColumns(tables: TableDefinition[]): RedundancyDiagnostic[] {
  const columnTableMap = new Map<string, string[]>();
  const diagnostics: RedundancyDiagnostic[] = [];

  // Ignore standard technical keys
  const ignoredKeys = new Set(['id', 'created_at', 'updated_at', 'status', 'is_active', 'deleted_at']);

  for (const table of tables) {
    for (const col of table.columns) {
      const lower = col.name.toLowerCase();
      // Skip foreign and primary keys
      if (col.isPrimaryKey || col.isForeignKey || ignoredKeys.has(lower) || lower.endsWith('_id')) {
        continue;
      }

      if (!columnTableMap.has(lower)) {
        columnTableMap.set(lower, []);
      }
      columnTableMap.get(lower)!.push(table.name);
    }
  }

  for (const [colName, tableNames] of columnTableMap.entries()) {
    if (tableNames.length > 1) {
      const isCritical = colName.includes('name') || colName.includes('price') || colName.includes('amount') || colName.includes('address');
      diagnostics.push({
        tables: tableNames,
        column: colName,
        severity: isCritical ? 'high' : 'medium',
        insight: `Column "${colName}" is duplicated across [${tableNames.join(', ')}]. Saves join lookups but requires synchronized updates.`,
      });
    }
  }

  return diagnostics;
}

function findDenormalizationOpportunities(tables: TableDefinition[]): DenormalizationOpportunity[] {
  const opportunities: DenormalizationOpportunity[] = [];
  const tableMap = new Map<string, TableDefinition>();
  for (const t of tables) {
    tableMap.set(t.name.toLowerCase(), t);
  }

  for (const childTable of tables) {
    for (const fk of childTable.foreignKeys) {
      const parentTable = tableMap.get(fk.referencedTable.toLowerCase());
      if (!parentTable) continue;

      // Find descriptive candidate columns from parent table (e.g. name, title, email)
      const candidateCols = parentTable.columns
        .filter(c => !c.isPrimaryKey && !c.isForeignKey && (c.type.toUpperCase().includes('CHAR') || c.type.toUpperCase().includes('TEXT')))
        .map(c => c.name)
        .slice(0, 3);

      if (candidateCols.length > 0) {
        opportunities.push({
          sourceTable: parentTable.name,
          targetTable: childTable.name,
          candidateColumns: candidateCols,
          estimatedReadSpeedup: '+25% to +45% (eliminates JOIN on foreign key)',
          writePenaltyRisk: `Updates to ${parentTable.name} require cascading updates on ${childTable.name}.`,
        });
      }
    }
  }

  return opportunities;
}

function detectWriteAmplificationRisks(tables: TableDefinition[], redundancies: RedundancyDiagnostic[]): Array<{ table: string; warning: string; score: number }> {
  const risks: Array<{ table: string; warning: string; score: number }> = [];

  const tableRedundancyMap = new Map<string, RedundancyDiagnostic[]>();
  for (const r of redundancies) {
    for (const tbl of r.tables) {
      let list = tableRedundancyMap.get(tbl);
      if (!list) {
        list = [];
        tableRedundancyMap.set(tbl, list);
      }
      list.push(r);
    }
  }

  for (const table of tables) {
    const tableRedundancies = tableRedundancyMap.get(table.name);
    if (tableRedundancies && tableRedundancies.length > 0) {
      risks.push({
        table: table.name,
        warning: `Table holds ${tableRedundancies.length} duplicated column(s) [${tableRedundancies.map(r => r.column).join(', ')}]. Updates to these values trigger rewrite amplification across dependent records.`,
        score: Math.min(10, tableRedundancies.length * 2.5),
      });
    }
  }

  return risks;
}

function estimateNormalForm(tables: TableDefinition[], redundancies: RedundancyDiagnostic[], maxJoinDepth: number): '1NF' | '2NF' | '3NF' | 'Denormalized' {
  if (redundancies.length > 2) {
    return 'Denormalized';
  }

  let hasCompositePks = false;
  let hasMissingPks = false;

  for (const t of tables) {
    if (t.primaryKeys.length === 0) hasMissingPks = true;
    if (t.primaryKeys.length > 1) hasCompositePks = true;
  }

  if (hasMissingPks) return '1NF';
  if (hasCompositePks && redundancies.length > 0) return '2NF';
  if (maxJoinDepth >= 2 && redundancies.length === 0) return '3NF';

  return '3NF';
}
