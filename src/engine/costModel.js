/**
 * Denormalization Trade-off Analytical Cost Model Engine
 * 
 * Provides mathematical cost modeling comparing Normalized (3NF/BCNF) vs. Denormalized architectures.
 * Evaluates Storage, Read Latency, Write Latency, Write Amplification, Lock Contention,
 * Anomaly Risk Index, and Pareto Optimality.
 */

export const HARDWARE_SPECS = {
  nvme: {
    label: 'Enterprise NVMe SSD (PCIe Gen4)',
    baseSeekMs: 0.04,
    diskPageFetchMs: 0.15,
    iopsLimit: 500000,
    costPerGbPerMonth: 0.18,
  },
  ssd: {
    label: 'Standard Cloud SSD (EBS gp3)',
    baseSeekMs: 0.35,
    diskPageFetchMs: 0.90,
    iopsLimit: 16000,
    costPerGbPerMonth: 0.08,
  },
  hdd: {
    label: 'Mechanical HDD (7200 RPM SAS)',
    baseSeekMs: 6.50,
    diskPageFetchMs: 8.20,
    iopsLimit: 250,
    costPerGbPerMonth: 0.02,
  },
};

/**
 * Calculates comprehensive trade-off metrics.
 * 
 * @param {Object} params 
 * @returns {Object} Comprehensive calculation results
 */
export function calculateTradeoffs(params) {
  const {
    readQps = 5000,
    writeQps = 500,
    table1Rows = 1000000, // Primary table (e.g. Orders)
    table2Rows = 100000,  // Dimension 1 (e.g. Customers)
    table3Rows = 2500000, // Child/Dimension 2 (e.g. Order Items)
    joinDepth = 3,        // Tables joined in normalized queries
    normRowSizeBytes = 180,
    denormRowSizeBytes = 480,
    hardwareTier = 'ssd',
    bufferCacheHitRatio = 0.82,
    indexOverheadPercent = 25,
    concurrency = 64,
    syncLockLevel = 'optimistic', // 'strict' (2PC / serializable), 'optimistic', 'none' (eventual)
  } = params;

  // Safe boundary fallbacks to avoid division by zero
  const safeReadQps = Math.max(0, readQps);
  const safeWriteQps = Math.max(0, writeQps);
  const totalQps = safeReadQps + safeWriteQps || 1;
  const readRatio = safeReadQps / totalQps;
  const writeRatio = safeWriteQps / totalQps;

  const hw = HARDWARE_SPECS[hardwareTier] || HARDWARE_SPECS.ssd;

  // --- 1. STORAGE CALCULATIONS ---
  // Normalized: Orders + Customers + Items separately
  const dim1RowSize = 120; // e.g. Customer row
  const dim2RowSize = 80;  // e.g. Item row
  const normRawBytes = (table1Rows * normRowSizeBytes) + 
                       (table2Rows * dim1RowSize) + 
                       (table3Rows * dim2RowSize);
  const normIndexBytes = normRawBytes * (indexOverheadPercent / 100);
  const totalNormBytes = normRawBytes + normIndexBytes;
  const normStorageGb = totalNormBytes / (1024 * 1024 * 1024);

  // Denormalized: Primary table holds redundant copies of Customer details + pre-aggregated summary
  const denormRawBytes = table1Rows * denormRowSizeBytes;
  const redundantBytes = table1Rows * Math.max(0, denormRowSizeBytes - normRowSizeBytes);
  // Wider rows mean wider indexes and more leaf page splits
  const denormIndexPercent = indexOverheadPercent * 1.35;
  const denormIndexBytes = denormRawBytes * (denormIndexPercent / 100);
  const totalDenormBytes = denormRawBytes + denormIndexBytes;
  const denormStorageGb = totalDenormBytes / (1024 * 1024 * 1024);
  const redundantStorageGb = redundantBytes / (1024 * 1024 * 1024);
  const storageInflationFactor = totalNormBytes > 0 ? (totalDenormBytes / totalNormBytes) : 1;

  // Monthly storage hosting cost
  const normMonthlyCost = normStorageGb * hw.costPerGbPerMonth;
  const denormMonthlyCost = denormStorageGb * hw.costPerGbPerMonth;

  // --- 2. READ LATENCY MODEL ---
  // Cache miss factor
  const missRatio = Math.max(0.01, 1 - bufferCacheHitRatio);

  // Normalized Read:
  // Must execute (joinDepth - 1) joins (Hash joins or Nested Loop index lookups)
  // Each join touches separate table index blocks and buffer pages, increasing cache eviction
  const normJoinCpuCostMs = (joinDepth - 1) * 2.8; 
  const normPagesTouched = 1 + (joinDepth - 1) * 3.2;
  const normDiskIoCostMs = normPagesTouched * missRatio * hw.diskPageFetchMs;
  const normReadLatencyMs = Number((hw.baseSeekMs + normJoinCpuCostMs + normDiskIoCostMs).toFixed(2));

  // Denormalized Read:
  // Direct single-table clustered index scan or point fetch. 0 joins.
  const denormPagesTouched = 1.4; // Slightly wider rows mean fewer rows per page
  const denormDiskIoCostMs = denormPagesTouched * missRatio * hw.diskPageFetchMs;
  const denormReadLatencyMs = Number((hw.baseSeekMs + 0.35 + denormDiskIoCostMs).toFixed(2));

  const readSpeedupFactor = normReadLatencyMs > 0 ? Number((normReadLatencyMs / denormReadLatencyMs).toFixed(2)) : 1;

  // --- 3. WRITE LATENCY & WRITE AMPLIFICATION MODEL ---
  // Write amplification: in normalized, updating a Customer updates 1 row in Customer table
  // In denormalized, updating Customer requires updating all Orders placed by that customer
  const fanoutRatio = Math.max(1, Math.round(table1Rows / Math.max(1, table2Rows)));
  const denormWriteAmplification = Number((1 + (fanoutRatio * 0.4)).toFixed(2));

  // Lock Contention factor based on write concurrency and fanout
  const lockContentionBase = (safeWriteQps / 1000) * (concurrency / 32);
  const normLockDelayMs = 0.5 * lockContentionBase;
  const denormLockDelayMs = 4.2 * lockContentionBase * (fanoutRatio > 5 ? 2.1 : 1.2);

  // Normalized Write Latency:
  const normWriteLatencyMs = Number((hw.baseSeekMs + 1.2 + normLockDelayMs + (missRatio * hw.diskPageFetchMs)).toFixed(2));

  // Denormalized Write Latency:
  const denormWriteLatencyMs = Number((
    (hw.baseSeekMs + 1.5) * denormWriteAmplification * 0.75 + denormLockDelayMs + (missRatio * hw.diskPageFetchMs * denormWriteAmplification)
  ).toFixed(2));

  const writePenaltyFactor = normWriteLatencyMs > 0 ? Number((denormWriteLatencyMs / normWriteLatencyMs).toFixed(2)) : 1;

  // --- 4. WEIGHTED OVERALL LATENCY & THROUGHPUT ---
  const normOverallLatencyMs = Number(((readRatio * normReadLatencyMs) + (writeRatio * normWriteLatencyMs)).toFixed(2));
  const denormOverallLatencyMs = Number(((readRatio * denormReadLatencyMs) + (writeRatio * denormWriteLatencyMs)).toFixed(2));

  // Maximum sustainable QPS before queue saturation (Amdahl / Little's law approximation)
  const normMaxQps = Math.round((concurrency * 1000) / Math.max(0.5, normOverallLatencyMs));
  const denormMaxQps = Math.round((concurrency * 1000) / Math.max(0.5, denormOverallLatencyMs));

  // --- 5. BREAK-EVEN CROSSOVER ANALYSIS ---
  // Find readRatio where: readRatio * normRead + (1-readRatio) * normWrite = readRatio * denormRead + (1-readRatio) * denormWrite
  // readRatio * (normRead - denormRead) = (1-readRatio) * (denormWrite - normWrite)
  // Let DeltaRead = normRead - denormRead (>0), DeltaWrite = denormWrite - normWrite (>0)
  // R * DeltaRead = (1 - R) * DeltaWrite => R * (DeltaRead + DeltaWrite) = DeltaWrite => R = DeltaWrite / (DeltaRead + DeltaWrite)
  const deltaRead = normReadLatencyMs - denormReadLatencyMs;
  const deltaWrite = denormWriteLatencyMs - normWriteLatencyMs;
  let breakEvenReadRatio = 0.5;
  if (deltaRead + deltaWrite > 0) {
    breakEvenReadRatio = Math.max(0, Math.min(1, deltaWrite / (deltaRead + deltaWrite)));
  }
  const breakEvenPercent = Math.round(breakEvenReadRatio * 100);

  // --- 6. ANOMALY RISK INDEX (0 - 100) ---
  // Normalized 3NF has 0 schema-level anomaly risk due to foreign key constraints and single source of truth
  const normAnomalyRisk = 0;

  // Denormalized anomaly risk depends on write ratio, fanout, and synchronization mechanism
  let syncVulnerabilityMultiplier = 1.0;
  if (syncLockLevel === 'strict') syncVulnerabilityMultiplier = 0.15; // 2PC or distributed locks reduce anomaly risk but tank performance
  else if (syncLockLevel === 'optimistic') syncVulnerabilityMultiplier = 0.60;
  else if (syncLockLevel === 'none') syncVulnerabilityMultiplier = 1.0; // Eventual consistency / async queues

  const rawRisk = (writeRatio * 45) + 
                  (Math.min(fanoutRatio, 20) * 1.8) + 
                  ((redundantBytes / (totalDenormBytes || 1)) * 30);
  const denormAnomalyRisk = Math.min(100, Math.round(rawRisk * syncVulnerabilityMultiplier));

  // --- 7. AUTOMATED DBA RECOMMENDATION & VERDICT ---
  let recommendation = {
    verdict: 'Evaluate Carefully',
    badgeColor: 'amber',
    strategy: 'Hybrid / Materialized Views',
    summary: '',
    actionItems: [],
  };

  if (readRatio >= 0.85 && denormOverallLatencyMs < normOverallLatencyMs) {
    recommendation = {
      verdict: 'Strongly Recommend Denormalization',
      badgeColor: 'emerald',
      strategy: 'Denormalize Read-Path or CQRS',
      summary: `Your workload is heavily read-dominant (${(readRatio * 100).toFixed(0)}% reads). Denormalization reduces read latency by ${readSpeedupFactor}x (from ${normReadLatencyMs}ms down to ${denormReadLatencyMs}ms) with manageable write overhead.`,
      actionItems: [
        'Pre-join frequently queried dimension attributes (e.g. Customer Name, Product Category) into the primary query table.',
        'Implement an asynchronous message queue (e.g. Kafka/RabbitMQ) for propagating dimension updates to reduce write lock contention.',
        'Use Materialized Views with REFRESH FAST ON COMMIT or periodic cron refreshes.',
      ],
    };
  } else if (writeRatio >= 0.40 || denormOverallLatencyMs > normOverallLatencyMs) {
    recommendation = {
      verdict: 'Keep Normalized (3NF / BCNF)',
      badgeColor: 'rose',
      strategy: 'Strict 3NF Normalization',
      summary: `Write volume (${(writeRatio * 100).toFixed(0)}% writes) causes heavy write amplification (${denormWriteAmplification}x) and high anomaly risk (${denormAnomalyRisk}/100). Overall latency in denormalized is ${denormOverallLatencyMs}ms vs ${normOverallLatencyMs}ms in normalized.`,
      actionItems: [
        'Maintain strict 3NF schema to avoid update anomalies and high lock contention.',
        'Optimize multi-table joins using composite secondary indexes on foreign keys.',
        'Add an in-memory caching tier (Redis/Memcached) for hot read keys instead of polluting the disk schema with redundancy.',
      ],
    };
  } else {
    recommendation = {
      verdict: 'Adopt Hybrid Selective Denormalization',
      badgeColor: 'blue',
      strategy: 'Selective Pre-Aggregation & Caching',
      summary: `Balanced workload near the break-even threshold (${breakEvenPercent}% reads). Blanket denormalization will bloat storage by ${storageInflationFactor.toFixed(1)}x and slow down updates without clear overall gains.`,
      actionItems: [
        'Denormalize only static or rarely mutated lookup fields (e.g., country codes, historical unit prices at time of sale).',
        'Keep volatile attributes (e.g., current inventory stock, customer addresses) strictly normalized.',
        'Benchmark database buffer pool hit ratio to ensure wider rows do not cause working set thrashing.',
      ],
    };
  }

  return {
    inputs: params,
    storage: {
      normStorageGb: Number(normStorageGb.toFixed(2)),
      denormStorageGb: Number(denormStorageGb.toFixed(2)),
      redundantStorageGb: Number(redundantStorageGb.toFixed(2)),
      storageInflationFactor: Number(storageInflationFactor.toFixed(2)),
      normMonthlyCost: Number(normMonthlyCost.toFixed(2)),
      denormMonthlyCost: Number(denormMonthlyCost.toFixed(2)),
    },
    latency: {
      normReadLatencyMs,
      denormReadLatencyMs,
      readSpeedupFactor,
      normWriteLatencyMs,
      denormWriteLatencyMs,
      writePenaltyFactor,
      normOverallLatencyMs,
      denormOverallLatencyMs,
      denormWriteAmplification,
      breakEvenPercent,
      readRatioPercent: Math.round(readRatio * 100),
      writeRatioPercent: Math.round(writeRatio * 100),
    },
    throughput: {
      normMaxQps,
      denormMaxQps,
      concurrency,
    },
    anomaly: {
      normAnomalyRisk,
      denormAnomalyRisk,
      syncLockLevel,
      fanoutRatio,
    },
    recommendation,
    hardware: hw,
  };
}

/**
 * Generates sweep points for latency curves across 0% to 100% Read ratio.
 */
export function generateWorkloadSweepData(params) {
  const points = [];
  for (let r = 0; r <= 100; r += 5) {
    const total = 10000;
    const currentReadQps = Math.round((r / 100) * total);
    const currentWriteQps = total - currentReadQps;

    const result = calculateTradeoffs({
      ...params,
      readQps: currentReadQps,
      writeQps: currentWriteQps,
    });

    points.push({
      readPercent: r,
      writePercent: 100 - r,
      normLatency: result.latency.normOverallLatencyMs,
      denormLatency: result.latency.denormOverallLatencyMs,
    });
  }
  return points;
}
