import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { ParsedSchema, TableDefinition, ColumnDefinition } from './ddlParser';

export interface CSVParseResult {
  schema: ParsedSchema;
  estimatedRowCount: number;
  generatedDDL: string;
}

/**
 * Clean and format table name from filename
 */
function cleanTableName(filename: string): string {
  const base = path.basename(filename, path.extname(filename));
  const cleaned = base.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^_+|_+$/g, '');
  if (!cleaned) return 'Uploaded_Table';
  // Capitalize first letter of each word/segment
  return cleaned
    .split('_')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('_');
}

/**
 * Split CSV line respecting double quotes
 */
function splitCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Detect CSV delimiter from header candidate
 */
function detectDelimiter(line: string): string {
  let commas = 0;
  let tabs = 0;
  let semicolons = 0;
  let pipes = 0;

  for (let i = 0; i < line.length; i++) {
    const ch = line.charCodeAt(i);
    if (ch === 44) commas++;          // ','
    else if (ch === 9) tabs++;        // '\t'
    else if (ch === 59) semicolons++; // ';'
    else if (ch === 124) pipes++;     // '|'
  }

  if (tabs > commas && tabs > semicolons && tabs > pipes) return '\t';
  if (semicolons > commas && semicolons > pipes) return ';';
  if (pipes > commas) return '|';
  return ',';
}

/**
 * Infer SQL data type for a column given sampled values
 */
function inferType(values: string[]): string {
  const nonNull = values.filter(v => v !== '' && v.toLowerCase() !== 'null' && v.toLowerCase() !== 'na' && v.toLowerCase() !== 'n/a');
  if (nonNull.length === 0) return 'VARCHAR(255)';

  let isInt = true;
  let isDecimal = true;
  let isBool = true;
  let isDate = true;
  let maxLen = 0;

  for (const v of nonNull) {
    maxLen = Math.max(maxLen, v.length);

    // Boolean check
    if (isBool) {
      const lower = v.toLowerCase();
      if (lower !== 'true' && lower !== 'false' && lower !== '0' && lower !== '1' && lower !== 'yes' && lower !== 'no') {
        isBool = false;
      }
    }

    // Integer check
    if (isInt && !/^-?\d+$/.test(v)) {
      isInt = false;
    }

    // Decimal check
    if (isDecimal && !/^-?\d+(\.\d+)?$/.test(v)) {
      isDecimal = false;
    }

    // Date check (ISO or standard date formats)
    if (isDate && !/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(v) && isNaN(Date.parse(v))) {
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
 * Heuristically detect target referenced table from foreign key column name
 * e.g. "customer_id" -> "Customers", "product_id" -> "Products"
 */
function inferReferencedTable(colName: string, currentTable: string): { table: string; column: string } | null {
  const match = colName.match(/^(.+?)[_-]?(id|fk)$/i);
  if (!match) return null;

  const entity = match[1].toLowerCase();
  const currLower = currentTable.toLowerCase();
  if (entity === currLower || `${entity}s` === currLower) return null;

  // Capitalize entity name and pluralize if needed
  let refTable = entity.charAt(0).toUpperCase() + entity.slice(1);
  if (!refTable.endsWith('s')) refTable += 's';

  return { table: refTable, column: colName };
}

/**
 * Stream-parse a CSV file up to 500MB without exhausting memory.
 */
export async function parseCSVFile(filePath: string, originalFileName?: string): Promise<CSVParseResult> {
  const tableName = cleanTableName(originalFileName || path.basename(filePath));
  const fileStats = await fs.promises.stat(filePath);
  const fileSize = fileStats.size;

  const fileStream = fs.createReadStream(filePath, { encoding: 'utf-8' });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity,
  });

  let delimiter = ',';
  let headers: string[] = [];
  const columnSamples: string[][] = [];
  let sampleRowCount = 0;
  let totalLinesCounted = 0;
  let totalBytesRead = 0;
  const MAX_SAMPLE_ROWS = 5000;

  for await (const line of rl) {
    totalLinesCounted++;
    totalBytesRead += Buffer.byteLength(line, 'utf-8') + 1;

    const trimmed = line.trim();
    if (!trimmed) continue;

    if (headers.length === 0) {
      delimiter = detectDelimiter(trimmed);
      headers = splitCSVLine(trimmed, delimiter).map((h, idx) => {
        const clean = h.replace(/^["']|["']$/g, '').replace(/[^a-zA-Z0-9_]/g, '_').trim();
        return clean || `column_${idx + 1}`;
      });
      for (let i = 0; i < headers.length; i++) {
        columnSamples.push([]);
      }
      continue;
    }

    if (sampleRowCount < MAX_SAMPLE_ROWS) {
      const values = splitCSVLine(trimmed, delimiter);
      for (let i = 0; i < headers.length; i++) {
        const val = values[i] !== undefined ? values[i].replace(/^["']|["']$/g, '') : '';
        columnSamples[i].push(val);
      }
      sampleRowCount++;
    }

    // For huge files (> 20MB), compute average line size after 5,000 rows to estimate total rows fast
    if (fileSize > 20 * 1024 * 1024 && sampleRowCount >= MAX_SAMPLE_ROWS) {
      break;
    }
  }

  rl.close();
  fileStream.destroy();

  // Estimate total rows if we stopped early on huge files
  let estimatedRowCount = totalLinesCounted - 1;
  if (sampleRowCount >= MAX_SAMPLE_ROWS && totalBytesRead < fileSize && totalBytesRead > 0) {
    const avgLineBytes = totalBytesRead / totalLinesCounted;
    estimatedRowCount = Math.max(sampleRowCount, Math.round(fileSize / avgLineBytes) - 1);
  }

  return buildSchemaFromColumns(tableName, headers, columnSamples, estimatedRowCount);
}

/**
 * Parse CSV raw content string (for client-pasted or small CSV files)
 */
export function parseCSVContent(content: string, tableName: string = 'Uploaded_CSV'): CSVParseResult {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    throw new Error('CSV file is empty.');
  }

  const delimiter = detectDelimiter(lines[0]);
  const headers = splitCSVLine(lines[0], delimiter).map((h, idx) => {
    const clean = h.replace(/^["']|["']$/g, '').replace(/[^a-zA-Z0-9_]/g, '_').trim();
    return clean || `col_${idx + 1}`;
  });

  const columnSamples: string[][] = headers.map(() => []);
  const sampleLimit = Math.min(lines.length, 2000);

  for (let r = 1; r < sampleLimit; r++) {
    const vals = splitCSVLine(lines[r], delimiter);
    for (let c = 0; c < headers.length; c++) {
      columnSamples[c].push(vals[c] !== undefined ? vals[c].replace(/^["']|["']$/g, '') : '');
    }
  }

  return buildSchemaFromColumns(tableName, headers, columnSamples, lines.length - 1);
}

/**
 * Constructs ParsedSchema, TableDefinition and SQL DDL from headers and sample data
 */
function buildSchemaFromColumns(
  tableName: string,
  headers: string[],
  columnSamples: string[][],
  estimatedRowCount: number
): CSVParseResult {
  const columns: ColumnDefinition[] = [];
  const primaryKeys: string[] = [];
  const foreignKeys: Array<{ column: string; referencedTable: string; referencedColumn: string }> = [];

  // Identify PK candidate
  const baseName = tableName.replace(/_csv$/i, '').toLowerCase();
  const singularBase = baseName.endsWith('s') ? baseName.slice(0, -1) : baseName;
  let pkCandidate = headers.find(h => {
    const hLow = h.toLowerCase();
    return hLow === 'id' || hLow === `${baseName}_id` || hLow === `${singularBase}_id` || hLow === `${baseName}id`;
  });

  if (!pkCandidate && headers.length > 0 && /id$/i.test(headers[0])) {
    pkCandidate = headers[0];
  }

  if (!pkCandidate) {
    // Check first column if values are unique in sample
    const firstColVals = columnSamples[0] || [];
    const nonNullVals = firstColVals.filter(Boolean);
    if (nonNullVals.length > 0 && new Set(nonNullVals).size === nonNullVals.length) {
      pkCandidate = headers[0];
    }
  }

  if (pkCandidate) {
    primaryKeys.push(pkCandidate);
  }

  headers.forEach((colName, idx) => {
    const samples = columnSamples[idx] || [];
    const inferredType = inferType(samples);
    const hasEmpty = samples.some(v => v === '' || v.toLowerCase() === 'null');
    const isPk = colName === pkCandidate;

    let isFk = false;
    let refInfo: { table: string; column: string } | undefined;

    if (!isPk) {
      const fkCandidate = inferReferencedTable(colName, tableName);
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
      isNullable: !isPk && hasEmpty,
      isPrimaryKey: isPk,
      isForeignKey: isFk,
      references: refInfo,
    });
  });

  const tableDef: TableDefinition = {
    name: tableName,
    columns,
    primaryKeys,
    foreignKeys,
  };

  const schema: ParsedSchema = {
    tables: [tableDef],
    dialect: 'generic',
    rawStatementCount: 1,
  };

  // Generate clean SQL DDL
  const ddlLines = [
    `-- Auto-inferred Schema from CSV: ${tableName}`,
    `-- Inferred Record Count: ~${estimatedRowCount.toLocaleString()}`,
    `CREATE TABLE ${tableName} (`,
  ];

  const colDefs = columns.map(c => {
    let line = `  ${c.name} ${c.type}`;
    if (c.isPrimaryKey) line += ' PRIMARY KEY';
    if (!c.isNullable && !c.isPrimaryKey) line += ' NOT NULL';
    if (c.references) line += ` REFERENCES ${c.references.table}(${c.references.column})`;
    return line;
  });

  ddlLines.push(colDefs.join(',\n'));
  ddlLines.push(');');

  return {
    schema,
    estimatedRowCount: Math.max(1, estimatedRowCount),
    generatedDDL: ddlLines.join('\n'),
  };
}
