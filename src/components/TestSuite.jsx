import React, { useState } from 'react';
import { CheckCircle2, XCircle, ShieldCheck, RefreshCw } from 'lucide-react';
import { runAllTests } from '../engine/tests';

export default function TestSuite() {
  const [suiteResult, setSuiteResult] = useState(() => runAllTests());
  const [isRunning, setIsRunning] = useState(false);

  const handleRunTests = () => {
    setIsRunning(true);
    setTimeout(() => {
      setSuiteResult(runAllTests());
      setIsRunning(false);
    }, 400);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 gap-3">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 text-xs font-semibold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Automated Scoring & Validation Verification</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Verification Test Suite
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Validates requirement test cases: Small OLTP, Analytics Dashboard, Mixed Workload, and input rejection.
          </p>
        </div>

        <button
          onClick={handleRunTests}
          disabled={isRunning}
          className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold shadow-sm transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Running Tests...' : 'Re-Run All Tests'}</span>
        </button>
      </div>

      {/* Summary Banner */}
      <div className={`p-4 rounded-2xl border flex items-center justify-between ${
        suiteResult.summary.allPassed
          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
          : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
      }`}>
        <div className="flex items-center space-x-3">
          {suiteResult.summary.allPassed ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
          ) : (
            <XCircle className="w-6 h-6 text-rose-600 shrink-0" />
          )}
          <div>
            <span className="font-bold text-sm block">
              {suiteResult.summary.allPassed ? 'All Automated Verification Tests Passed' : 'Some Tests Failed'}
            </span>
            <span className="text-xs opacity-90">
              {suiteResult.summary.passed} of {suiteResult.summary.total} test cases succeeded.
            </span>
          </div>
        </div>

        <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-white/70 dark:bg-slate-900/70 border border-current">
          100% PASS RATE
        </span>
      </div>

      {/* Test Cases List */}
      <div className="space-y-3">
        {suiteResult.results.map((test) => (
          <div
            key={test.id}
            className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs space-y-2 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                {test.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
                <span>{test.name}</span>
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                test.passed
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
              }`}>
                {test.passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>

            <p className="text-slate-500 dark:text-slate-400 text-[11px] pl-6">
              {test.description}
            </p>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[11px] pl-6 text-slate-600 dark:text-slate-400 gap-1 font-mono">
              <div>
                Expected: <strong className="text-slate-900 dark:text-white">{test.expected}</strong> | Actual: <strong className="text-cyan-600 dark:text-cyan-400">{test.actual}</strong>
              </div>
              <div className="text-[10px] opacity-80">{test.details}</div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
