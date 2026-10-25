/**
 * Schema Uploader & Diagnostic Integration Module
 * Handles file drag-and-drop, SQL DDL, CSV datasets, and JSON schemas (up to 500MB),
 * backend streaming API dispatch via multipart/form-data,
 * and updates the UI with topological diagnostics in the "Submit Your Schema" tab.
 */

import { auth } from './auth.js';
import { calculateTradeoffScores } from './scoring.js';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB maximum file size

const SAMPLE_DDL = `CREATE TABLE Customers (
  customer_id INT PRIMARY KEY,
  customer_name VARCHAR(100) NOT NULL,
  shipping_city VARCHAR(50)
);

CREATE TABLE Orders (
  order_id INT PRIMARY KEY,
  customer_id INT REFERENCES Customers(customer_id),
  shipping_city VARCHAR(50), -- Duplicated attribute across tables
  order_date DATE
);

CREATE TABLE Order_Items (
  item_id INT PRIMARY KEY,
  order_id INT REFERENCES Orders(order_id),
  product_id INT,
  quantity INT,
  unit_price DECIMAL(10,2)
);`;

const SAMPLE_CSV = `order_id,customer_id,product_id,order_date,total_amount,shipping_city
1001,501,88,2026-03-01,120.50,San Francisco
1002,502,45,2026-03-02,45.00,New York
1003,501,12,2026-03-03,320.00,San Francisco
1004,503,88,2026-03-04,15.99,Chicago
1005,502,34,2026-03-05,89.50,New York`;

const SAMPLE_JSON = `{
  "customers": [
    { "customer_id": 501, "customer_name": "Alice Smith", "shipping_city": "San Francisco" },
    { "customer_id": 502, "customer_name": "Bob Jones", "shipping_city": "New York" }
  ],
  "orders": [
    { "order_id": 1001, "customer_id": 501, "shipping_city": "San Francisco", "order_date": "2026-03-01", "total_amount": 120.50 },
    { "order_id": 1002, "customer_id": 502, "shipping_city": "New York", "order_date": "2026-03-02", "total_amount": 45.00 }
  ]
}`;

let barChartInstance = null;
let lastBreakdown = null;

export function resizeBarChart() {
  if (barChartInstance) {
    try {
      barChartInstance.resize();
    } catch {}
  }
}

export function setupSchemaUploader(onAnalysisComplete) {
  // Dedicated "Submit Your Schema" Tab elements
  const tabFileInput = document.getElementById('tab-input-schema-file');
  const tabDropZone = document.getElementById('tab-schema-drop-zone');
  const tabSqlTextarea = document.getElementById('tab-input-schema-sql');
  const tabDialectSelect = document.getElementById('tab-input-dialect');
  const tabRowCountInput = document.getElementById('tab-input-row-count');
  const tabAnalyzeBtn = document.getElementById('tab-btn-analyze');
  const tabSampleBtn = document.getElementById('btn-tab-load-sample');
  const tabSampleCsvBtn = document.getElementById('btn-tab-load-sample-csv');
  const tabSampleJsonBtn = document.getElementById('btn-tab-load-sample-json');
  const tabStatusEl = document.getElementById('tab-schema-status');
  const tabViewAnalyzerBtn = document.getElementById('btn-view-in-analyzer');

  let selectedSchemaFile = null;

  // 1. Sample Buttons (with live trade-off scale preview)
  if (tabSampleBtn && tabSqlTextarea) {
    tabSampleBtn.addEventListener('click', () => {
      selectedSchemaFile = null;
      tabSqlTextarea.value = SAMPLE_DDL;
      showStatus(tabStatusEl, 'Sample DDL loaded. Click "Analyze Schema & Workload".', 'info');
      const sampleEval = calculateTradeoffScores({
        rowCount: 10000000,
        readPercent: 85,
        writePercent: 15,
        queryComplexity: 'complex',
        storageCostSensitivity: 'medium',
        dataConsistencyCriticality: 'medium',
      });
      renderTabDiagnosticResults(
        {
          tableCount: 3,
          foreignKeysCount: 2,
          maxJoinDepth: 2,
          estimatedNormalForm: '3NF',
        },
        {
          detectedRedundancies: [
            { column: 'shipping_city', tables: ['Customers', 'Orders'], insight: 'Pre-joined customer city to eliminate join during order fulfillment.' }
          ],
          denormalizationOpportunities: [
            { sourceTable: 'Customers', targetTable: 'Orders', candidateColumns: ['customer_name'], estimatedReadSpeedup: '3.2x faster lookup' }
          ],
        },
        sampleEval
      );
      if (tabViewAnalyzerBtn) tabViewAnalyzerBtn.style.display = 'inline-flex';
    });
  }

  if (tabSampleCsvBtn && tabSqlTextarea) {
    tabSampleCsvBtn.addEventListener('click', () => {
      selectedSchemaFile = null;
      tabSqlTextarea.value = SAMPLE_CSV;
      if (tabRowCountInput) tabRowCountInput.value = '5';
      showStatus(tabStatusEl, 'Sample CSV loaded. Click "Analyze Schema & Workload".', 'info');
      const sampleEval = calculateTradeoffScores({
        rowCount: 500000,
        readPercent: 90,
        writePercent: 10,
        queryComplexity: 'simple',
        storageCostSensitivity: 'low',
        dataConsistencyCriticality: 'low',
      });
      renderTabDiagnosticResults(
        {
          tableCount: 1,
          foreignKeysCount: 2,
          maxJoinDepth: 1,
          estimatedNormalForm: 'Denormalized',
        },
        {
          detectedRedundancies: [],
          denormalizationOpportunities: [
            { sourceTable: 'Customers', targetTable: 'Orders', candidateColumns: ['shipping_city'], estimatedReadSpeedup: 'Flat wide table' }
          ],
        },
        sampleEval
      );
      if (tabViewAnalyzerBtn) tabViewAnalyzerBtn.style.display = 'inline-flex';
    });
  }

  if (tabSampleJsonBtn && tabSqlTextarea) {
    tabSampleJsonBtn.addEventListener('click', () => {
      selectedSchemaFile = null;
      tabSqlTextarea.value = SAMPLE_JSON;
      if (tabRowCountInput) tabRowCountInput.value = '4';
      showStatus(tabStatusEl, 'Sample JSON loaded. Click "Analyze Schema & Workload".', 'info');
      const sampleEval = calculateTradeoffScores({
        rowCount: 2000000,
        readPercent: 75,
        writePercent: 25,
        queryComplexity: 'medium',
        storageCostSensitivity: 'medium',
        dataConsistencyCriticality: 'medium',
      });
      renderTabDiagnosticResults(
        {
          tableCount: 2,
          foreignKeysCount: 1,
          maxJoinDepth: 1,
          estimatedNormalForm: '3NF',
        },
        {
          detectedRedundancies: [
            { column: 'shipping_city', tables: ['customers', 'orders'], insight: 'Denormalized shipping destination across documents.' }
          ],
          denormalizationOpportunities: [
            { sourceTable: 'customers', targetTable: 'orders', candidateColumns: ['customer_name'], estimatedReadSpeedup: 'Embedded document lookup' }
          ],
        },
        sampleEval
      );
      if (tabViewAnalyzerBtn) tabViewAnalyzerBtn.style.display = 'inline-flex';
    });
  }



  // Initialize with initial baseline state so the card is never empty
  const initialEval = calculateTradeoffScores({
    rowCount: 10000000,
    readPercent: 80,
    writePercent: 20,
    queryComplexity: 'medium',
    storageCostSensitivity: 'medium',
    dataConsistencyCriticality: 'high',
  });
  renderTabDiagnosticResults(
    {
      tableCount: 0,
      foreignKeysCount: 0,
      maxJoinDepth: 0,
      estimatedNormalForm: '3NF',
    },
    {
      detectedRedundancies: [],
      denormalizationOpportunities: [],
    },
    initialEval
  );

  // 2. File Input & Drag and Drop
  bindDropZone(tabDropZone, tabFileInput, tabSqlTextarea, tabStatusEl);

  function bindDropZone(zone, input, textarea, status) {
    if (!zone || !input) return;

    zone.addEventListener('click', () => input.click());

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.style.borderColor = 'var(--accent)';
    });

    zone.addEventListener('dragleave', () => {
      zone.style.borderColor = 'var(--border)';
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.style.borderColor = 'var(--border)';
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleSelectedFile(e.dataTransfer.files[0], textarea, status);
      }
    });

    input.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleSelectedFile(e.target.files[0], textarea, status);
      }
    });
  }

  function handleSelectedFile(file, textarea, status) {
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      showStatus(status, `File size (${formatBytes(file.size)}) exceeds 500MB maximum limit.`, 'error');
      return;
    }

    selectedSchemaFile = file;
    const isLarge = file.size > 1024 * 1024; // > 1MB

    // For large files up to 500MB, read a leading 512KB slice for instant preview
    const sliceToRead = isLarge ? file.slice(0, 512 * 1024) : file;
    const reader = new FileReader();

    reader.onload = (evt) => {
      const text = evt.target.result;
      if (textarea) {
        if (isLarge) {
          textarea.value = `-- [Large File: ${file.name} (${formatBytes(file.size)})]\n-- Preview of leading records (Full 500MB will be streamed to analysis engine):\n\n${text.slice(0, 2000)}\n\n-- ... [Remaining data continues for ${formatBytes(file.size)}] ...`;
        } else {
          textarea.value = text;
        }
      }
      showStatus(status, `Loaded "${file.name}" (${formatBytes(file.size)}). Ready for analysis.`, 'success');
    };

    reader.onerror = () => {
      showStatus(status, `Error reading file "${file.name}".`, 'error');
    };

    reader.readAsText(sliceToRead);
  }

  // 3. Analysis Dispatcher
  async function performAnalysis({ fileObj, sqlContent, dialect, rowCountVal, readPercentVal, storageCostVal, consistencyVal, buttonEl, statusElement }) {
    if (!fileObj && (!sqlContent || sqlContent.trim().length === 0)) {
      showStatus(statusElement, 'Please paste SQL/CSV/JSON or upload a file (up to 500MB).', 'error');
      return;
    }

    buttonEl.disabled = true;
    const origHtml = buttonEl.innerHTML;
    buttonEl.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 6px; animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><span>Analyzing Schema...</span>';
    showStatus(statusElement, fileObj ? `Streaming ${formatBytes(fileObj.size)} file to analysis engine...` : 'Analyzing schema & workload...', 'info');

    try {
      let response;

      if (fileObj) {
        // Stream file using multipart/form-data
        const formData = new FormData();
        formData.append('schemaFile', fileObj);
        formData.append('dialect', dialect);
        if (rowCountVal) formData.append('rowCount', parseRowCount(rowCountVal));
        formData.append('readPercent', readPercentVal);
        formData.append('writePercent', 100 - readPercentVal);
        formData.append('storageCostSensitivity', storageCostVal);
        formData.append('dataConsistencyCriticality', consistencyVal);

        response = await fetch('http://localhost:4000/api/v1/schema/analyze', {
          method: 'POST',
          body: formData,
        });
      } else {
        // Send raw text as JSON
        response = await fetch('http://localhost:4000/api/v1/schema/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sqlContent,
            dialect,
            rowCount: parseRowCount(rowCountVal),
            readPercent: readPercentVal,
            writePercent: 100 - readPercentVal,
            storageCostSensitivity: storageCostVal,
            dataConsistencyCriticality: consistencyVal,
          }),
        });
      }

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Server error: ${response.status}`);
      }

      const res = await response.json();
      const { schemaSummary, diagnostics, tradeoffEvaluation, generatedDDL, inferredRowCount } = res.data;

      showStatus(statusElement, `Analyzed ${schemaSummary.tableCount} tables & ${schemaSummary.foreignKeysCount} relations.`, 'success');

      // Update textarea with inferred SQL DDL if converted from CSV or JSON
      if (generatedDDL && tabSqlTextarea && fileObj) {
        tabSqlTextarea.value = generatedDDL;
      }

      // Update row count input if inferred
      if (inferredRowCount && tabRowCountInput && (!tabRowCountInput.value || tabRowCountInput.value === '10M')) {
        tabRowCountInput.value = formatNumberShorthand(inferredRowCount);
      }

      // Update diagnostic views in Dedicated Tab
      renderTabDiagnosticResults(schemaSummary, diagnostics, tradeoffEvaluation);

      // Reveal "View in Full Analyzer" CTA
      if (tabViewAnalyzerBtn) {
        tabViewAnalyzerBtn.style.display = 'inline-flex';
      }

      // Update global application evaluation & radar chart with full custom dataset context
      if (typeof onAnalysisComplete === 'function' && tradeoffEvaluation) {
        const datasetName = fileObj ? fileObj.name : 'Custom Relational Schema';
        tradeoffEvaluation.isCustomSchema = true;
        tradeoffEvaluation.datasetName = datasetName;
        tradeoffEvaluation.schemaSummary = schemaSummary;
        tradeoffEvaluation.diagnostics = diagnostics;
        tradeoffEvaluation.generatedDDL = generatedDDL;
        tradeoffEvaluation.inferredRowCount = inferredRowCount;
        tradeoffEvaluation.inputs = {
          rowCount: inferredRowCount || parseRowCount(rowCountVal),
          readPercent: readPercentVal,
          writePercent: 100 - readPercentVal,
          queryComplexity: schemaSummary.maxJoinDepth >= 4 ? 'complex' : schemaSummary.maxJoinDepth >= 2 ? 'medium' : 'simple',
          storageCostSensitivity: storageCostVal,
          dataConsistencyCriticality: consistencyVal
        };

        if (!tradeoffEvaluation.recommendation) {
          tradeoffEvaluation.recommendation = {
            verdict: tradeoffEvaluation.verdict || 'Hybrid',
            badgeClass: tradeoffEvaluation.badgeClass || (
              tradeoffEvaluation.verdict?.toLowerCase().includes('denorm') ? 'denorm' :
              tradeoffEvaluation.verdict?.toLowerCase().includes('norm') ? 'norm' : 'hybrid'
            ),
            explanation: tradeoffEvaluation.explanation || '',
            keyTakeaways: tradeoffEvaluation.keyTakeaways || { why: '', whatCouldChange: '' }
          };
        }
        onAnalysisComplete(tradeoffEvaluation);
      }
    } catch (err) {
      console.warn('Analysis error:', err);
      // If it's a validation error from server (e.g. invalid SQL or unparseable input)
      if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
        showStatus(statusElement, `Analysis error: ${err.message}`, 'error');
      } else {
        // Genuine network failure / server offline
        runClientSideFallback({ sqlContent, rowCountVal, statusElement });
      }
    } finally {
      buttonEl.disabled = false;
      buttonEl.innerHTML = origHtml;
    }
  }

  // 4. Action for Dedicated Tab Button
  if (tabAnalyzeBtn) {
    tabAnalyzeBtn.addEventListener('click', () => {
      const sqlContent = tabSqlTextarea ? tabSqlTextarea.value.trim() : '';
      const dialect = tabDialectSelect ? tabDialectSelect.value : 'generic';
      const rowCountVal = tabRowCountInput ? tabRowCountInput.value : '10M';
      const readPercentVal = 80;
      const storageCostVal = 'medium';
      const consistencyVal = 'high';

      performAnalysis({
        fileObj: selectedSchemaFile,
        sqlContent,
        dialect,
        rowCountVal,
        readPercentVal,
        storageCostVal,
        consistencyVal,
        buttonEl: tabAnalyzeBtn,
        statusElement: tabStatusEl,
      });
    });
  }

  // 5. Mode Switcher (File vs Live Supabase)
  const btnModeFile = document.getElementById('btn-mode-file');
  const btnModeSupabase = document.getElementById('btn-mode-supabase');
  const panelModeFile = document.getElementById('panel-mode-file');
  const panelModeSupabase = document.getElementById('panel-mode-supabase');
  const inputSupabaseUri = document.getElementById('tab-input-supabase-uri');
  const inputSupabaseSchema = document.getElementById('tab-input-supabase-schema');
  const inputSupabaseRowCount = document.getElementById('tab-input-supabase-row-count');
  const btnToggleUri = document.getElementById('btn-toggle-uri-visibility');
  const btnConnectSupabase = document.getElementById('tab-btn-connect-supabase');
  const statusSupabaseEl = document.getElementById('tab-supabase-status');

  if (btnModeFile && btnModeSupabase && panelModeFile && panelModeSupabase) {
    btnModeFile.addEventListener('click', () => {
      btnModeFile.classList.add('active');
      btnModeSupabase.classList.remove('active');
      panelModeFile.style.display = 'block';
      panelModeSupabase.style.display = 'none';
    });

    btnModeSupabase.addEventListener('click', () => {
      btnModeSupabase.classList.add('active');
      btnModeFile.classList.remove('active');
      panelModeFile.style.display = 'none';
      panelModeSupabase.style.display = 'block';
    });
  }

  // 6. Toggle URI Visibility
  if (btnToggleUri && inputSupabaseUri) {
    btnToggleUri.addEventListener('click', () => {
      const isPassword = inputSupabaseUri.type === 'password';
      inputSupabaseUri.type = isPassword ? 'text' : 'password';
      btnToggleUri.textContent = isPassword ? 'Hide URI' : 'Show URI';
    });
  }

  // 7. Connect & Introspect Supabase Action
  if (btnConnectSupabase) {
    btnConnectSupabase.addEventListener('click', async () => {
      const connectionString = inputSupabaseUri ? inputSupabaseUri.value.trim() : '';
      const schemaName = (inputSupabaseSchema ? inputSupabaseSchema.value.trim() : '') || 'public';
      const targetRowCount = inputSupabaseRowCount ? inputSupabaseRowCount.value.trim() : '';

      if (!connectionString) {
        showStatus(statusSupabaseEl, 'Please paste your Supabase PostgreSQL connection URI.', 'error');
        return;
      }

      btnConnectSupabase.disabled = true;
      const origHtml = btnConnectSupabase.innerHTML;
      btnConnectSupabase.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle; margin-right: 6px; animation: spin 1s linear infinite;"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg><span>Introspecting Supabase...</span>';
      showStatus(statusSupabaseEl, 'Connecting via SSL and reading information_schema...', 'info');

      try {
        const payload = {
          connectionString,
          schemaName,
          readPercent: 80,
          writePercent: 20,
          storageCostSensitivity: 'medium',
          dataConsistencyCriticality: 'high',
        };
        if (targetRowCount && !targetRowCount.toLowerCase().includes('auto')) {
          payload.rowCount = parseRowCount(targetRowCount);
        }

        const response = await fetch('http://localhost:4000/api/v1/schema/connect-postgres', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || `Connection failed: ${response.status}`);
        }

        const res = await response.json();
        const { schemaSummary, diagnostics, tradeoffEvaluation, generatedDDL, inferredRowCount } = res.data;

        showStatus(statusSupabaseEl, `Connected to Supabase! Introspected ${schemaSummary.tableCount} tables & ${schemaSummary.foreignKeysCount} foreign keys (${formatNumberShorthand(inferredRowCount)} total rows).`, 'success');

        // Populate textarea with generated DDL so user can inspect their Supabase tables
        if (tabSqlTextarea && generatedDDL) {
          tabSqlTextarea.value = generatedDDL;
        }

        if (inputSupabaseRowCount && inferredRowCount) {
          inputSupabaseRowCount.value = formatNumberShorthand(inferredRowCount);
        }

        // Update diagnostics
        renderTabDiagnosticResults(schemaSummary, diagnostics, tradeoffEvaluation);

        // Reveal CTA button
        if (tabViewAnalyzerBtn) {
          tabViewAnalyzerBtn.style.display = 'inline-flex';
        }

        // Update global radar chart with full custom Supabase context
        if (typeof onAnalysisComplete === 'function' && tradeoffEvaluation) {
          const dbTitle = document.getElementById('tab-input-supabase-title')?.value.trim() || 'Supabase Production Database';
          tradeoffEvaluation.isCustomSchema = true;
          tradeoffEvaluation.datasetName = dbTitle;
          tradeoffEvaluation.schemaSummary = schemaSummary;
          tradeoffEvaluation.diagnostics = diagnostics;
          tradeoffEvaluation.generatedDDL = generatedDDL;
          tradeoffEvaluation.inferredRowCount = inferredRowCount;
          tradeoffEvaluation.inputs = {
            rowCount: inferredRowCount || 1000000,
            readPercent: 80,
            writePercent: 20,
            queryComplexity: schemaSummary.maxJoinDepth >= 4 ? 'complex' : schemaSummary.maxJoinDepth >= 2 ? 'medium' : 'simple',
            storageCostSensitivity: 'medium',
            dataConsistencyCriticality: 'high'
          };

          if (!tradeoffEvaluation.recommendation) {
            tradeoffEvaluation.recommendation = {
              verdict: tradeoffEvaluation.verdict || 'Hybrid',
              badgeClass: tradeoffEvaluation.badgeClass || (
                tradeoffEvaluation.verdict?.toLowerCase().includes('denorm') ? 'denorm' :
                tradeoffEvaluation.verdict?.toLowerCase().includes('norm') ? 'norm' : 'hybrid'
              ),
              explanation: tradeoffEvaluation.explanation || '',
              keyTakeaways: tradeoffEvaluation.keyTakeaways || { why: '', whatCouldChange: '' }
            };
          }
          onAnalysisComplete(tradeoffEvaluation);
        }

        // Auto-save to user account if checkbox is checked
        const saveToAccount = document.getElementById('tab-input-save-to-account')?.checked;
        const dbTitle = document.getElementById('tab-input-supabase-title')?.value.trim() || 'Supabase Database';
        if (saveToAccount) {
          try {
            await fetch('http://localhost:4000/api/v1/saved-schemas', {
              method: 'POST',
              headers: auth.getAuthHeaders(),
              body: JSON.stringify({
                title: dbTitle,
                connectionString,
                targetSchema: schemaName,
                ddlContent: generatedDDL,
                tableCount: schemaSummary.tableCount,
                foreignKeysCount: schemaSummary.foreignKeysCount,
                maxJoinDepth: schemaSummary.maxJoinDepth,
                estimatedNormalForm: schemaSummary.estimatedNormalForm,
                tables: res.data.tableStats || [],
                relationships: [],
                initialAnalysis: {
                  workload: {
                    rowCountNumeric: inferredRowCount || 1000000,
                    readPercent: 80,
                    writePercent: 20
                  },
                  evaluation: tradeoffEvaluation
                }
              })
            });
            window.dispatchEvent(new CustomEvent('schemas:reload'));
          } catch (_sErr) {
            console.warn('Could not auto-save schema:', _sErr);
          }
        }
      } catch (err) {
        console.error('Supabase connection error:', err);
        showStatus(statusSupabaseEl, err.message || 'Failed to connect. Check credentials & ensure backend server is running (npm run server).', 'error');
      } finally {
        btnConnectSupabase.disabled = false;
        btnConnectSupabase.innerHTML = origHtml;
      }
    });
  }

  // 8. "View in Full Analyzer" redirect
  if (tabViewAnalyzerBtn) {
    tabViewAnalyzerBtn.addEventListener('click', () => {
      const analyzerNavBtn = document.querySelector('[data-nav-target="tab-analyzer"]');
      if (analyzerNavBtn) {
        analyzerNavBtn.click();
        setTimeout(() => {
          const recBanner = document.getElementById('recommendation-banner');
          if (recBanner) {
            recBanner.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 120);
      }
    });
  }

  function showStatus(el, msg, type) {
    if (!el) return;
    el.style.display = 'block';
    el.textContent = msg;
    el.style.color = type === 'error' ? '#ef4444' : type === 'success' ? 'var(--accent)' : type === 'warning' ? '#f59e0b' : 'var(--text-muted)';
  }

  function renderTabDiagnosticResults(summary, diagnostics, tradeoffEvaluation = null) {
    const tabBadge = document.getElementById('tab-diag-badge');
    const tabTables = document.getElementById('tab-diag-tables');
    const tabDepth = document.getElementById('tab-diag-depth');
    const tabRedundancies = document.getElementById('tab-diag-redundancies');
    const tabRedList = document.getElementById('tab-diag-redundancy-list');
    const tabOppList = document.getElementById('tab-diag-opportunity-list');

    if (tabBadge) tabBadge.textContent = `${summary.estimatedNormalForm} Topology`;
    if (tabTables) tabTables.textContent = `${summary.tableCount} / ${summary.foreignKeysCount}`;
    if (tabDepth) tabDepth.textContent = `${summary.maxJoinDepth} Hops`;
    if (tabRedundancies) tabRedundancies.textContent = String(diagnostics.detectedRedundancies.length);

    if (tabRedList) {
      if (diagnostics.detectedRedundancies.length === 0) {
        tabRedList.innerHTML = '<li style="color: var(--accent);">Zero duplicate attributes detected. 3NF compliance maintained.</li>';
      } else {
        tabRedList.innerHTML = diagnostics.detectedRedundancies.map(r => `
          <li><strong>${r.column}</strong> duplicated in [${r.tables.join(', ')}]. ${r.insight}</li>
        `).join('');
      }
    }

    if (tabOppList) {
      if (diagnostics.denormalizationOpportunities.length === 0) {
        tabOppList.innerHTML = '<li>Zero foreign key bottlenecks found.</li>';
      } else {
        tabOppList.innerHTML = diagnostics.denormalizationOpportunities.map(o => `
          <li>Pre-join <strong>[${o.candidateColumns.join(', ')}]</strong> from <em>${o.sourceTable}</em> into <em>${o.targetTable}</em> (${o.estimatedReadSpeedup})</li>
        `).join('');
      }
    }

    // Default fallback calculation if tradeoffEvaluation wasn't supplied directly
    if (!tradeoffEvaluation) {
      tradeoffEvaluation = calculateTradeoffScores({
        rowCount: 10000000,
        readPercent: 80,
        writePercent: 20,
        queryComplexity: summary.maxJoinDepth >= 4 ? 'complex' : summary.maxJoinDepth >= 2 ? 'medium' : 'simple',
        storageCostSensitivity: 'medium',
        dataConsistencyCriticality: 'high',
      });
    }

    renderTradeoffScaleView(tradeoffEvaluation);
  }

  function renderTradeoffScaleView(evalData) {
    if (!evalData) return;

    const normScoreEl = document.getElementById('scale-norm-score');
    const denormScoreEl = document.getElementById('scale-denorm-score');
    const spectrumStatusEl = document.getElementById('scale-spectrum-status');
    const spectrumPointerEl = document.getElementById('spectrum-pointer');

    const normAvg = evalData.scores?.normalizedAverage ?? 5.0;
    const denormAvg = evalData.scores?.denormalizedAverage ?? 5.0;

    if (normScoreEl) normScoreEl.textContent = normAvg.toFixed(1);
    if (denormScoreEl) denormScoreEl.textContent = denormAvg.toFixed(1);

    // Spectrum Pointer Position (0% = Strict 3NF, 100% = Pure Denorm)
    const sum = normAvg + denormAvg;
    let pct = 50;
    if (sum > 0) {
      pct = Math.round((denormAvg / sum) * 100);
    }
    pct = Math.max(8, Math.min(92, pct));

    if (spectrumPointerEl) {
      spectrumPointerEl.style.left = `${pct}%`;
    }

    if (spectrumStatusEl) {
      const verdict = evalData.verdict || evalData.recommendation?.verdict || '';
      if (verdict.toLowerCase().includes('denorm')) {
        spectrumStatusEl.textContent = 'Favors Denormalization';
        spectrumStatusEl.style.color = 'var(--accent)';
      } else if (verdict.toLowerCase().includes('norm')) {
        spectrumStatusEl.textContent = 'Favors 3NF Normalization';
        spectrumStatusEl.style.color = 'var(--indicator-norm)';
      } else {
        spectrumStatusEl.textContent = 'Balanced Equilibrium (Hybrid)';
        spectrumStatusEl.style.color = 'var(--indicator-hybrid)';
      }
    }

    // Render Grouped Bar Chart Only
    if (evalData.breakdown) {
      updateBarChart(evalData.breakdown);
    }
  }

  function updateBarChart(breakdown) {
    lastBreakdown = breakdown;
    const canvas = document.getElementById('tab-diag-bar-chart');
    if (!canvas || typeof window.Chart === 'undefined' || !breakdown) return;

    const isDay = document.documentElement.getAttribute('data-theme') === 'day';
    const gridColor = isDay ? 'rgba(0, 0, 0, 0.07)' : 'rgba(255, 255, 255, 0.08)';
    const textColor = isDay ? '#52525b' : '#a1a1aa';
    const normColor = isDay ? '#2563eb' : '#60a5fa';
    const denormColor = isDay ? '#059669' : '#10b981';

    const labels = ['Read Latency', 'Write Amplification', 'Storage Footprint', 'Data Integrity', 'Maintainability'];
    const normData = [
      breakdown.readPerformance.normalized,
      breakdown.writePerformance.normalized,
      breakdown.storageEfficiency.normalized,
      breakdown.dataIntegrity.normalized,
      breakdown.queryComplexity.normalized,
    ];
    const denormData = [
      breakdown.readPerformance.denormalized,
      breakdown.writePerformance.denormalized,
      breakdown.storageEfficiency.denormalized,
      breakdown.dataIntegrity.denormalized,
      breakdown.queryComplexity.denormalized,
    ];

    if (barChartInstance) {
      barChartInstance.data.datasets[0].data = normData;
      barChartInstance.data.datasets[1].data = denormData;
      barChartInstance.data.datasets[0].backgroundColor = normColor;
      barChartInstance.data.datasets[1].backgroundColor = denormColor;
      if (barChartInstance.options.scales?.x) {
        barChartInstance.options.scales.x.grid.color = gridColor;
        barChartInstance.options.scales.x.ticks.color = textColor;
      }
      if (barChartInstance.options.scales?.y) {
        barChartInstance.options.scales.y.grid.color = gridColor;
        barChartInstance.options.scales.y.ticks.color = textColor;
      }
      if (barChartInstance.options.plugins?.legend?.labels) {
        barChartInstance.options.plugins.legend.labels.color = textColor;
      }
      barChartInstance.update();
      return;
    }

    barChartInstance = new window.Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: '3NF Normalization',
            data: normData,
            backgroundColor: normColor,
            borderRadius: 4,
            borderSkipped: false,
            maxBarThickness: 24,
          },
          {
            label: 'Denormalization',
            data: denormData,
            backgroundColor: denormColor,
            borderRadius: 4,
            borderSkipped: false,
            maxBarThickness: 24,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: textColor,
              font: { family: 'Inter', size: 11, weight: '600' },
              boxWidth: 12,
              boxHeight: 12,
              usePointStyle: true,
              pointStyle: 'rectRounded',
            },
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.dataset.label}: ${ctx.raw} / 10`,
            },
          },
        },
        scales: {
          x: {
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              font: { family: 'Inter', size: 10, weight: '500' },
            },
          },
          y: {
            min: 0,
            max: 10,
            grid: { color: gridColor },
            ticks: {
              stepSize: 2,
              color: textColor,
              font: { family: 'Inter', size: 10 },
            },
          },
        },
      },
    });
  }

  // Theme observer for repainting bar chart on Day/Night toggle
  const themeObserver = new MutationObserver(() => {
    if (lastBreakdown && barChartInstance) {
      barChartInstance.destroy();
      barChartInstance = null;
      updateBarChart(lastBreakdown);
    }
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  // Client-side quick fallback if backend server isn't running
  function runClientSideFallback({ sqlContent, _rowCountVal, statusElement }) {
    showStatus(statusElement, 'Backend offline (run: npm run server). Displaying client heuristic preview.', 'warning');

    let tableCount = 1;
    let fkCount = 0;
    const isJson = sqlContent.startsWith('{') || sqlContent.startsWith('[');
    const isCsv = !isJson && !sqlContent.toUpperCase().includes('CREATE TABLE') && sqlContent.includes(',');

    if (isCsv) {
      const lines = sqlContent.split('\n').filter(Boolean);
      const headers = lines[0] ? lines[0].split(',').map(h => h.trim()) : [];
      fkCount = headers.filter(h => /id$/i.test(h) && !/^id$/i.test(h)).length;
      tableCount = 1;
    } else if (isJson) {
      try {
        const obj = JSON.parse(sqlContent);
        tableCount = Array.isArray(obj) ? 1 : Object.keys(obj).length;
        fkCount = tableCount > 1 ? tableCount - 1 : 0;
      } catch {
        tableCount = 1;
      }
    } else {
      const matches = sqlContent.match(/CREATE\s+TABLE/gi) || [];
      tableCount = Math.max(1, matches.length);
      const fks = sqlContent.match(/REFERENCES/gi) || [];
      fkCount = fks.length;
    }

    const fallbackEval = calculateTradeoffScores({
      rowCount: parseRowCount(_rowCountVal) || 1000000,
      readPercent: 80,
      writePercent: 20,
      queryComplexity: fkCount >= 3 ? 'complex' : fkCount >= 1 ? 'medium' : 'simple',
      storageCostSensitivity: 'medium',
      dataConsistencyCriticality: 'high',
    });

    renderTabDiagnosticResults(
      {
        tableCount,
        foreignKeysCount: fkCount,
        maxJoinDepth: Math.min(tableCount - 1, 3),
        estimatedNormalForm: fkCount > 1 ? '3NF' : 'Denormalized',
      },
      {
        detectedRedundancies: [],
        denormalizationOpportunities: [
          {
            sourceTable: 'Inferred Entity',
            targetTable: 'Main Table',
            candidateColumns: ['frequently_queried_fields'],
            estimatedReadSpeedup: '3.5x faster lookup',
          }
        ],
      },
      fallbackEval
    );

    if (tabViewAnalyzerBtn) tabViewAnalyzerBtn.style.display = 'inline-flex';
  }
}

function parseRowCount(val) {
  if (typeof val === 'number') return val;
  const str = String(val).trim().toUpperCase();
  const num = parseFloat(str.replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return 100000;
  if (str.endsWith('B')) return num * 1_000_000_000;
  if (str.endsWith('M')) return num * 1_000_000;
  if (str.endsWith('K')) return num * 1_000;
  return num;
}

function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatNumberShorthand(num) {
  if (num >= 1_000_000_000) return `${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return String(num);
}
