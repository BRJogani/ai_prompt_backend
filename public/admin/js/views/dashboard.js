import { api } from '../api.js';
import { toast } from '../toast.js';

let timeseriesChart = null;
let currentTimeseriesRange = '30d';
let currentTopPromptMetric = 'viewCount';

export async function renderDashboard(container, app) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <!-- Header Banner -->
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 class="view-title">Overview & Statistics</h1>
          <p class="view-subtitle">Real-time platform metrics, user engagement analytics, and content leaderboards</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" id="refresh-dashboard-btn">
            <i data-lucide="refresh-cw" style="width: 15px; height: 15px;"></i> Refresh
          </button>
          <button class="btn btn-primary" id="recalc-trending-btn">
            <i data-lucide="trending-up" style="width: 15px; height: 15px;"></i> Recalculate Trending
          </button>
        </div>
      </div>

      <!-- Pending Reports Alert Banner -->
      <div id="pending-reports-alert" style="display: none; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: var(--border-radius); padding: 14px 18px; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 34px; height: 34px; border-radius: 8px; background: rgba(239, 68, 68, 0.2); display: flex; align-items: center; justify-content: center; color: #ef4444;">
            <i data-lucide="alert-triangle" style="width: 18px; height: 18px;"></i>
          </div>
          <div>
            <div style="font-weight: 600; color: #f87171; font-size: 0.92rem;" id="pending-reports-text">Pending user reports require moderation</div>
            <div style="font-size: 0.78rem; color: #cbd5e1;">Review user flags regarding inappropriate content or broken prompts.</div>
          </div>
        </div>
        <button class="btn btn-danger btn-sm" id="view-pending-reports-btn">
          Review Reports <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i>
        </button>
      </div>

      <!-- KPI Stat Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Registered Users</span>
            <div class="stat-icon" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;"><i data-lucide="users"></i></div>
          </div>
          <div class="stat-value" id="kpi-users">--</div>
          <div class="stat-subtext" id="kpi-users-sub">Active: -- today &bull; -- 7d</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Prompt Inspirations</span>
            <div class="stat-icon" style="background: rgba(6, 182, 212, 0.15); color: #22d3ee;"><i data-lucide="file-text"></i></div>
          </div>
          <div class="stat-value" id="kpi-prompts">--</div>
          <div class="stat-subtext" id="kpi-prompts-sub">-- Images &bull; -- Videos</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Prompts Copied</span>
            <div class="stat-icon" style="background: rgba(168, 85, 247, 0.15); color: #c084fc;"><i data-lucide="copy"></i></div>
          </div>
          <div class="stat-value" id="kpi-copies">--</div>
          <div class="stat-subtext" id="kpi-copies-sub">Prompt generation runs</div>
        </div>

        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Total Views & Saves</span>
            <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: #34d399;"><i data-lucide="heart"></i></div>
          </div>
          <div class="stat-value" id="kpi-views">--</div>
          <div class="stat-subtext" id="kpi-engagement-sub">-- Views &bull; -- Favorites</div>
        </div>
      </div>

      <!-- Timeseries Activity Chart -->
      <div class="card" style="padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
          <div>
            <h3 style="font-size: 1.05rem; font-weight: 600; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
              <i data-lucide="line-chart" style="color: #818cf8; width: 18px; height: 18px;"></i> Daily Platform Events & Activity
            </h3>
            <span style="font-size: 0.8rem; color: var(--text-muted);">Aggregate telemetry events across mobile clients</span>
          </div>
          <div style="display: flex; gap: 6px;">
            <button class="btn btn-sm ${currentTimeseriesRange === 'today' ? 'btn-primary' : 'btn-secondary'} ts-range-btn" data-range="today">Today</button>
            <button class="btn btn-sm ${currentTimeseriesRange === '7d' ? 'btn-primary' : 'btn-secondary'} ts-range-btn" data-range="7d">7 Days</button>
            <button class="btn btn-sm ${currentTimeseriesRange === '30d' ? 'btn-primary' : 'btn-secondary'} ts-range-btn" data-range="30d">30 Days</button>
          </div>
        </div>
        <div style="height: 280px; position: relative;">
          <canvas id="timeseries-chart"></canvas>
        </div>
      </div>

      <!-- Leaderboards Grid -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;" class="dashboard-grid">
        <!-- Top Prompts Leaderboard -->
        <div class="card" style="padding: 0; overflow: hidden;">
          <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <i data-lucide="award" style="color: #f59e0b; width: 18px; height: 18px;"></i>
              <span style="font-weight: 600; font-size: 0.95rem; color: var(--text-main);">Top Performing Prompts</span>
            </div>
            <select class="form-control" id="top-prompts-metric-select" style="width: auto; padding: 4px 10px; font-size: 0.8rem;">
              <option value="viewCount">Most Viewed</option>
              <option value="copyCount">Most Copied</option>
              <option value="favoriteCount">Most Favorited</option>
            </select>
          </div>
          <div id="top-prompts-container" style="min-height: 200px;">
            <div style="padding: 30px; text-align: center; color: var(--text-muted);">Loading leaderboard...</div>
          </div>
        </div>

        <!-- Top Categories Leaderboard -->
        <div class="card" style="padding: 0; overflow: hidden;">
          <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <div style="display: flex; align-items: center; gap: 8px;">
              <i data-lucide="layers" style="color: #06b6d4; width: 18px; height: 18px;"></i>
              <span style="font-weight: 600; font-size: 0.95rem; color: var(--text-main);">Top Categories by Popularity</span>
            </div>
            <span style="font-size: 0.78rem; color: var(--text-muted);">Total Prompts & Views</span>
          </div>
          <div id="top-categories-container" style="min-height: 200px;">
            <div style="padding: 30px; text-align: center; color: var(--text-muted);">Loading categories...</div>
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Bind Events
  container.querySelector('#refresh-dashboard-btn')?.addEventListener('click', () => loadAllDashboardData(container, app));

  container.querySelector('#recalc-trending-btn')?.addEventListener('click', async () => {
    const btn = container.querySelector('#recalc-trending-btn');
    btn.disabled = true;
    try {
      await api.recalculateTrending();
      toast.success('Trending scores calculated successfully');
      await loadAllDashboardData(container, app);
    } catch (err) {
      toast.error(err.message || 'Failed to recalculate trending');
    } finally {
      btn.disabled = false;
    }
  });

  container.querySelector('#view-pending-reports-btn')?.addEventListener('click', () => {
    if (app) app.navigate('reports');
  });

  container.querySelectorAll('.ts-range-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentTimeseriesRange = btn.getAttribute('data-range') || '30d';
      container.querySelectorAll('.ts-range-btn').forEach((b) => b.className = 'btn btn-sm btn-secondary ts-range-btn');
      btn.className = 'btn btn-sm btn-primary ts-range-btn';
      loadTimeseriesData(container);
    });
  });

  container.querySelector('#top-prompts-metric-select')?.addEventListener('change', (e) => {
    currentTopPromptMetric = e.target.value;
    loadTopPromptsData(container, app);
  });

  await loadAllDashboardData(container, app);
}

async function loadAllDashboardData(container, app) {
  await Promise.all([
    loadOverviewStats(container, app),
    loadTimeseriesData(container),
    loadTopPromptsData(container, app),
    loadTopCategoriesData(container),
  ]);
}

async function loadOverviewStats(container, app) {
  try {
    const res = await api.getDashboardOverview();
    const data = res.data;
    if (!data) return;

    const { users, content, engagement, pendingReports } = data;

    // Pending reports alert
    const alertEl = container.querySelector('#pending-reports-alert');
    const alertText = container.querySelector('#pending-reports-text');
    if (alertEl && alertText) {
      if (pendingReports > 0) {
        alertEl.style.display = 'flex';
        alertText.textContent = `${pendingReports} pending user report${pendingReports > 1 ? 's' : ''} awaiting moderation`;
      } else {
        alertEl.style.display = 'none';
      }
    }

    // Fill KPI numbers
    const elUsers = container.querySelector('#kpi-users');
    const elUsersSub = container.querySelector('#kpi-users-sub');
    const elPrompts = container.querySelector('#kpi-prompts');
    const elPromptsSub = container.querySelector('#kpi-prompts-sub');
    const elCopies = container.querySelector('#kpi-copies');
    const elCopiesSub = container.querySelector('#kpi-copies-sub');
    const elViews = container.querySelector('#kpi-views');
    const elEngagementSub = container.querySelector('#kpi-engagement-sub');

    if (elUsers) elUsers.textContent = (users?.total || 0).toLocaleString();
    if (elUsersSub) elUsersSub.textContent = `Active: ${users?.activeToday || 0} today • ${users?.active7d || 0} 7d`;

    if (elPrompts) elPrompts.textContent = (content?.totalPrompts || 0).toLocaleString();
    if (elPromptsSub) elPromptsSub.textContent = `${content?.totalImages || 0} Images • ${content?.totalVideos || 0} Videos`;

    if (elCopies) elCopies.textContent = (engagement?.totalCopies || 0).toLocaleString();
    if (elCopiesSub) elCopiesSub.textContent = `${engagement?.totalShares || 0} Shares across platforms`;

    if (elViews) elViews.textContent = (engagement?.totalViews || 0).toLocaleString();
    if (elEngagementSub) elEngagementSub.textContent = `${(engagement?.totalFavorites || 0).toLocaleString()} Saved Favorites`;
  } catch (err) {
    console.error('Failed to load overview data', err);
  }
}

async function loadTimeseriesData(container) {
  const canvas = container.querySelector('#timeseries-chart');
  if (!canvas || !window.Chart) return;

  try {
    const res = await api.getEventsTimeseries(currentTimeseriesRange);
    const timeseries = res.data || [];

    if (timeseriesChart) timeseriesChart.destroy();

    const labels = timeseries.map((item) => {
      const parts = item.date.split('-');
      return parts.length === 3 ? `${parts[1]}/${parts[2]}` : item.date;
    });
    const dataPoints = timeseries.map((item) => item.count);

    timeseriesChart = new window.Chart(canvas, {
      type: 'line',
      data: {
        labels: labels.length ? labels : ['No Data'],
        datasets: [
          {
            label: 'Daily Telemetry Events',
            data: dataPoints.length ? dataPoints : [0],
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            borderColor: '#6366f1',
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#818cf8',
            pointRadius: 4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            titleColor: '#f8fafc',
            bodyColor: '#cbd5e1',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 10,
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8' },
          },
          y: {
            beginAtZero: true,
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#94a3b8', stepSize: 1 },
          },
        },
      },
    });
  } catch (err) {
    console.error('Failed to render timeseries chart', err);
  }
}

async function loadTopPromptsData(container, app) {
  const topPromptsEl = container.querySelector('#top-prompts-container');
  if (!topPromptsEl) return;

  try {
    const res = await api.getTopPrompts(currentTopPromptMetric, 5);
    const prompts = res.data || [];

    if (prompts.length === 0) {
      topPromptsEl.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted);">No published prompts found</div>`;
      return;
    }

    topPromptsEl.innerHTML = `
      <table class="data-table" style="margin: 0;">
        <thead>
          <tr>
            <th>Rank</th>
            <th>Title</th>
            <th style="text-align: right;">Metric</th>
          </tr>
        </thead>
        <tbody>
          ${prompts.map((p, idx) => `
            <tr class="clickable-prompt-row" data-prompt-id="${p.id}" style="cursor: pointer;">
              <td style="width: 50px; font-weight: 700; color: ${idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : '#64748b'};">
                #${idx + 1}
              </td>
              <td>
                <div style="font-weight: 600; color: var(--text-main); font-size: 0.88rem;">${p.title}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">${p.viewCount} views &bull; ${p.copyCount} copies &bull; ${p.favoriteCount} saves</div>
              </td>
              <td style="text-align: right; font-weight: 700; color: #818cf8; font-size: 0.95rem;">
                ${p[currentTopPromptMetric].toLocaleString()}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;

    topPromptsEl.querySelectorAll('.clickable-prompt-row').forEach((row) => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-prompt-id');
        if (id && app) app.navigate('prompt-editor', { promptId: id });
      });
    });
  } catch (err) {
    topPromptsEl.innerHTML = `<div style="padding: 24px; text-align: center; color: #ef4444;">Failed to load top prompts</div>`;
  }
}

async function loadTopCategoriesData(container) {
  const topCatEl = container.querySelector('#top-categories-container');
  if (!topCatEl) return;

  try {
    const res = await api.getTopCategories(5);
    const items = res.data || [];

    if (items.length === 0) {
      topCatEl.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted);">No category data found</div>`;
      return;
    }

    topCatEl.innerHTML = `
      <table class="data-table" style="margin: 0;">
        <thead>
          <tr>
            <th>Category</th>
            <th>Prompts</th>
            <th style="text-align: right;">Total Views</th>
          </tr>
        </thead>
        <tbody>
          ${items.map((item) => `
            <tr>
              <td>
                <div style="font-weight: 600; color: var(--text-main); font-size: 0.88rem;">
                  ${item.category ? item.category.name : 'Unknown'}
                </div>
              </td>
              <td style="font-size: 0.85rem; color: var(--text-muted);">
                ${item.promptCount} prompts
              </td>
              <td style="text-align: right; font-weight: 700; color: #22d3ee; font-size: 0.95rem;">
                ${item.totalViews.toLocaleString()}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  } catch (err) {
    topCatEl.innerHTML = `<div style="padding: 24px; text-align: center; color: #ef4444;">Failed to load categories</div>`;
  }
}
