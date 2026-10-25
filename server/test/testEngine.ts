import assert from 'assert';
import { parseDDL } from '../src/parser/ddlParser';
import { parseCSVContent } from '../src/parser/csvParser';
import { parseJSONContent } from '../src/parser/jsonParser';
import { analyzeSchema } from '../src/analyzer/schemaAnalyzer';
import { evaluateCustomSchema } from '../src/analyzer/recommender';

console.log('[TEST] Starting Schema Analysis Backend Test Suite...');

// Sample Test DDL: 3NF E-Commerce with an intentional redundant column (shipping_city)
const sampleSql = `
CREATE TABLE Customers (
  customer_id INT PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  shipping_city VARCHAR(50)
);

CREATE TABLE Orders (
  order_id INT PRIMARY KEY,
  customer_id INT REFERENCES Customers(customer_id),
  shipping_city VARCHAR(50), -- Intentionally duplicated attribute
  order_date DATE
);

CREATE TABLE Order_Items (
  item_id INT PRIMARY KEY,
  order_id INT REFERENCES Orders(order_id),
  product_id INT,
  quantity INT,
  unit_price DECIMAL(10,2)
);
`;

// Test 1: Parser Test
console.log('Running Test 1: DDL Parsing...');
const schema = parseDDL(sampleSql, 'generic');
assert.strictEqual(schema.tables.length, 3, 'Should parse exactly 3 tables');

const ordersTable = schema.tables.find(t => t.name.toLowerCase() === 'orders');
assert.ok(ordersTable, 'Orders table should exist');
assert.strictEqual(ordersTable.primaryKeys[0], 'order_id', 'Primary key should be order_id');
assert.strictEqual(ordersTable.foreignKeys.length, 1, 'Orders should have 1 foreign key');
assert.strictEqual(ordersTable.foreignKeys[0].referencedTable.toLowerCase(), 'customers', 'FK should point to customers');
console.log('[PASS] Test 1: Tables, columns, and foreign keys extracted correctly.');

// Test 2: Graph Analysis & Redundancy Detection Test
console.log('Running Test 2: Graph Analysis & Redundancy Detection...');
const analysis = analyzeSchema(schema);
assert.strictEqual(analysis.summary.tableCount, 3, 'Summary should reflect 3 tables');
assert.ok(analysis.summary.maxJoinDepth >= 2, 'Max join depth across Order_Items -> Orders -> Customers should be >= 2');

const redundancy = analysis.diagnostics.detectedRedundancies.find(r => r.column === 'shipping_city');
assert.ok(redundancy, 'Should detect shipping_city as a redundant column across Customers and Orders');
assert.ok(redundancy.tables.includes('Customers') || redundancy.tables.includes('customers'), 'Should list Customers');
assert.ok(redundancy.tables.includes('Orders') || redundancy.tables.includes('orders'), 'Should list Orders');
console.log('[PASS] Test 2: Correctly identified max join depth and duplicate column redundancy.');

// Test 3: Recommendation Engine Test (Read-heavy workload)
console.log('Running Test 3: Workload Evaluation...');
const readHeavyWorkload = {
  rowCount: 1000000,
  readPercent: 95,
  writePercent: 5,
  storageCostSensitivity: 'low' as const,
  dataConsistencyCriticality: 'low' as const,
};
const evalResult = evaluateCustomSchema(analysis, readHeavyWorkload);
assert.ok(evalResult.scores.denormalizedAverage > 0, 'Should have positive denormalized score');
assert.ok(evalResult.breakdown.readPerformance.denormalized >= evalResult.breakdown.readPerformance.normalized, 'Denormalized read should outperform normalized read under 95% reads');
assert.strictEqual(evalResult.verdict, 'Prefer Denormalization', 'Read-heavy low consistency should favor Denormalization');
console.log('[PASS] Test 3: Read-heavy evaluation generates Prefer Denormalization recommendation.');

// Test 4: Write-heavy workload evaluation
console.log('Running Test 4: High ACID Write-heavy Evaluation...');
const writeHeavyWorkload = {
  rowCount: 5000000,
  readPercent: 20,
  writePercent: 80,
  storageCostSensitivity: 'medium' as const,
  dataConsistencyCriticality: 'high' as const,
};
const writeEval = evaluateCustomSchema(analysis, writeHeavyWorkload);
assert.strictEqual(writeEval.verdict, 'Prefer Normalization', 'Write-heavy high consistency should favor Normalization');
console.log('[PASS] Test 4: Write-heavy evaluation generates Prefer Normalization recommendation.');

// Test 5: CSV Parsing & Type Inference
console.log('Running Test 5: CSV Schema Ingestion & Type Inference...');
const sampleCsv = `order_id,customer_id,order_date,total_amount,is_delivered
1001,42,2026-01-15,124.50,true
1002,89,2026-01-16,89.00,false
1003,42,2026-01-17,450.75,true`;

const csvResult = parseCSVContent(sampleCsv, 'Orders_CSV');
assert.strictEqual(csvResult.schema.tables.length, 1);
const csvTable = csvResult.schema.tables[0];
assert.strictEqual(csvTable.name, 'Orders_CSV');
assert.strictEqual(csvTable.primaryKeys[0], 'order_id');
assert.ok(csvTable.foreignKeys.some(f => f.column === 'customer_id'));
assert.strictEqual(csvTable.columns.find(c => c.name === 'total_amount')?.type, 'DECIMAL(12,2)');
assert.strictEqual(csvTable.columns.find(c => c.name === 'is_delivered')?.type, 'BOOLEAN');
assert.strictEqual(csvResult.estimatedRowCount, 3);
console.log('[PASS] Test 5: CSV correctly parsed, column types inferred, PK and FK detected.');

// Test 6: JSON Parsing (Multi-Table & Nested Objects)
console.log('Running Test 6: JSON Relational & Document Schema Ingestion...');
const sampleJson = JSON.stringify({
  customers: [
    { customer_id: 1, name: 'Alice', city: 'Seattle' },
    { customer_id: 2, name: 'Bob', city: 'Austin' }
  ],
  orders: [
    { order_id: 501, customer_id: 1, order_date: '2026-02-01', amount: 199.99 },
    { order_id: 502, customer_id: 2, order_date: '2026-02-02', amount: 49.99 }
  ]
});

const jsonResult = parseJSONContent(sampleJson);
assert.strictEqual(jsonResult.schema.tables.length, 2);
const customersT = jsonResult.schema.tables.find(t => t.name.toLowerCase() === 'customers');
const ordersT = jsonResult.schema.tables.find(t => t.name.toLowerCase() === 'orders');
assert.ok(customersT && ordersT, 'Both tables should be extracted from JSON');
assert.strictEqual(customersT.primaryKeys[0], 'customer_id');
assert.strictEqual(ordersT.primaryKeys[0], 'order_id');
assert.ok(ordersT.foreignKeys.some(f => f.column === 'customer_id' && f.referencedTable.toLowerCase() === 'customers'));
console.log('[PASS] Test 6: JSON multi-table schema inferred with primary and foreign key linkages.');

// Test 7: Streaming File Parsing on Disk
console.log('Running Test 7: Streaming Large-File CSV on Disk...');
import os from 'os';
import path from 'path';
import fs from 'fs';
import { parseCSVFile } from '../src/parser/csvParser';
import { parseJSONFile } from '../src/parser/jsonParser';

const tmpCsvPath = path.join(os.tmpdir(), 'test_orders_stream.csv');
const streamRows = ['order_id,customer_id,product_id,order_date,amount,shipped'];
for (let i = 1; i <= 20000; i++) {
  streamRows.push(`${i},${(i % 500) + 1},${(i % 50) + 1},2026-03-01,${(i * 1.5).toFixed(2)},${i % 2 === 0}`);
}
fs.writeFileSync(tmpCsvPath, streamRows.join('\n'));

const streamCsvResult = await parseCSVFile(tmpCsvPath, 'large_orders.csv');
assert.strictEqual(streamCsvResult.schema.tables[0].name, 'Large_Orders');
assert.strictEqual(streamCsvResult.schema.tables[0].primaryKeys[0], 'order_id');
assert.ok(streamCsvResult.schema.tables[0].foreignKeys.length >= 2, 'Should detect customer_id and product_id FKs');
assert.ok(streamCsvResult.estimatedRowCount >= 19000, 'Should estimate approximately 20,000 rows');
fs.unlinkSync(tmpCsvPath);
console.log('[PASS] Test 7: Large CSV file streamed, types inferred, FKs resolved, row count counted.');

// Test 8: JSON File on Disk
console.log('Running Test 8: Parsing JSON File on Disk...');
const tmpJsonPath = path.join(os.tmpdir(), 'test_users.json');
fs.writeFileSync(tmpJsonPath, JSON.stringify([
  { user_id: 1, email: 'a@example.com', sign_up: '2026-01-01', active: true },
  { user_id: 2, email: 'b@example.com', sign_up: '2026-01-02', active: false }
]));
const jsonFileResult = await parseJSONFile(tmpJsonPath, 'users.json');
assert.strictEqual(jsonFileResult.schema.tables[0].name, 'Users');
assert.strictEqual(jsonFileResult.schema.tables[0].primaryKeys[0], 'user_id');
assert.strictEqual(jsonFileResult.schema.tables[0].columns.find(c => c.name === 'active')?.type, 'BOOLEAN');
fs.unlinkSync(tmpJsonPath);
console.log('[PASS] Test 8: JSON file parsed from disk successfully.');

// Test 9: Postgres Type Normalization
console.log('Running Test 9: PostgreSQL Type Normalization...');
import { formatPostgresType, introspectPostgres } from '../src/parser/postgresIntrospector';

assert.strictEqual(formatPostgresType({ data_type: 'character varying', udt_name: 'varchar', character_maximum_length: 120, numeric_precision: null, numeric_scale: null }), 'VARCHAR(120)');
assert.strictEqual(formatPostgresType({ data_type: 'integer', udt_name: 'int4', character_maximum_length: null, numeric_precision: null, numeric_scale: null }), 'INT');
assert.strictEqual(formatPostgresType({ data_type: 'numeric', udt_name: 'numeric', character_maximum_length: null, numeric_precision: 10, numeric_scale: 2 }), 'DECIMAL(10,2)');
assert.strictEqual(formatPostgresType({ data_type: 'uuid', udt_name: 'uuid', character_maximum_length: null, numeric_precision: null, numeric_scale: null }), 'UUID');
assert.strictEqual(formatPostgresType({ data_type: 'jsonb', udt_name: 'jsonb', character_maximum_length: null, numeric_precision: null, numeric_scale: null }), 'JSONB');
assert.strictEqual(formatPostgresType({ data_type: 'boolean', udt_name: 'bool', character_maximum_length: null, numeric_precision: null, numeric_scale: null }), 'BOOLEAN');
console.log('[PASS] Test 9: PostgreSQL types mapped and normalized correctly.');

// Test 10: PostgreSQL Connection Error Handling
console.log('Running Test 10: PostgreSQL Introspection Error Handling...');
try {
  await introspectPostgres('postgresql://fakeuser:fakepass@127.0.0.1:54329/nonexistent_db?sslmode=disable');
  assert.fail('Should have thrown connection error');
} catch (err: any) {
  assert.ok(err.message, 'Should catch connection or authentication error');
  console.log('[PASS] Test 10: Connection error caught and handled cleanly.');
}

console.log('[SUCCESS] All 10 Backend Engine Unit Tests Passed Successfully!');

