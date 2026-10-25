import React from 'react';
import { 
  Compass, 
  Layers 
} from 'lucide-react';

export default function RecommendationEngine({ metrics }) {
  const { recommendation, latency, storage, inputs } = metrics;

  // Architectural Strategies Matrix
  const strategies = [
    {
      name: 'Option 1: Strict Normalized 3NF / BCNF',
      readScore: 4,
      writeScore: 10,
      storageScore: 10,
      consistencyScore: 10,
      complexityScore: 9,
      estReadMs: latency.normReadLatencyMs,
      estWriteMs: latency.normWriteLatencyMs,
      estStorageGb: storage.normStorageGb,
      isAcid: true,
      bestFor: 'Financial systems, inventory ledgers, systems with heavy update frequencies (>30% writes).',
      recommend: metrics.latency.writeRatioPercent >= 35,
    },
    {
      name: 'Option 2: Blanket Denormalized Wide Table',
      readScore: 10,
      writeScore: 3,
      storageScore: 4,
      consistencyScore: 4,
      complexityScore: 8,
      estReadMs: latency.denormReadLatencyMs,
      estWriteMs: latency.denormWriteLatencyMs,
      estStorageGb: storage.denormStorageGb,
      isAcid: false,
      bestFor: 'Analytical data lakes, ClickHouse / BigQuery OLAP warehouses, append-only logs.',
      recommend: metrics.latency.readRatioPercent >= 90,
    },
    {
      name: 'Option 3: Materialized Views with Incremental Refresh',
      readScore: 9,
      writeScore: 7,
      storageScore: 6,
      consistencyScore: 8,
      complexityScore: 6,
      estReadMs: Number((latency.denormReadLatencyMs * 1.1).toFixed(1)),
      estWriteMs: Number((latency.normWriteLatencyMs * 1.5).toFixed(1)),
      estStorageGb: Number((storage.normStorageGb + (storage.denormStorageGb * 0.4)).toFixed(1)),
      isAcid: true,
      bestFor: 'PostgreSQL / Oracle enterprise applications needing fast reads without destroying write paths.',
      recommend: metrics.latency.readRatioPercent >= 65 && metrics.latency.readRatioPercent < 90,
    },
    {
      name: 'Option 4: Dual-Path CQRS with Redis Read Cache',
      readScore: 10,
      writeScore: 9,
      storageScore: 7,
      consistencyScore: 7,
      complexityScore: 4,
      estReadMs: 0.8,
      estWriteMs: Number((latency.normWriteLatencyMs * 1.2).toFixed(1)),
      estStorageGb: storage.normStorageGb,
      isAcid: false,
      bestFor: 'Modern microservices, high-traffic consumer web applications, social timelines.',
      recommend: inputs.readQps > 8000,
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner with Verdict */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 mb-4 border-b border-slate-200/50 dark:border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-emerald-600 text-white shadow-md shadow-cyan-500/25 ring-1 ring-white/30">
              <Compass className="w-6 h-6 drop-shadow-xs" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                  DBA Architectural Advisor
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold glass-pill ${
                  recommendation.badgeColor === 'emerald'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-400/30'
                    : recommendation.badgeColor === 'rose'
                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-400/30'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/30'
                }`}>
                  {recommendation.verdict}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automated heuristic recommendation derived from workload profiles and hardware constraints
              </p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-slate-500 dark:text-slate-400">Optimal Strategy:</div>
            <div className="text-sm font-black text-cyan-600 dark:text-cyan-400">
              {recommendation.strategy}
            </div>
          </div>
        </div>

        {/* Detailed Summary */}
        <div className="p-4 rounded-xl glass-card mb-4 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
          {recommendation.summary}
        </div>

        {/* Action Items List */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Recommended Implementation Roadmap
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommendation.actionItems.map((item, idx) => (
              <div key={idx} className="p-3.5 rounded-xl glass-card text-xs text-slate-700 dark:text-slate-300 flex items-start space-x-2">
                <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 border border-cyan-400/30">
                  {idx + 1}
                </span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Strategy Comparison Matrix */}
      <div className="glass-panel p-6 rounded-2xl">
        <div className="flex items-center space-x-2 pb-4 mb-4 border-b border-slate-200/50 dark:border-white/10">
          <div className="p-2 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-slate-900 dark:text-white text-base">
            Architectural Alternatives & Pareto Comparison
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {strategies.map((strat, i) => (
            <div 
              key={i} 
              className={`p-5 rounded-2xl transition-all ${
                strat.recommend 
                  ? 'glass-card border-cyan-400 dark:border-cyan-500 ring-2 ring-cyan-400/30 shadow-md shadow-cyan-500/10' 
                  : 'glass-card-interactive'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center space-x-1.5">
                  <span>{strat.name}</span>
                </h4>
                {strat.recommend && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-600 text-white shadow-sm shadow-cyan-600/30 border border-cyan-400/40">
                    TOP MATCH
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                {strat.bestFor}
              </p>

              {/* Metrics Pills */}
              <div className="grid grid-cols-3 gap-2 py-2.5 mb-3 border-y border-slate-200/50 dark:border-white/10 text-center text-xs">
                <div className="glass-pill p-1.5 rounded-lg">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Read Latency</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{strat.estReadMs} ms</div>
                </div>
                <div className="glass-pill p-1.5 rounded-lg">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Write Latency</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{strat.estWriteMs} ms</div>
                </div>
                <div className="glass-pill p-1.5 rounded-lg">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">Storage</div>
                  <div className="font-bold text-slate-800 dark:text-slate-200">{strat.estStorageGb} GB</div>
                </div>
              </div>

              {/* Progress Pillar Scores */}
              <div className="space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Read Speed:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{strat.readScore}/10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Write Efficiency:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{strat.writeScore}/10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Storage Efficiency:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{strat.storageScore}/10</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">ACID Consistency:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{strat.consistencyScore}/10</span>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
