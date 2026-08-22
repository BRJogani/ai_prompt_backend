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
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 class="view-title">Admin Audit Trail</h1>
          <p class="view-subtitle">Security and operational change logs tracking all administrative actions</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" id="btn-refresh-logs">
            <i data-lucide="refresh-cw" style="width: 15px; height: 15px;"></i> Refresh Logs
          </button>
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

  container.querySelector('#btn-refresh-logs')?.addEventListener('click', () => fetchLogs(container));
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
    const data = res.data || {};
    const items = data.items || [];
    state.total = data.total || items.length;

    if (!items.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 48px; color: var(--text-muted);">No audit logs found matching current query.</td></tr>`;
      container.querySelector('#audit-count-label').textContent = 'Showing 0 logs';
      container.querySelector('#audit-pagination-buttons').innerHTML = '';
      return;
    }

    tbody.innerHTML = items
      .map((log) => `
        <tr>
          <td style="color: var(--text-muted); font-size: 0.8rem; white-space: nowrap;">
            ${new Date(log.createdAt).toLocaleString()}
          </td>
          <td>
            <div style="font-weight: 600; color: var(--text-main); font-size: 0.88rem;">${log.admin ? log.admin.name : 'System'}</div>
            <div style="font-size: 0.74rem; color: var(--text-muted);">${log.admin ? log.admin.email : ''}</div>
          </td>
          <td>
            <span class="badge badge-purple" style="font-size: 0.75rem;">${log.action}</span>
          </td>
          <td>
            <span style="font-weight: 600; color: var(--text-main);">${log.entityType}</span>
            ${log.entityId ? `<span style="font-size: 0.74rem; color: var(--text-muted); margin-left: 4px;">(${log.entityId.slice(0, 8)}...)</span>` : ''}
          </td>
          <td>
            <span style="font-family: monospace; font-size: 0.8rem; color: var(--text-muted);">${log.ipAddress || '—'}</span>
          </td>
          <td>
            <span style="font-family: monospace; font-size: 0.75rem; color: var(--text-muted); max-width: 220px; overflow: hidden; text-overflow: ellipsis; display: block;" title='${log.metadata ? JSON.stringify(log.metadata) : ""}'>
              ${log.metadata ? JSON.stringify(log.metadata) : '—'}
            </span>
          </td>
        </tr>
      `)
      .join('');

    if (window.lucide) window.lucide.createIcons();

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
