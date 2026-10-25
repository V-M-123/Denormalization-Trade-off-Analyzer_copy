import React, { useState } from 'react';
import { Database, Layers, Table, Key, Link, Zap, Lightbulb } from 'lucide-react';

export default function SchemaComparison() {
  const [selectedDomain, setSelectedDomain] = useState('ecommerce'); // 'ecommerce' or 'library'
  const [highlightDifferences, setHighlightDifferences] = useState(true);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Interactive Schema Visualizer (Normalized vs. Denormalized)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Explore how entity relationships are structured in 3NF versus flat denormalized tables
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Domain selector */}
          <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setSelectedDomain('ecommerce')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedDomain === 'ecommerce'
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              E-Commerce
            </button>
            <button
              onClick={() => setSelectedDomain('library')}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                selectedDomain === 'library'
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Library System
            </button>
          </div>

          {/* Highlight toggle */}
          <label className="text-xs text-slate-600 dark:text-slate-300 flex items-center space-x-1 cursor-pointer">
            <input
              type="checkbox"
              checked={highlightDifferences}
              onChange={(e) => setHighlightDifferences(e.target.checked)}
              className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-3.5 h-3.5"
            />
            <span className="hidden sm:inline">Highlight Redundancy</span>
          </label>
        </div>
      </div>

      {/* Schema Comparison Container */}
      {selectedDomain === 'ecommerce' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Normalized 3NF Schema */}
          <div className="p-4 rounded-xl border border-cyan-200 dark:border-cyan-900/50 bg-cyan-50/20 dark:bg-cyan-950/10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-200 dark:border-cyan-900/50">
              <span className="font-bold text-xs text-cyan-800 dark:text-cyan-300 flex items-center space-x-1.5">
                <Table className="w-4 h-4" />
                <span>Normalized Schema (3NF - 3 Separate Tables)</span>
              </span>
              <span className="text-[10px] bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200 px-2 py-0.5 rounded-full font-semibold">
                Single Source of Truth
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              {/* Customers table */}
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white mb-1">customers</div>
                <div className="text-slate-500 text-[11px] space-y-0.5">
                  <div className="flex items-center gap-1"><Key className="w-3 h-3 text-amber-500 shrink-0" /> customer_id (PK, INT)</div>
                  <div>customer_name (VARCHAR)</div>
                  <div>customer_email (VARCHAR)</div>
                  <div>shipping_address (VARCHAR)</div>
                </div>
              </div>

              {/* Orders table */}
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white mb-1">orders</div>
                <div className="text-slate-500 text-[11px] space-y-0.5">
                  <div className="flex items-center gap-1"><Key className="w-3 h-3 text-amber-500 shrink-0" /> order_id (PK, INT)</div>
                  <div className="flex items-center gap-1"><Link className="w-3 h-3 text-indigo-400 shrink-0" /> customer_id (FK &rarr; customers)</div>
                  <div>order_date (TIMESTAMP)</div>
                  <div>status (VARCHAR)</div>
                </div>
              </div>

              {/* Order Items table */}
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white mb-1">order_items</div>
                <div className="text-slate-500 text-[11px] space-y-0.5">
                  <div className="flex items-center gap-1"><Key className="w-3 h-3 text-amber-500 shrink-0" /> item_id (PK, INT)</div>
                  <div className="flex items-center gap-1"><Link className="w-3 h-3 text-indigo-400 shrink-0" /> order_id (FK &rarr; orders)</div>
                  <div className="flex items-center gap-1"><Link className="w-3 h-3 text-indigo-400 shrink-0" /> product_id (FK &rarr; products)</div>
                  <div>quantity (INT), unit_price (DECIMAL)</div>
                </div>
              </div>
            </div>

            {/* Query */}
            <div className="mt-3 p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] space-y-1">
              <div className="text-slate-400 font-sans text-[10px] font-bold uppercase">Read Query (Requires 2 JOINs):</div>
              <pre className="overflow-x-auto text-cyan-300">
{`SELECT o.order_id, c.customer_name, i.quantity, i.unit_price
FROM orders o
JOIN customers c ON o.customer_id = c.customer_id
JOIN order_items i ON o.order_id = i.order_id
WHERE o.order_id = 4501;`}
              </pre>
            </div>
          </div>

          {/* Denormalized Wide Table */}
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-rose-200 dark:border-rose-900/50">
              <span className="font-bold text-xs text-rose-800 dark:text-rose-300 flex items-center space-x-1.5">
                <Layers className="w-4 h-4" />
                <span>Denormalized Schema (Wide Pre-Joined Table)</span>
              </span>
              <span className="text-[10px] bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 px-2 py-0.5 rounded-full font-semibold">
                Fast Zero-Join Reads
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white mb-1">orders_denormalized</div>
                <div className="text-slate-500 text-[11px] space-y-0.5">
                  <div className="flex items-center gap-1"><Key className="w-3 h-3 text-amber-500 shrink-0" /> order_id (PK, INT)</div>
                  <div>customer_id (INT)</div>
                  <div className={highlightDifferences ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 px-1 rounded font-bold flex items-center gap-1' : 'flex items-center gap-1'}>
                    <Zap className="w-3 h-3 text-amber-500 shrink-0" /> customer_name (VARCHAR) [Duplicated]
                  </div>
                  <div className={highlightDifferences ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 px-1 rounded font-bold flex items-center gap-1' : 'flex items-center gap-1'}>
                    <Zap className="w-3 h-3 text-amber-500 shrink-0" /> customer_email (VARCHAR) [Duplicated]
                  </div>
                  <div>order_date (TIMESTAMP)</div>
                  <div className={highlightDifferences ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 px-1 rounded font-bold flex items-center gap-1' : 'flex items-center gap-1'}>
                    <Zap className="w-3 h-3 text-amber-500 shrink-0" /> total_item_count (INT) [Pre-computed summary]
                  </div>
                  <div className={highlightDifferences ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 px-1 rounded font-bold flex items-center gap-1' : 'flex items-center gap-1'}>
                    <Zap className="w-3 h-3 text-amber-500 shrink-0" /> total_amount (DECIMAL) [Pre-computed summary]
                  </div>
                </div>
              </div>
            </div>

            {/* Query */}
            <div className="mt-3 p-3 rounded-lg bg-slate-900 text-slate-200 font-mono text-[11px] space-y-1">
              <div className="text-slate-400 font-sans text-[10px] font-bold uppercase">Read Query (0 JOINs - Direct Seek):</div>
              <pre className="overflow-x-auto text-emerald-400">
{`SELECT order_id, customer_name, total_item_count, total_amount
FROM orders_denormalized
WHERE order_id = 4501;`}
              </pre>
            </div>
          </div>

        </div>
      ) : (
        /* Library System Domain */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Normalized Library */}
          <div className="p-4 rounded-xl border border-cyan-200 dark:border-cyan-900/50 bg-cyan-50/20 dark:bg-cyan-950/10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-cyan-200 dark:border-cyan-900/50">
              <span className="font-bold text-xs text-cyan-800 dark:text-cyan-300 flex items-center space-x-1.5">
                <Table className="w-4 h-4" />
                <span>Normalized Library (books, authors, loans)</span>
              </span>
              <span className="text-[10px] bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-200 px-2 py-0.5 rounded-full font-semibold">
                Strict 3NF
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white mb-1">authors</div>
                <div className="text-slate-500 text-[11px] flex items-center gap-1">
                  <Key className="w-3 h-3 text-amber-500 shrink-0" /> author_id, author_name, country
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white mb-1">books</div>
                <div className="text-slate-500 text-[11px] flex items-center gap-1">
                  <Key className="w-3 h-3 text-amber-500 shrink-0" /> book_id, title, <Link className="w-3 h-3 text-indigo-400 shrink-0" /> author_id (FK), isbn
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white mb-1">loans</div>
                <div className="text-slate-500 text-[11px] flex items-center gap-1">
                  <Key className="w-3 h-3 text-amber-500 shrink-0" /> loan_id, <Link className="w-3 h-3 text-indigo-400 shrink-0" /> book_id (FK), member_id, loan_date
                </div>
              </div>
            </div>
          </div>

          {/* Denormalized Library */}
          <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-rose-200 dark:border-rose-900/50">
              <span className="font-bold text-xs text-rose-800 dark:text-rose-300 flex items-center space-x-1.5">
                <Layers className="w-4 h-4" />
                <span>Denormalized Library (book_catalog_flat)</span>
              </span>
              <span className="text-[10px] bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 px-2 py-0.5 rounded-full font-semibold">
                Fast Catalog Search
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-slate-900 dark:text-white mb-1">book_catalog_flat</div>
                <div className="text-slate-500 text-[11px] space-y-0.5">
                  <div className="flex items-center gap-1"><Key className="w-3 h-3 text-amber-500 shrink-0" /> book_id (PK, INT)</div>
                  <div>title (VARCHAR)</div>
                  <div className={highlightDifferences ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 px-1 rounded font-bold flex items-center gap-1' : 'flex items-center gap-1'}>
                    <Zap className="w-3 h-3 text-amber-500 shrink-0" /> author_name (VARCHAR) [Duplicated]
                  </div>
                  <div className={highlightDifferences ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 px-1 rounded font-bold flex items-center gap-1' : 'flex items-center gap-1'}>
                    <Zap className="w-3 h-3 text-amber-500 shrink-0" /> active_loan_count (INT) [Pre-aggregated]
                  </div>
                  <div>isbn (VARCHAR)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Trade-off summary note */}
      <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
        <Lightbulb className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <strong>Key Trade-off takeaway:</strong> In the normalized version, updating an author's name modifies exactly 1 record. In the denormalized version, updating an author's name forces an update query across thousands of book records, requiring multi-row table locks and risking inconsistent author names if a crash occurs mid-update.
        </div>
      </div>

    </div>
  );
}
