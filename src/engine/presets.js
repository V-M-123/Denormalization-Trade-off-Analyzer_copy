/**
 * Presets for standard database workload scenarios.
 * Directly maps to: Small OLTP app, Analytics dashboard, Mixed workload, and E-commerce.
 */

export const WORKLOAD_PRESETS = [
  {
    id: 'analytics-dashboard',
    title: 'Analytics Dashboard',
    category: 'OLAP / Reporting',
    description: 'Read-heavy data aggregation with complex queries across historical tables. Zero or infrequent batch writes.',
    expectedOutcome: 'Prefer Denormalization',
    inputs: {
      rowCount: 10000000,
      readPercent: 95,
      writePercent: 5,
      queryComplexity: 'complex',
      storageCostSensitivity: 'low',
      dataConsistencyCriticality: 'low',
    }
  },
  {
    id: 'small-oltp',
    title: 'Small OLTP App',
    category: 'Transactional Banking / Ledger',
    description: 'High write and update concurrency with strict zero-loss consistency. Low row counts and simple lookups.',
    expectedOutcome: 'Prefer Normalization',
    inputs: {
      rowCount: 50000,
      readPercent: 30,
      writePercent: 70,
      queryComplexity: 'simple',
      storageCostSensitivity: 'medium',
      dataConsistencyCriticality: 'high',
    }
  },
  {
    id: 'mixed-workload',
    title: 'Mixed Workload',
    category: 'Balanced SaaS App',
    description: 'Typical multi-tenant web application with steady transactional traffic and routine dashboard reads.',
    expectedOutcome: 'Hybrid',
    inputs: {
      rowCount: 2000000,
      readPercent: 70,
      writePercent: 30,
      queryComplexity: 'medium',
      storageCostSensitivity: 'medium',
      dataConsistencyCriticality: 'medium',
    }
  },
  {
    id: 'ecommerce-store',
    title: 'E-Commerce Store',
    category: 'Customer Catalog & Orders',
    description: 'Frequent browsing and product searches with moderate transactional checkout updates.',
    expectedOutcome: 'Hybrid',
    inputs: {
      rowCount: 1500000,
      readPercent: 85,
      writePercent: 15,
      queryComplexity: 'medium',
      storageCostSensitivity: 'medium',
      dataConsistencyCriticality: 'high',
    }
  }
];
