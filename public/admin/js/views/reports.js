import { api } from '../api.js';
import { toast } from '../toast.js';

let currentStatusFilter = '';
let currentPage = 1;
const limit = 15;

export async function renderReports(container, app) {
  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">User Reports & Moderation</h1>
        <p class="view-subtitle">Review flagged prompts, handle user complaints, and manage report resolutions</p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="btn btn-secondary" id="refresh-reports-btn">
          <i data-lucide="refresh-cw" style="width: 15px; height: 15px;"></i> Refresh
        </button>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; flex-wrap: wrap;">
      <button class="btn btn-sm ${currentStatusFilter === '' ? 'btn-primary' : 'btn-secondary'} filter-tab" data-status="">
        All Reports
      </button>
      <button class="btn btn-sm ${currentStatusFilter === 'PENDING' ? 'btn-primary' : 'btn-secondary'} filter-tab" data-status="PENDING">
        <span class="badge badge-warning" style="margin-right: 4px;">Pending</span> Needs Review
      </button>
      <button class="btn btn-sm ${currentStatusFilter === 'REVIEWED' ? 'btn-primary' : 'btn-secondary'} filter-tab" data-status="REVIEWED">
        <span class="badge badge-info" style="margin-right: 4px;">In Review</span> Reviewed
      </button>
      <button class="btn btn-sm ${currentStatusFilter === 'RESOLVED' ? 'btn-primary' : 'btn-secondary'} filter-tab" data-status="RESOLVED">
        <span class="badge badge-success" style="margin-right: 4px;">Resolved</span> Action Taken
      </button>
      <button class="btn btn-sm ${currentStatusFilter === 'DISMISSED' ? 'btn-primary' : 'btn-secondary'} filter-tab" data-status="DISMISSED">
        <span class="badge badge-neutral" style="margin-right: 4px;">Dismissed</span> Ignored
      </button>
    </div>

    <!-- Reports Table Card -->
    <div class="card" style="padding: 0; overflow: hidden;">
      <div id="reports-table-container" style="min-height: 250px; position: relative;">
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          <i data-lucide="loader-2" class="spin" style="width: 28px; height: 28px; margin-bottom: 10px;"></i>
          <p>Loading reports...</p>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Bind filter tabs
  container.querySelectorAll('.filter-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      currentStatusFilter = tab.getAttribute('data-status') || '';
      currentPage = 1;
      renderReports(container, app);
    });
  });

  // Bind refresh
  container.querySelector('#refresh-reports-btn')?.addEventListener('click', () => {
    loadReportsData(container, app);
  });

  await loadReportsData(container, app);
}

async function loadReportsData(container, app) {
  const tableContainer = container.querySelector('#reports-table-container');
  if (!tableContainer) return;

  try {
    const params = { page: currentPage, limit };
    if (currentStatusFilter) params.status = currentStatusFilter;

    const res = await api.getReports(params);
    const reports = res.data?.items || [];
    const total = res.data?.total || 0;
    const totalPages = Math.ceil(total / limit) || 1;

    if (reports.length === 0) {
      tableContainer.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
          <i data-lucide="shield-check" style="width: 44px; height: 44px; margin-bottom: 12px; color: var(--success);"></i>
          <h3 style="font-size: 1.1rem; color: var(--text-main); font-weight: 600; margin-bottom: 4px;">No Reports Found</h3>
          <p style="font-size: 0.875rem;">${currentStatusFilter ? `No ${currentStatusFilter.toLowerCase()} reports right now.` : 'No content reports have been submitted.'}</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const getStatusBadge = (status) => {
      switch (status) {
        case 'PENDING': return '<span class="badge badge-warning"><i data-lucide="clock" style="width: 12px; height: 12px;"></i> PENDING</span>';
        case 'REVIEWED': return '<span class="badge badge-info"><i data-lucide="eye" style="width: 12px; height: 12px;"></i> REVIEWED</span>';
        case 'RESOLVED': return '<span class="badge badge-success"><i data-lucide="check-circle" style="width: 12px; height: 12px;"></i> RESOLVED</span>';
        case 'DISMISSED': return '<span class="badge badge-neutral"><i data-lucide="x-circle" style="width: 12px; height: 12px;"></i> DISMISSED</span>';
        default: return `<span class="badge badge-neutral">${status}</span>`;
      }
    };

    const getReasonLabel = (reason) => {
      switch (reason) {
        case 'INAPPROPRIATE': return '<span style="color: #ef4444; font-weight: 600;">Inappropriate Content</span>';
        case 'BROKEN_CONTENT': return '<span style="color: #f59e0b; font-weight: 600;">Broken Media/Prompt</span>';
        case 'WRONG_CATEGORY': return '<span style="color: #3b82f6; font-weight: 600;">Wrong Category</span>';
        case 'COPYRIGHT': return '<span style="color: #ec4899; font-weight: 600;">Copyright / IP</span>';
        default: return `<span style="color: #94a3b8; font-weight: 600;">${reason || 'Other'}</span>`;
      }
    };

    tableContainer.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Reason</th>
            <th>Description & Context</th>
            <th>Reported Prompt</th>
            <th>Reported At</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${reports.map((report) => `
            <tr>
              <td>${getStatusBadge(report.status)}</td>
              <td>${getReasonLabel(report.reason)}</td>
              <td style="max-width: 280px;">
                <div style="font-size: 0.875rem; color: var(--text-main); font-weight: 500; margin-bottom: 2px;">
                  ${report.description ? report.description : '<span style="color: var(--text-muted); font-style: italic;">No extra details provided</span>'}
                </div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">
                  User ID: <code style="font-size: 0.72rem; color: #94a3b8;">${report.userId || 'Anonymous'}</code>
                </div>
              </td>
              <td>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <button class="btn btn-secondary btn-sm open-prompt-btn" data-prompt-id="${report.promptId}" title="Open Prompt in Editor">
                    <i data-lucide="external-link" style="width: 13px; height: 13px;"></i> View Prompt
                  </button>
                </div>
              </td>
              <td style="font-size: 0.8rem; color: var(--text-muted); white-space: nowrap;">
                ${new Date(report.createdAt).toLocaleString()}
              </td>
              <td style="text-align: right; white-space: nowrap;">
                <div style="display: inline-flex; gap: 6px;">
                  ${report.status === 'PENDING' ? `
                    <button class="btn btn-secondary btn-sm update-status-btn" data-id="${report.id}" data-status="REVIEWED" title="Mark as Reviewed">
                      <i data-lucide="eye" style="width: 13px; height: 13px;"></i> Review
                    </button>
                  ` : ''}
                  ${report.status !== 'RESOLVED' ? `
                    <button class="btn btn-primary btn-sm update-status-btn" data-id="${report.id}" data-status="RESOLVED" title="Mark as Resolved">
                      <i data-lucide="check" style="width: 13px; height: 13px;"></i> Resolve
                    </button>
                  ` : ''}
                  ${report.status !== 'DISMISSED' ? `
                    <button class="btn btn-secondary btn-sm update-status-btn" data-id="${report.id}" data-status="DISMISSED" title="Dismiss Report">
                      <i data-lucide="x" style="width: 13px; height: 13px;"></i> Dismiss
                    </button>
                  ` : ''}
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Pagination -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-top: 1px solid var(--border-color); background: rgba(0,0,0,0.15);">
        <div style="font-size: 0.85rem; color: var(--text-muted);">
          Showing ${(currentPage - 1) * limit + 1} - ${Math.min(currentPage * limit, total)} of ${total} reports
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-secondary btn-sm" id="prev-page-btn" ${currentPage <= 1 ? 'disabled' : ''}>
            <i data-lucide="chevron-left" style="width: 14px; height: 14px;"></i> Prev
          </button>
          <span style="display: flex; align-items: center; font-size: 0.85rem; padding: 0 8px; color: var(--text-main);">
            ${currentPage} / ${totalPages}
          </span>
          <button class="btn btn-secondary btn-sm" id="next-page-btn" ${currentPage >= totalPages ? 'disabled' : ''}>
            Next <i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Bind action buttons
    tableContainer.querySelectorAll('.open-prompt-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const promptId = btn.getAttribute('data-prompt-id');
        if (promptId && app) {
          app.navigate('prompt-editor', { promptId });
        }
      });
    });

    tableContainer.querySelectorAll('.update-status-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const reportId = btn.getAttribute('data-id');
        const newStatus = btn.getAttribute('data-status');
        btn.disabled = true;
        try {
          await api.updateReportStatus(reportId, newStatus);
          toast.success(`Report updated to ${newStatus}`);
          await loadReportsData(container, app);
        } catch (err) {
          toast.error(err.message || 'Failed to update report status');
          btn.disabled = false;
        }
      });
    });

    tableContainer.querySelector('#prev-page-btn')?.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        loadReportsData(container, app);
      }
    });

    tableContainer.querySelector('#next-page-btn')?.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        loadReportsData(container, app);
      }
    });
  } catch (err) {
    tableContainer.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #ef4444;">
        <i data-lucide="alert-triangle" style="width: 32px; height: 32px; margin-bottom: 10px;"></i>
        <p>Failed to load reports: ${err.message}</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }
}
