import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { hashPassword, verifyPassword } from '../utils/crypto';

export interface CustomSchemaRecord {
  id: string;
  created_at: string;
  updated_at: string;
  title: string;
  description?: string | null;
  dialect: 'postgres' | 'mysql' | 'sqlite' | 'generic';
  ddl_content: string;
  table_count: number;
  foreign_keys_count: number;
  max_join_depth: number;
  estimated_normal_form: string;
  is_public: boolean;
  user_id: string | null;
}

export interface SchemaTableRecord {
  id: string;
  schema_id: string;
  table_name: string;
  estimated_row_count: number;
  column_count: number;
  primary_keys: string[];
  created_at: string;
}

export interface SchemaRelationshipRecord {
  id: string;
  schema_id: string;
  source_table: string;
  source_column: string;
  target_table: string;
  target_column: string;
  constraint_name?: string | null;
  created_at: string;
}

export interface AnalysisRunRecord {
  id: string;
  schema_id: string;
  created_at: string;
  row_count_spec: string;
  row_count_numeric: number;
  read_percent: number;
  write_percent: number;
  query_complexity: 'simple' | 'medium' | 'complex';
  storage_cost_sensitivity: 'low' | 'medium' | 'high';
  data_consistency_criticality: 'low' | 'medium' | 'high';
  verdict: 'Prefer Normalization' | 'Prefer Denormalization' | 'Hybrid';
  normalized_average: number;
  denormalized_average: number;
  confidence_margin: number;
  scores_breakdown: Record<string, any>;
  recommendation_details: Record<string, any>;
}

export interface UserRecord {
  id: string;
  email: string;
  name: string;
  created_at: string;
}

// ----------------------------------------------------------------------------
// Client Initialization (Supabase Remote or SQLite Local Fallback)
// ----------------------------------------------------------------------------
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

export let supabase: SupabaseClient | null = null;
if (isSupabaseConfigured) {
  supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
  });
  console.log('[STORAGE] Connected to remote Supabase database instance.');
} else {
  console.log('[STORAGE] Remote Supabase credentials not set; utilizing local SQLite storage mirror.');
}

// Local SQLite database initialization
let sqliteDb: DatabaseSync | null = null;

function getSqliteDb(): DatabaseSync {
  if (!sqliteDb) {
    const dataDir = path.resolve(process.cwd(), 'server', 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const dbPath = path.join(dataDir, 'analyzer.db');
    sqliteDb = new DatabaseSync(dbPath);
    initSqliteSchema(sqliteDb);
  }
  return sqliteDb;
}

function initSqliteSchema(db: DatabaseSync) {
  // Enables WAL and foreign keys
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);

  // Table 1: custom_schemas
  db.exec(`
    CREATE TABLE IF NOT EXISTS custom_schemas (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      dialect TEXT NOT NULL DEFAULT 'postgres',
      ddl_content TEXT NOT NULL,
      table_count INTEGER DEFAULT 0,
      foreign_keys_count INTEGER DEFAULT 0,
      max_join_depth INTEGER DEFAULT 0,
      estimated_normal_form TEXT DEFAULT '3NF',
      is_public INTEGER NOT NULL DEFAULT 1,
      user_id TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
  `);

  // Table 2: schema_tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_tables (
      id TEXT PRIMARY KEY,
      schema_id TEXT NOT NULL,
      table_name TEXT NOT NULL,
      estimated_row_count INTEGER DEFAULT 100000,
      column_count INTEGER DEFAULT 0,
      primary_keys TEXT DEFAULT '[]',
      created_at TEXT NOT NULL,
      FOREIGN KEY (schema_id) REFERENCES custom_schemas(id) ON DELETE CASCADE
    );
  `);

  // Table 3: schema_relationships
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_relationships (
      id TEXT PRIMARY KEY,
      schema_id TEXT NOT NULL,
      source_table TEXT NOT NULL,
      source_column TEXT NOT NULL,
      target_table TEXT NOT NULL,
      target_column TEXT NOT NULL,
      constraint_name TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (schema_id) REFERENCES custom_schemas(id) ON DELETE CASCADE
    );
  `);

  // Table 4: analysis_runs
  db.exec(`
    CREATE TABLE IF NOT EXISTS analysis_runs (
      id TEXT PRIMARY KEY,
      schema_id TEXT,
      created_at TEXT NOT NULL,
      row_count_spec TEXT NOT NULL DEFAULT '10M',
      row_count_numeric INTEGER NOT NULL DEFAULT 10000000,
      read_percent INTEGER NOT NULL,
      write_percent INTEGER NOT NULL,
      query_complexity TEXT NOT NULL,
      storage_cost_sensitivity TEXT NOT NULL,
      data_consistency_criticality TEXT NOT NULL,
      verdict TEXT NOT NULL,
      normalized_average REAL NOT NULL,
      denormalized_average REAL NOT NULL,
      confidence_margin INTEGER NOT NULL DEFAULT 0,
      scores_breakdown TEXT NOT NULL,
      recommendation_details TEXT NOT NULL,
      FOREIGN KEY (schema_id) REFERENCES custom_schemas(id) ON DELETE CASCADE
    );
  `);

  // Performance Indexes for foreign key joins, cascade deletes, and filtered schema listing
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_custom_schemas_user ON custom_schemas(user_id, is_public);
    CREATE INDEX IF NOT EXISTS idx_schema_tables_schema ON schema_tables(schema_id);
    CREATE INDEX IF NOT EXISTS idx_schema_rel_schema ON schema_relationships(schema_id);
    CREATE INDEX IF NOT EXISTS idx_analysis_runs_schema_created ON analysis_runs(schema_id, created_at DESC);
  `);

  // Table 5: quiz_questions
  db.exec(`
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      question TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      explanation TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      topic TEXT NOT NULL,
      is_competitive_exam INTEGER DEFAULT 0,
      exam_tag TEXT,
      category TEXT DEFAULT 'AI_GENERATED',
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_quiz_questions_diff ON quiz_questions(difficulty);
    CREATE INDEX IF NOT EXISTS idx_quiz_questions_is_comp ON quiz_questions(is_competitive_exam);
    CREATE INDEX IF NOT EXISTS idx_quiz_questions_cat ON quiz_questions(category);
  `);

  // Table 6: quizzes (Quiz attempts & performance)
  db.exec(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      difficulty TEXT NOT NULL,
      question_count INTEGER NOT NULL,
      score INTEGER NOT NULL,
      percentage REAL NOT NULL,
      summary TEXT NOT NULL,
      question_ids TEXT NOT NULL,
      user_answers TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'completed',
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE INDEX IF NOT EXISTS idx_quizzes_user ON quizzes(user_id);
    CREATE INDEX IF NOT EXISTS idx_quizzes_created ON quizzes(created_at DESC);
  `);
}

// ----------------------------------------------------------------------------
// User Authentication API
// ----------------------------------------------------------------------------
export async function registerUser(email: string, password: string, name: string): Promise<UserRecord> {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim() || cleanEmail.split('@')[0];

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { name: cleanName } }
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Registration failed');
    return {
      id: data.user.id,
      email: data.user.email || cleanEmail,
      name: (data.user.user_metadata?.name as string) || cleanName,
      created_at: data.user.created_at || new Date().toISOString()
    };
  }

  // Local SQLite fallback
  const db = getSqliteDb();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail) as { id: string } | undefined;
  if (existing) {
    throw new Error('A user with this email address already exists.');
  }

  const userId = crypto.randomUUID();
  const passwordHash = hashPassword(password);
  const now = new Date().toISOString();

  db.prepare(`
    INSERT INTO users (id, email, password_hash, name, created_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, cleanEmail, passwordHash, cleanName, now);

  return { id: userId, email: cleanEmail, name: cleanName, created_at: now };
}

export async function loginUser(email: string, password: string): Promise<{ user: UserRecord; token?: string }> {
  const cleanEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured && supabase) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password
    });
    if (error) throw new Error(error.message);
    if (!data.user) throw new Error('Invalid credentials');
    return {
      user: {
        id: data.user.id,
        email: data.user.email || cleanEmail,
        name: (data.user.user_metadata?.name as string) || cleanEmail.split('@')[0],
        created_at: data.user.created_at || new Date().toISOString()
      },
      token: data.session?.access_token
    };
  }

  // Local SQLite fallback
  const db = getSqliteDb();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail) as any;
  if (!user || !verifyPassword(password, user.password_hash)) {
    throw new Error('Invalid email or password.');
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      created_at: user.created_at
    }
  };
}

export async function getUserById(userId: string): Promise<UserRecord | null> {
  if (isSupabaseConfigured && supabase) {
    const { data } = await supabase.auth.admin?.getUserById(userId) || {};
    if (data?.user) {
      return {
        id: data.user.id,
        email: data.user.email || '',
        name: (data.user.user_metadata?.name as string) || '',
        created_at: data.user.created_at || ''
      };
    }
  }

  const db = getSqliteDb();
  const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(userId) as any;
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    created_at: user.created_at
  };
}

// ----------------------------------------------------------------------------
// Custom Schemas, Tables & Relationships Operations
// ----------------------------------------------------------------------------
export async function createCustomSchemaWithRelations(params: {
  title: string;
  description?: string;
  dialect?: 'postgres' | 'mysql' | 'sqlite' | 'generic';
  ddlContent: string;
  tableCount: number;
  foreignKeysCount: number;
  maxJoinDepth: number;
  estimatedNormalForm?: string;
  isPublic?: boolean;
  userId?: string | null;
  tables: Array<{
    name: string;
    estimatedRows: number;
    columnCount: number;
    primaryKeys: string[];
  }>;
  relationships: Array<{
    sourceTable: string;
    sourceColumn: string;
    targetTable: string;
    targetColumn: string;
    constraintName?: string;
  }>;
  initialAnalysis?: {
    workload: {
      rowCountSpec?: string;
      rowCountNumeric: number;
      readPercent: number;
      writePercent: number;
      queryComplexity?: 'simple' | 'medium' | 'complex';
      storageCostSensitivity?: 'low' | 'medium' | 'high';
      dataConsistencyCriticality?: 'low' | 'medium' | 'high';
    };
    evaluation: {
      verdict: 'Prefer Normalization' | 'Prefer Denormalization' | 'Hybrid';
      scores: {
        normalizedAverage: number;
        denormalizedAverage: number;
        margin: number;
      };
      breakdown: Record<string, any>;
      explanation: Record<string, any>;
    };
  };
}): Promise<CustomSchemaRecord> {
  const schemaId = crypto.randomUUID();
  const now = new Date().toISOString();
  const dialect = params.dialect || 'postgres';
  const estimatedNormalForm = params.estimatedNormalForm || '3NF';
  const isPublic = params.isPublic ?? true;
  const userId = params.userId || null;

  if (isSupabaseConfigured && supabase) {
    // 1. Insert custom_schemas
    const { error: schemaErr } = await supabase.from('custom_schemas').insert({
      id: schemaId,
      created_at: now,
      updated_at: now,
      title: params.title,
      description: params.description || null,
      dialect,
      ddl_content: params.ddlContent,
      table_count: params.tableCount,
      foreign_keys_count: params.foreignKeysCount,
      max_join_depth: params.maxJoinDepth,
      estimated_normal_form: estimatedNormalForm,
      is_public: isPublic,
      user_id: userId
    });
    if (schemaErr) throw new Error(schemaErr.message);

    // 2. Insert schema_tables
    if (params.tables.length > 0) {
      const tableRows = params.tables.map(t => ({
        id: crypto.randomUUID(),
        schema_id: schemaId,
        table_name: t.name,
        estimated_row_count: t.estimatedRows,
        column_count: t.columnCount,
        primary_keys: t.primaryKeys,
        created_at: now
      }));
      const { error: tblErr } = await supabase.from('schema_tables').insert(tableRows);
      if (tblErr) console.error('[STORAGE] Error inserting schema_tables:', tblErr.message);
    }

    // 3. Insert schema_relationships
    if (params.relationships.length > 0) {
      const relRows = params.relationships.map(r => ({
        id: crypto.randomUUID(),
        schema_id: schemaId,
        source_table: r.sourceTable,
        source_column: r.sourceColumn,
        target_table: r.targetTable,
        target_column: r.targetColumn,
        constraint_name: r.constraintName || null,
        created_at: now
      }));
      const { error: relErr } = await supabase.from('schema_relationships').insert(relRows);
      if (relErr) console.error('[STORAGE] Error inserting schema_relationships:', relErr.message);
    }

    // 4. Insert initial analysis run if provided
    if (params.initialAnalysis) {
      const initRun = params.initialAnalysis;
      await supabase.from('analysis_runs').insert({
        id: crypto.randomUUID(),
        schema_id: schemaId,
        created_at: now,
        row_count_spec: initRun.workload.rowCountSpec || '10M',
        row_count_numeric: initRun.workload.rowCountNumeric || 10000000,
        read_percent: initRun.workload.readPercent,
        write_percent: initRun.workload.writePercent,
        query_complexity: initRun.workload.queryComplexity || 'medium',
        storage_cost_sensitivity: initRun.workload.storageCostSensitivity || 'medium',
        data_consistency_criticality: initRun.workload.dataConsistencyCriticality || 'medium',
        verdict: initRun.evaluation.verdict,
        normalized_average: initRun.evaluation.scores.normalizedAverage,
        denormalized_average: initRun.evaluation.scores.denormalizedAverage,
        confidence_margin: initRun.evaluation.scores.margin || 0,
        scores_breakdown: initRun.evaluation.breakdown,
        recommendation_details: initRun.evaluation.explanation
      });
    }

    return {
      id: schemaId,
      created_at: now,
      updated_at: now,
      title: params.title,
      description: params.description || null,
      dialect,
      ddl_content: params.ddlContent,
      table_count: params.tableCount,
      foreign_keys_count: params.foreignKeysCount,
      max_join_depth: params.maxJoinDepth,
      estimated_normal_form: estimatedNormalForm,
      is_public: isPublic,
      user_id: userId
    };
  }

  // SQLite fallback
  const db = getSqliteDb();
  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare(`
      INSERT INTO custom_schemas (
        id, created_at, updated_at, title, description, dialect, ddl_content,
        table_count, foreign_keys_count, max_join_depth, estimated_normal_form,
        is_public, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      schemaId, now, now, params.title, params.description || null, dialect, params.ddlContent,
      params.tableCount, params.foreignKeysCount, params.maxJoinDepth, estimatedNormalForm,
      isPublic ? 1 : 0, userId
    );

    if (params.tables.length > 0) {
      const insertTableStmt = db.prepare(`
        INSERT INTO schema_tables (id, schema_id, table_name, estimated_row_count, column_count, primary_keys, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const t of params.tables) {
        insertTableStmt.run(crypto.randomUUID(), schemaId, t.name, t.estimatedRows, t.columnCount, JSON.stringify(t.primaryKeys), now);
      }
    }

    if (params.relationships.length > 0) {
      const insertRelStmt = db.prepare(`
        INSERT INTO schema_relationships (id, schema_id, source_table, source_column, target_table, target_column, constraint_name, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const r of params.relationships) {
        insertRelStmt.run(crypto.randomUUID(), schemaId, r.sourceTable, r.sourceColumn, r.targetTable, r.targetColumn, r.constraintName || null, now);
      }
    }

    if (params.initialAnalysis) {
      const initRun = params.initialAnalysis;
      db.prepare(`
        INSERT INTO analysis_runs (
          id, schema_id, created_at, row_count_spec, row_count_numeric,
          read_percent, write_percent, query_complexity, storage_cost_sensitivity,
          data_consistency_criticality, verdict, normalized_average, denormalized_average,
          confidence_margin, scores_breakdown, recommendation_details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        crypto.randomUUID(), schemaId, now, initRun.workload.rowCountSpec || '10M',
        initRun.workload.rowCountNumeric || 10000000, initRun.workload.readPercent, initRun.workload.writePercent,
        initRun.workload.queryComplexity || 'medium', initRun.workload.storageCostSensitivity || 'medium',
        initRun.workload.dataConsistencyCriticality || 'medium', initRun.evaluation.verdict,
        initRun.evaluation.scores.normalizedAverage, initRun.evaluation.scores.denormalizedAverage,
        initRun.evaluation.scores.margin || 0,
        JSON.stringify(initRun.evaluation.breakdown), JSON.stringify(initRun.evaluation.explanation)
      );
    }

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }

  return {
    id: schemaId,
    created_at: now,
    updated_at: now,
    title: params.title,
    description: params.description || null,
    dialect,
    ddl_content: params.ddlContent,
    table_count: params.tableCount,
    foreign_keys_count: params.foreignKeysCount,
    max_join_depth: params.maxJoinDepth,
    estimated_normal_form: estimatedNormalForm,
    is_public: isPublic,
    user_id: userId
  };
}

export async function listUserSchemas(userId?: string | null): Promise<Array<CustomSchemaRecord & { latest_run?: AnalysisRunRecord | null }>> {
  if (isSupabaseConfigured && supabase) {
    let query = supabase.from('custom_schemas').select('*').order('created_at', { ascending: false });
    if (userId) {
      query = query.or(`user_id.eq.${userId},is_public.eq.true`);
    } else {
      query = query.eq('is_public', true);
    }
    const { data, error } = await query;
    if (error) throw new Error(error.message);

    const schemas = data as CustomSchemaRecord[];
    return Promise.all(
      schemas.map(async (s) => {
        const { data: runs } = await supabase
          .from('analysis_runs')
          .select('*')
          .eq('schema_id', s.id)
          .order('created_at', { ascending: false })
          .limit(1);
        return {
          ...s,
          latest_run: runs && runs.length > 0 ? (runs[0] as AnalysisRunRecord) : null
        };
      })
    );
  }

  // SQLite fallback
  const db = getSqliteDb();
  let rows: any[];
  if (userId) {
    rows = db.prepare('SELECT * FROM custom_schemas WHERE user_id = ? OR is_public = 1 ORDER BY created_at DESC').all(userId);
  } else {
    rows = db.prepare('SELECT * FROM custom_schemas WHERE is_public = 1 ORDER BY created_at DESC').all();
  }

  const getLatestRunStmt = db.prepare('SELECT * FROM analysis_runs WHERE schema_id = ? ORDER BY created_at DESC LIMIT 1');

  return rows.map(r => {
    const latestRunRow = getLatestRunStmt.get(r.id) as any;
    let latest_run: AnalysisRunRecord | null = null;
    if (latestRunRow) {
      latest_run = {
        ...latestRunRow,
        scores_breakdown: JSON.parse(latestRunRow.scores_breakdown || '{}'),
        recommendation_details: JSON.parse(latestRunRow.recommendation_details || '{}')
      };
    }

    return {
      id: r.id,
      created_at: r.created_at,
      updated_at: r.updated_at,
      title: r.title,
      description: r.description,
      dialect: r.dialect,
      ddl_content: r.ddl_content,
      table_count: r.table_count,
      foreign_keys_count: r.foreign_keys_count,
      max_join_depth: r.max_join_depth,
      estimated_normal_form: r.estimated_normal_form,
      is_public: Boolean(r.is_public),
      user_id: r.user_id,
      latest_run
    };
  });
}

export async function getCustomSchemaDetails(schemaId: string): Promise<{
  schema: CustomSchemaRecord;
  tables: SchemaTableRecord[];
  relationships: SchemaRelationshipRecord[];
  runs: AnalysisRunRecord[];
} | null> {
  if (isSupabaseConfigured && supabase) {
    const { data: schema, error: schemaErr } = await supabase.from('custom_schemas').select('*').eq('id', schemaId).single();
    if (schemaErr || !schema) return null;

    const { data: tables } = await supabase.from('schema_tables').select('*').eq('schema_id', schemaId);
    const { data: relationships } = await supabase.from('schema_relationships').select('*').eq('schema_id', schemaId);
    const { data: runs } = await supabase.from('analysis_runs').select('*').eq('schema_id', schemaId).order('created_at', { ascending: false });

    return {
      schema: schema as CustomSchemaRecord,
      tables: (tables || []) as SchemaTableRecord[],
      relationships: (relationships || []) as SchemaRelationshipRecord[],
      runs: (runs || []) as AnalysisRunRecord[]
    };
  }

  // SQLite fallback
  const db = getSqliteDb();
  const schema = db.prepare('SELECT * FROM custom_schemas WHERE id = ?').get(schemaId) as any;
  if (!schema) return null;

  const tableRows = db.prepare('SELECT * FROM schema_tables WHERE schema_id = ?').all(schemaId) as any[];
  const relRows = db.prepare('SELECT * FROM schema_relationships WHERE schema_id = ?').all(schemaId) as any[];
  const runRows = db.prepare('SELECT * FROM analysis_runs WHERE schema_id = ? ORDER BY created_at DESC').all(schemaId) as any[];

  return {
    schema: {
      ...schema,
      is_public: Boolean(schema.is_public)
    },
    tables: tableRows.map(t => ({
      ...t,
      primary_keys: typeof t.primary_keys === 'string' ? JSON.parse(t.primary_keys) : t.primary_keys
    })),
    relationships: relRows,
    runs: runRows.map(rn => ({
      ...rn,
      scores_breakdown: JSON.parse(rn.scores_breakdown || '{}'),
      recommendation_details: JSON.parse(rn.recommendation_details || '{}')
    }))
  };
}

export async function updateSchemaSync(params: {
  schemaId: string;
  tableCount: number;
  foreignKeysCount: number;
  maxJoinDepth: number;
  ddlContent: string;
  tables: Array<{
    name: string;
    estimatedRows: number;
    columnCount: number;
    primaryKeys: string[];
  }>;
  relationships: Array<{
    sourceTable: string;
    sourceColumn: string;
    targetTable: string;
    targetColumn: string;
    constraintName?: string;
  }>;
  newAnalysis?: {
    workload: {
      rowCountSpec?: string;
      rowCountNumeric: number;
      readPercent: number;
      writePercent: number;
      queryComplexity?: 'simple' | 'medium' | 'complex';
      storageCostSensitivity?: 'low' | 'medium' | 'high';
      dataConsistencyCriticality?: 'low' | 'medium' | 'high';
    };
    evaluation: {
      verdict: 'Prefer Normalization' | 'Prefer Denormalization' | 'Hybrid';
      scores: {
        normalizedAverage: number;
        denormalizedAverage: number;
        margin: number;
      };
      breakdown: Record<string, any>;
      explanation: Record<string, any>;
    };
  };
}): Promise<void> {
  const now = new Date().toISOString();

  if (isSupabaseConfigured && supabase) {
    // 1. Update custom_schemas
    await supabase.from('custom_schemas').update({
      updated_at: now,
      table_count: params.tableCount,
      foreign_keys_count: params.foreignKeysCount,
      max_join_depth: params.maxJoinDepth,
      ddl_content: params.ddlContent
    }).eq('id', params.schemaId);

    // 2. Replace schema_tables
    await supabase.from('schema_tables').delete().eq('schema_id', params.schemaId);
    if (params.tables.length > 0) {
      await supabase.from('schema_tables').insert(params.tables.map(t => ({
        id: crypto.randomUUID(),
        schema_id: params.schemaId,
        table_name: t.name,
        estimated_row_count: t.estimatedRows,
        column_count: t.columnCount,
        primary_keys: t.primaryKeys,
        created_at: now
      })));
    }

    // 3. Replace schema_relationships
    await supabase.from('schema_relationships').delete().eq('schema_id', params.schemaId);
    if (params.relationships.length > 0) {
      await supabase.from('schema_relationships').insert(params.relationships.map(r => ({
        id: crypto.randomUUID(),
        schema_id: params.schemaId,
        source_table: r.sourceTable,
        source_column: r.sourceColumn,
        target_table: r.targetTable,
        target_column: r.targetColumn,
        constraint_name: r.constraintName || null,
        created_at: now
      })));
    }

    // 4. Log new analysis run
    if (params.newAnalysis) {
      const a = params.newAnalysis;
      await supabase.from('analysis_runs').insert({
        id: crypto.randomUUID(),
        schema_id: params.schemaId,
        created_at: now,
        row_count_spec: a.workload.rowCountSpec || '10M',
        row_count_numeric: a.workload.rowCountNumeric || 10000000,
        read_percent: a.workload.readPercent,
        write_percent: a.workload.writePercent,
        query_complexity: a.workload.queryComplexity || 'medium',
        storage_cost_sensitivity: a.workload.storageCostSensitivity || 'medium',
        data_consistency_criticality: a.workload.dataConsistencyCriticality || 'medium',
        verdict: a.evaluation.verdict,
        normalized_average: a.evaluation.scores.normalizedAverage,
        denormalized_average: a.evaluation.scores.denormalizedAverage,
        confidence_margin: a.evaluation.scores.margin || 0,
        scores_breakdown: a.evaluation.breakdown,
        recommendation_details: a.evaluation.explanation
      });
    }
    return;
  }

  // SQLite fallback
  const db = getSqliteDb();
  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare(`
      UPDATE custom_schemas
      SET updated_at = ?, table_count = ?, foreign_keys_count = ?, max_join_depth = ?, ddl_content = ?
      WHERE id = ?
    `).run(now, params.tableCount, params.foreignKeysCount, params.maxJoinDepth, params.ddlContent, params.schemaId);

    db.prepare('DELETE FROM schema_tables WHERE schema_id = ?').run(params.schemaId);
    if (params.tables.length > 0) {
      const insertTableStmt = db.prepare(`
        INSERT INTO schema_tables (id, schema_id, table_name, estimated_row_count, column_count, primary_keys, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const t of params.tables) {
        insertTableStmt.run(crypto.randomUUID(), params.schemaId, t.name, t.estimatedRows, t.columnCount, JSON.stringify(t.primaryKeys), now);
      }
    }

    db.prepare('DELETE FROM schema_relationships WHERE schema_id = ?').run(params.schemaId);
    if (params.relationships.length > 0) {
      const insertRelStmt = db.prepare(`
        INSERT INTO schema_relationships (id, schema_id, source_table, source_column, target_table, target_column, constraint_name, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const r of params.relationships) {
        insertRelStmt.run(crypto.randomUUID(), params.schemaId, r.sourceTable, r.sourceColumn, r.targetTable, r.targetColumn, r.constraintName || null, now);
      }
    }

    if (params.newAnalysis) {
      const a = params.newAnalysis;
      db.prepare(`
        INSERT INTO analysis_runs (
          id, schema_id, created_at, row_count_spec, row_count_numeric,
          read_percent, write_percent, query_complexity, storage_cost_sensitivity,
          data_consistency_criticality, verdict, normalized_average, denormalized_average,
          confidence_margin, scores_breakdown, recommendation_details
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        crypto.randomUUID(), params.schemaId, now, a.workload.rowCountSpec || '10M',
        a.workload.rowCountNumeric || 10000000, a.workload.readPercent, a.workload.writePercent,
        a.workload.queryComplexity || 'medium', a.workload.storageCostSensitivity || 'medium',
        a.workload.dataConsistencyCriticality || 'medium', a.evaluation.verdict,
        a.evaluation.scores.normalizedAverage, a.evaluation.scores.denormalizedAverage,
        a.evaluation.scores.margin || 0,
        JSON.stringify(a.evaluation.breakdown), JSON.stringify(a.evaluation.explanation)
      );
    }

    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

export async function deleteCustomSchema(schemaId: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    const { error } = await supabase.from('custom_schemas').delete().eq('id', schemaId);
    return !error;
  }

  const db = getSqliteDb();
  db.prepare('DELETE FROM custom_schemas WHERE id = ?').run(schemaId);
  return true;
}

// ----------------------------------------------------------------------------
// Quiz & Questions Management (Supabase with SQLite Mirror)
// ----------------------------------------------------------------------------

export interface QuizQuestionRecord {
  id: string;
  question: string;
  options: string[] | any;
  correct_answer: string;
  explanation: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  topic: string;
  is_competitive_exam?: boolean;
  exam_tag?: string;
  category?: string;
  created_at?: string;
}

export interface QuizAttemptRecord {
  id?: string;
  user_id?: string | null;
  difficulty: string;
  question_count: number;
  score: number;
  percentage: number;
  summary: Record<string, any>;
  question_ids: string[];
  user_answers: any[];
  status?: string;
  created_at?: string;
}

/**
 * Seed questions into Supabase / SQLite if table is empty
 */
export async function seedQuizQuestions(questions: QuizQuestionRecord[]): Promise<number> {
  const now = new Date().toISOString();
  let seededCount = 0;

  if (isSupabaseConfigured && supabase) {
    try {
      const { count } = await supabase.from('quiz_questions').select('*', { count: 'exact', head: true });
      if (!count || count === 0) {
        const rows = questions.map(q => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          topic: q.topic,
          is_competitive_exam: Boolean(q.is_competitive_exam),
          exam_tag: q.exam_tag || null,
          category: q.category || 'AI_GENERATED',
          created_at: q.created_at || now
        }));
        const { error } = await supabase.from('quiz_questions').upsert(rows);
        if (!error) seededCount = rows.length;
      }
    } catch (err) {
      console.warn('[STORAGE] Remote Supabase seeding note:', err);
    }
  }

  // Also seed local SQLite mirror
  const db = getSqliteDb();
  const rowCount = (db.prepare('SELECT COUNT(*) as count FROM quiz_questions').get() as { count: number }).count;
  if (rowCount === 0) {
    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO quiz_questions (
        id, question, options, correct_answer, explanation,
        difficulty, topic, is_competitive_exam, exam_tag, category, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    db.exec('BEGIN TRANSACTION;');
    try {
      for (const q of questions) {
        insertStmt.run(
          q.id,
          q.question,
          typeof q.options === 'string' ? q.options : JSON.stringify(q.options),
          q.correct_answer,
          q.explanation,
          q.difficulty,
          q.topic,
          q.is_competitive_exam ? 1 : 0,
          q.exam_tag || null,
          q.category || 'AI_GENERATED',
          q.created_at || now
        );
      }
      db.exec('COMMIT;');
      seededCount = questions.length;
    } catch (e) {
      db.exec('ROLLBACK;');
      console.error('[STORAGE] SQLite question seed error:', e);
    }
  }

  return seededCount;
}

/**
 * Get questions for interactive AI quiz filtered by difficulty
 */
export async function getQuizQuestions(params: {
  difficulty?: string;
  count?: number;
  topic?: string;
}): Promise<QuizQuestionRecord[]> {
  const limit = params.count || 5;

  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('quiz_questions').select('*');
      if (params.difficulty) {
        query = query.eq('difficulty', params.difficulty);
      }
      if (params.topic) {
        query = query.eq('topic', params.topic);
      }
      const { data, error } = await query.limit(limit * 3); // fetch sample to shuffle
      if (!error && data && data.length > 0) {
        // Shuffle and take requested count
        const shuffled = data.sort(() => 0.5 - Math.random()).slice(0, limit);
        return shuffled.map(q => ({
          ...q,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
        }));
      }
    } catch (err) {
      console.warn('[STORAGE] Supabase question query fallback to SQLite:', err);
    }
  }

  // SQLite Fallback
  const db = getSqliteDb();
  let sql = 'SELECT * FROM quiz_questions WHERE 1=1';
  const queryParams: any[] = [];

  if (params.difficulty) {
    sql += ' AND difficulty = ?';
    queryParams.push(params.difficulty);
  }
  if (params.topic) {
    sql += ' AND topic = ?';
    queryParams.push(params.topic);
  }
  sql += ' ORDER BY RANDOM() LIMIT ?';
  queryParams.push(limit);

  const rows = db.prepare(sql).all(...queryParams) as any[];
  return rows.map(r => ({
    ...r,
    is_competitive_exam: Boolean(r.is_competitive_exam),
    options: typeof r.options === 'string' ? JSON.parse(r.options) : r.options
  }));
}

/**
 * Get Competitive Exam questions
 */
export async function getCompetitiveExamQuestions(params?: {
  category?: string;
  topic?: string;
  search?: string;
}): Promise<QuizQuestionRecord[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      let query = supabase.from('quiz_questions').select('*').eq('is_competitive_exam', true);
      if (params?.category && params.category !== 'All') {
        query = query.eq('category', params.category);
      }
      if (params?.topic && params.topic !== 'All') {
        query = query.eq('topic', params.topic);
      }
      const { data, error } = await query.order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        let results = data.map(q => ({
          ...q,
          options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options
        }));
        if (params?.search) {
          const s = params.search.toLowerCase();
          results = results.filter(q =>
            q.question.toLowerCase().includes(s) ||
            (q.exam_tag && q.exam_tag.toLowerCase().includes(s)) ||
            q.explanation.toLowerCase().includes(s)
          );
        }
        return results;
      }
    } catch (err) {
      console.warn('[STORAGE] Supabase exam query fallback to SQLite:', err);
    }
  }

  // SQLite Fallback
  const db = getSqliteDb();
  let sql = 'SELECT * FROM quiz_questions WHERE is_competitive_exam = 1';
  const queryParams: any[] = [];

  if (params?.category && params.category !== 'All') {
    sql += ' AND category = ?';
    queryParams.push(params.category);
  }
  if (params?.topic && params.topic !== 'All') {
    sql += ' AND topic = ?';
    queryParams.push(params.topic);
  }
  sql += ' ORDER BY created_at ASC';

  let rows = db.prepare(sql).all(...queryParams) as any[];
  let results = rows.map(r => ({
    ...r,
    is_competitive_exam: true,
    options: typeof r.options === 'string' ? JSON.parse(r.options) : r.options
  }));

  if (params?.search) {
    const s = params.search.toLowerCase();
    results = results.filter(q =>
      q.question.toLowerCase().includes(s) ||
      (q.exam_tag && q.exam_tag.toLowerCase().includes(s)) ||
      q.explanation.toLowerCase().includes(s)
    );
  }

  return results;
}

/**
 * Record a completed Quiz attempt in Supabase & SQLite
 */
export async function saveQuizAttempt(attempt: QuizAttemptRecord): Promise<QuizAttemptRecord> {
  const id = attempt.id || crypto.randomUUID();
  const now = new Date().toISOString();
  const record = {
    ...attempt,
    id,
    created_at: attempt.created_at || now
  };

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase.from('quizzes').insert({
        id: record.id,
        user_id: record.user_id || null,
        difficulty: record.difficulty,
        question_count: record.question_count,
        score: record.score,
        percentage: record.percentage,
        summary: record.summary,
        question_ids: record.question_ids,
        user_answers: record.user_answers,
        status: record.status || 'completed',
        created_at: record.created_at
      });
      if (error) console.warn('[STORAGE] Supabase save quiz attempt note:', error.message);
    } catch (err) {
      console.warn('[STORAGE] Supabase save quiz error:', err);
    }
  }

  // Always mirror in SQLite
  const db = getSqliteDb();
  db.prepare(`
    INSERT INTO quizzes (
      id, user_id, difficulty, question_count, score, percentage,
      summary, question_ids, user_answers, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    record.id,
    record.user_id || null,
    record.difficulty,
    record.question_count,
    record.score,
    record.percentage,
    JSON.stringify(record.summary),
    JSON.stringify(record.question_ids),
    JSON.stringify(record.user_answers),
    record.status || 'completed',
    record.created_at
  );

  return record;
}

/**
 * List past quiz attempts
 */
export async function getQuizAttempts(userId?: string): Promise<QuizAttemptRecord[]> {
  if (isSupabaseConfigured && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch (err) {
      console.warn('[STORAGE] Supabase fetch quiz attempts fallback to SQLite:', err);
    }
  }

  const db = getSqliteDb();
  let sql = 'SELECT * FROM quizzes';
  const params: any[] = [];
  if (userId) {
    sql += ' WHERE user_id = ?';
    params.push(userId);
  }
  sql += ' ORDER BY created_at DESC LIMIT 50';

  const rows = db.prepare(sql).all(...params) as any[];
  return rows.map(r => ({
    ...r,
    summary: typeof r.summary === 'string' ? JSON.parse(r.summary) : r.summary,
    question_ids: typeof r.question_ids === 'string' ? JSON.parse(r.question_ids) : r.question_ids,
    user_answers: typeof r.user_answers === 'string' ? JSON.parse(r.user_answers) : r.user_answers
  }));
}
