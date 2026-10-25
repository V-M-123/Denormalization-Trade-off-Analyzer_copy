import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { ParsedSchema, TableDefinition, ColumnDefinition } from './ddlParser';

export interface JSONParseResult {
  schema: ParsedSchema;
  estimatedRowCount: number;
  generatedDDL: string;
}

/**
 * Format table name cleanly
 */
function cleanTableName(name: string): string {
  const base = path.basename(name, path.extname(name));
  const cleaned = base.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^_+|_+$/g, '');
  if (!cleaned) return 'Uploaded_JSON';
  return cleaned
    .split('_')
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join('_');
}

/**
 * Infer SQL data type from JavaScript values
 */
function inferTypeFromValues(values: any[]): string {
  const nonNull = values.filter(v => v !== null && v !== undefined && v !== '');
  if (nonNull.length === 0) return 'VARCHAR(255)';

  let isInt = true;
  let isDecimal = true;
  let isBool = true;
  let isDate = true;
  let maxLen = 0;

  for (const v of nonNull) {
    if (typeof v === 'boolean') {
      isInt = false;
      isDecimal = false;
      isDate = false;
      continue;
    }
    if (typeof v === 'number') {
      isBool = false;
      isDate = false;
      if (!Number.isInteger(v)) {
        isInt = false;
      }
      continue;
    }
    if (typeof v === 'object') {
      return 'JSON';
    }

    const str = String(v);
    maxLen = Math.max(maxLen, str.length);

    if (str.toLowerCase() !== 'true' && str.toLowerCase() !== 'false') {
      isBool = false;
    }
    if (!/^-?\d+$/.test(str)) {
      isInt = false;
    }
    if (!/^-?\d+(\.\d+)?$/.test(str)) {
      isDecimal = false;
    }
    if (isNaN(Date.parse(str)) || str.length < 8) {
      isDate = false;
    }
  }

  if (isBool) return 'BOOLEAN';
  if (isInt) return maxLen > 9 ? 'BIGINT' : 'INT';
  if (isDecimal) return 'DECIMAL(12,2)';
  if (isDate) return 'TIMESTAMP';
  if (maxLen > 255) return 'TEXT';
  return `VARCHAR(${Math.min(255, Math.max(50, Math.ceil(maxLen * 1.5)))})`;
}

/**
 * Infer foreign key references
 */
function inferReferencedTable(colName: string, currentTable: string, existingTableNames: string[]): { table: string; column: string } | null {
  const match = colName.match(/^(.+?)[_-]?(id|fk)$/i);
  if (!match) return null;

  const entity = match[1].toLowerCase();
  const currLower = currentTable.toLowerCase();
  if (entity === currLower || `${entity}s` === currLower) return null;

  // Check if matches an existing table in schema
  const directMatch = existingTableNames.find(t => {
    const tLower = t.toLowerCase();
    return tLower === entity || tLower === `${entity}s` || `${tLower}s` === entity;
  });

  if (directMatch) {
    return { table: directMatch, column: colName };
  }

  let refTable = entity.charAt(0).toUpperCase() + entity.slice(1);
  if (!refTable.endsWith('s')) refTable += 's';
  return { table: refTable, column: colName };
}

/**
 * Build a TableDefinition from a sample of record objects
 */
function buildTableFromRecords(
  tableName: string,
  records: Array<Record<string, any>>,
  existingTableNames: string[] = []
): { table: TableDefinition; childTables: TableDefinition[] } {
  const colNamesSet = new Set<string>();
  const nestedArrays: Record<string, any[]> = {};

  records.forEach(rec => {
    if (!rec || typeof rec !== 'object') return;
    Object.keys(rec).forEach(key => {
      const val = rec[key];
      if (Array.isArray(val) && val.length > 0 && typeof val[0] === 'object') {
        if (!nestedArrays[key]) nestedArrays[key] = [];
        nestedArrays[key].push(...val.slice(0, 50));
      } else {
        colNamesSet.add(key);
      }
    });
  });

  const headers = Array.from(colNamesSet);
  const columns: ColumnDefinition[] = [];
  const primaryKeys: string[] = [];
  const foreignKeys: Array<{ column: string; referencedTable: string; referencedColumn: string }> = [];

  // Detect PK
  const baseName = tableName.toLowerCase();
  const singularBase = baseName.endsWith('s') ? baseName.slice(0, -1) : baseName;
  let pkCandidate = headers.find(h => {
    const hLow = h.toLowerCase();
    return hLow === 'id' || hLow === `${baseName}_id` || hLow === `${singularBase}_id` || hLow === `${baseName}id`;
  });

  if (!pkCandidate && headers.length > 0 && /id$/i.test(headers[0])) {
    pkCandidate = headers[0];
  }

  if (!pkCandidate && headers.length > 0) {
    const firstColVals = records.map(r => r[headers[0]]).filter(v => v !== undefined && v !== null);
    if (firstColVals.length > 0 && new Set(firstColVals).size === firstColVals.length) {
      pkCandidate = headers[0];
    }
  }

  if (pkCandidate) primaryKeys.push(pkCandidate);

  headers.forEach(colName => {
    const values = records.map(r => r[colName]);
    const inferredType = inferTypeFromValues(values);
    const hasNull = values.some(v => v === null || v === undefined || v === '');
    const isPk = colName === pkCandidate;

    let isFk = false;
    let refInfo: { table: string; column: string } | undefined;

    if (!isPk) {
      const fkCandidate = inferReferencedTable(colName, tableName, existingTableNames);
      if (fkCandidate) {
        isFk = true;
        refInfo = fkCandidate;
        foreignKeys.push({
          column: colName,
          referencedTable: fkCandidate.table,
          referencedColumn: fkCandidate.column,
        });
      }
    }

    columns.push({
      name: colName,
      type: inferredType,
      isNullable: !isPk && hasNull,
      isPrimaryKey: isPk,
      isForeignKey: isFk,
      references: refInfo,
    });
  });

  const table: TableDefinition = {
    name: tableName,
    columns,
    primaryKeys,
    foreignKeys,
  };

  // Build child tables for detected 1:N nested relations (denormalized document arrays)
  const childTables: TableDefinition[] = [];
  Object.keys(nestedArrays).forEach(nestedKey => {
    const childName = `${tableName}_${cleanTableName(nestedKey)}`;
    const childRecords = nestedArrays[nestedKey];
    // inject parent FK
    const parentFkName = pkCandidate || `${tableName.toLowerCase()}_id`;
    childRecords.forEach((cr, _idx) => {
      if (cr && typeof cr === 'object') {
        cr[parentFkName] = 1;
      }
    });

    const childRes = buildTableFromRecords(childName, childRecords, [tableName, ...existingTableNames]);
    // ensure child links to parent
    if (!childRes.table.foreignKeys.some(f => f.referencedTable === tableName)) {
      childRes.table.foreignKeys.push({
        column: parentFkName,
        referencedTable: tableName,
        referencedColumn: parentFkName,
      });
    }
    childTables.push(childRes.table);
  });

  return { table, childTables };
}

/**
 * Generate DDL string from tables
 */
function generateDDLFromTables(tables: TableDefinition[], estimatedRowCount: number): string {
  const ddlBlocks: string[] = [
    `-- Auto-inferred Schema from JSON`,
    `-- Inferred Tables: ${tables.length} | Record Count: ~${estimatedRowCount.toLocaleString()}`,
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

  return ddlBlocks.join('\n\n');
}

/**
 * Stream-parse a JSON or NDJSON file up to 500MB without heap exhaustion
 */
export async function parseJSONFile(filePath: string, originalFileName?: string): Promise<JSONParseResult> {
  const baseTableName = cleanTableName(originalFileName || path.basename(filePath));
  const fileStats = await fs.promises.stat(filePath);
  const fileSize = fileStats.size;

  // 1. Check if NDJSON (JSON Lines) or standard JSON by inspecting first chunk
  const fd = await fs.promises.open(filePath, 'r');
  const bufferSize = Math.min(fileSize, 2 * 1024 * 1024); // 2MB inspect buffer
  const buffer = Buffer.alloc(bufferSize);
  await fd.read(buffer, 0, bufferSize, 0);
  await fd.close();

  const previewStr = buffer.toString('utf-8').trim();

  // Test if it is NDJSON (line 1 is a valid JSON object and ends with newline)
  const firstNewline = previewStr.indexOf('\n');
  let isNdjson = false;
  if (firstNewline > 0 && !previewStr.startsWith('[') && !previewStr.startsWith('{')) {
    try {
      JSON.parse(previewStr.substring(0, firstNewline).trim());
      isNdjson = true;
    } catch {}
  }

  if (isNdjson) {
    return parseNDJSONFile(filePath, baseTableName, fileSize);
  }

  // If standard JSON and small enough (<= 30MB), parse directly
  if (fileSize <= 30 * 1024 * 1024) {
    const rawContent = await fs.promises.readFile(filePath, 'utf-8');
    return parseJSONContent(rawContent, baseTableName);
  }

  // Large JSON (> 30MB, up to 500MB): Extract records from the leading chunk
  return parseLargeJSONChunk(previewStr, baseTableName, fileSize);
}

/**
 * Handle line-delimited JSON (NDJSON) streaming
 */
async function parseNDJSONFile(filePath: string, tableName: string, fileSize: number): Promise<JSONParseResult> {
  const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  const sampleRecords: Array<Record<string, any>> = [];
  let lineCount = 0;
  let bytesRead = 0;
  const MAX_SAMPLES = 5000;

  for await (const line of rl) {
    lineCount++;
    bytesRead += Buffer.byteLength(line, 'utf-8') + 1;
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (sampleRecords.length < MAX_SAMPLES) {
      try {
        const obj = JSON.parse(trimmed);
        if (obj && typeof obj === 'object') {
          sampleRecords.push(obj);
        }
      } catch {}
    }

    if (fileSize > 20 * 1024 * 1024 && sampleRecords.length >= MAX_SAMPLES) {
      break;
    }
  }

  rl.close();
  fileStream.destroy();

  let estimatedRowCount = lineCount;
  if (sampleRecords.length >= MAX_SAMPLES && bytesRead < fileSize && bytesRead > 0) {
    const avgLineBytes = bytesRead / lineCount;
    estimatedRowCount = Math.max(sampleRecords.length, Math.round(fileSize / avgLineBytes));
  }

  const { table, childTables } = buildTableFromRecords(tableName, sampleRecords);
  const allTables = [table, ...childTables];

  const schema: ParsedSchema = {
    tables: allTables,
    dialect: 'generic',
    rawStatementCount: allTables.length,
  };

  return {
    schema,
    estimatedRowCount,
    generatedDDL: generateDDLFromTables(allTables, estimatedRowCount),
  };
}

/**
 * Handle large JSON files (>30MB up to 500MB) by parsing leading array items
 */
function parseLargeJSONChunk(chunkStr: string, tableName: string, fileSize: number): JSONParseResult {
  const sampleRecords: Array<Record<string, any>> = [];

  // Find array bracket '[' and collect objects
  const startIdx = chunkStr.indexOf('[');
  if (startIdx !== -1) {
    let cursor = startIdx + 1;
    while (sampleRecords.length < 2000 && cursor < chunkStr.length) {
      const objStart = chunkStr.indexOf('{', cursor);
      if (objStart === -1) break;

      // Find closing brace with balanced counting
      let depth = 0;
      let objEnd = -1;
      for (let i = objStart; i < chunkStr.length; i++) {
        if (chunkStr[i] === '{') depth++;
        else if (chunkStr[i] === '}') {
          depth--;
          if (depth === 0) {
            objEnd = i;
            break;
          }
        }
      }

      if (objEnd === -1) break; // incomplete object at chunk boundary

      try {
        const parsed = JSON.parse(chunkStr.substring(objStart, objEnd + 1));
        sampleRecords.push(parsed);
      } catch {}

      cursor = objEnd + 1;
    }
  }

  if (sampleRecords.length === 0) {
    throw new Error('Could not extract JSON records from large dataset.');
  }

  // Estimate total records: average record bytes
  const sampleBytes = JSON.stringify(sampleRecords).length;
  const avgRecordBytes = sampleBytes / sampleRecords.length;
  const estimatedRowCount = Math.max(sampleRecords.length, Math.round(fileSize / avgRecordBytes));

  const { table, childTables } = buildTableFromRecords(tableName, sampleRecords);
  const allTables = [table, ...childTables];

  const schema: ParsedSchema = {
    tables: allTables,
    dialect: 'generic',
    rawStatementCount: allTables.length,
  };

  return {
    schema,
    estimatedRowCount,
    generatedDDL: generateDDLFromTables(allTables, estimatedRowCount),
  };
}

/**
 * Parse raw JSON string (small files or client-pasted)
 */
export function parseJSONContent(content: string, defaultTableName: string = 'Uploaded_JSON'): JSONParseResult {
  let parsed: any;
  try {
    parsed = JSON.parse(content);
  } catch (err: any) {
    throw new Error(`Invalid JSON: ${err.message}`);
  }

  // 1. Explicit Schema definition: { tables: [ { name, columns, primaryKeys, foreignKeys } ] }
  if (parsed && typeof parsed === 'object' && Array.isArray(parsed.tables)) {
    const tables: TableDefinition[] = parsed.tables.map((t: any) => ({
      name: cleanTableName(t.name || 'Table'),
      columns: Array.isArray(t.columns)
        ? t.columns.map((c: any) => ({
            name: String(c.name || 'col'),
            type: String(c.type || 'VARCHAR(255)'),
            isNullable: c.isNullable ?? true,
            isPrimaryKey: !!c.isPrimaryKey,
            isForeignKey: !!c.isForeignKey,
            references: c.references,
          }))
        : [],
      primaryKeys: Array.isArray(t.primaryKeys) ? t.primaryKeys : [],
      foreignKeys: Array.isArray(t.foreignKeys) ? t.foreignKeys : [],
    }));

    const schema: ParsedSchema = {
      tables,
      dialect: 'generic',
      rawStatementCount: tables.length,
    };

    return {
      schema,
      estimatedRowCount: 1000000,
      generatedDDL: generateDDLFromTables(tables, 1000000),
    };
  }

  // 2. Multi-table object: { "customers": [...], "orders": [...] }
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const tableKeys = Object.keys(parsed).filter(k => Array.isArray(parsed[k]));
    if (tableKeys.length > 0) {
      const allTables: TableDefinition[] = [];
      let totalRows = 0;

      tableKeys.forEach(tKey => {
        const records = parsed[tKey];
        totalRows += records.length;
        const { table, childTables } = buildTableFromRecords(cleanTableName(tKey), records, tableKeys);
        allTables.push(table, ...childTables);
      });

      const schema: ParsedSchema = {
        tables: allTables,
        dialect: 'generic',
        rawStatementCount: allTables.length,
      };

      return {
        schema,
        estimatedRowCount: Math.max(1, totalRows),
        generatedDDL: generateDDLFromTables(allTables, totalRows),
      };
    }
  }

  // 3. Array of record objects: [ {...}, {...} ]
  if (Array.isArray(parsed)) {
    const records = parsed.filter(r => r && typeof r === 'object');
    if (records.length === 0) {
      throw new Error('JSON array contains no objects.');
    }

    const { table, childTables } = buildTableFromRecords(defaultTableName, records);
    const allTables = [table, ...childTables];

    const schema: ParsedSchema = {
      tables: allTables,
      dialect: 'generic',
      rawStatementCount: allTables.length,
    };

    return {
      schema,
      estimatedRowCount: Math.max(1, records.length),
      generatedDDL: generateDDLFromTables(allTables, records.length),
    };
  }

  throw new Error('Unsupported JSON format. Provide an array of records, a multi-table object, or a schema definition.');
}
