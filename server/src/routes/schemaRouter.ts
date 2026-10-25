import { Router, Request, Response } from 'express';
import multer from 'multer';
import { z } from 'zod';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { parseDDL, ParsedSchema } from '../parser/ddlParser';
import { parseCSVFile, parseCSVContent } from '../parser/csvParser';
import { parseJSONFile, parseJSONContent } from '../parser/jsonParser';
import { introspectPostgres } from '../parser/postgresIntrospector';
import { analyzeSchema } from '../analyzer/schemaAnalyzer';
import { evaluateCustomSchema, WorkloadInputs } from '../analyzer/recommender';

// Ensure temp upload dir exists
const tempUploadDir = path.join(os.tmpdir(), 'denorm-schema-uploads');
if (!fs.existsSync(tempUploadDir)) {
  try {
    fs.mkdirSync(tempUploadDir, { recursive: true });
  } catch {}
}

const upload = multer({
  dest: tempUploadDir,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB maximum file size
});

export const schemaRouter = Router();

const workloadSchema = z.object({
  rowCount: z.coerce.number().positive().optional(),
  readPercent: z.coerce.number().min(0).max(100).default(80),
  writePercent: z.coerce.number().min(0).max(100).default(20),
  storageCostSensitivity: z.enum(['low', 'medium', 'high']).default('medium'),
  dataConsistencyCriticality: z.enum(['low', 'medium', 'high']).default('high'),
});

/**
 * POST /api/v1/schema/analyze
 * Accepts multipart/form-data (file upload up to 500MB) or application/json (raw text)
 * Supports .sql, .ddl, .csv, .json, .ndjson
 */
schemaRouter.post('/analyze', upload.single('schemaFile'), async (req: Request, res: Response): Promise<void> => {
  const uploadedFile = req.file;

  try {
    let parsedSchema: ParsedSchema;
    let inferredRowCount = 1000000;
    let generatedDDL = '';
    const dialect = (req.body.dialect as string) || 'generic';

    if (uploadedFile) {
      const ext = path.extname(uploadedFile.originalname).toLowerCase();

      if (ext === '.csv') {
        const csvRes = await parseCSVFile(uploadedFile.path, uploadedFile.originalname);
        parsedSchema = csvRes.schema;
        inferredRowCount = csvRes.estimatedRowCount;
        generatedDDL = csvRes.generatedDDL;
      } else if (ext === '.json' || ext === '.ndjson') {
        const jsonRes = await parseJSONFile(uploadedFile.path, uploadedFile.originalname);
        parsedSchema = jsonRes.schema;
        inferredRowCount = jsonRes.estimatedRowCount;
        generatedDDL = jsonRes.generatedDDL;
      } else {
        // Default to SQL DDL (.sql, .ddl, .txt)
        const sqlContent = await fs.promises.readFile(uploadedFile.path, 'utf-8');
        parsedSchema = parseDDL(sqlContent, dialect);
        generatedDDL = sqlContent;
      }
    } else {
      // Content passed in request body
      const rawText = String(req.body.sqlContent || req.body.fileContent || '').trim();
      if (!rawText) {
        res.status(400).json({
          error: 'Bad Request',
          message: 'No schema provided. Upload a .sql, .csv, or .json file (up to 500MB) or provide content in request body.',
        });
        return;
      }

      // Detect format from content
      if (rawText.startsWith('{') || rawText.startsWith('[')) {
        try {
          const jsonRes = parseJSONContent(rawText);
          parsedSchema = jsonRes.schema;
          inferredRowCount = jsonRes.estimatedRowCount;
          generatedDDL = jsonRes.generatedDDL;
        } catch {
          // Fallback to DDL if JSON parsing failed
          parsedSchema = parseDDL(rawText, dialect);
          generatedDDL = rawText;
        }
      } else if (req.body.format === 'csv' || (!rawText.toUpperCase().includes('CREATE TABLE') && rawText.includes(','))) {
        try {
          const csvRes = parseCSVContent(rawText);
          parsedSchema = csvRes.schema;
          inferredRowCount = csvRes.estimatedRowCount;
          generatedDDL = csvRes.generatedDDL;
        } catch {
          parsedSchema = parseDDL(rawText, dialect);
          generatedDDL = rawText;
        }
      } else {
        parsedSchema = parseDDL(rawText, dialect);
        generatedDDL = rawText;
      }
    }

    if (!parsedSchema || parsedSchema.tables.length === 0) {
      res.status(422).json({
        error: 'Unprocessable Entity',
        message: 'Could not extract any valid tables or schema definitions from the provided input.',
      });
      return;
    }

    // Validate workload inputs
    const parsedWorkload = workloadSchema.safeParse(req.body);
    const validatedData = parsedWorkload.success ? parsedWorkload.data : {
      readPercent: 80,
      writePercent: 20,
      storageCostSensitivity: 'medium' as const,
      dataConsistencyCriticality: 'high' as const,
    };

    const finalRowCount = validatedData.rowCount || inferredRowCount;

    const workload: WorkloadInputs = {
      rowCount: finalRowCount,
      readPercent: validatedData.readPercent,
      writePercent: 100 - validatedData.readPercent,
      storageCostSensitivity: validatedData.storageCostSensitivity,
      dataConsistencyCriticality: validatedData.dataConsistencyCriticality,
    };

    // 1. Perform graph & topological analysis
    const analysis = analyzeSchema(parsedSchema);

    // 2. Generate tailored trade-off evaluation
    const evaluation = evaluateCustomSchema(analysis, workload);

    res.json({
      status: 'success',
      data: {
        schemaSummary: analysis.summary,
        diagnostics: analysis.diagnostics,
        tradeoffEvaluation: evaluation,
        generatedDDL,
        inferredRowCount,
        tablesDetected: parsedSchema.tables.map(t => ({
          name: t.name,
          columnCount: t.columns.length,
          primaryKeys: t.primaryKeys,
          foreignKeys: t.foreignKeys,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error?.message || 'An unexpected error occurred during schema analysis.',
    });
  } finally {
    // Safely delete temporary file if uploaded
    if (uploadedFile && uploadedFile.path) {
      fs.promises.unlink(uploadedFile.path).catch(() => {});
    }
  }
});

/**
 * POST /api/v1/schema/connect-postgres
 * Directly connects to a live PostgreSQL / Supabase instance,
 * introspects schema metadata, foreign keys, and row counts,
 * and performs graph analysis & trade-off evaluation.
 */
schemaRouter.post('/connect-postgres', async (req: Request, res: Response): Promise<void> => {
  try {
    const { connectionString, schemaName = 'public' } = req.body;
    if (!connectionString || typeof connectionString !== 'string' || !connectionString.trim()) {
      res.status(400).json({
        error: 'Bad Request',
        message: 'PostgreSQL / Supabase connection URI is required (e.g. postgresql://postgres:password@db.xxx.supabase.co:5432/postgres).',
      });
      return;
    }

    // 1. Run live introspection
    const introResult = await introspectPostgres(connectionString.trim(), (schemaName || 'public').trim());

    // 2. Validate workload inputs
    const parsedWorkload = workloadSchema.safeParse(req.body);
    const validatedData = parsedWorkload.success ? parsedWorkload.data : {
      readPercent: 80,
      writePercent: 20,
      storageCostSensitivity: 'medium' as const,
      dataConsistencyCriticality: 'high' as const,
    };

    const finalRowCount = validatedData.rowCount || introResult.totalRowCount;

    const workload: WorkloadInputs = {
      rowCount: finalRowCount,
      readPercent: validatedData.readPercent,
      writePercent: 100 - validatedData.readPercent,
      storageCostSensitivity: validatedData.storageCostSensitivity,
      dataConsistencyCriticality: validatedData.dataConsistencyCriticality,
    };

    // 3. Perform graph & topological analysis
    const analysis = analyzeSchema(introResult.schema);

    // 4. Generate tailored trade-off evaluation
    const evaluation = evaluateCustomSchema(analysis, workload);

    res.json({
      status: 'success',
      data: {
        schemaSummary: analysis.summary,
        diagnostics: analysis.diagnostics,
        tradeoffEvaluation: evaluation,
        generatedDDL: introResult.generatedDDL,
        inferredRowCount: introResult.totalRowCount,
        tableStats: introResult.tableStats,
        tablesDetected: introResult.schema.tables.map(t => ({
          name: t.name,
          columnCount: t.columns.length,
          primaryKeys: t.primaryKeys,
          foreignKeys: t.foreignKeys,
        })),
      },
    });
  } catch (error: any) {
    res.status(500).json({
      error: 'Database Connection Error',
      message: error?.message || 'Failed to connect to Supabase / PostgreSQL instance. Check host, port, credentials, and SSL settings.',
    });
  }
});
