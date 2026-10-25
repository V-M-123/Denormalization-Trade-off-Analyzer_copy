import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { generateWorkloadSweepData } from '../engine/costModel';
import { useTheme } from '../context/ThemeContext';
import { TrendingUp, PieChart, Layers, Lightbulb } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function TradeoffCharts({ metrics }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const textColor = isDark ? '#94a3b8' : '#475569';
  const gridColor = isDark ? '#334155' : '#e2e8f0';

  // Generate sweep curve
  const sweepData = useMemo(() => {
    return generateWorkloadSweepData(metrics.inputs);
  }, [metrics.inputs]);

  // Chart 1: Latency Crossover Sweep Curve
  const lineChartData = {
    labels: sweepData.map(d => `${d.readPercent}% R`),
    datasets: [
      {
        label: 'Normalized 3NF Latency (ms)',
        data: sweepData.map(d => d.normLatency),
        borderColor: isDark ? '#22d3ee' : '#0891b2',
        backgroundColor: isDark ? 'rgba(34, 211, 238, 0.12)' : 'rgba(8, 145, 178, 0.12)',
        fill: false,
        tension: 0.25,
        pointRadius: 3,
        pointHoverRadius: 6,
      },
      {
        label: 'Denormalized Latency (ms)',
        data: sweepData.map(d => d.denormLatency),
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.1)',
        fill: false,
        tension: 0.25,
        pointRadius: 3,
        pointHoverRadius: 6,
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: textColor, font: { size: 11, weight: 600 } }
      },
      tooltip: {
        callbacks: {
          afterBody: (context) => {
            const index = context[0].dataIndex;
            const pt = sweepData[index];
            return `Workload: ${pt.readPercent}% Read / ${pt.writePercent}% Write`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { size: 10 } },
        title: {
          display: true,
          text: 'Read Workload Ratio (% Reads)',
          color: textColor,
          font: { size: 11 }
        }
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { size: 10 } },
        title: {
          display: true,
          text: 'Overall Latency (ms)',
          color: textColor,
          font: { size: 11 }
        }
      }
    }
  };

  // Chart 2: Storage Decomposition Bar Chart
  const storageBarData = {
    labels: ['Normalized 3NF', 'Denormalized Store'],
    datasets: [
      {
        label: 'Base Entity Data (GB)',
        data: [
          (metrics.storage.normStorageGb * 0.78).toFixed(1),
          (metrics.storage.normStorageGb * 0.78).toFixed(1),
        ],
        backgroundColor: isDark ? '#06b6d4' : '#0891b2',
      },
      {
        label: 'Redundant Duplicated Columns (GB)',
        data: [
          0,
          metrics.storage.redundantStorageGb,
        ],
        backgroundColor: '#f59e0b',
      },
      {
        label: 'Secondary Index Overhead (GB)',
        data: [
          (metrics.storage.normStorageGb * 0.22).toFixed(1),
          (metrics.storage.denormStorageGb - metrics.storage.redundantStorageGb - (metrics.storage.normStorageGb * 0.78)).toFixed(1),
        ],
        backgroundColor: '#14b8a6',
      }
    ]
  };

  const storageBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: textColor, font: { size: 11, weight: 600 } }
      },
    },
    scales: {
      x: {
        stacked: true,
        grid: { color: gridColor },
        ticks: { color: textColor, font: { size: 11, weight: 600 } },
      },
      y: {
        stacked: true,
        grid: { color: gridColor },
        ticks: { color: textColor, font: { size: 10 } },
        title: {
          display: true,
          text: 'Disk Storage Footprint (GB)',
          color: textColor,
          font: { size: 11 }
        }
      }
    }
  };

  // Chart 3: Direct Latency Breakdown Bar Chart
  const latencyCompData = {
    labels: ['Read Latency', 'Write Latency', 'Weighted Average'],
    datasets: [
      {
        label: 'Normalized 3NF',
        data: [
          metrics.latency.normReadLatencyMs,
          metrics.latency.normWriteLatencyMs,
          metrics.latency.normOverallLatencyMs,
        ],
        backgroundColor: isDark ? '#06b6d4' : '#0891b2',
      },
      {
        label: 'Denormalized',
        data: [
          metrics.latency.denormReadLatencyMs,
          metrics.latency.denormWriteLatencyMs,
          metrics.latency.denormOverallLatencyMs,
        ],
        backgroundColor: '#f43f5e',
      }
    ]
  };

  const latencyCompOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: textColor, font: { size: 11, weight: 600 } }
      }
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { size: 11, weight: 600 } },
      },
      y: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { size: 10 } },
        title: {
          display: true,
          text: 'Latency (ms) [Lower is better]',
          color: textColor,
          font: { size: 11 }
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Chart: Crossover Sweep Curve with Break-even Badge */}
      <div className="glass-panel p-5 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-slate-200/50 dark:border-white/10 gap-2">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Workload Sensitivity & Crossover Analysis
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Plots overall latency across 0% to 100% Read ratio to identify the architectural tipping point
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 glass-pill px-3 py-1.5 rounded-full">
            <span className="text-xs text-slate-600 dark:text-slate-400">Break-Even Threshold:</span>
            <span className="text-xs font-bold text-cyan-600 dark:text-cyan-400">
              {metrics.latency.breakEvenPercent}% Reads
            </span>
          </div>
        </div>

        <div className="h-72 w-full">
          <Line data={lineChartData} options={lineChartOptions} />
        </div>

        <div className="mt-4 text-xs text-slate-600 dark:text-slate-300 glass-card p-3 rounded-xl flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span><strong>Observation:</strong> At workloads below <strong>{metrics.latency.breakEvenPercent}% Reads</strong>, Normalized 3NF wins due to low write amplification. Above <strong>{metrics.latency.breakEvenPercent}% Reads</strong>, Denormalization wins by eliminating join overhead.</span>
          </span>
          <span className="hidden md:inline font-mono text-[11px] text-cyan-600 dark:text-cyan-400 ml-2 whitespace-nowrap">
            Current: {metrics.latency.readRatioPercent}% R / {metrics.latency.writeRatioPercent}% W
          </span>
        </div>
      </div>

      {/* Two Column Charts: Storage & Latency Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Storage Breakdown */}
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-200/50 dark:border-white/10">
            <div className="p-2 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
              <PieChart className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                Storage Allocation Breakdown
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Decomposing base data vs. duplicated column redundancy
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            <Bar data={storageBarData} options={storageBarOptions} />
          </div>
          <div className="mt-3 text-center text-xs text-slate-600 dark:text-slate-400 glass-pill py-1 rounded-lg">
            Storage Inflation: <strong className="text-indigo-600 dark:text-indigo-400">{metrics.storage.storageInflationFactor}x</strong> (+{metrics.storage.redundantStorageGb} GB redundant data)
          </div>
        </div>

        {/* Latency Comparison */}
        <div className="glass-panel p-5 rounded-2xl">
          <div className="flex items-center space-x-2 pb-3 mb-3 border-b border-slate-200/50 dark:border-white/10">
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                Latency Breakdown (Read / Write / Weighted)
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Comparing pure read speed vs write update penalties
              </p>
            </div>
          </div>
          <div className="h-64 w-full">
            <Bar data={latencyCompData} options={latencyCompOptions} />
          </div>
          <div className="mt-3 text-center text-xs text-slate-600 dark:text-slate-400 glass-pill py-1 rounded-lg">
            Weighted Latency: <strong className="text-cyan-600 dark:text-cyan-400">{metrics.latency.normOverallLatencyMs} ms</strong> (Norm) vs <strong className="text-rose-600 dark:text-rose-400">{metrics.latency.denormOverallLatencyMs} ms</strong> (Denorm)
          </div>
        </div>

      </div>

    </div>
  );
}
