import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  ArrowRight, 
  ArrowLeft, 
  Compass, 
  Sliders, 
  Zap, 
  AlertTriangle, 
  Download,
  Lightbulb
} from 'lucide-react';

export default function GuidedTourModal({ isOpen, onClose, onNavigateTab }) {
  const [currentStep, setCurrentStep] = useState(0);

  const tourSteps = [
    {
      title: 'Welcome to the Denormalization Analyzer',
      subtitle: 'Architecture Overview & Purpose',
      icon: Compass,
      description: 'This application rigorously evaluates the trade-offs between Normalized (3NF/BCNF) and Denormalized schemas. It provides mathematical cost models for read acceleration vs write amplification, storage bloat, and anomaly risks.',
      targetTab: 'workbench',
      highlight: 'Use the top tabs to navigate between the Analyzer Studio, Anomaly Lab, DBA Advisor, and Test Suite.'
    },
    {
      title: 'Step 1: Choose or Customize a Workload Preset',
      subtitle: 'Real-world scenarios from E-Commerce to Banking',
      icon: Sliders,
      description: 'Switch between production presets (E-Commerce, Social Media, Financial Banking, IoT Telemetry). Each preset automatically configures realistic row counts, query join depths, and read-to-write traffic ratios.',
      targetTab: 'workbench',
      highlight: 'Notice how read-heavy workloads favor denormalization, while write-heavy workloads suffer severe penalties.'
    },
    {
      title: 'Step 2: Review Trade-off KPIs & Crossover Curve',
      subtitle: 'Identifying the exact tipping point',
      icon: Zap,
      description: 'The Crossover Chart dynamically calculates the exact Read % where denormalization becomes beneficial. The KPIs immediately report read speedup (e.g. 8x faster) alongside write amplification fanout (e.g. 5x penalty).',
      targetTab: 'workbench',
      highlight: 'Check the Storage Allocation bar chart to see how duplicate columns bloat disk usage.'
    },
    {
      title: 'Step 3: Interactive Data Anomaly Simulator',
      subtitle: 'Why denormalization causes production bugs',
      icon: AlertTriangle,
      description: 'In the Anomaly Lab, simulate what happens when a customer address update encounters a partial worker failure. You will see duplicated columns drift into an inconsistent, corrupted state.',
      targetTab: 'anomalyLab',
      highlight: 'Normalized 3NF is immune to this bug because of the single source of truth principle.'
    },
    {
      title: 'Step 4: Automated Verification & Report Export',
      subtitle: 'Academic evaluation ready',
      icon: Download,
      description: 'Run the 8-test automated test suite to verify mathematical boundaries. Then click "Download" to generate a complete PDF or Word audit report documenting all user inputs, formulas, and results.',
      targetTab: 'tests',
      highlight: 'Mandatory sections (Learn, Developed By, Help, Download, Day/Night Mode) are all accessible via the top navigation.'
    }
  ];

  const step = tourSteps[currentStep];
  const StepIcon = step.icon;

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      const nextIndex = currentStep + 1;
      setCurrentStep(nextIndex);
      onNavigateTab(tourSteps[nextIndex].targetTab);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      const prevIndex = currentStep - 1;
      setCurrentStep(prevIndex);
      onNavigateTab(tourSteps[prevIndex].targetTab);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="glass-panel rounded-3xl max-w-lg w-full p-6 shadow-2xl relative border border-white/40 dark:border-white/10"
          >
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full glass-pill text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Step Indicator */}
            <div className="flex items-center space-x-1.5 mb-4">
              {tourSteps.map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep 
                      ? 'w-8 bg-cyan-600 shadow-xs shadow-cyan-500/50' 
                      : i < currentStep 
                        ? 'w-3 bg-cyan-400 dark:bg-cyan-700' 
                        : 'w-3 bg-slate-200/80 dark:bg-slate-700/80'
                  }`}
                />
              ))}
            </div>

            {/* Step Header */}
            <div className="flex items-center space-x-3 mb-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500 to-teal-600 text-white shadow-md shadow-cyan-500/25 ring-1 ring-white/30">
                <StepIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                  Step {currentStep + 1} of {tourSteps.length}
                </span>
                <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-tight">
                  {step.title}
                </h3>
              </div>
            </div>

            {/* Step Content */}
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              {step.description}
            </p>

            {/* Highlight Banner */}
            <div className="p-3.5 rounded-2xl glass-card border border-cyan-400/30 text-xs text-slate-700 dark:text-slate-200 mb-6 flex items-start space-x-2">
              <span className="font-bold text-cyan-600 dark:text-cyan-400 shrink-0 inline-flex items-center gap-1">
                <Lightbulb className="w-3.5 h-3.5" /> Note:
              </span>
              <p>{step.highlight}</p>
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/50 dark:border-white/10">
              <button
                onClick={handlePrev}
                disabled={currentStep === 0}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-semibold glass-pill transition-all ${
                  currentStep === 0 
                    ? 'opacity-40 cursor-not-allowed text-slate-400' 
                    : 'text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>

              <button
                onClick={handleNext}
                className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-md shadow-cyan-500/25 border border-cyan-400/40 transition-all"
              >
                <span>{currentStep === tourSteps.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
