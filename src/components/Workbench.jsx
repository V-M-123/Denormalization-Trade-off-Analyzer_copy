import React from 'react';
import AnalyzerForm from './AnalyzerForm';
import DimensionRadarChart from './DimensionRadarChart';
import SchemaComparison from './SchemaComparison';

export default function Workbench({
  inputs,
  evaluation,
  onCalculate,
  onReset,
  selectedPresetId,
  onSelectPreset,
  onOpenDownload,
}) {
  return (
    <div className="space-y-6 pb-12">
      
      {/* 1. Primary Workload Input Form */}
      <AnalyzerForm
        key={selectedPresetId}
        currentInputs={inputs}
        onCalculate={onCalculate}
        onReset={onReset}
        selectedPresetId={selectedPresetId}
        onSelectPreset={onSelectPreset}
      />

      {/* 2. Visual Analysis & 0-10 Dimension Scores */}
      {evaluation && (
        <DimensionRadarChart
          evaluation={evaluation}
          onOpenDownload={onOpenDownload}
        />
      )}

      {/* 3. Interactive Schema Snippets & Differences Visualizer */}
      <SchemaComparison />

    </div>
  );
}
