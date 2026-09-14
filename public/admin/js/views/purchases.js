import { api } from '../api.js';
import { toast } from '../toast.js';
import { modal } from '../modal.js';

let currentSearch = '';
let currentPlatform = '';
let currentStatus = '';
let currentPage = 1;
const limit = 15;

export async function renderPurchases(container, _app) {
  container.innerHTML = `
    <div class="view-header" style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px;">
      <div>
        <h1 class="view-title" style="font-size: 1.6rem; font-weight: 800; color: #fff; margin-bottom: 4px; display: flex; align-items: center; gap: 10px;">
          <span style="display: inline-flex; padding: 6px; border-radius: 10px; background: rgba(245, 158, 11, 0.15); color: #f59e0b;">
            <i data-lucide="crown" style="width: 24px; height: 24px;"></i>
          </span>
          In-App Purchases & Premium Users
        </h1>
        <p class="view-subtitle" style="color: var(--text-secondary); font-size: 0.88rem;">
          Track live premium customer purchases, lifetime unlocks (SKU: <code>ai_prompt</code>), and store receipts
        </p>
      </div>
      <div style="display: flex; gap: 10px;">
        <button id="refresh-purchases-btn" class="btn btn-secondary btn-sm" title="Refresh data">
          <i data-lucide="refresh-cw" style="width: 15px; height: 15px;"></i> Refresh
        </button>
      </div>
    </div>

    <!-- Metric Cards Overview -->
    <div id="purchase-metrics-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 16px; margin-bottom: 24px;">
      <div class="card" style="padding: 18px; border-left: 4px solid #f59e0b; background: rgba(245, 158, 11, 0.04);">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Estimated Revenue</div>
        <div id="stat-revenue" style="font-size: 1.85rem; font-weight: 800; color: #fff; margin: 4px 0;">$...</div>
        <div style="font-size: 0.75rem; color: #f59e0b;">Lifetime In-App Sales</div>
      </div>
      <div class="card" style="padding: 18px; border-left: 4px solid #10b981; background: rgba(16, 185, 129, 0.04);">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Total Purchases</div>
        <div id="stat-total-purchases" style="font-size: 1.85rem; font-weight: 800; color: #fff; margin: 4px 0;">0</div>
        <div style="font-size: 0.75rem; color: #10b981;">Completed / Restored orders</div>
      </div>
      <div class="card" style="padding: 18px; border-left: 4px solid #6366f1; background: rgba(99, 102, 241, 0.04);">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Active Pro Devices</div>
        <div id="stat-pro-users" style="font-size: 1.85rem; font-weight: 800; color: #fff; margin: 4px 0;">0</div>
        <div style="font-size: 0.75rem; color: #a5b4fc;">Ad-free & unlocked devices</div>
      </div>
      <div class="card" style="padding: 18px; border-left: 4px solid #38bdf8; background: rgba(56, 189, 248, 0.04);">
        <div style="font-size: 0.8rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Platform Breakdown</div>
        <div id="stat-platforms" style="font-size: 1.35rem; font-weight: 700; color: #fff; margin: 8px 0;">
          <span style="color: #34d399;">0 Android</span> &bull; <span style="color: #60a5fa;">0 iOS</span>
        </div>
        <div style="font-size: 0.75rem; color: var(--text-muted);">Store distribution</div>
      </div>
    </div>

    <!-- Filters & Search Toolbar -->
    <div class="card" style="padding: 16px; margin-bottom: 20px;">
      <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
        <div style="flex: 1; min-width: 240px; position: relative;">
          <i data-lucide="search" style="position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 16px; height: 16px; color: var(--text-muted);"></i>
          <input
            type="text"
            id="purchase-search-input"
            class="input"
            style="padding-left: 36px; width: 100%;"
            placeholder="Search by Device UUID, Order ID, or SKU..."
            value="${escapeHtml(currentSearch)}"
          />
        </div>
        <div style="min-width: 140px;">
          <select id="purchase-platform-filter" class="input">
            <option value="" ${currentPlatform === '' ? 'selected' : ''}>All Platforms</option>
            <option value="ANDROID" ${currentPlatform === 'ANDROID' ? 'selected' : ''}>Android</option>
            <option value="IOS" ${currentPlatform === 'IOS' ? 'selected' : ''}>iOS</option>
            <option value="OTHER" ${currentPlatform === 'OTHER' ? 'selected' : ''}>Other</option>
          </select>
        </div>
        <div style="min-width: 140px;">
          <select id="purchase-status-filter" class="input">
            <option value="" ${currentStatus === '' ? 'selected' : ''}>All Statuses</option>
            <option value="COMPLETED" ${currentStatus === 'COMPLETED' ? 'selected' : ''}>Completed</option>
            <option value="RESTORED" ${currentStatus === 'RESTORED' ? 'selected' : ''}>Restored</option>
            <option value="PENDING" ${currentStatus === 'PENDING' ? 'selected' : ''}>Pending</option>
            <option value="FAILED" ${currentStatus === 'FAILED' ? 'selected' : ''}>Failed</option>
            <option value="REFUNDED" ${currentStatus === 'REFUNDED' ? 'selected' : ''}>Refunded</option>
          </select>
        </div>
        <button id="reset-filters-btn" class="btn btn-secondary btn-sm" style="height: 38px;">
          Reset
        </button>
      </div>
    </div>

    <!-- Purchases Table Card -->
    <div class="card" style="padding: 0; overflow: hidden;">
      <div id="purchases-table-container" style="min-height: 280px; position: relative;">
        <div style="text-align: center; padding: 50px 20px; color: var(--text-muted);">
          <i data-lucide="loader-2" class="spin" style="width: 28px; height: 28px; margin-bottom: 10px;"></i>
          <p>Loading purchase records...</p>
        </div>
      </div>
      <div id="purchases-pagination" style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-top: 1px solid var(--border-color); background: rgba(15, 23, 42, 0.4);">
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Bind Event Listeners
  const refreshBtn = container.querySelector('#refresh-purchases-btn');
  refreshBtn?.addEventListener('click', () => {
    loadPurchasesData(container);
    loadPurchasesStats(container);
  });

  const searchInput = container.querySelector('#purchase-search-input');
  let searchTimeout;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      currentSearch = e.target.value.trim();
      currentPage = 1;
      loadPurchasesData(container);
    }, 350);
  });

  const platformFilter = container.querySelector('#purchase-platform-filter');
  platformFilter?.addEventListener('change', (e) => {
    currentPlatform = e.target.value;
    currentPage = 1;
    loadPurchasesData(container);
  });

  const statusFilter = container.querySelector('#purchase-status-filter');
  statusFilter?.addEventListener('change', (e) => {
    currentStatus = e.target.value;
    currentPage = 1;
    loadPurchasesData(container);
  });

  const resetBtn = container.querySelector('#reset-filters-btn');
  resetBtn?.addEventListener('click', () => {
    currentSearch = '';
    currentPlatform = '';
    currentStatus = '';
    currentPage = 1;
    if (searchInput) searchInput.value = '';
    if (platformFilter) platformFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    loadPurchasesData(container);
  });

  // Initial Data Fetch
  loadPurchasesStats(container);
  loadPurchasesData(container);
}

async function loadPurchasesStats(container) {
  try {
    const res = await api.getPurchaseStats();
    if (!res || !res.data) return;
    const stats = res.data;

    const revEl = container.querySelector('#stat-revenue');
    const totalEl = container.querySelector('#stat-total-purchases');
    const proEl = container.querySelector('#stat-pro-users');
    const platEl = container.querySelector('#stat-platforms');

    if (revEl) revEl.textContent = `$${(stats.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (totalEl) totalEl.textContent = (stats.totalPurchases || 0).toLocaleString();
    if (proEl) proEl.textContent = (stats.activePremiumUsers || 0).toLocaleString();
    if (platEl) {
      platEl.innerHTML = `
        <span style="color: #34d399;">${stats.androidCount || 0} Android</span> &bull; <span style="color: #60a5fa;">${stats.iosCount || 0} iOS</span>
      `;
    }
  } catch (err) {
    console.error('Failed to load purchase metrics:', err);
  }
}

async function loadPurchasesData(container) {
  const tableContainer = container.querySelector('#purchases-table-container');
  const paginationContainer = container.querySelector('#purchases-pagination');
  if (!tableContainer) return;

  try {
    const params = {
      page: currentPage,
      limit,
    };
    if (currentSearch) params.search = currentSearch;
    if (currentPlatform) params.platform = currentPlatform;
    if (currentStatus) params.status = currentStatus;

    const res = await api.getPurchases(params);
    const purchases = Array.isArray(res.data) ? res.data : (res.data?.items || []);
    const total = res.pagination?.total ?? (res.data?.total ?? purchases.length);
    const totalPages = Math.ceil(total / limit) || 1;

    if (purchases.length === 0) {
      tableContainer.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
          <div style="width: 54px; height: 54px; border-radius: 50%; background: rgba(245, 158, 11, 0.12); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 14px; color: #f59e0b;">
            <i data-lucide="receipt" style="width: 28px; height: 28px;"></i>
          </div>
          <h3 style="font-size: 1.15rem; color: #fff; font-weight: 700; margin-bottom: 6px;">No Purchases Found</h3>
          <p style="font-size: 0.88rem; max-width: 420px; margin: 0 auto; line-height: 1.5;">
            ${currentSearch || currentPlatform || currentStatus ? 'No purchase transactions matched your current filters.' : 'When users make in-app purchases (SKU: ai_prompt) from the mobile app, transactions will appear here.'}
          </p>
        </div>
      `;
      if (paginationContainer) paginationContainer.innerHTML = '';
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    // Build Table
    let tableHtml = `
      <div style="overflow-x: auto;">
        <table class="table" style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border-color); background: rgba(255, 255, 255, 0.02); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted);">
              <th style="padding: 14px 18px;">Device User ID</th>
              <th style="padding: 14px 16px;">Product SKU</th>
              <th style="padding: 14px 16px;">Platform</th>
              <th style="padding: 14px 16px;">Order ID / Token</th>
              <th style="padding: 14px 16px;">Price</th>
              <th style="padding: 14px 16px;">Status</th>
              <th style="padding: 14px 16px;">Purchase Date</th>
              <th style="padding: 14px 18px; text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
    `;

    purchases.forEach((p) => {
      const uniqueId = p.user?.uniqueId || 'Unknown';
      const shortUniqueId = uniqueId.length > 16 ? `${uniqueId.substring(0, 8)}...${uniqueId.substring(uniqueId.length - 6)}` : uniqueId;
      const orderId = p.orderId || '—';
      const shortOrderId = orderId.length > 20 ? `${orderId.substring(0, 16)}...` : orderId;
      const dateStr = p.purchaseDate || p.createdAt;
      const formattedDate = dateStr ? new Date(dateStr).toLocaleString() : '—';
      const priceStr = p.price !== null && p.price !== undefined ? `$${Number(p.price).toFixed(2)} ${p.currency || 'USD'}` : '—';

      const platformBadge = getPlatformBadge(p.platform || p.user?.platform);
      const statusBadge = getStatusBadge(p.status);

      tableHtml += `
        <tr style="border-bottom: 1px solid rgba(255, 255, 255, 0.05); transition: background 0.15s;" onmouseover="this.style.background='rgba(255,255,255,0.02)'" onmouseout="this.style.background='transparent'">
          <td style="padding: 14px 18px;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span style="font-family: monospace; font-size: 0.82rem; color: #cbd5e1;" title="${escapeHtml(uniqueId)}">${escapeHtml(shortUniqueId)}</span>
              <button class="btn-icon copy-uid-btn" data-uid="${escapeHtml(uniqueId)}" title="Copy Device UUID" style="padding: 3px; background: transparent; border: none; cursor: pointer; color: var(--text-muted);">
                <i data-lucide="copy" style="width: 13px; height: 13px;"></i>
              </button>
            </div>
            ${p.user?.deviceModel ? `<div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">${escapeHtml(p.user.deviceModel)}</div>` : ''}
          </td>
          <td style="padding: 14px 16px;">
            <span class="badge" style="background: rgba(245, 158, 11, 0.16); color: #f59e0b; font-weight: 700; border: 1px solid rgba(245, 158, 11, 0.3);">
              <i data-lucide="sparkles" style="width: 12px; height: 12px; margin-right: 4px;"></i>
              ${escapeHtml(p.productId)}
            </span>
          </td>
          <td style="padding: 14px 16px;">${platformBadge}</td>
          <td style="padding: 14px 16px;">
            <span style="font-family: monospace; font-size: 0.8rem; color: #94a3b8;" title="${escapeHtml(orderId)}">${escapeHtml(shortOrderId)}</span>
          </td>
          <td style="padding: 14px 16px; font-weight: 700; color: #34d399; font-size: 0.9rem;">
            ${priceStr}
          </td>
          <td style="padding: 14px 16px;">${statusBadge}</td>
          <td style="padding: 14px 16px; font-size: 0.82rem; color: var(--text-secondary); white-space: nowrap;">
            ${formattedDate}
          </td>
          <td style="padding: 14px 18px; text-align: right;">
            <button class="btn btn-secondary btn-sm view-purchase-btn" data-id="${p.id}" title="View Receipt Details">
              <i data-lucide="file-text" style="width: 14px; height: 14px;"></i> Details
            </button>
          </td>
        </tr>
      `;
    });

    tableHtml += `
          </tbody>
        </table>
      </div>
    `;

    tableContainer.innerHTML = tableHtml;

    // Build Pagination Footer
    if (paginationContainer) {
      paginationContainer.innerHTML = `
        <div style="font-size: 0.82rem; color: var(--text-muted);">
          Showing <strong>${(currentPage - 1) * limit + 1}</strong> to <strong>${Math.min(currentPage * limit, total)}</strong> of <strong>${total}</strong> purchases
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-secondary btn-sm" id="prev-page-btn" ${currentPage <= 1 ? 'disabled' : ''}>
            <i data-lucide="chevron-left" style="width: 14px; height: 14px;"></i> Previous
          </button>
          <span style="display: flex; align-items: center; padding: 0 10px; font-size: 0.82rem; color: var(--text-secondary);">
            Page ${currentPage} of ${totalPages}
          </span>
          <button class="btn btn-secondary btn-sm" id="next-page-btn" ${currentPage >= totalPages ? 'disabled' : ''}>
            Next <i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      `;

      paginationContainer.querySelector('#prev-page-btn')?.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          loadPurchasesData(container);
        }
      });

      paginationContainer.querySelector('#next-page-btn')?.addEventListener('click', () => {
        if (currentPage < totalPages) {
          currentPage++;
          loadPurchasesData(container);
        }
      });
    }

    // Attach copy button events
    container.querySelectorAll('.copy-uid-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const uid = btn.getAttribute('data-uid');
        if (uid) {
          navigator.clipboard.writeText(uid);
          toast.success('Device UUID copied to clipboard');
        }
      });
    });

    // Attach view details events
    container.querySelectorAll('.view-purchase-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const purchase = purchases.find((p) => p.id === id);
        if (purchase) {
          showPurchaseDetailsModal(purchase);
        }
      });
    });

    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    console.error('Failed to load purchases data:', err);
    tableContainer.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: #ef4444;">
        <i data-lucide="alert-circle" style="width: 32px; height: 32px; margin-bottom: 8px;"></i>
        <p style="font-weight: 600;">Failed to load purchase records</p>
        <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 4px;">${escapeHtml(err.message || 'Unknown network error')}</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }
}

function showPurchaseDetailsModal(p) {
  let receiptFormatted = 'No raw receipt attached';
  if (p.rawReceipt) {
    try {
      const parsed = JSON.parse(p.rawReceipt);
      receiptFormatted = JSON.stringify(parsed, null, 2);
    } catch {
      receiptFormatted = p.rawReceipt;
    }
  }

  const dateFormatted = (p.purchaseDate || p.createdAt) ? new Date(p.purchaseDate || p.createdAt).toUTCString() : '—';

  const bodyHtml = `
    <div style="display: flex; flex-direction: column; gap: 18px;">
      <!-- Highlights Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; background: rgba(255, 255, 255, 0.03); padding: 14px; border-radius: 12px; border: 1px solid rgba(255, 255, 255, 0.06);">
        <div>
          <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Product SKU</span>
          <div style="font-size: 0.95rem; font-weight: 700; color: #f59e0b; margin-top: 2px;">${escapeHtml(p.productId)}</div>
        </div>
        <div>
          <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Status</span>
          <div style="margin-top: 2px;">${getStatusBadge(p.status)}</div>
        </div>
        <div>
          <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Price & Currency</span>
          <div style="font-size: 0.95rem; font-weight: 700; color: #34d399; margin-top: 2px;">$${Number(p.price || 4.99).toFixed(2)} ${escapeHtml(p.currency || 'USD')}</div>
        </div>
        <div>
          <span style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase;">Platform</span>
          <div style="margin-top: 2px;">${getPlatformBadge(p.platform)}</div>
        </div>
      </div>

      <!-- Transaction Keys -->
      <div style="display: flex; flex-direction: column; gap: 10px; font-size: 0.85rem;">
        <div>
          <span style="color: var(--text-muted); font-size: 0.75rem;">Order / Transaction ID:</span>
          <div style="font-family: monospace; color: #e2e8f0; background: rgba(0,0,0,0.25); padding: 6px 10px; border-radius: 6px; word-break: break-all; margin-top: 2px;">
            ${escapeHtml(p.orderId || 'None')}
          </div>
        </div>
        <div>
          <span style="color: var(--text-muted); font-size: 0.75rem;">Device Anonymous UUID:</span>
          <div style="font-family: monospace; color: #e2e8f0; background: rgba(0,0,0,0.25); padding: 6px 10px; border-radius: 6px; word-break: break-all; margin-top: 2px;">
            ${escapeHtml(p.user?.uniqueId || 'Unknown')}
          </div>
        </div>
        ${p.purchaseToken ? `
          <div>
            <span style="color: var(--text-muted); font-size: 0.75rem;">Store Purchase Token:</span>
            <div style="font-family: monospace; color: #e2e8f0; background: rgba(0,0,0,0.25); padding: 6px 10px; border-radius: 6px; word-break: break-all; font-size: 0.75rem; margin-top: 2px; max-height: 80px; overflow-y: auto;">
              ${escapeHtml(p.purchaseToken)}
            </div>
          </div>
        ` : ''}
        <div>
          <span style="color: var(--text-muted); font-size: 0.75rem;">Purchase Timestamp:</span>
          <div style="color: #cbd5e1; margin-top: 2px;">${escapeHtml(dateFormatted)}</div>
        </div>
      </div>

      <!-- Raw Verification / Receipt Payload -->
      <div>
        <span style="color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; font-weight: 600;">Store Verification Receipt:</span>
        <pre style="background: #090d16; border: 1px solid rgba(255, 255, 255, 0.08); padding: 12px; border-radius: 8px; font-family: monospace; font-size: 0.75rem; color: #93c5fd; max-height: 180px; overflow-y: auto; margin-top: 4px; white-space: pre-wrap; word-break: break-all;">${escapeHtml(receiptFormatted)}</pre>
      </div>
    </div>
  `;

  modal.dialog({
    title: 'Purchase & Receipt Audit',
    bodyHtml,
    confirmText: 'Done',
    cancelText: 'Close',
    maxWidth: '620px',
  });
}

function getPlatformBadge(platform) {
  const p = (platform || '').toUpperCase();
  if (p === 'ANDROID') {
    return `<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399;"><i data-lucide="play" style="width: 11px; height: 11px; margin-right: 3px;"></i> Android</span>`;
  }
  if (p === 'IOS') {
    return `<span class="badge" style="background: rgba(96, 165, 250, 0.15); color: #60a5fa;"><i data-lucide="apple" style="width: 11px; height: 11px; margin-right: 3px;"></i> iOS</span>`;
  }
  return `<span class="badge badge-neutral">${escapeHtml(platform || 'Other')}</span>`;
}

function getStatusBadge(status) {
  const s = (status || '').toUpperCase();
  switch (s) {
    case 'COMPLETED':
      return `<span class="badge badge-success"><i data-lucide="check-circle-2" style="width: 12px; height: 12px; margin-right: 3px;"></i> COMPLETED</span>`;
    case 'RESTORED':
      return `<span class="badge" style="background: rgba(56, 189, 248, 0.15); color: #38bdf8;"><i data-lucide="rotate-ccw" style="width: 12px; height: 12px; margin-right: 3px;"></i> RESTORED</span>`;
    case 'PENDING':
      return `<span class="badge badge-warning"><i data-lucide="clock" style="width: 12px; height: 12px; margin-right: 3px;"></i> PENDING</span>`;
    case 'FAILED':
      return `<span class="badge badge-danger"><i data-lucide="alert-triangle" style="width: 12px; height: 12px; margin-right: 3px;"></i> FAILED</span>`;
    case 'REFUNDED':
      return `<span class="badge badge-neutral"><i data-lucide="corner-up-left" style="width: 12px; height: 12px; margin-right: 3px;"></i> REFUNDED</span>`;
    default:
      return `<span class="badge badge-neutral">${escapeHtml(status || '—')}</span>`;
  }
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
