/**
 * Saved Schemas & Live Supabase Change Tracking Manager
 * Provides user database management, drift checking, AST diff review, and sync.
 * All icons rendered via clean SVGs (NO emojis).
 */

import { auth } from './auth.js';

const API_BASE = 'http://localhost:4000/api/v1';

// Clean SVG Icon Helpers (strictly no emojis)
const SVGS = {
  database: `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
  refresh: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>`,
  arrowRight: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  trash: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  history: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
  check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12"/></svg>`,
  alert: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`
};

let onOpenSchemaInWorkspace = null;

export function setupSavedSchemasManager(openInWorkspaceCallback) {
  onOpenSchemaInWorkspace = openInWorkspaceCallback;

  const refreshBtn = document.getElementById('refresh-schemas-btn');
  const diffModal = document.getElementById('diff-modal');
  const closeDiffModalBtn = document.getElementById('close-diff-modal');

  if (closeDiffModalBtn && diffModal) {
    closeDiffModalBtn.addEventListener('click', () => {
      diffModal.style.display = 'none';
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadSavedSchemas();
    });
  }

  window.addEventListener('auth:change', () => {
    loadSavedSchemas();
  });

  // Initial load
  loadSavedSchemas();
}

/**
 * Fetches and renders all saved databases from the backend
 */
export async function loadSavedSchemas() {
  const container = document.getElementById('saved-schemas-container');
  if (!container) return;

  container.innerHTML = `
    <div style="padding: var(--space-4); text-align: center; color: var(--text-muted);">
      Loading your databases...
    </div>
  `;

  try {
    const res = await fetch(`${API_BASE}/saved-schemas`, {
      headers: auth.getAuthHeaders()
    });

    if (!res.ok) throw new Error('Failed to load saved schemas.');
    const data = await res.json();
    const schemas = data.schemas || [];

    renderSchemasList(container, schemas);
  } catch (err) {
    container.innerHTML = `
      <div class="card" style="padding: var(--space-4); text-align: center;">
        <span style="color: var(--danger);">${err.message}</span>
        <button type="button" class="btn btn-secondary btn-sm" style="margin-top: var(--space-2);" onclick="window.dispatchEvent(new CustomEvent('schemas:reload'))">
          Retry
        </button>
      </div>
    `;
  }
}

function renderSchemasList(container, schemas) {
  if (schemas.length === 0) {
    container.innerHTML = `
      <div class="card" style="padding: var(--space-6); text-align: center; background: var(--surface-elevated);">
        <div style="margin-bottom: var(--space-3); color: var(--text-muted);">
          ${SVGS.database}
        </div>
        <h3 style="font-size: 16px; margin-bottom: var(--space-2); color: var(--text-primary);">No Saved Databases Yet</h3>
        <p style="font-size: 13px; color: var(--text-secondary); max-width: 460px; margin: 0 auto var(--space-4);">
          Connect your Supabase project in the <strong>Submit Your Schema</strong> tab and check "Save to my account" to enable automated drift and schema change tracking.
        </p>
        <button type="button" class="btn btn-primary btn-sm" id="btn-goto-submit-schema">
          Connect a Database
        </button>
      </div>
    `;

    const gotoBtn = container.querySelector('#btn-goto-submit-schema');
    if (gotoBtn) {
      gotoBtn.addEventListener('click', () => {
        const tabSubmit = document.querySelector('[data-nav-target="tab-submit-schema"]');
        if (tabSubmit) tabSubmit.click();
      });
    }
    return;
  }

  const listHtml = schemas.map(s => {
    const latestRun = s.latest_run;
    const verdict = latestRun ? latestRun.verdict : 'Not Evaluated';
    const verdictColor = verdict.includes('Normalization') ? 'var(--blue)' : 'var(--accent)';
    const updatedDate = new Date(s.updated_at || s.created_at).toLocaleDateString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    return `
      <div class="card" data-schema-id="${s.id}" style="padding: var(--space-4); background: var(--surface-elevated); margin-bottom: var(--space-3); border-left: 3px solid ${verdictColor};">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-2);">
          <div>
            <div style="display: flex; align-items: center; gap: var(--space-2);">
              <span style="color: var(--accent);">${SVGS.database}</span>
              <strong style="font-size: 15px; color: var(--text-primary);">${escapeHtml(s.title)}</strong>
              <span class="badge" style="font-size: 10px; text-transform: uppercase;">${s.dialect}</span>
              <span class="badge" style="font-size: 10px;">${s.estimated_normal_form || '3NF'}</span>
            </div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">
              Last Updated: ${updatedDate}
            </div>
          </div>

          <div style="display: flex; gap: var(--space-2);">
            <button type="button" class="btn btn-secondary btn-sm action-check-changes" data-id="${s.id}" title="Connect to live Supabase and detect schema changes">
              ${SVGS.refresh} <span style="margin-left: 4px;">Check for Changes</span>
            </button>
            <button type="button" class="btn btn-primary btn-sm action-open-workspace" data-id="${s.id}" title="Open schema in analyzer workspace">
              ${SVGS.arrowRight} <span style="margin-left: 4px;">Analyze</span>
            </button>
            <button type="button" class="btn btn-ghost btn-sm action-delete-schema" data-id="${s.id}" style="color: var(--danger);" title="Delete database">
              ${SVGS.trash}
            </button>
          </div>
        </div>

        <div style="display: flex; flex-wrap: wrap; gap: var(--space-4); font-size: 12px; color: var(--text-secondary); padding-top: var(--space-2); border-top: 1px solid var(--border-subtle);">
          <div><strong>${s.table_count}</strong> Tables</div>
          <div><strong>${s.foreign_keys_count}</strong> Foreign Keys</div>
          <div>Max Join Depth: <strong>${s.max_join_depth}</strong></div>
          <div>Latest Verdict: <strong style="color: ${verdictColor};">${verdict}</strong></div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = listHtml;

  // Attach event listeners
  container.querySelectorAll('.action-check-changes').forEach(btn => {
    btn.addEventListener('click', () => handleCheckChanges(btn.getAttribute('data-id'), btn));
  });

  container.querySelectorAll('.action-open-workspace').forEach(btn => {
    btn.addEventListener('click', () => handleOpenWorkspace(btn.getAttribute('data-id')));
  });

  container.querySelectorAll('.action-delete-schema').forEach(btn => {
    btn.addEventListener('click', () => handleDeleteSchema(btn.getAttribute('data-id')));
  });
}

/**
 * Triggers live drift detection against Supabase
 */
async function handleCheckChanges(schemaId, btnElement) {
  const originalText = btnElement.innerHTML;
  btnElement.innerHTML = `Checking...`;
  btnElement.disabled = true;

  try {
    const res = await fetch(`${API_BASE}/saved-schemas/${schemaId}/check-changes`, {
      method: 'POST',
      headers: auth.getAuthHeaders()
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to check database changes.');

    showDiffModal(schemaId, data);
  } catch (err) {
    alert(`Could not verify changes: ${err.message}`);
  } finally {
    btnElement.innerHTML = originalText;
    btnElement.disabled = false;
  }
}

/**
 * Displays the interactive diff modal showing drift details
 */
function showDiffModal(schemaId, diffData) {
  const diffModal = document.getElementById('diff-modal');
  const diffBody = document.getElementById('diff-modal-body');
  const syncBtn = document.getElementById('diff-modal-sync-btn');
  if (!diffModal || !diffBody) return;

  const diff = diffData.diff;
  let statusBadge = diff.hasChanges
    ? `<span class="badge" style="background: var(--warning); color: #000; font-size: 11px;">Changes Detected</span>`
    : `<span class="badge" style="background: var(--accent); color: #000; font-size: 11px;">Up to Date</span>`;

  let detailsHtml = `
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: var(--space-3);">
      <h4 style="font-size: 15px; margin: 0; color: var(--text-primary);">Drift & Schema Delta Report</h4>
      ${statusBadge}
    </div>

    <div class="card" style="padding: var(--space-3); background: var(--surface-card); margin-bottom: var(--space-3); font-size: 13px; color: var(--text-secondary);">
      ${escapeHtml(diff.summary)}
    </div>
  `;

  if (diff.hasChanges) {
    detailsHtml += `
      <div style="display: flex; flex-direction: column; gap: var(--space-2); margin-bottom: var(--space-3); font-size: 12px;">
        ${diff.addedTables.length > 0 ? `
          <div style="padding: var(--space-2); background: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: var(--radius-sm);">
            <strong style="color: var(--accent);">+ Added Tables:</strong> ${diff.addedTables.map(t => `<code style="color: var(--text-primary);">${escapeHtml(t)}</code>`).join(', ')}
          </div>
        ` : ''}

        ${diff.removedTables.length > 0 ? `
          <div style="padding: var(--space-2); background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: var(--radius-sm);">
            <strong style="color: var(--danger);">- Removed Tables:</strong> ${diff.removedTables.map(t => `<code style="color: var(--text-primary);">${escapeHtml(t)}</code>`).join(', ')}
          </div>
        ` : ''}

        ${diff.modifiedTables.length > 0 ? `
          <div style="padding: var(--space-2); background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: var(--radius-sm);">
            <strong style="color: var(--blue);">Modified Tables:</strong>
            <ul style="margin: 4px 0 0 var(--space-4); padding: 0;">
              ${diff.modifiedTables.map(m => `
                <li><strong>${escapeHtml(m.tableName)}</strong>: Row count ${m.oldRowCount} -> ${m.newRowCount} (${m.rowCountDelta >= 0 ? '+' : ''}${m.rowCountDelta})</li>
              `).join('')}
            </ul>
          </div>
        ` : ''}
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--space-2); font-size: 12px; margin-bottom: var(--space-3);">
        <div class="card" style="padding: var(--space-2); text-align: center;">
          <div style="color: var(--text-muted);">Table Count</div>
          <strong style="font-size: 14px; color: var(--text-primary);">${diff.metricsDiff.tableCount.old} -> ${diff.metricsDiff.tableCount.new}</strong>
        </div>
        <div class="card" style="padding: var(--space-2); text-align: center;">
          <div style="color: var(--text-muted);">Max Join Depth</div>
          <strong style="font-size: 14px; color: var(--text-primary);">${diff.metricsDiff.maxJoinDepth.old} -> ${diff.metricsDiff.maxJoinDepth.new}</strong>
        </div>
      </div>
    `;

    if (syncBtn) {
      syncBtn.style.display = 'inline-flex';
      syncBtn.onclick = async () => {
        syncBtn.disabled = true;
        syncBtn.textContent = 'Syncing...';
        try {
          const syncRes = await fetch(`${API_BASE}/saved-schemas/${schemaId}/sync`, {
            method: 'POST',
            headers: auth.getAuthHeaders(),
            body: JSON.stringify({
              liveIntrospection: diffData.liveIntrospection,
              newEvaluation: diffData.newEvaluation
            })
          });
          if (!syncRes.ok) throw new Error('Sync failed.');
          diffModal.style.display = 'none';
          loadSavedSchemas();
        } catch (sErr) {
          alert(`Sync error: ${sErr.message}`);
        } finally {
          syncBtn.disabled = false;
          syncBtn.textContent = 'Apply & Sync Changes';
        }
      };
    }
  } else {
    if (syncBtn) syncBtn.style.display = 'none';
  }

  diffBody.innerHTML = detailsHtml;
  diffModal.style.display = 'flex';
}

/**
 * Loads a saved schema directly into the main workspace
 */
async function handleOpenWorkspace(schemaId) {
  try {
    const res = await fetch(`${API_BASE}/saved-schemas/${schemaId}`, {
      headers: auth.getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to load schema details.');

    const data = await res.json();
    if (onOpenSchemaInWorkspace) {
      onOpenSchemaInWorkspace(data);
    }
  } catch (err) {
    alert(`Could not open schema: ${err.message}`);
  }
}

/**
 * Deletes a saved schema
 */
async function handleDeleteSchema(schemaId) {
  if (!confirm('Are you sure you want to remove this saved database and its analysis history?')) {
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/saved-schemas/${schemaId}`, {
      method: 'DELETE',
      headers: auth.getAuthHeaders()
    });
    if (!res.ok) throw new Error('Failed to delete schema.');
    loadSavedSchemas();
  } catch (err) {
    alert(`Delete error: ${err.message}`);
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
