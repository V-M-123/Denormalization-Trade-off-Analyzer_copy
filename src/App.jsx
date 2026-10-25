import React, { useState, useMemo } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { CursorProvider, useCursor } from './context/CursorContext';
import { PixelCursorTrail } from './components/ui/pixel-trail';
import { MagneticCursor } from './components/ui/magnetic-cursor';
import Navbar from './components/Navbar';
import Workbench from './components/Workbench';
import LearnSection from './components/LearnSection';
import QuizSection from './components/QuizSection';
import CompetitiveExamSection from './components/CompetitiveExamSection';
import DevelopedBy from './components/DevelopedBy';
import HelpSection from './components/HelpSection';
import TestSuite from './components/TestSuite';
import DownloadModal from './components/DownloadModal';
import { WORKLOAD_PRESETS } from './engine/presets';
import { calculateScores } from './engine/scoringEngine';
import { Database } from 'lucide-react';

function AppContent() {
  const [activeTab, setActiveTab] = useState('analyzer');
  const [selectedPresetId, setSelectedPresetId] = useState('analytics-dashboard');
  const { cursorMode } = useCursor();
  
  // Initialize inputs with the first preset
  const [inputs, setInputs] = useState(() => WORKLOAD_PRESETS[0].inputs);
  const [isDownloadOpen, setIsDownloadOpen] = useState(false);

  // Compute 0-10 scores, breakdown, justifications, and recommendation
  const evaluation = useMemo(() => {
    return calculateScores(inputs);
  }, [inputs]);

  const handleCalculate = (newInputs) => {
    setInputs(newInputs);
  };

  const handleReset = () => {
    const defaultPreset = WORKLOAD_PRESETS[0];
    setSelectedPresetId(defaultPreset.id);
    setInputs(defaultPreset.inputs);
  };

  const handleSelectPreset = (presetId) => {
    setSelectedPresetId(presetId);
    const found = WORKLOAD_PRESETS.find(p => p.id === presetId);
    if (found) {
      setInputs(found.inputs);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors ${
      cursorMode === 'trail' ? 'cursor-none' : ''
    }`}>
      {/* Active Custom Cursor Overlays */}
      {cursorMode === 'magnetic' && <MagneticCursor />}
      {cursorMode === 'trail' && (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
          <PixelCursorTrail fullScreen={false} className="w-full h-full" />
        </div>
      )}

      {/* 1. Header Navigation Bar */}
      <Navbar 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDownload={() => setIsDownloadOpen(true)}
      />

      {/* 2. Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'analyzer' && (
          <Workbench 
            inputs={inputs}
            evaluation={evaluation}
            onCalculate={handleCalculate}
            onReset={handleReset}
            selectedPresetId={selectedPresetId}
            onSelectPreset={handleSelectPreset}
            onOpenDownload={() => setIsDownloadOpen(true)}
          />
        )}

        {activeTab === 'learn' && (
          <LearnSection />
        )}

        {activeTab === 'quiz' && (
          <QuizSection />
        )}

        {activeTab === 'competitiveExam' && (
          <CompetitiveExamSection />
        )}

        {activeTab === 'developedBy' && (
          <DevelopedBy />
        )}

        {activeTab === 'help' && (
          <HelpSection />
        )}

        {activeTab === 'tests' && (
          <TestSuite />
        )}
      </main>

      {/* 3. Academic Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800 py-6 mt-12 bg-white dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
          <div className="flex items-center space-x-2">
            <div className="p-1 rounded bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300">
              <Database className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Denormalization Trade-off Analyzer
            </span>
            <span className="hidden sm:inline text-slate-400">— DBMS Architectural Optimization Engine</span>
          </div>

          <div className="flex items-center space-x-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <span className="text-slate-500">Guided By:</span>
            <span className="font-semibold text-slate-800 dark:text-slate-100">
              Dr. Swaminathan A
            </span>
            <span className="text-slate-500 text-[11px]">(Assistant Professor)</span>
          </div>

          <div className="text-[11px] text-slate-500">
            Digital Assignment 1 (DA1) • DBMS Academic Review
          </div>
        </div>
      </footer>

      {/* 4. Report Download Modal */}
      <DownloadModal 
        isOpen={isDownloadOpen}
        onClose={() => setIsDownloadOpen(false)}
        evaluation={evaluation}
      />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <CursorProvider>
        <AppContent />
      </CursorProvider>
    </ThemeProvider>
  );
}
