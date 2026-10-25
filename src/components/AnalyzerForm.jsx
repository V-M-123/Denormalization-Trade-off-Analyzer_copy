import React, { useState } from 'react';
import { 
  Sliders, 
  RotateCcw, 
  Zap, 
  AlertCircle, 
  Check, 
  ArrowRightLeft 
} from 'lucide-react';
import { WORKLOAD_PRESETS } from '../engine/presets';
import { validateInputs } from '../engine/scoringEngine';

export default function AnalyzerForm({
  currentInputs,
  onCalculate,
  onReset,
  selectedPresetId,
  onSelectPreset,
}) {
  // Local form state
  const [formData, setFormData] = useState(currentInputs);
  const [liveMode, setLiveMode] = useState(true);
  const [validation, setValidation] = useState(() => validateInputs(currentInputs));

  // Handle single field change
  const handleChange = (field, value) => {
    let updated = { ...formData, [field]: value };

    // Auto-balance read & write percentages when sliders/inputs change
    if (field === 'readPercent') {
      const r = Math.max(0, Math.min(100, Number(value) || 0));
      updated.readPercent = r;
      updated.writePercent = 100 - r;
    } else if (field === 'writePercent') {
      const w = Math.max(0, Math.min(100, Number(value) || 0));
      updated.writePercent = w;
      updated.readPercent = 100 - w;
    }

    setFormData(updated);
    const valResult = validateInputs(updated);
    setValidation(valResult);

    // If live mode is enabled and input is valid, calculate immediately
    if (liveMode && valResult.isValid) {
      onCalculate(updated);
    }
  };

  const handlePresetClick = (preset) => {
    onSelectPreset(preset.id);
    setFormData(preset.inputs);
    setValidation(validateInputs(preset.inputs));
    onCalculate(preset.inputs);
  };

  const handleManualSubmit = (e) => {
    if (e) e.preventDefault();
    if (validation.isValid) {
      onCalculate(formData);
    }
  };

  const handleResetClick = () => {
    onReset();
  };

  const rowPresets = [
    { label: '10K', value: 10000 },
    { label: '500K', value: 500000 },
    { label: '2M', value: 2000000 },
    { label: '10M', value: 10000000 },
    { label: '50M', value: 50000000 },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-6">
      
      {/* 1. Header & Preset Selector Bar */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800 gap-2">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-cyan-100 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-300 font-bold">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Workload Configuration Form
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Input your database workload parameters to evaluate Normalization vs Denormalization
              </p>
            </div>
          </div>

          {/* Live "What-If" Slider Mode Toggle */}
          <div className="flex items-center space-x-2 self-start sm:self-auto">
            <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 cursor-pointer flex items-center space-x-1.5">
              <input 
                type="checkbox" 
                checked={liveMode} 
                onChange={(e) => setLiveMode(e.target.checked)}
                className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 w-3.5 h-3.5"
              />
              <span>Live "What-If" Mode</span>
            </label>
            <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full">
              {liveMode ? 'Real-time updates' : 'Manual submit'}
            </span>
          </div>
        </div>

        {/* Preset Buttons */}
        <div className="mt-3">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block mb-2">
            Quick Load Presets:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {WORKLOAD_PRESETS.map((p) => {
              const isSelected = selectedPresetId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetClick(p)}
                  className={`px-3 py-2 rounded-xl text-left border transition-all text-xs flex flex-col justify-between ${
                    isSelected
                      ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/40 text-cyan-900 dark:text-cyan-200 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-700 dark:text-slate-300 bg-slate-50/50 dark:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate">{p.title}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600 shrink-0 ml-1" />}
                  </div>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal truncate mt-0.5">
                    {p.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Validation Error Banner */}
      {!validation.isValid && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs space-y-1">
          <div className="flex items-center space-x-1.5 font-bold">
            <AlertCircle className="w-4 h-4 text-rose-600" />
            <span>Please correct the following inputs:</span>
          </div>
          <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
            {Object.values(validation.errors).map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 2. Inputs Grid */}
      <form onSubmit={handleManualSubmit} className="space-y-5">
        
        {/* Input 1: Estimated Table Row Count */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <label htmlFor="rowCountInput" className="font-bold text-slate-800 dark:text-slate-200">
              1. Estimated Table Row Count
            </label>
            <span className="font-mono text-cyan-700 dark:text-cyan-400 font-bold text-xs">
              {Number(formData.rowCount).toLocaleString()} rows
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <input 
              id="rowCountInput"
              type="number"
              min="1"
              step="1000"
              value={formData.rowCount}
              onChange={(e) => handleChange('rowCount', e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500 font-mono"
              placeholder="e.g. 1000000"
            />
            {/* Quick row count presets */}
            <div className="hidden sm:flex items-center space-x-1">
              {rowPresets.map(preset => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => handleChange('rowCount', preset.value)}
                  className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border ${
                    Number(formData.rowCount) === preset.value
                      ? 'bg-cyan-600 text-white border-cyan-600'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Datasets exceeding ~10M rows increase RAM cache pressure, diminishing wide-table denormalization advantages.
          </p>
        </div>

        {/* Input 2: Read / Write Ratio */}
        <div className="space-y-2 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center space-x-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-600" />
              <span>2. Read / Write Workload Ratio</span>
            </span>
            <div className="space-x-2 font-mono font-bold text-xs">
              <span className="text-cyan-700 dark:text-cyan-400">{formData.readPercent}% Reads</span>
              <span className="text-slate-400">/</span>
              <span className="text-rose-600 dark:text-rose-400">{formData.writePercent}% Writes</span>
            </div>
          </div>

          {/* Interactive Range Slider */}
          <input 
            type="range"
            min="0"
            max="100"
            value={formData.readPercent}
            onChange={(e) => handleChange('readPercent', e.target.value)}
            className="w-full accent-cyan-600 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
          />

          <div className="flex justify-between items-center text-[11px] text-slate-500 dark:text-slate-400">
            <span>0% (Write-Intensive Logging)</span>
            <span>50% / 50%</span>
            <span>100% (Read-Only Analytics)</span>
          </div>
        </div>

        {/* Inputs 3, 4, 5: Complexity, Storage Sensitivity, Consistency */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* Input 3: Query Complexity Level */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              3. Query Complexity Level
            </label>
            <div className="grid grid-cols-3 gap-1">
              {[
                { id: 'simple', label: 'Simple', desc: '1-2 joins' },
                { id: 'medium', label: 'Medium', desc: '3-4 joins' },
                { id: 'complex', label: 'Complex', desc: '5+ joins' },
              ].map(opt => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleChange('queryComplexity', opt.id)}
                  className={`p-2 rounded-xl text-center border text-xs transition-all ${
                    formData.queryComplexity === opt.id
                      ? 'bg-cyan-600 text-white border-cyan-600 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="font-semibold">{opt.label}</div>
                  <div className="text-[10px] opacity-80">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Input 4: Storage Cost Sensitivity */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              4. Storage Cost Sensitivity
            </label>
            <div className="grid grid-cols-3 gap-1">
              {['low', 'medium', 'high'].map(lvl => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => handleChange('storageCostSensitivity', lvl)}
                  className={`p-2 rounded-xl text-center border text-xs capitalize transition-all ${
                    formData.storageCostSensitivity === lvl
                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="font-semibold">{lvl}</div>
                  <div className="text-[10px] opacity-80">
                    {lvl === 'low' ? 'Budget rich' : lvl === 'medium' ? 'Standard' : 'Tight budget'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Input 5: Data Consistency Criticality */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              5. Consistency Criticality
            </label>
            <div className="grid grid-cols-3 gap-1">
              {['low', 'medium', 'high'].map(crit => (
                <button
                  key={crit}
                  type="button"
                  onClick={() => handleChange('dataConsistencyCriticality', crit)}
                  className={`p-2 rounded-xl text-center border text-xs capitalize transition-all ${
                    formData.dataConsistencyCriticality === crit
                      ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="font-semibold">{crit}</div>
                  <div className="text-[10px] opacity-80">
                    {crit === 'low' ? 'Eventual' : crit === 'medium' ? 'App checks' : 'Strict ACID'}
                  </div>
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* 3. Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800 gap-3">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleResetClick}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold w-full sm:w-auto transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reset to Defaults</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={!validation.isValid}
            className={`flex items-center justify-center space-x-2 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition-all w-full sm:w-auto ${
              validation.isValid
                ? 'bg-cyan-600 hover:bg-cyan-700 shadow-cyan-600/20 active:scale-98'
                : 'bg-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            <Zap className="w-4 h-4 fill-white" />
            <span>Calculate Recommendation</span>
          </button>
        </div>

      </form>

    </div>
  );
}
