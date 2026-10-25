import React, { useState } from 'react';
import { Terminal, Cpu, Copy, Check } from 'lucide-react';

export default function SqlVisualizer({ preset }) {
  const [copiedNorm, setCopiedNorm] = useState(false);
  const [copiedDenorm, setCopiedDenorm] = useState(false);

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'norm') {
      setCopiedNorm(true);
      setTimeout(() => setCopiedNorm(false), 2000);
    } else {
      setCopiedDenorm(true);
      setTimeout(() => setCopiedDenorm(false), 2000);
    }
  };

  const norm = preset.schema.normalized;
  const denorm = preset.schema.denormalized;

  return (
    <div className="glass-panel rounded-2xl p-5 mt-6">
      
      <div className="flex items-center justify-between pb-4 mb-5 border-b border-slate-200/50 dark:border-white/10">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              Query & Execution Plan Workbench ({preset.title})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Side-by-side architectural inspection of relational multi-table JOINs vs denormalized point lookups
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Normalized Side */}
        <div className="glass-card p-4 rounded-2xl border border-cyan-300/40 dark:border-cyan-500/20 bg-cyan-500/[0.03] dark:bg-cyan-950/20 shadow-sm">
          
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-cyan-200/40 dark:border-cyan-800/30">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-xs shadow-cyan-500/50"></span>
              <h4 className="font-bold text-sm text-cyan-900 dark:text-cyan-200">
                Normalized Schema (3NF / BCNF)
              </h4>
            </div>
            <button
              onClick={() => copyToClipboard(norm.query, 'norm')}
              className="text-xs glass-pill px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-400 flex items-center space-x-1 transition-all"
            >
              {copiedNorm ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedNorm ? 'Copied' : 'Copy SQL'}</span>
            </button>
          </div>

          {/* Table Schema Badges */}
          <div className="mb-3">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Physical Tables ({norm.tables.length})
            </div>
            <div className="space-y-1.5">
              {norm.tables.map(t => (
                <div key={t.name} className="text-xs glass-card p-2 rounded-lg border border-white/50 dark:border-white/5">
                  <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 mr-2">{t.name}:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300 text-[11px]">{t.cols.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SQL Query */}
          <div className="mb-3">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Query (Requires Multi-Table JOINs)
            </div>
            <pre className="p-3 bg-slate-950/90 text-cyan-300 rounded-xl text-xs font-mono overflow-x-auto border border-cyan-500/20 backdrop-blur-md leading-relaxed shadow-inner">
              {norm.query}
            </pre>
          </div>

          {/* Query Execution Plan */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-500" />
              <span>Simulated Query Execution Plan (DBMS Optimizer)</span>
            </div>
            <div className="space-y-1 glass-card p-2.5 rounded-xl border border-white/40 dark:border-white/5 text-xs">
              {norm.plan.map((p, idx) => (
                <div key={idx} className="flex items-start justify-between py-1 border-b last:border-0 border-slate-200/40 dark:border-white/5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono text-[11px]">{p.step}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] text-right ml-2">{p.detail}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Denormalized Side */}
        <div className="glass-card p-4 rounded-2xl border border-rose-300/40 dark:border-rose-500/20 bg-rose-500/[0.03] dark:bg-rose-950/20 shadow-sm">
          
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-rose-200/40 dark:border-rose-800/30">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs shadow-rose-500/50"></span>
              <h4 className="font-bold text-sm text-rose-900 dark:text-rose-200">
                Denormalized / Pre-Joined Schema
              </h4>
            </div>
            <button
              onClick={() => copyToClipboard(denorm.query, 'denorm')}
              className="text-xs glass-pill px-2.5 py-1 rounded-lg text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 flex items-center space-x-1 transition-all"
            >
              {copiedDenorm ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedDenorm ? 'Copied' : 'Copy SQL'}</span>
            </button>
          </div>

          {/* Table Schema Badges */}
          <div className="mb-3">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Physical Tables ({denorm.tables.length})
            </div>
            <div className="space-y-1.5">
              {denorm.tables.map(t => (
                <div key={t.name} className="text-xs glass-card p-2 rounded-lg border border-white/50 dark:border-white/5">
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400 mr-2">{t.name}:</span>
                  <span className="font-mono text-slate-600 dark:text-slate-300 text-[11px]">{t.cols.join(', ')}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SQL Query */}
          <div className="mb-3">
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
              Query (Single Clustered Index Seek, 0 JOINs)
            </div>
            <pre className="p-3 bg-slate-950/90 text-rose-300 rounded-xl text-xs font-mono overflow-x-auto border border-rose-500/20 backdrop-blur-md leading-relaxed shadow-inner">
              {denorm.query}
            </pre>
          </div>

          {/* Query Execution Plan */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
              <Cpu className="w-3.5 h-3.5 text-rose-500" />
              <span>Simulated Query Execution Plan (DBMS Optimizer)</span>
            </div>
            <div className="space-y-1 glass-card p-2.5 rounded-xl border border-white/40 dark:border-white/5 text-xs">
              {denorm.plan.map((p, idx) => (
                <div key={idx} className="flex items-start justify-between py-1 border-b last:border-0 border-slate-200/40 dark:border-white/5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono text-[11px]">{p.step}</span>
                  <span className="text-slate-500 dark:text-slate-400 text-[11px] text-right ml-2">{p.detail}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
