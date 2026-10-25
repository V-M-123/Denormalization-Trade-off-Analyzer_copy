import React from 'react';
import { 
  Database, 
  Sun, 
  Moon, 
  Download, 
  BookOpen, 
  HelpCircle, 
  UserCheck, 
  Sliders, 
  ShieldCheck,
  MousePointer,
  Sparkles,
  CircleDot,
  Award
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useCursor } from '../context/CursorContext';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  onOpenDownload 
}) {
  const { theme, toggleTheme } = useTheme();
  const { cursorMode, cycleCursorMode } = useCursor();

  const navTabs = [
    { id: 'analyzer', label: 'Analyzer', icon: Sliders },
    { id: 'learn', label: 'Learn', icon: BookOpen },
    { id: 'quiz', label: 'QUIZ', icon: CircleDot },
    { id: 'competitiveExam', label: 'COMPETITIVE EXAM', icon: Award },
    { id: 'developedBy', label: 'Developed By', icon: UserCheck },
    { id: 'help', label: 'Help', icon: HelpCircle },
    { id: 'tests', label: 'Test Suite', icon: ShieldCheck },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Title */}
          <div 
            onClick={() => setActiveTab('analyzer')}
            className="flex items-center space-x-2.5 cursor-pointer select-none shrink-0 mr-4"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-600 flex items-center justify-center text-white shadow-xs">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white tracking-tight">
                Denormalization Trade-off Analyzer
              </span>
              <span className="hidden lg:block text-[11px] text-slate-500 dark:text-slate-400">
                Relational Database Normalization (1NF-3NF) vs Denormalization Optimizer
              </span>
            </div>
          </div>

          {/* Primary Navigation Tabs */}
          <nav className="hidden md:flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800/60 rounded-xl">
            {navTabs.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive 
                      ? 'bg-white dark:bg-slate-700 text-cyan-700 dark:text-cyan-300 shadow-xs' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-600 dark:text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Bar: Download Report & Day/Night Mode Toggle */}
          <div className="flex items-center space-x-2 shrink-0">
            
            {/* Download Report Button */}
            <button
              onClick={onOpenDownload}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all"
              title="Download architecture evaluation report"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download Report</span>
              <span className="sm:hidden">Report</span>
            </button>

            {/* Custom Cursor Mode Toggle */}
            <button
              onClick={cycleCursorMode}
              className={`p-2 rounded-xl border transition-all flex items-center justify-center ${
                cursorMode !== 'default'
                  ? 'border-cyan-400 bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 shadow-xs shadow-cyan-500/30'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
              aria-label="Toggle Custom Cursor Mode"
              title={
                cursorMode === 'default'
                  ? 'Cursor: Standard (Click to switch to Magnetic Dual-Ring)'
                  : cursorMode === 'magnetic'
                  ? 'Cursor: Magnetic Dual-Ring (Click to switch to Pixel Trail)'
                  : 'Cursor: Aurora Pixel Trail (Click to reset to Standard)'
              }
            >
              {cursorMode === 'default' && <MousePointer className="w-4 h-4" />}
              {cursorMode === 'magnetic' && <CircleDot className="w-4 h-4 text-cyan-500 animate-pulse" />}
              {cursorMode === 'trail' && <Sparkles className="w-4 h-4 text-emerald-500 animate-spin" style={{ animationDuration: '3s' }} />}
            </button>

            {/* Day / Night Mode Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
              aria-label="Toggle Day/Night Mode"
              title={theme === 'dark' ? 'Switch to Day Mode' : 'Switch to Night Mode'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="md:hidden flex items-center space-x-1 py-2 border-t border-slate-200 dark:border-slate-800 overflow-x-auto">
          {navTabs.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive 
                    ? 'bg-cyan-600 text-white shadow-xs' 
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
}
