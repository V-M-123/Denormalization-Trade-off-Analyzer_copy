import { Router, Request, Response } from 'express';
import {
  createCustomSchemaWithRelations,
  listUserSchemas,
  getCustomSchemaDetails,
  updateSchemaSync,
  deleteCustomSchema
} from '../db/supabaseClient';
import { encryptSensitive, decryptSensitive, verifySessionToken } from '../utils/crypto';
import { introspectPostgres } from '../parser/postgresIntrospector';
import { analyzeSchema } from '../analyzer/schemaAnalyzer';
import { evaluateCustomSchema } from '../analyzer/recommender';
import { computeSchemaDiff } from '../analyzer/schemaDiffEngine';

export const savedSchemaRouter = Router();

// Helper to extract optional user ID from token
function getUserIdFromAuth(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  const session = verifySessionToken(token);
  return session ? session.userId : null;
}

// 1. List user schemas
savedSchemaRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromAuth(req);
    const schemas = await listUserSchemas(userId);
    res.json({ schemas });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list schemas.' });
  }
});

// 2. Save a new schema (from file upload or Supabase introspection)
savedSchemaRouter.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserIdFromAuth(req);
    const {
      title,
      description,
      connectionString,
      targetSchema = 'public',
      dialect = 'postgres',
      ddlContent,
      tableCount,
      foreignKeysCount,
      maxJoinDepth,
      estimatedNormalForm = '3NF',
      isPublic = true,
      tables = [],
      relationships = [],
      initialAnalysis
    } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Schema title is required.' });
    }
    if (!ddlContent) {
      return res.status(400).json({ error: 'DDL content is required.' });
    }

    // Pack encrypted connection string into metadata payload if supplied
    let secureDescription = description || '';
    if (connectionString) {
      const metaObj = {
        note: description || '',
        encUri: encryptSensitive(connectionString),
        targetSchema
      };
      secureDescription = `__META__:${JSON.stringify(metaObj)}`;
    }

    const saved = await createCustomSchemaWithRelations({
      title,
      description: secureDescription,
      dialect,
      ddlContent,
      tableCount: tableCount || tables.length || 0,
      foreignKeysCount: foreignKeysCount || relationships.length || 0,
      maxJoinDepth: maxJoinDepth || 0,
      estimatedNormalForm,
      isPublic: Boolean(isPublic),
      userId,
      tables,
      relationships,
      initialAnalysis
    });

    res.status(201).json({
      message: 'Schema saved successfully.',
      schema: saved
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to save schema.' });
  }
});

// 3. Get schema details (including tables, relationships, and previous runs)
savedSchemaRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const details = await getCustomSchemaDetails(id);
    if (!details) {
      return res.status(404).json({ error: 'Schema not found.' });
    }

    // Mask any encrypted URI from public exposure
    let hasLiveConnection = false;
    let targetSchema = 'public';
    let cleanDescription = details.schema.description || '';

    if (cleanDescription.startsWith('__META__:')) {
      try {
        const meta = JSON.parse(cleanDescription.substring(9));
        cleanDescription = meta.note || '';
        targetSchema = meta.targetSchema || 'public';
        hasLiveConnection = Boolean(meta.encUri);
      } catch {
        // Ignore JSON parsing errors
      }
    }

    res.json({
      ...details,
      schema: {
        ...details.schema,
        description: cleanDescription,
        hasLiveConnection,
        targetSchema
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch schema details.' });
  }
});

// 4. Check for changes in live database
savedSchemaRouter.post('/:id/check-changes', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const details = await getCustomSchemaDetails(id);
    if (!details) {
      return res.status(404).json({ error: 'Schema not found.' });
    }

    // Extract connection URI
    let connectionUri = req.body.connectionString;
    let targetSchema = req.body.targetSchema || 'public';

    if (!connectionUri && details.schema.description?.startsWith('__META__:')) {
      try {
        const meta = JSON.parse(details.schema.description.substring(9));
        connectionUri = decryptSensitive(meta.encUri);
        targetSchema = meta.targetSchema || targetSchema;
      } catch {
        // Ignore JSON parsing errors
      }
    }

    if (!connectionUri) {
      return res.status(400).json({
        error: 'No database connection string available. Please provide your Supabase connection URI.'
      });
    }

    // Execute live introspection
    const liveIntrospection = await introspectPostgres(connectionUri, targetSchema);
    const liveGraphAnalysis = analyzeSchema(liveIntrospection.schema);

    // Compute diff against stored schema_tables & schema_relationships
    const diff = computeSchemaDiff({
      storedTables: details.tables,
      storedRelationships: details.relationships,
      storedMetrics: {
        tableCount: details.schema.table_count,
        foreignKeysCount: details.schema.foreign_keys_count,
        maxJoinDepth: details.schema.max_join_depth
      },
      liveSchema: liveIntrospection.schema,
      liveStats: liveIntrospection.tableStats,
      liveMaxJoinDepth: liveGraphAnalysis.summary.maxJoinDepth
    });

    // Compute updated trade-off score with latest or default workload
    const latestRun = details.runs.length > 0 ? details.runs[0] : null;
    const workload = latestRun ? {
      rowCount: latestRun.row_count_numeric,
      readPercent: latestRun.read_percent,
      writePercent: latestRun.write_percent,
      storageCostSensitivity: latestRun.storage_cost_sensitivity,
      dataConsistencyCriticality: latestRun.data_consistency_criticality
    } : {
      rowCount: liveIntrospection.totalRowCount || 1000000,
      readPercent: 70,
      writePercent: 30,
      storageCostSensitivity: 'medium' as const,
      dataConsistencyCriticality: 'medium' as const
    };

    const newEvaluation = evaluateCustomSchema(liveGraphAnalysis, workload);

    res.json({
      schemaId: id,
      diff,
      liveIntrospection: {
        tableCount: liveIntrospection.schema.tables.length,
        foreignKeysCount: liveGraphAnalysis.summary.foreignKeyCount,
        maxJoinDepth: liveGraphAnalysis.summary.maxJoinDepth,
        totalRowCount: liveIntrospection.totalRowCount,
        tableStats: liveIntrospection.tableStats,
        generatedDDL: liveIntrospection.generatedDDL
      },
      newEvaluation,
      canSync: diff.hasChanges
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to check database for changes.' });
  }
});

// 5. Sync / Apply changes to database schema
savedSchemaRouter.post('/:id/sync', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { liveIntrospection, newEvaluation, workload } = req.body;

    if (!liveIntrospection || !liveIntrospection.tableStats) {
      return res.status(400).json({ error: 'Missing live introspection data for sync.' });
    }

    const tables = liveIntrospection.tableStats.map((s: any) => ({
      name: s.name,
      estimatedRows: s.estimatedRows || 0,
      columnCount: s.columnCount || 0,
      primaryKeys: s.primaryKeys || ['id']
    }));

    await updateSchemaSync({
      schemaId: id,
      tableCount: liveIntrospection.tableCount,
      foreignKeysCount: liveIntrospection.foreignKeysCount,
      maxJoinDepth: liveIntrospection.maxJoinDepth,
      ddlContent: liveIntrospection.generatedDDL,
      tables,
      relationships: liveIntrospection.relationships || [],
      newAnalysis: newEvaluation ? {
        workload: {
          rowCountSpec: workload?.rowCountSpec || '10M',
          rowCountNumeric: workload?.rowCount || 10000000,
          readPercent: workload?.readPercent || 70,
          writePercent: workload?.writePercent || 30,
          queryComplexity: workload?.queryComplexity || 'medium',
          storageCostSensitivity: workload?.storageCostSensitivity || 'medium',
          dataConsistencyCriticality: workload?.dataConsistencyCriticality || 'medium'
        },
        evaluation: newEvaluation
      } : undefined
    });

    res.json({ message: 'Database schema and analysis synchronized successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to synchronize schema changes.' });
  }
});

// 6. Delete schema
savedSchemaRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await deleteCustomSchema(id);
    res.json({ message: 'Schema deleted successfully.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete schema.' });
  }
});
