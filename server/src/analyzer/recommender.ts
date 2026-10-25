import { SchemaAnalysisResult } from './schemaAnalyzer';

export interface WorkloadInputs {
  rowCount: number;
  readPercent: number;
  writePercent: number;
  storageCostSensitivity: 'low' | 'medium' | 'high';
  dataConsistencyCriticality: 'low' | 'medium' | 'high';
}

export interface DimensionScore {
  label: string;
  normalized: number;
  denormalized: number;
  justification: string;
}

export interface CustomTradeoffEvaluation {
  verdict: 'Prefer Normalization' | 'Prefer Denormalization' | 'Hybrid';
  badgeClass: 'norm' | 'denorm' | 'hybrid';
  explanation: string;
  scores: {
    normalizedAverage: number;
    denormalizedAverage: number;
  };
  breakdown: {
    readPerformance: DimensionScore;
    writePerformance: DimensionScore;
    storageEfficiency: DimensionScore;
    dataIntegrity: DimensionScore;
    queryComplexity: DimensionScore;
  };
  keyTakeaways: {
    why: string;
    whatCouldChange: string;
  };
  recommendation: {
    verdict: 'Prefer Normalization' | 'Prefer Denormalization' | 'Hybrid';
    badgeClass: 'norm' | 'denorm' | 'hybrid';
    explanation: string;
    keyTakeaways: {
      why: string;
      whatCouldChange: string;
    };
  };
}

/**
 * Calculates tailored trade-off scores factoring in real schema topology
 * (table count, join depth, detected redundancies) alongside workload inputs.
 */
export function evaluateCustomSchema(analysis: SchemaAnalysisResult, workload: WorkloadInputs): CustomTradeoffEvaluation {
  const { summary, diagnostics } = analysis;
  const { rowCount, readPercent, writePercent, storageCostSensitivity, dataConsistencyCriticality } = workload;

  // 1. Join Complexity Factor from Schema
  const joinDepth = summary.maxJoinDepth;
  const redundancyCount = diagnostics.detectedRedundancies.length;

  // --- Read Performance (0–10) ---
  let normRead = 8.0 - (joinDepth * 0.7); // deeper FK trees penalize normalized reads
  if (rowCount > 10000000) normRead -= 0.5;

  let denormRead = 9.5;
  if (redundancyCount > 0) denormRead = Math.min(10, denormRead + 0.3); // already eliminated joins
  if (rowCount >= 10000000) denormRead -= 1.8;
  else if (rowCount >= 2000000) denormRead -= 0.6;

  normRead = clampScore(normRead);
  denormRead = clampScore(denormRead);

  // --- Write Performance (0–10) ---
  let normWrite = 9.2;
  if (writePercent > 40 && dataConsistencyCriticality === 'high') normWrite = 9.8;

  // High foreign key count and duplicated fields compound rewrite penalties
  const rewriteMultiplier = 1 + (redundancyCount * 0.35);
  let denormWrite = 7.5 - ((writePercent / 100) * 5.0 * rewriteMultiplier);
  if (rowCount > 5000000) denormWrite -= 1.0;

  normWrite = clampScore(normWrite);
  denormWrite = clampScore(denormWrite);

  // --- Storage Efficiency (0–10) ---
  const normStorage = 9.5;
  let denormStorage = 6.5 - (redundancyCount * 0.6);
  if (storageCostSensitivity === 'high') denormStorage -= 2.0;
  else if (storageCostSensitivity === 'medium') denormStorage -= 0.5;

  denormStorage = clampScore(denormStorage);

  // --- Data Integrity (0–10) ---
  const normIntegrity = 10.0;
  let denormIntegrity = 7.0 - (redundancyCount * 0.8);
  if (dataConsistencyCriticality === 'high') denormIntegrity -= 2.0;
  else if (dataConsistencyCriticality === 'medium') denormIntegrity -= 1.0;

  denormIntegrity = clampScore(denormIntegrity);

  // --- Query Complexity (0–10) ---
  let normComplexity = 7.5 - (joinDepth * 0.8);
  const denormComplexity = 9.5; // flat SELECT queries

  normComplexity = clampScore(normComplexity);

  // Dimension Breakdown
  const breakdown = {
    readPerformance: {
      label: 'Read Performance',
      normalized: normRead,
      denormalized: denormRead,
      justification: denormRead >= normRead
        ? `Schema join depth (${joinDepth}) induces join overhead; denormalizing avoids ${joinDepth - 1} relational joins.`
        : `At ${rowCount.toLocaleString()} rows, wide denormalized rows dilute RAM buffer pool hit ratio.`
    },
    writePerformance: {
      label: 'Write Performance',
      normalized: normWrite,
      denormalized: denormWrite,
      justification: normWrite > denormWrite
        ? `Normalized updates alter 1 row per entity. Redundancies force multi-table rewrites (${writePercent}% write volume).`
        : `Low write traffic keeps denormalization lock contention manageable.`
    },
    storageEfficiency: {
      label: 'Storage Efficiency',
      normalized: normStorage,
      denormalized: denormStorage,
      justification: `Normalized schema maintains zero duplicate columns. Denormalizing copies attributes across ${summary.tableCount} tables.`
    },
    dataIntegrity: {
      label: 'Data Integrity',
      normalized: normIntegrity,
      denormalized: denormIntegrity,
      justification: `ACID foreign keys enforce constraints across ${summary.foreignKeysCount} relations. Duplication risks drift.`
    },
    queryComplexity: {
      label: 'Query Simplicity',
      normalized: normComplexity,
      denormalized: denormComplexity,
      justification: `Normalized queries require navigating ${joinDepth}-table JOIN paths. Denormalized queries are single-table lookups.`
    }
  };

  // Weighted Verdict
  const normTotal = (normRead * (readPercent / 100)) +
                    (normWrite * (writePercent / 100)) +
                    (normStorage * 0.4) +
                    (normIntegrity * (dataConsistencyCriticality === 'high' ? 1.0 : dataConsistencyCriticality === 'medium' ? 0.7 : 0.4)) +
                    (normComplexity * 0.4);

  const denormTotal = (denormRead * (readPercent / 100)) +
                      (denormWrite * (writePercent / 100)) +
                      (denormStorage * 0.4) +
                      (denormIntegrity * (dataConsistencyCriticality === 'high' ? 1.0 : dataConsistencyCriticality === 'medium' ? 0.7 : 0.4)) +
                      (denormComplexity * 0.4);

  const delta = denormTotal - normTotal;
  let verdict: 'Prefer Normalization' | 'Prefer Denormalization' | 'Hybrid' = 'Hybrid';
  let badgeClass: 'norm' | 'denorm' | 'hybrid' = 'hybrid';
  let explanation = '';
  const keyTakeaways = { why: '', whatCouldChange: '' };

  if (delta > 0.45 && readPercent >= 75 && dataConsistencyCriticality !== 'high') {
    verdict = 'Prefer Denormalization';
    badgeClass = 'denorm';
    explanation = `Your uploaded schema contains a join depth of ${joinDepth} across ${summary.tableCount} tables. With ${readPercent}% read traffic, pre-joining frequently accessed attributes delivers substantial latency gains while low write traffic (${writePercent}%) minimizes update anomalies.`;
    keyTakeaways.why = `Read latency reduction (Denorm: ${denormRead}/10 vs Norm: ${normRead}/10) eliminates ${joinDepth - 1} nested JOIN operations.`;
    keyTakeaways.whatCouldChange = `If writes surpass 35% or foreign key updates become concurrent, write amplification will favor Normalization.`;
  } else if (delta < -0.45 || writePercent >= 40 || dataConsistencyCriticality === 'high') {
    verdict = 'Prefer Normalization';
    badgeClass = 'norm';
    explanation = `Given the schema's ${summary.foreignKeysCount} foreign key constraints, high write ratio (${writePercent}%), and ${dataConsistencyCriticality} consistency requirement, strict Normalization (3NF) is strongly recommended to protect ACID integrity.`;
    keyTakeaways.why = `Single-row update atomicity (${normWrite}/10 vs ${denormWrite}/10) prevents multi-table lock contention and synchronization drift.`;
    keyTakeaways.whatCouldChange = `If read SLAs are breached on reporting endpoints, consider selective materialized views rather than widespread physical denormalization.`;
  } else {
    verdict = 'Hybrid';
    badgeClass = 'hybrid';
    explanation = `The schema shows balanced demands: keep transactional core entities in 3NF while selectively caching or denormalizing high-frequency foreign key lookups.`;
    keyTakeaways.why = `Neither pure approach is optimal: deep joins (${joinDepth}) hinder read queries, but writing to duplicated columns threatens data integrity.`;
    keyTakeaways.whatCouldChange = `A traffic swing towards >85% reads would trigger denormalization recommendations for hot tables.`;
  }

  const normAvg = Number(((normRead + normWrite + normStorage + normIntegrity + normComplexity) / 5).toFixed(1));
  const denormAvg = Number(((denormRead + denormWrite + denormStorage + denormIntegrity + denormComplexity) / 5).toFixed(1));

  return {
    verdict,
    badgeClass,
    explanation,
    scores: {
      normalizedAverage: normAvg,
      denormalizedAverage: denormAvg,
    },
    breakdown,
    keyTakeaways,
    recommendation: {
      verdict,
      badgeClass,
      explanation,
      keyTakeaways,
    },
  };
}

function clampScore(val: number): number {
  return Math.max(1, Math.min(10, Math.round(val * 10) / 10));
}
