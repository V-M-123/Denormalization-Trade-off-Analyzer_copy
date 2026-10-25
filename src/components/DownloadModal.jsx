import React, { useState } from 'react';
import { 
  X, 
  FileText, 
  FileCode, 
  Download, 
  Check, 
  FileSpreadsheet
} from 'lucide-react';
import { 
  downloadPdfReport, 
  downloadWordDocument, 
  downloadText, 
  formatReportMarkdown 
} from '../engine/reportGenerator';

export default function DownloadModal({ isOpen, onClose, evaluation }) {
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  if (!isOpen) return null;

  const handleDownload = async (format) => {
    setDownloadingFormat(format);
    try {
      if (format === 'pdf') {
        downloadPdfReport(evaluation);
      } else if (format === 'doc') {
        downloadWordDocument(evaluation);
      } else if (format === 'md') {
        const md = formatReportMarkdown(evaluation);
        downloadText(`denormalization-report-${Date.now()}.md`, md, 'text/markdown;charset=utf-8');
      } else if (format === 'txt') {
        const txt = formatReportMarkdown(evaluation);
        downloadText(`denormalization-report-${Date.now()}.txt`, txt, 'text/plain;charset=utf-8');
      } else if (format === 'json') {
        const jsonStr = JSON.stringify(evaluation, null, 2);
        downloadText(`denormalization-evaluation-${Date.now()}.json`, jsonStr, 'application/json;charset=utf-8');
      }
    } catch (err) {
      console.error('Download error:', err);
    } finally {
      setTimeout(() => setDownloadingFormat(null), 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl relative space-y-5">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Download Architecture Audit Report
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Export user inputs, 0-10 trade-off scores, justifications, and DBA recommendation
            </p>
          </div>
        </div>

        {/* Evaluation Preview Highlights */}
        <div className="rounded-xl p-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Recommendation:</span>
            <span className="font-bold text-cyan-700 dark:text-cyan-400">
              {evaluation?.recommendation?.verdict}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Workload:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {evaluation?.inputs?.readPercent}% Reads / {evaluation?.inputs?.writePercent}% Writes
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500 dark:text-slate-400">Average Scores:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300">
              Norm: {evaluation?.scores?.normalizedAverage}/10 | Denorm: {evaluation?.scores?.denormalizedAverage}/10
            </span>
          </div>
        </div>

        {/* Download Format Options */}
        <div className="space-y-2.5">
          
          {/* PDF */}
          <button
            onClick={() => handleDownload('pdf')}
            disabled={downloadingFormat === 'pdf'}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500 bg-white dark:bg-slate-800/40 transition-all text-left group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  Executive PDF Report (Recommended)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Clean printable vector document formatted for faculty review
                </div>
              </div>
            </div>
            {downloadingFormat === 'pdf' ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            )}
          </button>

          {/* Word (.doc) */}
          <button
            onClick={() => handleDownload('doc')}
            disabled={downloadingFormat === 'doc'}
            className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-cyan-500 dark:hover:border-cyan-500 bg-white dark:bg-slate-800/40 transition-all text-left group"
          >
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-950 text-cyan-600 dark:text-cyan-400">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">
                  Microsoft Word Document (.doc)
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Editable document with tables and formatting
                </div>
              </div>
            </div>
            {downloadingFormat === 'doc' ? (
              <Check className="w-4 h-4 text-cyan-500" />
            ) : (
              <Download className="w-4 h-4 text-slate-400 group-hover:text-cyan-500 transition-colors" />
            )}
          </button>

          {/* Markdown & Text */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleDownload('md')}
              className="flex items-center justify-center space-x-1.5 p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
            >
              <FileCode className="w-3.5 h-3.5 text-cyan-600" />
              <span>Markdown (.md)</span>
            </button>

            <button
              onClick={() => handleDownload('txt')}
              className="flex items-center justify-center space-x-1.5 p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span>Plain Text (.txt)</span>
            </button>
          </div>

          {/* JSON */}
          <button
            onClick={() => handleDownload('json')}
            className="w-full text-center text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 pt-1"
          >
            Export Raw JSON Evaluation Payload
          </button>

        </div>

      </div>
    </div>
  );
}
