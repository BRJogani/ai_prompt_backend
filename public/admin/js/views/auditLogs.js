import { api } from '../api.js';
import { toast } from '../toast.js';

let state = {
  page: 1,
  limit: 20,
  total: 0,
  action: '',
  entityType: '',
};

export async function renderAuditLogs(container) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <div class="view-header" style="margin-bottom: 0;">
        <div>
          <h1 class="view-title">Admin Audit Trail</h1>
          <p class="view-subtitle">Security and operational change logs tracking all administrative actions</p>
        </div>
      </div>

      <!-- Filters Row -->
      <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
        <input type="text" class="form-control" id="filter-action" placeholder="Filter by action (e.g. CREATE, UPDATE)..." style="max-width: 260px;" value="${state.action}" />
        <input type="text" class="form-control" id="filter-entity" placeholder="Filter by entity (e.g. Prompt, Category)..." style="max-width: 240px;" value="${state.entityType}" />
        <button class="btn btn-primary btn-sm" id="btn-apply-filters">
          <i data-lucide="filter" style="width: 14px; height: 14px;"></i> Apply Filter
        </button>
        ${state.action || state.entityType ? `
          <button class="btn btn-secondary btn-sm" id="btn-clear-filters">Clear</button>
        ` : ''}
      </div>

      <div class="card" style="padding: 0; overflow: hidden;">
        <div class="table-responsive">
          <table class="data-table" style="margin: 0;">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Admin User</th>
                <th>Action</th>
                <th>Entity Target</th>
                <th>IP Address</th>
                <th>Metadata</th>
              </tr>
            </thead>
            <tbody id="audit-table-body">
              <tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">Loading audit logs...</td></tr>
            </tbody>
          </table>
        </div>

        <div style="padding: 14px 20px; border-top: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; background: rgba(0,0,0,0.15);">
          <span style="font-size: 0.85rem; color: var(--text-muted);" id="audit-count-label">Showing 0 logs</span>
          <div style="display: flex; gap: 8px;" id="audit-pagination-buttons"></div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  await fetchLogs(container);

  container.querySelector('#btn-apply-filters')?.addEventListener('click', () => {
    state.action = container.querySelector('#filter-action')?.value.trim() || '';
    state.entityType = container.querySelector('#filter-entity')?.value.trim() || '';
    state.page = 1;
    renderAuditLogs(container);
  });
  container.querySelector('#btn-clear-filters')?.addEventListener('click', () => {
    state.action = '';
    state.entityType = '';
    state.page = 1;
    renderAuditLogs(container);
  });
}

async function fetchLogs(container) {
  const tbody = container.querySelector('#audit-table-body');
  if (!tbody) return;

  try {
    const params = { page: state.page, limit: state.limit };
    if (state.action) params.action = state.action;
    if (state.entityType) params.entityType = state.entityType;

    const res = await api.getAuditLogs(params);
    const items = Array.isArray(res.data) ? res.data : (res.data?.items || []);
    state.total = res.pagination?.total ?? (res.data?.total ?? items.length);

    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 48px; color: var(--text-muted);">No audit logs found matching current query.</td></tr>`;
      container.querySelector('#audit-count-label').textContent = 'Showing 0 logs';
      container.querySelector('#audit-pagination-buttons').innerHTML = '';
      return;
    }

    const getActionBadge = (act = '') => {
      const upper = act.toUpperCase();
      if (upper.includes('DELETE') || upper.includes('REMOVE')) {
        return `<span class="badge" style="background: rgba(244, 63, 94, 0.2); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.4);">${act}</span>`;
      }
      if (upper.includes('CREATE') || upper.includes('REGISTER')) {
        return `<span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4);">${act}</span>`;
      }
      if (upper.includes('UPDATE') || upper.includes('EDIT') || upper.includes('PATCH')) {
        return `<span class="badge" style="background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.4);">${act}</span>`;
      }
      return `<span class="badge badge-purple" style="font-size: 0.75rem;">${act}</span>`;
    };

    const escapeHtml = (str) => {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    tbody.innerHTML = items
      .map((log) => {
        const hasMetadata = log.metadata && (typeof log.metadata === 'object' ? Object.keys(log.metadata).length > 0 : true);
        const jsonFormatted = hasMetadata ? JSON.stringify(log.metadata, null, 2) : '';
        const jsonOneLine = hasMetadata ? JSON.stringify(log.metadata) : '';

        return `
          <tr>
            <td style="color: var(--text-muted); font-size: 0.8rem; white-space: nowrap;">
              ${new Date(log.createdAt).toLocaleString()}
            </td>
            <td>
              <div style="font-weight: 600; color: #f1f5f9; font-size: 0.88rem;">${log.admin ? log.admin.name : 'System'}</div>
              <div style="font-size: 0.74rem; color: var(--text-muted);">${log.admin ? log.admin.email : ''}</div>
            </td>
            <td>
              ${getActionBadge(log.action)}
            </td>
            <td>
              <span style="font-weight: 600; color: #e2e8f0;">${log.entityType}</span>
              ${log.entityId ? `<span style="font-size: 0.74rem; color: var(--text-muted); margin-left: 4px;">(${log.entityId.slice(0, 8)}...)</span>` : ''}
            </td>
            <td>
              <span style="font-family: monospace; font-size: 0.8rem; color: var(--text-muted);">${log.ipAddress || '—'}</span>
            </td>
            <td class="${hasMetadata ? 'metadata-hover-cell' : ''}">
              ${hasMetadata ? `
                <div class="metadata-snippet-badge" data-json="${escapeHtml(jsonFormatted)}" title="Hover to view full popup • Click to copy">
                  <i data-lucide="braces" style="width: 13px; height: 13px; color: #818cf8; flex-shrink: 0;"></i>
                  <span class="metadata-snippet-text">${escapeHtml(jsonOneLine)}</span>
                </div>
                <div class="metadata-popover">
                  <div class="popover-header">
                    <span class="popover-title">
                      <i data-lucide="file-code-2" style="width: 13px; height: 13px;"></i> Metadata Payload
                    </span>
                    <button type="button" class="popover-copy-btn copy-metadata-btn" data-json="${escapeHtml(jsonFormatted)}">
                      <i data-lucide="copy" style="width: 12px; height: 12px;"></i> Copy
                    </button>
                  </div>
                  <pre class="popover-json-body"><code>${escapeHtml(jsonFormatted)}</code></pre>
                </div>
              ` : `
                <span style="color: var(--text-muted); font-size: 0.8rem; font-style: italic;">—</span>
              `}
            </td>
          </tr>
        `;
      })
      .join('');

    if (window.lucide) window.lucide.createIcons();

    // Bind copy buttons and badge clicks
    tbody.querySelectorAll('.metadata-snippet-badge, .copy-metadata-btn').forEach((el) => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const jsonText = el.getAttribute('data-json');
        if (jsonText) {
          navigator.clipboard.writeText(jsonText).then(() => {
            toast.success('Metadata copied to clipboard');
          }).catch(() => {
            toast.info('JSON: ' + jsonText.slice(0, 50) + '...');
          });
        }
      });
    });

    container.querySelector('#audit-count-label').textContent = `Showing ${(state.page - 1) * state.limit + 1} - ${Math.min(state.page * state.limit, state.total)} of ${state.total} logs`;
    renderPagination(container);
  } catch (err) {
    toast.error('Failed to load audit logs');
  }
}

function renderPagination(container) {
  const paginationDiv = container.querySelector('#audit-pagination-buttons');
  if (!paginationDiv) return;

  const totalPages = Math.ceil(state.total / state.limit) || 1;
  if (totalPages <= 1) {
    paginationDiv.innerHTML = '';
    return;
  }

  paginationDiv.innerHTML = `
    <button class="btn btn-secondary btn-sm" id="prev-audit-btn" ${state.page <= 1 ? 'disabled' : ''}>Previous</button>
    <span style="font-size: 0.82rem; align-self: center; color: var(--text-muted); padding: 0 6px;">Page ${state.page} of ${totalPages}</span>
    <button class="btn btn-secondary btn-sm" id="next-audit-btn" ${state.page >= totalPages ? 'disabled' : ''}>Next</button>
  `;

  paginationDiv.querySelector('#prev-audit-btn')?.addEventListener('click', () => {
    if (state.page > 1) {
      state.page -= 1;
      fetchLogs(container);
    }
  });

  paginationDiv.querySelector('#next-audit-btn')?.addEventListener('click', () => {
    if (state.page < totalPages) {
      state.page += 1;
      fetchLogs(container);
    }
  });
}
