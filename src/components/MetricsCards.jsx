import React from 'react';
import { 
  Zap, 
  Clock, 
  HardDrive, 
  AlertTriangle, 
  ArrowUpRight, 
  ArrowDownRight 
} from 'lucide-react';

export default function MetricsCards({ metrics }) {
  const { latency, storage, anomaly } = metrics;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* 1. Read Latency Card */}
      <div className="glass-card-interactive rounded-2xl p-4.5 relative overflow-hidden group hover:border-cyan-400/50">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Read Latency (Query)
          </span>
          <div className="w-8 h-8 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-xs border border-cyan-500/25">
            <Zap className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
            {latency.denormReadLatencyMs} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">ms</span>
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full glass-pill bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-300/40 dark:border-cyan-500/30 flex items-center">
            <ArrowDownRight className="w-3 h-3 mr-0.5 text-cyan-600 dark:text-cyan-400" />
            {latency.readSpeedupFactor}x faster
          </span>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Normalized 3NF:</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {latency.normReadLatencyMs} ms ({metrics.inputs.joinDepth} joins)
          </span>
        </div>
      </div>

      {/* 2. Write Latency & Amplification Card */}
      <div className="glass-card-interactive rounded-2xl p-4.5 relative overflow-hidden group hover:border-rose-400/50">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Write / Update Latency
          </span>
          <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-xs border border-rose-500/25">
            <Clock className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
            {latency.denormWriteLatencyMs} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">ms</span>
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full glass-pill bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300/40 dark:border-rose-500/30 flex items-center">
            <ArrowUpRight className="w-3 h-3 mr-0.5 text-rose-600 dark:text-rose-400" />
            {latency.writePenaltyFactor}x penalty
          </span>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Write Amplification:</span>
          <span className="font-semibold text-rose-600 dark:text-rose-400">
            {latency.denormWriteAmplification}x fanout (Norm: 1.0x)
          </span>
        </div>
      </div>

      {/* 3. Disk Storage Footprint Card */}
      <div className="glass-card-interactive rounded-2xl p-4.5 relative overflow-hidden group hover:border-teal-400/50">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-teal-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Storage Footprint
          </span>
          <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center shadow-xs border border-teal-500/25">
            <HardDrive className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight font-mono">
            {storage.denormStorageGb} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">GB</span>
          </span>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full glass-pill bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-300/40 dark:border-teal-500/30">
            +{((storage.storageInflationFactor - 1) * 100).toFixed(0)}% bloat
          </span>
        </div>

        <div className="mt-2.5 pt-2.5 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Normalized Size:</span>
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {storage.normStorageGb} GB (Redundant: {storage.redundantStorageGb} GB)
          </span>
        </div>
      </div>

      {/* 4. Anomaly Risk Index Card */}
      <div className="glass-card-interactive rounded-2xl p-4.5 relative overflow-hidden group hover:border-amber-400/50">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            Anomaly Risk Score
          </span>
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-xs border ${
            anomaly.denormAnomalyRisk > 50 
              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/25' 
              : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/25'
          }`}>
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="flex items-baseline space-x-2">
          <span className={`text-2xl font-black tracking-tight font-mono ${
            anomaly.denormAnomalyRisk > 60 
              ? 'text-rose-600 dark:text-rose-400' 
              : anomaly.denormAnomalyRisk > 25 
                ? 'text-amber-600 dark:text-amber-400' 
                : 'text-cyan-600 dark:text-cyan-400'
          }`}>
            {anomaly.denormAnomalyRisk} <span className="text-xs font-normal text-slate-500 dark:text-slate-400">/ 100</span>
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            (Norm: <strong className="text-cyan-600 dark:text-cyan-400">0 Safe</strong>)
          </span>
        </div>

        <div className="mt-2.5">
          <div className="w-full bg-slate-200/60 dark:bg-slate-800/80 rounded-full h-1.5 overflow-hidden p-0.5">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                anomaly.denormAnomalyRisk > 60 
                  ? 'bg-rose-500 shadow-sm shadow-rose-500/50' 
                  : anomaly.denormAnomalyRisk > 25 
                    ? 'bg-amber-500 shadow-sm shadow-amber-500/50' 
                    : 'bg-cyan-500 shadow-sm shadow-cyan-500/50'
              }`}
              style={{ width: `${Math.min(100, Math.max(5, anomaly.denormAnomalyRisk))}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 mt-1.5">
            <span className="font-mono">Lock: {anomaly.syncLockLevel.toUpperCase()}</span>
            <span>Fanout: {anomaly.fanoutRatio} records</span>
          </div>
        </div>
      </div>

    </div>
  );
}
