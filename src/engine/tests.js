/**
 * Test Suite Runner for the Denormalization Trade-off Analyzer
 * Validates the 3 mandatory workload scenarios and input rejection logic.
 */

import { calculateScores, validateInputs } from './scoringEngine';

export function runAllTests() {
  const results = [];

  // Test 1: Small dataset, write-heavy, high consistency -> Expect "Prefer Normalization"
  const test1Inputs = {
    rowCount: 50000,
    readPercent: 30,
    writePercent: 70,
    queryComplexity: 'simple',
    storageCostSensitivity: 'medium',
    dataConsistencyCriticality: 'high',
  };
  const test1Res = calculateScores(test1Inputs);
  const test1Pass = test1Res.recommendation.verdict === 'Prefer Normalization';
  results.push({
    id: 'test-1',
    name: 'Test Case 1: Small Dataset, Write-Heavy, High Consistency',
    description: '50K rows, 30% reads / 70% writes, high consistency criticality.',
    expected: 'Prefer Normalization',
    actual: test1Res.recommendation.verdict,
    passed: test1Pass,
    details: `Normalized Average: ${test1Res.scores.normalizedAverage}/10 vs Denormalized: ${test1Res.scores.denormalizedAverage}/10`,
  });

  // Test 2: Large dataset, read-heavy, low consistency -> Expect "Prefer Denormalization"
  const test2Inputs = {
    rowCount: 10000000,
    readPercent: 95,
    writePercent: 5,
    queryComplexity: 'complex',
    storageCostSensitivity: 'low',
    dataConsistencyCriticality: 'low',
  };
  const test2Res = calculateScores(test2Inputs);
  const test2Pass = test2Res.recommendation.verdict === 'Prefer Denormalization';
  results.push({
    id: 'test-2',
    name: 'Test Case 2: Large Dataset, Read-Heavy, Low Consistency',
    description: '10M rows, 95% reads / 5% writes, complex joins, low consistency.',
    expected: 'Prefer Denormalization',
    actual: test2Res.recommendation.verdict,
    passed: test2Pass,
    details: `Normalized Average: ${test2Res.scores.normalizedAverage}/10 vs Denormalized: ${test2Res.scores.denormalizedAverage}/10`,
  });

  // Test 3: Mixed workload -> Expect "Hybrid"
  const test3Inputs = {
    rowCount: 2000000,
    readPercent: 70,
    writePercent: 30,
    queryComplexity: 'medium',
    storageCostSensitivity: 'medium',
    dataConsistencyCriticality: 'medium',
  };
  const test3Res = calculateScores(test3Inputs);
  const test3Pass = test3Res.recommendation.verdict === 'Hybrid';
  results.push({
    id: 'test-3',
    name: 'Test Case 3: Balanced Mixed Workload',
    description: '2M rows, 70% reads / 30% writes, medium joins, medium consistency.',
    expected: 'Hybrid',
    actual: test3Res.recommendation.verdict,
    passed: test3Pass,
    details: `Normalized Average: ${test3Res.scores.normalizedAverage}/10 vs Denormalized: ${test3Res.scores.denormalizedAverage}/10`,
  });

  // Test 4: Validation rejection on negative row count
  const invalidInputs1 = {
    rowCount: -500,
    readPercent: 80,
    writePercent: 20,
  };
  const val1 = validateInputs(invalidInputs1);
  const test4Pass = !val1.isValid && !!val1.errors.rowCount;
  results.push({
    id: 'test-4',
    name: 'Test Case 4: Validation - Negative Row Count Rejection',
    description: 'Ensure rowCount <= 0 is rejected with a user-friendly error.',
    expected: 'Invalid input rejected',
    actual: test4Pass ? 'Invalid input rejected' : 'Accepted invalid input',
    passed: test4Pass,
    details: val1.errors.rowCount || 'No error generated',
  });

  // Test 5: Validation rejection when Read% + Write% != 100%
  const invalidInputs2 = {
    rowCount: 10000,
    readPercent: 70,
    writePercent: 40, // sum = 110%
  };
  const val2 = validateInputs(invalidInputs2);
  const test5Pass = !val2.isValid && !!val2.errors.ratioSum;
  results.push({
    id: 'test-5',
    name: 'Test Case 5: Validation - Non-100% Ratio Sum Rejection',
    description: 'Ensure read (70%) + write (40%) summing to 110% is caught.',
    expected: 'Invalid ratio sum rejected',
    actual: test5Pass ? 'Invalid ratio sum rejected' : 'Accepted mismatched ratio',
    passed: test5Pass,
    details: val2.errors.ratioSum || 'No error generated',
  });

  const totalPassed = results.filter(r => r.passed).length;
  return {
    results,
    summary: {
      total: results.length,
      passed: totalPassed,
      failed: results.length - totalPassed,
      allPassed: totalPassed === results.length,
    }
  };
}
