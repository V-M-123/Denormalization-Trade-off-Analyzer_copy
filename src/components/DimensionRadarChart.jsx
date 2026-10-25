import React, { useState } from 'react';
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { Radar, Bar } from 'react-chartjs-2';
import { 
  Radar as RadarIcon, 
  BarChart2, 
  Download,
  Pin,
  Zap
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

ChartJS.register(
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

export default function DimensionRadarChart({ evaluation, onOpenDownload }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [chartType, setChartType] = useState('radar'); // 'radar' or 'bar'

  const { breakdown, scores, recommendation } = evaluation;

  const labels = [
    'Read Performance',
    'Write Performance',
    'Storage Efficiency',
    'Data Integrity',
    'Query Simplicity',
  ];

  const normValues = [
    breakdown.readPerformance.normalized,
    breakdown.writePerformance.normalized,
    breakdown.storageEfficiency.normalized,
    breakdown.dataIntegrity.normalized,
    breakdown.queryComplexity.normalized,
  ];

  const denormValues = [
    breakdown.readPerformance.denormalized,
    breakdown.writePerformance.denormalized,
    breakdown.storageEfficiency.denormalized,
    breakdown.dataIntegrity.denormalized,
    breakdown.queryComplexity.denormalized,
  ];

  const textColor = isDark ? '#cbd5e1' : '#334155';
  const gridColor = isDark ? '#334155' : '#e2e8f0';

  // Radar Chart Data
  const radarData = {
    labels,
    datasets: [
      {
        label: 'Normalized (3NF)',
        data: normValues,
        backgroundColor: isDark ? 'rgba(6, 182, 212, 0.25)' : 'rgba(8, 145, 178, 0.25)',
        borderColor: isDark ? '#22d3ee' : '#0891b2',
        borderWidth: 2,
        pointBackgroundColor: isDark ? '#22d3ee' : '#0891b2',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: isDark ? '#22d3ee' : '#0891b2',
      },
      {
        label: 'Denormalized',
        data: denormValues,
        backgroundColor: 'rgba(244, 63, 94, 0.25)',
        borderColor: '#f43f5e',
        borderWidth: 2,
        pointBackgroundColor: '#f43f5e',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: '#f43f5e',
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: textColor,
          font: { size: 12, weight: 'bold' },
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.raw} / 10`,
        },
      },
    },
    scales: {
      r: {
        angleLines: { color: gridColor },
        grid: { color: gridColor },
        pointLabels: {
          color: textColor,
          font: { size: 11, weight: '600' },
        },
        suggestedMin: 0,
        suggestedMax: 10,
        ticks: {
          stepSize: 2,
          color: isDark ? '#64748b' : '#94a3b8',
          backdropColor: 'transparent',
          font: { size: 9 },
        },
      },
    },
  };

  // Grouped Bar Chart Data
  const barData = {
    labels,
    datasets: [
      {
        label: 'Normalized (3NF)',
        data: normValues,
        backgroundColor: isDark ? '#06b6d4' : '#0891b2',
        borderRadius: 6,
      },
      {
        label: 'Denormalized',
        data: denormValues,
        backgroundColor: '#f43f5e',
        borderRadius: 6,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: textColor, font: { size: 12, weight: 'bold' } },
      },
      tooltip: {
        callbacks: {
          label: (context) => ` ${context.dataset.label}: ${context.raw} / 10`,
        },
      },
    },
    scales: {
      x: {
        grid: { color: gridColor },
        ticks: { color: textColor, font: { size: 11, weight: '600' } },
      },
      y: {
        min: 0,
        max: 10,
        grid: { color: gridColor },
        ticks: { stepSize: 2, color: textColor, font: { size: 10 } },
        title: {
          display: true,
          text: 'Score (0 - 10)',
          color: textColor,
          font: { size: 11, weight: 'bold' },
        },
      },
    },
  };

  const getBadgeStyle = (verdict) => {
    if (verdict === 'Prefer Denormalization') {
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800';
    }
    if (verdict === 'Prefer Normalization') {
      return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800';
    }
    return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800';
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Main Recommendation Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">
              Architectural Recommendation
            </span>
            <div className="flex items-center space-x-3 mt-1">
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {recommendation.verdict}
              </h2>
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getBadgeStyle(recommendation.verdict)}`}>
                Avg Score: {recommendation.verdict === 'Prefer Denormalization' ? scores.denormalizedAverage : scores.normalizedAverage}/10
              </span>
            </div>
          </div>

          <button
            onClick={onOpenDownload}
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm transition-all self-start md:self-auto"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Audit Report</span>
          </button>
        </div>

        {/* Plain-English Explanation */}
        <p className="mt-3 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
          {recommendation.explanation}
        </p>

        {/* Key Takeaways */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <strong className="text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
              <Pin className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>Why This Recommendation:</span>
            </strong>
            <p className="text-slate-600 dark:text-slate-400">
              {recommendation.keyTakeaways.why}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
            <strong className="text-slate-900 dark:text-white flex items-center gap-1.5 mb-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>What Could Trigger a Shift:</span>
            </strong>
            <p className="text-slate-600 dark:text-slate-400">
              {recommendation.keyTakeaways.whatCouldChange}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Visual Chart (Radar / Grouped Bar) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              5-Dimension Trade-off Visualizer
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comparing Normalized (3NF) vs Denormalized across core database metrics (0-10 scale)
            </p>
          </div>

          {/* Chart View Toggle */}
          <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setChartType('radar')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                chartType === 'radar'
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <RadarIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Radar Chart</span>
            </button>
            <button
              onClick={() => setChartType('bar')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-slate-700 text-cyan-600 dark:text-cyan-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bar Chart</span>
            </button>
          </div>
        </div>

        {/* Chart Render Area */}
        <div className="h-72 sm:h-80 w-full">
          {chartType === 'radar' ? (
            <Radar data={radarData} options={radarOptions} />
          ) : (
            <Bar data={barData} options={barOptions} />
          )}
        </div>
      </div>

      {/* 3. Scored Trade-off Breakdown Cards with Textual Justifications */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
          Detailed Dimension Scores & Justifications
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {Object.entries(breakdown).map(([key, item]) => {
            const isDenormWinning = item.denormalized > item.normalized;
            const isTie = item.denormalized === item.normalized;
            return (
              <div 
                key={key} 
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white">{item.label}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isTie 
                      ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300' 
                      : isDenormWinning 
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' 
                        : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300'
                  }`}>
                    {isTie ? 'Tied' : isDenormWinning ? 'Denorm Favored' : 'Norm Favored'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-y border-slate-200 dark:border-slate-800 font-mono font-bold">
                  <span className="text-cyan-700 dark:text-cyan-400">
                    Norm: {item.normalized}/10
                  </span>
                  <span className="text-slate-400">vs</span>
                  <span className="text-rose-600 dark:text-rose-400">
                    Denorm: {item.denormalized}/10
                  </span>
                </div>

                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  {item.justification}
                </p>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
