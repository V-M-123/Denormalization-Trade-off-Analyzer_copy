import React, { useState } from 'react';
import { 
  RotateCcw, 
  Play, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Info,
  Flame
} from 'lucide-react';

export default function AnomalyLab() {
  const [scenario, setScenario] = useState('update'); // 'update', 'insertion', 'deletion'
  
  // State for Update Anomaly Simulation
  const [ordersData, setOrdersData] = useState([
    { orderId: 101, customerId: 'C-901', name: 'Alice Chen', city: 'San Francisco', total: '$140.00', status: 'SYNCHRONIZED' },
    { orderId: 102, customerId: 'C-901', name: 'Alice Chen', city: 'San Francisco', total: '$85.50', status: 'SYNCHRONIZED' },
    { orderId: 103, customerId: 'C-901', name: 'Alice Chen', city: 'San Francisco', total: '$310.00', status: 'SYNCHRONIZED' },
    { orderId: 104, customerId: 'C-901', name: 'Alice Chen', city: 'San Francisco', total: '$45.00', status: 'SYNCHRONIZED' },
  ]);

  const [normCustomer, setNormCustomer] = useState({ id: 'C-901', name: 'Alice Chen', city: 'San Francisco' });
  const [anomalyTriggered, setAnomalyTriggered] = useState(false);
  const [anomalyLog, setAnomalyLog] = useState([]);

  // Reset simulation
  const handleReset = () => {
    setOrdersData([
      { orderId: 101, customerId: 'C-901', name: 'Alice Chen', city: 'San Francisco', total: '$140.00', status: 'SYNCHRONIZED' },
      { orderId: 102, customerId: 'C-901', name: 'Alice Chen', city: 'San Francisco', total: '$85.50', status: 'SYNCHRONIZED' },
      { orderId: 103, customerId: 'C-901', name: 'Alice Chen', city: 'San Francisco', total: '$310.00', status: 'SYNCHRONIZED' },
      { orderId: 104, customerId: 'C-901', name: 'Alice Chen', city: 'San Francisco', total: '$45.00', status: 'SYNCHRONIZED' },
    ]);
    setNormCustomer({ id: 'C-901', name: 'Alice Chen', city: 'San Francisco' });
    setAnomalyTriggered(false);
    setAnomalyLog([]);
  };

  // Run Update Anomaly: Customer moves to Seattle, but network drops after 2 rows
  const triggerUpdateAnomaly = () => {
    const newCity = 'Seattle, WA';
    // In normalized:
    setNormCustomer({ id: 'C-901', name: 'Alice Chen', city: newCity });

    // In denormalized: simulated partial failure (row 1 & 2 updated, row 3 & 4 failed due to lock timeout)
    setOrdersData([
      { orderId: 101, customerId: 'C-901', name: 'Alice Chen', city: newCity, total: '$140.00', status: 'UPDATED' },
      { orderId: 102, customerId: 'C-901', name: 'Alice Chen', city: newCity, total: '$85.50', status: 'UPDATED' },
      { orderId: 103, customerId: 'C-901', name: 'Alice Chen', city: 'San Francisco', total: '$310.00', status: 'DIRTY_ORPHAN' },
      { orderId: 104, customerId: 'C-901', name: 'Alice Chen', city: 'San Francisco', total: '$45.00', status: 'DIRTY_ORPHAN' },
    ]);

    setAnomalyTriggered(true);
    setAnomalyLog([
      'Step 1: Client requested: UPDATE customer SET city="Seattle, WA" WHERE customer_id="C-901"',
      'Normalized DB (3NF): Updated single row in `customers` table in 0.4ms. 100% atomic & clean.',
      'Denormalized DB: Fan-out update required 4 separate row writes.',
      'Worker process encountered connection timeout on order #103 & #104.',
      'CRITICAL: Data inconsistency! Same customer now lives in two different cities simultaneously in the database!'
    ]);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-amber-400/30 dark:border-amber-700/30 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-purple-500/10 dark:from-amber-950/40 dark:via-rose-950/40 dark:to-purple-950/40 shadow-sm">
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 text-white shadow-md shadow-amber-500/30 ring-1 ring-white/30">
            <Flame className="w-5 h-5 drop-shadow-xs" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
              Interactive Data Anomaly & Inconsistency Simulator
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Observe how duplicate denormalized attributes lead to partial writes, divergent state, and corrupted business metrics
            </p>
          </div>
        </div>

        {/* Anomaly Scenarios Selector */}
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => { setScenario('update'); handleReset(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              scenario === 'update' 
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 border border-amber-400/40' 
                : 'glass-pill text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            1. Update Anomaly (Partial Failure Drift)
          </button>
          <button
            onClick={() => { setScenario('insertion'); handleReset(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              scenario === 'insertion' 
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 border border-amber-400/40' 
                : 'glass-pill text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            2. Insertion Anomaly (Unplaced Entity)
          </button>
          <button
            onClick={() => { setScenario('deletion'); handleReset(); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              scenario === 'deletion' 
                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30 border border-amber-400/40' 
                : 'glass-pill text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60'
            }`}
          >
            3. Deletion Anomaly (Collateral Purge)
          </button>
        </div>
      </div>

      {/* Scenario 1: Update Anomaly */}
      {scenario === 'update' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Normalized Side */}
          <div className="glass-panel rounded-2xl p-5 border border-emerald-500/25">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/50 dark:border-white/10">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs shadow-emerald-500/50"></span>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Normalized 3NF: Single Source of Truth
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold glass-pill bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30">
                Guaranteed Consistent
              </span>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              Customer record is isolated in the <code>customers</code> table. Any order simply references <code>customer_id</code>.
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/40 dark:border-white/10">
              <table className="w-full text-xs text-left">
                <thead className="glass-pill text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-2.5">Customer ID</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">City</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/40 dark:divide-white/5">
                  <tr className="bg-emerald-500/[0.04] dark:bg-emerald-950/20 font-mono">
                    <td className="p-2.5 font-bold text-cyan-600 dark:text-cyan-400">{normCustomer.id}</td>
                    <td className="p-2.5 text-slate-800 dark:text-slate-200">{normCustomer.name}</td>
                    <td className="p-2.5 font-bold text-emerald-600 dark:text-emerald-400">
                      {normCustomer.city}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 rounded-xl glass-card border border-emerald-500/25 text-xs text-emerald-900 dark:text-emerald-300 flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <strong>Single atomic write:</strong> Even if 10 million orders exist for Alice Chen, updating her city takes 1 row lock and 0.4ms. All future joins automatically read "{normCustomer.city}".
              </div>
            </div>
          </div>

          {/* Denormalized Side */}
          <div className="glass-panel rounded-2xl p-5 border border-rose-500/25">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200/50 dark:border-white/10">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs shadow-rose-500/50"></span>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  Denormalized Table: Replicated Columns
                </h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all ${
                anomalyTriggered 
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-500/30 animate-pulse'
                  : 'glass-pill text-slate-600 dark:text-slate-400'
              }`}>
                {anomalyTriggered ? (
                  <span className="inline-flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-white" /> CORRUPTED / DIVERGENT
                  </span>
                ) : 'In Sync'}
              </span>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 mb-3">
              Table <code>orders_denormalized</code> stores <code>customer_name</code> and <code>city</code> directly in every row.
            </div>

            <div className="overflow-x-auto rounded-xl border border-white/40 dark:border-white/10">
              <table className="w-full text-xs text-left">
                <thead className="glass-pill text-slate-600 dark:text-slate-300">
                  <tr>
                    <th className="p-2.5">Order #</th>
                    <th className="p-2.5">Customer</th>
                    <th className="p-2.5">City (Redundant)</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/40 dark:divide-white/5">
                  {ordersData.map(o => (
                    <tr 
                      key={o.orderId}
                      className={
                        o.status === 'DIRTY_ORPHAN' 
                          ? 'bg-rose-500/15 dark:bg-rose-950/50 font-semibold' 
                          : o.status === 'UPDATED' 
                            ? 'bg-cyan-500/10 dark:bg-cyan-950/30'
                            : ''
                      }
                    >
                      <td className="p-2.5 font-mono">{o.orderId}</td>
                      <td className="p-2.5 text-slate-800 dark:text-slate-200">{o.name}</td>
                      <td className="p-2.5 font-mono">
                        {o.status === 'DIRTY_ORPHAN' ? (
                          <span className="text-rose-600 dark:text-rose-400 underline decoration-wavy font-bold">
                            {o.city} (STALE!)
                          </span>
                        ) : (
                          <span className={o.status === 'UPDATED' ? 'text-cyan-600 dark:text-cyan-400 font-bold' : ''}>
                            {o.city}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5">
                        {o.status === 'DIRTY_ORPHAN' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-xs">FAILED SYNC</span>
                        ) : o.status === 'UPDATED' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-600 text-white shadow-xs">UPDATED</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium glass-pill text-slate-600 dark:text-slate-300">SYNCED</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Interactive Trigger Controls */}
            <div className="mt-4 pt-4 border-t border-slate-200/50 dark:border-white/10 flex items-center justify-between">
              <button
                onClick={triggerUpdateAnomaly}
                disabled={anomalyTriggered}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white transition-all shadow-md shadow-rose-600/30 border border-rose-400/40"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Simulate Partial Failure Update</span>
              </button>

              <button
                onClick={handleReset}
                className="flex items-center space-x-1 text-xs glass-pill px-2.5 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Simulation</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* Scenario 2: Insertion Anomaly */}
      {scenario === 'insertion' && (
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-200/50 dark:border-white/10">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              The Insertion Anomaly Problem
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl glass-card border border-emerald-500/20">
              <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Normalized 3NF (Capable)</span>
              </h4>
              <p className="text-slate-600 dark:text-slate-300 mb-2">
                A new user registers, but hasn't placed any order yet.
              </p>
              <pre className="p-2.5 bg-slate-950/90 text-emerald-400 rounded-lg font-mono text-[11px] border border-emerald-500/20 backdrop-blur-md">
                INSERT INTO customers (customer_id, name, city) VALUES ('C-999', 'Bob Vance', 'Scranton');
              </pre>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                <strong>Result:</strong> Succeeded! The user is registered cleanly without needing dummy order keys.
              </p>
            </div>

            <div className="p-4 rounded-xl glass-card border border-rose-500/20">
              <h4 className="font-bold text-rose-600 dark:text-rose-400 mb-2 flex items-center space-x-1">
                <XCircle className="w-4 h-4" />
                <span>Flat Denormalized Table (Blocked)</span>
              </h4>
              <p className="text-slate-600 dark:text-slate-300 mb-2">
                How do you insert a user when the Primary Key is <code>order_id</code>?
              </p>
              <pre className="p-2.5 bg-slate-950/90 text-rose-400 rounded-lg font-mono text-[11px] border border-rose-500/20 backdrop-blur-md">
                INSERT INTO orders_denormalized (order_id, customer_name) VALUES (NULL, 'Bob Vance');
                -- ERROR: order_id is Primary Key and cannot be NULL!
              </pre>
              <p className="mt-2 text-rose-600 dark:text-rose-400 font-medium">
                <strong>Result:</strong> Fails! You are forced to invent synthetic dummy orders (e.g. order_id = -1) which pollutes analytics and breaks aggregate reporting!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Scenario 3: Deletion Anomaly */}
      {scenario === 'deletion' && (
        <div className="glass-panel rounded-2xl p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-200/50 dark:border-white/10">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-slate-900 dark:text-white text-base">
              The Deletion Anomaly Problem
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl glass-card border border-emerald-500/20">
              <h4 className="font-bold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center space-x-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Normalized 3NF (Protected)</span>
              </h4>
              <p className="text-slate-600 dark:text-slate-300 mb-2">
                Customer cancels their only order.
              </p>
              <pre className="p-2.5 bg-slate-950/90 text-emerald-400 rounded-lg font-mono text-[11px] border border-emerald-500/20 backdrop-blur-md">
                DELETE FROM orders WHERE order_id = 101;
              </pre>
              <p className="mt-2 text-slate-500 dark:text-slate-400">
                <strong>Result:</strong> The order is deleted, but the customer profile, shipping address, and login credentials in <code>customers</code> remain 100% intact.
              </p>
            </div>

            <div className="p-4 rounded-xl glass-card border border-rose-500/20">
              <h4 className="font-bold text-rose-600 dark:text-rose-400 mb-2 flex items-center space-x-1">
                <XCircle className="w-4 h-4" />
                <span>Flat Denormalized Table (Data Loss)</span>
              </h4>
              <p className="text-slate-600 dark:text-slate-300 mb-2">
                Customer cancels their only order.
              </p>
              <pre className="p-2.5 bg-slate-950/90 text-rose-400 rounded-lg font-mono text-[11px] border border-rose-500/20 backdrop-blur-md">
                DELETE FROM orders_denormalized WHERE order_id = 101;
              </pre>
              <p className="mt-2 text-rose-600 dark:text-rose-400 font-medium">
                <strong>Result:</strong> Unintended data loss! Deleting the order row accidentally destroys all knowledge that Alice Chen was a registered user.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Execution Log */}
      {anomalyLog.length > 0 && (
        <div className="bg-slate-950/90 backdrop-blur-xl rounded-2xl p-4 text-xs font-mono text-slate-300 border border-amber-500/20 shadow-lg space-y-1">
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
            <Info className="w-4 h-4" />
            <span>Database Engine Execution Log</span>
          </div>
          {anomalyLog.map((log, i) => (
            <div key={i} className="leading-relaxed">
              <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span> {log}
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
