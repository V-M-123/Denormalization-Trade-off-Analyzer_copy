/**
 * Denormalization Trade-off Scoring Engine
 * 
 * Computes 0-10 scores for both Normalized (3NF) and Denormalized architectures
 * across 5 mandatory dimensions:
 * 1. Read Performance
 * 2. Write Performance
 * 3. Storage Efficiency
 * 4. Data Integrity
 * 5. Query Complexity
 * 
 * Also generates recommendations: "Prefer Normalization", "Prefer Denormalization", or "Hybrid"
 * with plain-English explanations and Key Takeaways.
 */

export const QUERY_COMPLEXITY = {
  simple: { label: 'Simple (1-2 table joins)', joinCount: 1, penalty: 0.5 },
  medium: { label: 'Medium (3-4 table joins)', joinCount: 3, penalty: 2.0 },
  complex: { label: 'Complex (5+ table joins / aggregations)', joinCount: 5, penalty: 4.0 },
};

export const SENSITIVITY_LEVELS = {
  low: { label: 'Low', factor: 0.5 },
  medium: { label: 'Medium', factor: 1.0 },
  high: { label: 'High', factor: 1.5 },
};

/**
 * Validates user input parameters.
 * Returns { isValid: boolean, errors: Object }
 */
export function validateInputs(inputs) {
  const errors = {};

  const rowCount = Number(inputs.rowCount);
  if (isNaN(rowCount) || rowCount <= 0) {
    errors.rowCount = 'Table row count must be a positive number greater than 0.';
  }

  const readPercent = Number(inputs.readPercent);
  const writePercent = Number(inputs.writePercent);
  if (isNaN(readPercent) || readPercent < 0 || readPercent > 100) {
    errors.readPercent = 'Read percentage must be between 0% and 100%.';
  }
  if (isNaN(writePercent) || writePercent < 0 || writePercent > 100) {
    errors.writePercent = 'Write percentage must be between 0% and 100%.';
  }
  if (!isNaN(readPercent) && !isNaN(writePercent) && Math.round(readPercent + writePercent) !== 100) {
    errors.ratioSum = `Read (${readPercent}%) and Write (${writePercent}%) must sum to 100%. Current sum: ${readPercent + writePercent}%.`;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Computes 0-10 trade-off scores and DBA recommendation.
 */
export function calculateScores(inputs) {
  const rowCount = Math.max(1, Number(inputs.rowCount) || 100000);
  const readPercent = Math.max(0, Math.min(100, isNaN(Number(inputs.readPercent)) ? 80 : Number(inputs.readPercent)));
  const writePercent = Math.max(0, Math.min(100, isNaN(Number(inputs.writePercent)) ? 20 : Number(inputs.writePercent)));
  const queryComplexity = inputs.queryComplexity || 'medium';
  const storageSensitivity = inputs.storageCostSensitivity || 'medium';
  const consistencyCriticality = inputs.dataConsistencyCriticality || 'high';

  const complexityMeta = QUERY_COMPLEXITY[queryComplexity] || QUERY_COMPLEXITY.medium;
  const storageSensitivityMeta = SENSITIVITY_LEVELS[storageSensitivity] || SENSITIVITY_LEVELS.medium;
  const consistencyMeta = SENSITIVITY_LEVELS[consistencyCriticality] || SENSITIVITY_LEVELS.high;

  // --- Dimension 1: Read Performance (0 - 10) ---
  // Normalized read score: penalized by number of joins and large table scans
  let normReadScore = 8.0 - (complexityMeta.penalty * 1.2);
  if (rowCount > 10000000) normReadScore -= 1.0;
  normReadScore = Math.max(1, Math.min(10, Math.round(normReadScore * 10) / 10));

  // Denormalized read score: high by default because joins are eliminated.
  // Rule: Very large datasets that exceed typical RAM buffer pools adjust read advantage downward
  // (wide rows mean fewer rows fit in RAM page cache, causing more random disk I/O).
  let denormReadScore = 9.5;
  if (queryComplexity === 'simple') {
    denormReadScore = 8.5; // less dramatic gain when queries are already trivial
  }
  if (rowCount >= 10000000) {
    // RAM cache pressure from bloated rows (> 10M rows)
    denormReadScore -= 1.8;
  } else if (rowCount >= 2000000) {
    denormReadScore -= 0.8;
  }
  denormReadScore = Math.max(1, Math.min(10, Math.round(denormReadScore * 10) / 10));

  // --- Dimension 2: Write Performance (0 - 10) ---
  // Normalized write score: high because each entity update touches only 1 row/page (single source of truth).
  let normWriteScore = 9.2;
  if (rowCount > 20000000) normWriteScore -= 0.5; // deeper B-tree index maintenance
  normWriteScore = Math.max(1, Math.min(10, Math.round(normWriteScore * 10) / 10));

  // Denormalized write score: penalized heavily when write% is high and fanout is large.
  // Every parent update requires updating redundant copies across thousands of child records.
  let denormWriteScore = 7.5 - (writePercent / 100) * 5.5;
  if (rowCount > 5000000) denormWriteScore -= 1.0; // multi-row rewrite lock delay
  denormWriteScore = Math.max(1, Math.min(10, Math.round(denormWriteScore * 10) / 10));

  // --- Dimension 3: Storage Efficiency (0 - 10) ---
  // Normalized storage: 0 redundant duplicated fields.
  let normStorageScore = 9.5;

  // Denormalized storage: duplicate columns inflate table size 2x - 4x.
  // Penalized by storage cost sensitivity.
  let denormStorageScore = 7.0 - (storageSensitivityMeta.factor * 2.2);
  if (rowCount > 10000000) denormStorageScore -= 1.0;
  denormStorageScore = Math.max(1, Math.min(10, Math.round(denormStorageScore * 10) / 10));

  // --- Dimension 4: Data Integrity (0 - 10) ---
  // Normalized integrity: 10/10 guaranteed by foreign keys and 3NF single source of truth.
  let normIntegrityScore = 10.0;

  // Denormalized integrity: prone to update, deletion, and insertion anomalies.
  // Penalized by write frequency and consistency criticality.
  let denormIntegrityScore = 8.5 - ((writePercent / 100) * 3.5) - (consistencyMeta.factor * 2.0);
  denormIntegrityScore = Math.max(1, Math.min(10, Math.round(denormIntegrityScore * 10) / 10));

  // --- Dimension 5: Query Complexity (0 - 10) ---
  // Normalized: complex multi-table SQL queries with joins, foreign keys, and indexes.
  let normComplexityScore = 7.0 - complexityMeta.penalty;
  normComplexityScore = Math.max(1, Math.min(10, Math.round(normComplexityScore * 10) / 10));

  // Denormalized: flat queries without joins; trivial application SELECT queries.
  let denormComplexityScore = 9.0;
  if (queryComplexity === 'simple') denormComplexityScore = 8.5;
  denormComplexityScore = Math.max(1, Math.min(10, Math.round(denormComplexityScore * 10) / 10));

  // --- Scored Breakdown with Textual Justifications ---
  const breakdown = {
    readPerformance: {
      label: 'Read Performance',
      normalized: normReadScore,
      denormalized: denormReadScore,
      justification: denormReadScore > normReadScore
        ? `Denormalization avoids ${complexityMeta.joinCount}-table joins, fetching pre-combined rows directly.`
        : `Normalized with proper indexing performs comparably, avoiding bloated rows that exceed RAM cache.`
    },
    writePerformance: {
      label: 'Write Performance',
      normalized: normWriteScore,
      denormalized: denormWriteScore,
      justification: normWriteScore > denormWriteScore
        ? `Normalized updates touch only 1 row in 1 table. Denormalization suffers write amplification across duplicate rows.`
        : `Low write traffic (${writePercent}%) minimizes the write amplification penalty of denormalization.`
    },
    storageEfficiency: {
      label: 'Storage Efficiency',
      normalized: normStorageScore,
      denormalized: denormStorageScore,
      justification: `Normalized schema has zero redundancy. Denormalization duplicates columns, increasing disk and RAM footprint (${storageSensitivity} cost sensitivity).`
    },
    dataIntegrity: {
      label: 'Data Integrity',
      normalized: normIntegrityScore,
      denormalized: denormIntegrityScore,
      justification: `Normalized guarantees ACID integrity via foreign keys. Denormalization introduces anomaly risks if synchronization fails (${consistencyCriticality} criticality).`
    },
    queryComplexity: {
      label: 'Query Simplicity',
      normalized: normComplexityScore,
      denormalized: denormComplexityScore,
      justification: `Denormalized queries are simple single-table SELECTs. Normalized queries require complex multi-table JOINs and execution plans.`
    },
  };

  // --- Weighted Overall Recommendation Decision Logic ---
  // Rule-based logic reflecting DB design principles:
  // - High read % and low consistency criticality -> boost denormalization
  // - High write % and high consistency -> boost normalization
  // - RAM cache threshold check for massive tables
  let normTotalWeight = (normReadScore * (readPercent / 100)) + 
                        (normWriteScore * (writePercent / 100)) +
                        (normStorageScore * (storageSensitivityMeta.factor * 0.4)) +
                        (normIntegrityScore * (consistencyMeta.factor * 0.7)) +
                        (normComplexityScore * 0.3);

  let denormTotalWeight = (denormReadScore * (readPercent / 100)) + 
                          (denormWriteScore * (writePercent / 100)) +
                          (denormStorageScore * (storageSensitivityMeta.factor * 0.4)) +
                          (denormIntegrityScore * (consistencyMeta.factor * 0.7)) +
                          (denormComplexityScore * 0.3);

  let verdict = 'Hybrid';
  let badgeColor = 'amber';
  let explanation = '';
  let keyTakeaways = {
    why: '',
    whatCouldChange: ''
  };

  const delta = denormTotalWeight - normTotalWeight;

  if (readPercent >= 80 && consistencyCriticality !== 'high' && delta > 0.4) {
    verdict = 'Prefer Denormalization';
    badgeColor = 'emerald';
    explanation = `Your workload is heavily read-dominant (${readPercent}% reads) with ${consistencyCriticality} consistency sensitivity. Denormalization substantially boosts read throughput and query simplicity by eliminating ${complexityMeta.joinCount}-way relational joins, while the low write volume (${writePercent}%) keeps write amplification and anomaly risks minimal.`;
    keyTakeaways.why = `Read throughput gains (scored ${denormReadScore}/10 vs ${normReadScore}/10) decisively outweigh the moderate storage expansion under low write traffic.`;
    keyTakeaways.whatCouldChange = `If write traffic increases above 30% or if strict financial-grade consistency is enforced, write amplification and synchronization overhead would shift the recommendation back to Normalization or a Hybrid approach.`;
  } else if (writePercent >= 35 || consistencyCriticality === 'high' || delta < -0.4) {
    verdict = 'Prefer Normalization';
    badgeColor = 'rose';
    explanation = `Given the substantial write workload (${writePercent}% writes) and ${consistencyCriticality} data consistency criticality, Normalization (3NF) is strongly recommended. Normalization ensures atomic single-row updates, zero anomaly risks, and optimal storage efficiency, avoiding costly multi-row rewrite locks.`;
    keyTakeaways.why = `Write performance (${normWriteScore}/10 vs ${denormWriteScore}/10) and guaranteed ACID integrity (${normIntegrityScore}/10) protect against data corruption and lock contention.`;
    keyTakeaways.whatCouldChange = `If the system transitions to read-only reporting (>85% reads) or if read latency SLAs are breached, you can introduce read replicas or selective materialized views.`;
  } else {
    verdict = 'Hybrid';
    badgeColor = 'blue';
    explanation = `Your workload exhibits a balanced mix (${readPercent}% reads, ${writePercent}% writes) with ${consistencyCriticality} consistency requirements. A Hybrid architecture is optimal: retain strict 3NF normalization for core transactional tables while selectively denormalizing read-heavy summary tables or utilizing Materialized Views and an in-memory cache (e.g. Redis).`;
    keyTakeaways.why = `Neither pure Normalization nor pure Denormalization satisfies both write integrity and read latency simultaneously.`;
    keyTakeaways.whatCouldChange = `A shift toward either pure reads (>85%) or heavy batch writes (>50%) would clearly tip the balance toward one paradigm.`;
  }

  return {
    inputs: {
      rowCount,
      readPercent,
      writePercent,
      queryComplexity,
      storageCostSensitivity: storageSensitivity,
      dataConsistencyCriticality: consistencyCriticality,
    },
    breakdown,
    scores: {
      normalizedAverage: Number(((normReadScore + normWriteScore + normStorageScore + normIntegrityScore + normComplexityScore) / 5).toFixed(1)),
      denormalizedAverage: Number(((denormReadScore + denormWriteScore + denormStorageScore + denormIntegrityScore + denormComplexityScore) / 5).toFixed(1)),
    },
    recommendation: {
      verdict,
      badgeColor,
      explanation,
      keyTakeaways,
    },
    timestamp: new Date().toISOString(),
  };
}
