import React from 'react';
import { HelpCircle, RotateCcw, Zap, Layers } from 'lucide-react';

export default function HelpSection() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      
      {/* Title Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 text-xs font-semibold">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>User Manual & Guide</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
          Help & User Manual
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-xl mx-auto">
          Complete instructions on how to use the analyzer tool, interpret 0-10 trade-off scores, and export audit reports.
        </p>
      </div>

      {/* 1. What the Website Does */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <span className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-xs font-bold">1</span>
          <span>What the Website Does</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          The <strong>Denormalization Trade-off Analyzer</strong> is an interactive educational tool designed for students, database administrators, and software developers. It helps you evaluate whether a relational database should be kept in <strong>Strict Normalization (3NF)</strong> or whether it should be <strong>Denormalized</strong> for read performance.
        </p>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
          By inputting key characteristics of your workload—such as row count, read/write ratio, query complexity, storage sensitivity, and consistency criticality—the analyzer calculates objective 0–10 scores across 5 core dimensions and outputs a clear recommendation: <em>“Prefer Normalization”</em>, <em>“Prefer Denormalization”</em>, or <em>“Hybrid”</em>.
        </p>
      </div>

      {/* 2. Step-by-Step Instructions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <span className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-xs font-bold">2</span>
          <span>Step-by-Step Instructions</span>
        </h2>

        <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
          
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
            <strong className="text-slate-900 dark:text-white block font-bold">
              Step A: Navigating to the Analyzer
            </strong>
            <p>
              Click on the <strong>“Analyzer”</strong> tab in the top navigation bar. This opens the interactive form and visualization studio.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
            <strong className="text-slate-900 dark:text-white block font-bold">
              Step B: Filling Each Input Field
            </strong>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Table Row Count:</strong> Enter your estimated primary table row count (e.g. 10,000, 2,000,000, or 50,000,000) or click one of the quick preset pills (10K, 500K, 2M, 10M, 50M).</li>
              <li><strong>Read / Write Ratio:</strong> Drag the slider to set your workload split (e.g., 90% Reads / 10% Writes). The values always sum to 100%.</li>
              <li><strong>Query Complexity:</strong> Select whether your typical queries perform simple (1-2 joins), medium (3-4 joins), or complex (5+ joins) operations.</li>
              <li><strong>Storage Cost Sensitivity:</strong> Choose Low (ample budget/storage), Medium (standard cloud hosting), or High (constrained disk/RAM capacity).</li>
              <li><strong>Data Consistency Criticality:</strong> Choose Low (eventual consistency ok), Medium (application-level checks), or High (strict financial-grade ACID transactions).</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
            <strong className="text-slate-900 dark:text-white block font-bold">
              Step C: What Each Button Does
            </strong>
            <ul className="space-y-1.5 pt-1">
              <li className="flex items-start space-x-2">
                <span className="p-1 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-bold shrink-0 mt-0.5">
                  <Zap className="w-3 h-3" />
                </span>
                <div>
                  <strong>Calculate Recommendation:</strong> Recomputes the 0-10 scores, updates the Radar/Bar chart, and produces an architectural verdict.
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <span className="p-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold shrink-0 mt-0.5">
                  <RotateCcw className="w-3 h-3" />
                </span>
                <div>
                  <strong>Reset to Defaults:</strong> Clears custom inputs back to standard baseline parameters.
                </div>
              </li>
              <li className="flex items-start space-x-2">
                <span className="p-1 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold shrink-0 mt-0.5">
                  <Layers className="w-3 h-3" />
                </span>
                <div>
                  <strong>Load Scenario:</strong> Clicking any preset button (e.g. <em>Small OLTP App</em>, <em>Analytics Dashboard</em>, or <em>Mixed Workload</em>) auto-fills all 5 inputs to demonstrate how distinct real-world workloads behave.
                </div>
              </li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
            <strong className="text-slate-900 dark:text-white block font-bold">
              Step D: How to Interpret the Scores, Chart, and Recommendation
            </strong>
            <p>
              The <strong>Radar Chart</strong> visualizes both architectures across a 0 to 10 scale (where 10 is optimal). The larger the polygon area, the better that architecture fits your workload.
            </p>
            <ul className="list-disc pl-5 space-y-0.5 pt-1">
              <li><strong>Prefer Denormalization:</strong> Read throughput wins decisively outweigh the moderate write/storage cost.</li>
              <li><strong>Prefer Normalization:</strong> High write volume or strict consistency demands make single-source-of-truth 3NF the safest and fastest choice.</li>
              <li><strong>Hybrid:</strong> Workload has conflicting needs; use 3NF for core tables and selective materialized views or Redis caching for read queries.</li>
            </ul>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
            <strong className="text-slate-900 dark:text-white block font-bold">
              Step E: How to Use the Download Button
            </strong>
            <p>
              Click <strong>“Download”</strong> (in the top navbar or next to the recommendation banner). You can export an executive PDF report, a Microsoft Word document (.doc), Markdown (.md), or Plain Text (.txt) summary containing your inputs, dimension scores, chart data, and key takeaways.
            </p>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 space-y-1">
            <strong className="text-slate-900 dark:text-white block font-bold">
              Step F: How to Toggle Day / Night Mode
            </strong>
            <p>
              Click the <strong>Sun / Moon icon</strong> in the top-right header to switch between light mode (crisp daylight contrast) and dark mode (reduced eye strain). Your choice is saved automatically in your browser's local storage.
            </p>
          </div>

        </div>
      </div>

      {/* 3. Short FAQ */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <span className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-xs font-bold">3</span>
          <span>Frequently Asked Questions (FAQ)</span>
        </h2>

        <div className="space-y-3 text-xs">
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
            <strong className="text-slate-900 dark:text-white block mb-1">
              Q: What if my read/write ratio changes over time?
            </strong>
            <p className="text-slate-600 dark:text-slate-400">
              Database workloads frequently shift as companies scale (e.g., transitioning from early feature development to read-heavy user browsing). You can use the Live "What-If" slider to observe where your application crosses the threshold from Normalization to Denormalization.
            </p>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
            <strong className="text-slate-900 dark:text-white block mb-1">
              Q: Does denormalization always guarantee faster queries?
            </strong>
            <p className="text-slate-600 dark:text-slate-400">
              Not always! If your dataset exceeds available RAM, denormalized tables have wider rows, meaning fewer rows fit in the database page buffer cache. This causes frequent disk seeks, counteracting the read benefit.
            </p>
          </div>

          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
            <strong className="text-slate-900 dark:text-white block mb-1">
              Q: How does a Hybrid approach work in modern production?
            </strong>
            <p className="text-slate-600 dark:text-slate-400">
              Most high-scale systems (like Uber, Netflix, Amazon) keep the primary database in 3NF for ACID safety, but stream changes via change data capture (CDC) or event queues to read-optimized denormalized stores (Elasticsearch, Redis, or ClickHouse).
            </p>
          </div>
        </div>
      </div>

      {/* 4. Test Scenarios Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-sm space-y-3">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-2">
          <span className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-xs font-bold">4</span>
          <span>Verified Test Scenarios</span>
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400">
          The scoring engine has been verified against 3 primary baseline test cases:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="p-3 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/30 dark:bg-emerald-950/20">
            <strong className="text-emerald-800 dark:text-emerald-300 block font-bold mb-1">
              Case 1: Analytics Dashboard
            </strong>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
              <div>• 10M rows, 95% Reads / 5% Writes</div>
              <div>• Complex Joins, Low Consistency</div>
              <div className="font-bold text-emerald-700 dark:text-emerald-300 pt-1">
                ✓ Output: Prefer Denormalization
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/30 dark:bg-rose-950/20">
            <strong className="text-rose-800 dark:text-rose-300 block font-bold mb-1">
              Case 2: Small OLTP App
            </strong>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
              <div>• 50K rows, 30% Reads / 70% Writes</div>
              <div>• Simple Queries, High Consistency</div>
              <div className="font-bold text-rose-700 dark:text-rose-300 pt-1">
                ✓ Output: Prefer Normalization
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/30 dark:bg-blue-950/20">
            <strong className="text-blue-800 dark:text-blue-300 block font-bold mb-1">
              Case 3: Mixed Workload
            </strong>
            <div className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5">
              <div>• 2M rows, 70% Reads / 30% Writes</div>
              <div>• Medium Joins, Medium Consistency</div>
              <div className="font-bold text-blue-700 dark:text-blue-300 pt-1">
                ✓ Output: Hybrid
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
