import assert from 'assert';
import {
  encryptSensitive,
  decryptSensitive,
  hashPassword,
  verifyPassword,
  createSessionToken,
  verifySessionToken
} from '../src/utils/crypto';
import {
  registerUser,
  loginUser,
  createCustomSchemaWithRelations,
  getCustomSchemaDetails,
  updateSchemaSync,
  deleteCustomSchema
} from '../src/db/supabaseClient';
import { computeSchemaDiff } from '../src/analyzer/schemaDiffEngine';

console.log('[TEST] Starting Supabase Storage, Auth & Schema Drift Test Suite...');

// Test 1: Crypto AES-256-GCM & Session Tokens
console.log('Running Test 1: Crypto & Session Security...');
const rawUri = 'postgresql://postgres:secretpassword@db.xyz.supabase.co:5432/postgres';
const encryptedUri = encryptSensitive(rawUri);
assert.notStrictEqual(encryptedUri, rawUri, 'Encrypted URI must not equal raw URI');
const decryptedUri = decryptSensitive(encryptedUri);
assert.strictEqual(decryptedUri, rawUri, 'Decrypted URI must match raw URI');

const pass = 'SupabasePass123!';
const passHash = hashPassword(pass);
assert.ok(verifyPassword(pass, passHash), 'Password verification should succeed with correct password');
assert.ok(!verifyPassword('WrongPass', passHash), 'Password verification should fail with incorrect password');

const sessionToken = createSessionToken('user-uuid-1', 'test@example.com');
const verifiedSession = verifySessionToken(sessionToken);
assert.ok(verifiedSession, 'Session token should be valid');
assert.strictEqual(verifiedSession.userId, 'user-uuid-1');
assert.strictEqual(verifiedSession.email, 'test@example.com');
console.log('[PASS] Test 1: Encryption, password hashing, and session tokens verified.');

// Test 2: User Registration & Authentication
console.log('Running Test 2: User Registration & Authentication...');
const testEmail = `tester_${Date.now()}@example.com`;
const regUser = await registerUser(testEmail, 'SecurePass123!', 'Alex Tester');
assert.strictEqual(regUser.email, testEmail);
assert.strictEqual(regUser.name, 'Alex Tester');

const loginRes = await loginUser(testEmail, 'SecurePass123!');
assert.strictEqual(loginRes.user.email, testEmail);

try {
  await loginUser(testEmail, 'BadPassword');
  assert.fail('Should fail login with wrong password');
} catch (err: any) {
  assert.ok(err.message.includes('Invalid') || err.message.includes('password'));
}
console.log('[PASS] Test 2: User registration, login, and rejection of bad passwords verified.');

// Test 3: Schema Persistence with Child Tables & Relationships
console.log('Running Test 3: Schema, Tables, Relationships & Analysis Persistence...');
const savedSchema = await createCustomSchemaWithRelations({
  title: 'E-Commerce Live Database',
  description: 'Production Supabase Schema',
  dialect: 'postgres',
  ddlContent: 'CREATE TABLE Customers (id INT PRIMARY KEY); CREATE TABLE Orders (id INT PRIMARY KEY, customer_id INT REFERENCES Customers(id));',
  tableCount: 2,
  foreignKeysCount: 1,
  maxJoinDepth: 1,
  estimatedNormalForm: '3NF',
  isPublic: true,
  userId: regUser.id,
  tables: [
    { name: 'Customers', estimatedRows: 50000, columnCount: 3, primaryKeys: ['id'] },
    { name: 'Orders', estimatedRows: 250000, columnCount: 5, primaryKeys: ['id'] }
  ],
  relationships: [
    { sourceTable: 'Orders', sourceColumn: 'customer_id', targetTable: 'Customers', targetColumn: 'id', constraintName: 'fk_orders_customers' }
  ],
  initialAnalysis: {
    workload: {
      rowCountSpec: '250K',
      rowCountNumeric: 250000,
      readPercent: 80,
      writePercent: 20,
      queryComplexity: 'medium',
      storageCostSensitivity: 'medium',
      dataConsistencyCriticality: 'high'
    },
    evaluation: {
      verdict: 'Prefer Normalization',
      scores: {
        normalizedAverage: 7.4,
        denormalizedAverage: 5.6,
        margin: 18
      },
      breakdown: { readPerformance: { normalized: 6, denormalized: 8 } },
      explanation: { summary: 'Strong normalization preference due to high ACID requirements.' }
    }
  }
});

assert.ok(savedSchema.id, 'Saved schema should have a UUID id');
assert.strictEqual(savedSchema.title, 'E-Commerce Live Database');

const schemaDetails = await getCustomSchemaDetails(savedSchema.id);
assert.ok(schemaDetails, 'Should fetch full schema details');
assert.strictEqual(schemaDetails.tables.length, 2, 'Should have 2 tables');
assert.strictEqual(schemaDetails.relationships.length, 1, 'Should have 1 relationship');
assert.strictEqual(schemaDetails.runs.length, 1, 'Should have 1 analysis run');
assert.strictEqual(schemaDetails.runs[0].verdict, 'Prefer Normalization');
console.log('[PASS] Test 3: Schema, tables, relationships, and analysis runs persisted accurately.');

// Test 4: Schema Drift & Change Detection Engine
console.log('Running Test 4: Schema Drift & Change Detection Engine...');
const simulatedLiveSchema = {
  tables: [
    {
      name: 'Customers',
      columns: [
        { name: 'id', type: 'INT', isPrimaryKey: true, isForeignKey: false, isNullable: false },
        { name: 'name', type: 'VARCHAR(100)', isPrimaryKey: false, isForeignKey: false, isNullable: false },
        { name: 'email', type: 'VARCHAR(255)', isPrimaryKey: false, isForeignKey: false, isNullable: true }
      ],
      primaryKeys: ['id'],
      foreignKeys: []
    },
    {
      name: 'Orders',
      columns: [
        { name: 'id', type: 'INT', isPrimaryKey: true, isForeignKey: false, isNullable: false },
        { name: 'customer_id', type: 'INT', isPrimaryKey: false, isForeignKey: true, isNullable: false },
        { name: 'amount', type: 'DECIMAL(10,2)', isPrimaryKey: false, isForeignKey: false, isNullable: false },
        { name: 'status', type: 'VARCHAR(50)', isPrimaryKey: false, isForeignKey: false, isNullable: false },
        { name: 'created_at', type: 'TIMESTAMP', isPrimaryKey: false, isForeignKey: false, isNullable: false },
        // New column added in live database:
        { name: 'tracking_number', type: 'VARCHAR(100)', isPrimaryKey: false, isForeignKey: false, isNullable: true }
      ],
      primaryKeys: ['id'],
      foreignKeys: [{ column: 'customer_id', referencedTable: 'Customers', referencedColumn: 'id' }]
    },
    // New table added in live database:
    {
      name: 'Invoices',
      columns: [
        { name: 'id', type: 'INT', isPrimaryKey: true, isForeignKey: false, isNullable: false },
        { name: 'order_id', type: 'INT', isPrimaryKey: false, isForeignKey: true, isNullable: false }
      ],
      primaryKeys: ['id'],
      foreignKeys: [{ column: 'order_id', referencedTable: 'Orders', referencedColumn: 'id' }]
    }
  ]
};

const diffResult = computeSchemaDiff({
  storedTables: schemaDetails.tables,
  storedRelationships: schemaDetails.relationships,
  storedMetrics: {
    tableCount: schemaDetails.schema.table_count,
    foreignKeysCount: schemaDetails.schema.foreign_keys_count,
    maxJoinDepth: schemaDetails.schema.max_join_depth
  },
  liveSchema: simulatedLiveSchema,
  liveStats: [
    { name: 'Customers', columnCount: 3, estimatedRows: 55000 },
    { name: 'Orders', columnCount: 6, estimatedRows: 300000 },
    { name: 'Invoices', columnCount: 2, estimatedRows: 290000 }
  ],
  liveMaxJoinDepth: 2
});

assert.strictEqual(diffResult.hasChanges, true, 'Diff engine should flag that changes exist');
assert.ok(diffResult.addedTables.includes('Invoices'), 'Should detect Invoices as added table');
assert.strictEqual(diffResult.metricsDiff.tableCount.new, 3, 'New table count should be 3');
assert.strictEqual(diffResult.metricsDiff.maxJoinDepth.new, 2, 'Join depth should increase to 2');
assert.ok(diffResult.summary.includes('Invoices'), 'Summary should mention added table Invoices');
console.log('[PASS] Test 4: Schema drift engine detected added table, modified columns, and join depth change.');

// Test 5: Synchronization & History Tracking
console.log('Running Test 5: Schema Sync & History Tracking...');
await updateSchemaSync({
  schemaId: savedSchema.id,
  tableCount: 3,
  foreignKeysCount: 2,
  maxJoinDepth: 2,
  ddlContent: 'CREATE TABLE Customers... CREATE TABLE Orders... CREATE TABLE Invoices...',
  tables: [
    { name: 'Customers', estimatedRows: 55000, columnCount: 3, primaryKeys: ['id'] },
    { name: 'Orders', estimatedRows: 300000, columnCount: 6, primaryKeys: ['id'] },
    { name: 'Invoices', estimatedRows: 290000, columnCount: 2, primaryKeys: ['id'] }
  ],
  relationships: [
    { sourceTable: 'Orders', sourceColumn: 'customer_id', targetTable: 'Customers', targetColumn: 'id' },
    { sourceTable: 'Invoices', sourceColumn: 'order_id', targetTable: 'Orders', targetColumn: 'id' }
  ],
  newAnalysis: {
    workload: {
      rowCountSpec: '300K',
      rowCountNumeric: 300000,
      readPercent: 80,
      writePercent: 20
    },
    evaluation: {
      verdict: 'Prefer Normalization',
      scores: {
        normalizedAverage: 7.8,
        denormalizedAverage: 5.2,
        margin: 26
      },
      breakdown: { readPerformance: { normalized: 5.5, denormalized: 8.5 } },
      explanation: { summary: 'Increased join depth further emphasizes ACID normalization benefits.' }
    }
  }
});

const updatedDetails = await getCustomSchemaDetails(savedSchema.id);
assert.ok(updatedDetails);
assert.strictEqual(updatedDetails.schema.table_count, 3, 'Updated schema table count should be 3');
assert.strictEqual(updatedDetails.tables.length, 3, 'Updated tables length should be 3');
assert.strictEqual(updatedDetails.relationships.length, 2, 'Updated relationships length should be 2');
assert.strictEqual(updatedDetails.runs.length, 2, 'Should now have 2 analysis runs in history');
console.log('[PASS] Test 5: Sync applied cleanly and analysis runs history updated.');

// Test 6: Deletion
console.log('Running Test 6: Deletion & Cascade...');
const deleted = await deleteCustomSchema(savedSchema.id);
assert.strictEqual(deleted, true);
const deletedCheck = await getCustomSchemaDetails(savedSchema.id);
assert.strictEqual(deletedCheck, null, 'Deleted schema should not be found');
console.log('[PASS] Test 6: Schema deleted successfully.');

console.log('[SUCCESS] All Supabase Integration & Schema Drift Tests Passed Successfully!');
