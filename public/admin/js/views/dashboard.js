import { api } from '../api.js';
import { toast } from '../toast.js';
import { modal } from '../modal.js';

let timeseriesChart = null;
let currentFilterRange = 'today'; // Default filter: today!
let customFromDate = '';
let customToDate = '';
let currentTimeseriesType = 'dau'; // 'dau' or 'events'
let currentTopPromptMetric = 'viewCount';
let cachedTopPrompts = [];
let cachedTopCategories = [];

function getFilterLabel(range, from, to) {
  switch (range) {
    case 'today': return 'Today';
    case 'yesterday': return 'Yesterday';
    case '7d': return 'Last 7 Days';
    case 'this_month': return 'This Month';
    case 'last_month': return 'Last Month';
    case 'all_time': return 'All Time';
    case 'custom': return from && to ? `${from} to ${to}` : 'Custom Date Range';
    default: return 'Today';
  }
}

export async function renderDashboard(container, app) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 20px;">
      <!-- Header Banner -->
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 class="view-title">Overview & Statistics</h1>
          <p class="view-subtitle">Real-time platform metrics, telemetry, content engagement, and category explorations</p>
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

      <!-- Time Filter Bar (Today, Yesterday, Last 7 Days, This Month, Last Month, All Time, Date Range) -->
      <div class="card" style="padding: 14px 18px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; background: rgba(30, 41, 59, 0.45); border: 1px solid var(--border-color); border-radius: var(--radius-md);">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span style="font-size: 0.8rem; font-weight: 700; color: #94a3b8; display: flex; align-items: center; gap: 6px; margin-right: 4px;">
            <i data-lucide="calendar" style="width: 15px; height: 15px; color: #818cf8;"></i>
            <span>TIME FILTER:</span>
          </span>
          <div style="display: inline-flex; gap: 6px; flex-wrap: wrap;" id="dashboard-filter-buttons">
            <button type="button" class="btn btn-sm ${currentFilterRange === 'today' ? 'btn-primary' : 'btn-secondary'} filter-range-btn" data-range="today">Today</button>
            <button type="button" class="btn btn-sm ${currentFilterRange === 'yesterday' ? 'btn-primary' : 'btn-secondary'} filter-range-btn" data-range="yesterday">Yesterday</button>
            <button type="button" class="btn btn-sm ${currentFilterRange === '7d' ? 'btn-primary' : 'btn-secondary'} filter-range-btn" data-range="7d">Last 7 Days</button>
            <button type="button" class="btn btn-sm ${currentFilterRange === 'this_month' ? 'btn-primary' : 'btn-secondary'} filter-range-btn" data-range="this_month">This Month</button>
            <button type="button" class="btn btn-sm ${currentFilterRange === 'last_month' ? 'btn-primary' : 'btn-secondary'} filter-range-btn" data-range="last_month">Last Month</button>
            <button type="button" class="btn btn-sm ${currentFilterRange === 'all_time' ? 'btn-primary' : 'btn-secondary'} filter-range-btn" data-range="all_time">All Time</button>
            <button type="button" class="btn btn-sm ${currentFilterRange === 'custom' ? 'btn-primary' : 'btn-secondary'} filter-range-btn" data-range="custom">
              <i data-lucide="calendar-range" style="width: 13px; height: 13px;"></i> Date Range
            </button>
          </div>
        </div>

        <!-- Custom Date Range Picker Container (Reveals when Date Range button is clicked) -->
        <div id="custom-date-picker-box" style="display: ${currentFilterRange === 'custom' ? 'flex' : 'none'}; align-items: center; gap: 8px; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <label style="font-size: 0.76rem; color: #94a3b8;">From:</label>
            <input type="date" id="custom-from-input" class="input-text" style="padding: 4px 8px; font-size: 0.78rem; width: auto; background: var(--bg-surface); color: #fff; border-radius: 6px; border: 1px solid var(--border-color);" value="${customFromDate}" />
          </div>
          <div style="display: flex; align-items: center; gap: 6px;">
            <label style="font-size: 0.76rem; color: #94a3b8;">To:</label>
            <input type="date" id="custom-to-input" class="input-text" style="padding: 4px 8px; font-size: 0.78rem; width: auto; background: var(--bg-surface); color: #fff; border-radius: 6px; border: 1px solid var(--border-color);" value="${customToDate}" />
          </div>
          <button type="button" class="btn btn-primary btn-sm" id="apply-custom-range-btn" style="padding: 4px 12px; font-size: 0.78rem;">
            Apply
          </button>
        </div>

        <!-- Active Filter Indicator Badge -->
        <div id="active-filter-indicator" style="font-size: 0.78rem; color: #818cf8; background: rgba(99, 102, 241, 0.12); border: 1px solid rgba(99, 102, 241, 0.3); border-radius: 20px; padding: 4px 12px; font-weight: 600; display: flex; align-items: center; gap: 6px;">
          <span class="status-dot" style="background: #818cf8; width: 6px; height: 6px;"></span>
          <span id="active-filter-text">Filter: ${getFilterLabel(currentFilterRange, customFromDate, customToDate)}</span>
        </div>
      </div>

      <!-- Pending Reports Alert Banner -->
      <div id="pending-reports-alert" style="display: none; background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.35); border-radius: var(--radius-md); padding: 14px 18px; align-items: center; justify-content: space-between;">
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
        <!-- 1. DAU / Active Users -->
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title" id="kpi-dau-title">Daily Active Users (DAU)</span>
            <div class="stat-icon" style="background: rgba(99, 102, 241, 0.15); color: #818cf8;"><i data-lucide="activity"></i></div>
          </div>
          <div style="display: flex; align-items: baseline; gap: 10px;">
            <div class="stat-value" id="kpi-dau">--</div>
            <span id="kpi-dau-trend" class="badge" style="font-size: 0.75rem; font-weight: 700;"></span>
          </div>
          <div class="stat-subtext" id="kpi-dau-sub">Yesterday: -- &bull; 7d WAU: -- &bull; 30d MAU: --</div>
        </div>

        <!-- 2. Content Inspirations -->
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Prompt Inspirations</span>
            <div class="stat-icon" style="background: rgba(6, 182, 212, 0.15); color: #22d3ee;"><i data-lucide="file-text"></i></div>
          </div>
          <div class="stat-value" id="kpi-prompts">--</div>
          <div class="stat-subtext" id="kpi-prompts-sub">-- Published &bull; -- Categories</div>
        </div>

        <!-- 3. Prompts Copied & Conversion -->
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Prompts Copied</span>
            <div class="stat-icon" style="background: rgba(168, 85, 247, 0.15); color: #c084fc;"><i data-lucide="copy"></i></div>
          </div>
          <div class="stat-value" id="kpi-copies">--</div>
          <div class="stat-subtext" id="kpi-copies-sub">-- copy rate &bull; -- unique copiers</div>
        </div>

        <!-- 4. Views & Explorations -->
        <div class="stat-card">
          <div class="stat-header">
            <span class="stat-title">Prompt Views & Reach</span>
            <div class="stat-icon" style="background: rgba(16, 185, 129, 0.15); color: #34d399;"><i data-lucide="eye"></i></div>
          </div>
          <div class="stat-value" id="kpi-views">--</div>
          <div class="stat-subtext" id="kpi-engagement-sub">-- unique viewers &bull; -- saves</div>
        </div>
      </div>

      <!-- Timeseries Activity & DAU Chart -->
      <div class="card" style="padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 12px;">
          <div>
            <h3 style="font-size: 1.05rem; font-weight: 600; color: var(--text-main); display: flex; align-items: center; gap: 8px;">
              <i data-lucide="line-chart" style="color: #818cf8; width: 18px; height: 18px;"></i>
              <span id="chart-heading-text">Daily Active Users (DAU) Trend</span>
            </h3>
            <span style="font-size: 0.8rem; color: var(--text-muted);" id="chart-sub-text">Unique active devices connected per day</span>
          </div>
          <div style="display: flex; gap: 12px; align-items: center; flex-wrap: wrap;">
            <!-- Metric Type Toggle: DAU vs Events -->
            <div style="display: inline-flex; border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden;">
              <button type="button" class="btn btn-sm ${currentTimeseriesType === 'dau' ? 'btn-primary' : 'btn-secondary'} chart-type-btn" data-type="dau" style="border-radius: 0; padding: 4px 10px; font-size: 0.78rem;">DAU Users</button>
              <button type="button" class="btn btn-sm ${currentTimeseriesType === 'events' ? 'btn-primary' : 'btn-secondary'} chart-type-btn" data-type="events" style="border-radius: 0; padding: 4px 10px; font-size: 0.78rem;">All Events</button>
            </div>
          </div>
        </div>
        <div style="height: 280px; position: relative;">
          <canvas id="timeseries-chart"></canvas>
        </div>
      </div>

      <!-- Leaderboards Grid (Two Columns with Images & View All) -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;" class="dashboard-grid">
        <!-- Top Prompts Leaderboard -->
        <div class="card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
          <div style="padding: 14px 18px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; background: rgba(0,0,0,0.1);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <i data-lucide="award" style="color: #f59e0b; width: 18px; height: 18px;"></i>
              <span style="font-weight: 700; font-size: 0.95rem; color: #fff;">Top Performing Prompts</span>
            </div>
            <div style="display: flex; align-items: center; gap: 8px;">
              <select class="input-select" id="top-prompts-metric-select" style="width: auto; padding: 4px 10px; font-size: 0.78rem;">
                <option value="viewCount">Most Viewed</option>
                <option value="copyCount">Most Copied</option>
                <option value="favoriteCount">Most Saved</option>
                <option value="shareCount">Most Shared</option>
                <option value="trendingScore">Top Trending</option>
              </select>
              <button type="button" class="btn btn-secondary btn-sm" id="btn-view-all-prompts" style="padding: 4px 10px; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 4px;">
                <span>View All</span>
                <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i>
              </button>
            </div>
          </div>
          <div id="top-prompts-container" style="flex: 1; min-height: 220px;">
            <div style="padding: 30px; text-align: center; color: var(--text-muted);">Loading leaderboard...</div>
          </div>
        </div>

        <!-- Top Categories Leaderboard -->
        <div class="card" style="padding: 0; overflow: hidden; display: flex; flex-direction: column;">
          <div style="padding: 14px 18px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; background: rgba(0,0,0,0.1);">
            <div style="display: flex; align-items: center; gap: 8px;">
              <i data-lucide="layers" style="color: #06b6d4; width: 18px; height: 18px;"></i>
              <span style="font-weight: 700; font-size: 0.95rem; color: #fff;">Top Categories by Popularity</span>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" id="btn-view-all-categories" style="padding: 4px 10px; font-size: 0.78rem; display: inline-flex; align-items: center; gap: 4px;">
              <span>View All</span>
              <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i>
            </button>
          </div>
          <div id="top-categories-container" style="flex: 1; min-height: 220px;">
            <div style="padding: 30px; text-align: center; color: var(--text-muted);">Loading categories...</div>
          </div>
        </div>
      </div>

      <!-- In-Depth User Engagement & Content Breakdown Section -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;" class="dashboard-grid">
        <!-- Category Exploration Breakdown Table -->
        <div class="card" style="padding: 0; overflow: hidden;">
          <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-color); background: rgba(0,0,0,0.15);">
            <div style="font-weight: 700; font-size: 0.95rem; color: #fff; display: flex; align-items: center; gap: 8px;">
              <i data-lucide="compass" style="color: #10b981; width: 18px; height: 18px;"></i>
              Category Exploration Statistics
            </div>
            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">
              How many users explored each category & total user interactions in selected period
            </div>
          </div>
          <div id="category-exploration-container" style="padding: 0; max-height: 380px; overflow-y: auto;">
            <div style="padding: 24px; text-align: center; color: var(--text-muted);">Loading category analytics...</div>
          </div>
        </div>

        <!-- Prompt Views vs Copies Conversion Breakdown Table -->
        <div class="card" style="padding: 0; overflow: hidden;">
          <div style="padding: 16px 20px; border-bottom: 1px solid var(--border-color); background: rgba(0,0,0,0.15);">
            <div style="font-weight: 700; font-size: 0.95rem; color: #fff; display: flex; align-items: center; gap: 8px;">
              <i data-lucide="trending-up" style="color: #a855f7; width: 18px; height: 18px;"></i>
              Prompt Reach & Copy Conversion
            </div>
            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 2px;">
              How many unique users viewed each prompt vs how many copied it in selected period
            </div>
          </div>
          <div id="prompt-engagement-container" style="padding: 0; max-height: 380px; overflow-y: auto;">
            <div style="padding: 24px; text-align: center; color: var(--text-muted);">Loading prompt analytics...</div>
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Bind Header Controls
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

  // Time Filter Buttons
  const filterButtonsContainer = container.querySelector('#dashboard-filter-buttons');
  const customBox = container.querySelector('#custom-date-picker-box');
  const activeFilterText = container.querySelector('#active-filter-text');

  filterButtonsContainer?.querySelectorAll('.filter-range-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const range = btn.getAttribute('data-range');
      if (range === 'custom') {
        currentFilterRange = 'custom';
        filterButtonsContainer.querySelectorAll('.filter-range-btn').forEach((b) => (b.className = 'btn btn-sm btn-secondary filter-range-btn'));
        btn.className = 'btn btn-sm btn-primary filter-range-btn';
        if (customBox) customBox.style.display = 'flex';
        return;
      }

      currentFilterRange = range;
      customFromDate = '';
      customToDate = '';
      if (customBox) customBox.style.display = 'none';

      filterButtonsContainer.querySelectorAll('.filter-range-btn').forEach((b) => (b.className = 'btn btn-sm btn-secondary filter-range-btn'));
      btn.className = 'btn btn-sm btn-primary filter-range-btn';

      if (activeFilterText) {
        activeFilterText.textContent = `Filter: ${getFilterLabel(currentFilterRange)}`;
      }

      loadAllDashboardData(container, app);
    });
  });

  // Apply Custom Date Range Button
  container.querySelector('#apply-custom-range-btn')?.addEventListener('click', () => {
    const fromInput = container.querySelector('#custom-from-input');
    const toInput = container.querySelector('#custom-to-input');
    const fromVal = fromInput?.value;
    const toVal = toInput?.value;

    if (!fromVal || !toVal) {
      toast.error('Please select both From and To dates');
      return;
    }
    if (new Date(fromVal) > new Date(toVal)) {
      toast.error('From date cannot be after To date');
      return;
    }

    customFromDate = fromVal;
    customToDate = toVal;
    currentFilterRange = 'custom';

    if (activeFilterText) {
      activeFilterText.textContent = `Filter: ${customFromDate} to ${customToDate}`;
    }

    loadAllDashboardData(container, app);
  });

  // Chart Metric Toggle: DAU vs Events
  container.querySelectorAll('.chart-type-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentTimeseriesType = btn.getAttribute('data-type') || 'dau';
      container.querySelectorAll('.chart-type-btn').forEach((b) => (b.className = 'btn btn-sm btn-secondary chart-type-btn'));
      btn.className = 'btn btn-sm btn-primary chart-type-btn';
      loadTimeseriesData(container);
    });
  });

  // Top Prompts Metric Filter
  container.querySelector('#top-prompts-metric-select')?.addEventListener('change', (e) => {
    currentTopPromptMetric = e.target.value;
    loadTopPromptsData(container, app);
  });

  // "View All Prompts" button click
  container.querySelector('#btn-view-all-prompts')?.addEventListener('click', () => {
    showAllPromptsModal(app);
  });

  // "View All Categories" button click
  container.querySelector('#btn-view-all-categories')?.addEventListener('click', () => {
    showAllCategoriesModal(app);
  });

  await loadAllDashboardData(container, app);
}

async function loadAllDashboardData(container, app) {
  await Promise.all([
    loadOverviewStats(container),
    loadTimeseriesData(container),
    loadTopPromptsData(container, app),
    loadTopCategoriesData(container, app),
    loadDetailedEngagementData(container, app),
  ]);
}

async function loadOverviewStats(container) {
  try {
    const res = await api.getDashboardOverview({
      range: currentFilterRange,
      from: customFromDate,
      to: customToDate,
    });
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
    const elDauTitle = container.querySelector('#kpi-dau-title');
    const elDau = container.querySelector('#kpi-dau');
    const elDauTrend = container.querySelector('#kpi-dau-trend');
    const elDauSub = container.querySelector('#kpi-dau-sub');

    const elPrompts = container.querySelector('#kpi-prompts');
    const elPromptsSub = container.querySelector('#kpi-prompts-sub');

    const elCopies = container.querySelector('#kpi-copies');
    const elCopiesSub = container.querySelector('#kpi-copies-sub');

    const elViews = container.querySelector('#kpi-views');
    const elEngagementSub = container.querySelector('#kpi-engagement-sub');

    // Title adaptation
    if (elDauTitle) {
      switch (currentFilterRange) {
        case 'today': elDauTitle.textContent = 'Daily Active Users (DAU)'; break;
        case 'yesterday': elDauTitle.textContent = 'Active Users (Yesterday)'; break;
        case '7d': elDauTitle.textContent = 'Active Users (Last 7 Days)'; break;
        case 'this_month': elDauTitle.textContent = 'Active Users (This Month)'; break;
        case 'last_month': elDauTitle.textContent = 'Active Users (Last Month)'; break;
        case 'all_time': elDauTitle.textContent = 'Total Active Users'; break;
        default: elDauTitle.textContent = 'Active Users in Range'; break;
      }
    }

    // DAU Card
    if (elDau) elDau.textContent = (users?.activeInPeriod || users?.activeToday || 0).toLocaleString();
    if (elDauTrend) {
      if (currentFilterRange === 'today') {
        const trend = users?.dauTrendPercent ?? 0;
        if (trend > 0) {
          elDauTrend.style.background = 'rgba(16, 185, 129, 0.2)';
          elDauTrend.style.color = '#34d399';
          elDauTrend.style.border = '1px solid rgba(16, 185, 129, 0.4)';
          elDauTrend.textContent = `+${trend}% vs yday`;
          elDauTrend.style.display = 'inline-block';
        } else if (trend < 0) {
          elDauTrend.style.background = 'rgba(239, 68, 68, 0.2)';
          elDauTrend.style.color = '#f87171';
          elDauTrend.style.border = '1px solid rgba(239, 68, 68, 0.4)';
          elDauTrend.textContent = `${trend}% vs yday`;
          elDauTrend.style.display = 'inline-block';
        } else {
          elDauTrend.style.display = 'none';
        }
      } else {
        elDauTrend.style.display = 'none';
      }
    }
    if (elDauSub) {
      if (currentFilterRange === 'today') {
        elDauSub.textContent = `Yesterday: ${users?.activeYesterday || 0} • 7d WAU: ${users?.active7d || 0} • 30d MAU: ${users?.active30d || 0}`;
      } else {
        elDauSub.textContent = `Total registered devices: ${(users?.total || 0).toLocaleString()}`;
      }
    }

    // Content Card
    if (elPrompts) elPrompts.textContent = (content?.totalPrompts || 0).toLocaleString();
    if (elPromptsSub) {
      const addedText = content?.createdInPeriod !== undefined ? `${content.createdInPeriod} added in period • ` : '';
      elPromptsSub.textContent = `${addedText}${content?.publishedPrompts || 0} Published • ${content?.totalCategories || 0} Categories`;
    }

    // Copies Card
    if (elCopies) elCopies.textContent = (engagement?.totalCopies || 0).toLocaleString();
    if (elCopiesSub) {
      elCopiesSub.textContent = `${engagement?.copyConversionRate || '0%'} copy rate • ${(engagement?.uniqueCopiers || 0).toLocaleString()} unique copiers`;
    }

    // Views Card
    if (elViews) elViews.textContent = (engagement?.totalViews || 0).toLocaleString();
    if (elEngagementSub) {
      elEngagementSub.textContent = `${(engagement?.uniqueViewers || 0).toLocaleString()} unique viewers • ${(engagement?.totalFavorites || 0).toLocaleString()} saves`;
    }
  } catch (err) {
    console.error('Failed to load overview data', err);
  }
}

async function loadTimeseriesData(container) {
  const canvas = container.querySelector('#timeseries-chart');
  if (!canvas || !window.Chart) return;

  try {
    let timeseries = [];
    if (currentTimeseriesType === 'dau') {
      const res = await api.getDauTimeseries(currentFilterRange, customFromDate, customToDate);
      timeseries = res.data || [];
    } else {
      const res = await api.getEventsTimeseries(currentFilterRange, undefined, customFromDate, customToDate);
      timeseries = res.data || [];
    }

    if (timeseriesChart) timeseriesChart.destroy();

    const isHourly = currentFilterRange === 'today' || currentFilterRange === 'yesterday';
    const isDau = currentTimeseriesType === 'dau';

    const hText = container.querySelector('#chart-heading-text');
    const sText = container.querySelector('#chart-sub-text');
    if (hText) {
      hText.textContent = isDau
        ? (isHourly ? `Hourly Active Users (${getFilterLabel(currentFilterRange)})` : `Active Users (${getFilterLabel(currentFilterRange, customFromDate, customToDate)})`)
        : (isHourly ? `Hourly Telemetry Events (${getFilterLabel(currentFilterRange)})` : `Telemetry Events (${getFilterLabel(currentFilterRange, customFromDate, customToDate)})`);
    }
    if (sText) {
      sText.textContent = isDau
        ? (isHourly ? 'Unique active devices connected per hour' : 'Unique active devices connected per day in selected period')
        : 'Aggregate telemetry events across mobile clients';
    }

    const labels = timeseries.map((item) => {
      if (item.date.includes(':')) return item.date; // Hourly HH:00
      const parts = item.date.split('-');
      return parts.length === 3 ? `${parts[1]}/${parts[2]}` : item.date;
    });
    const dataPoints = timeseries.map((item) => item.count);

    const mainColor = isDau ? '#818cf8' : '#06b6d4';
    const fillColor = isDau ? 'rgba(99, 102, 241, 0.15)' : 'rgba(6, 182, 212, 0.15)';

    timeseriesChart = new window.Chart(canvas, {
      type: 'line',
      data: {
        labels: labels.length ? labels : ['No Data'],
        datasets: [
          {
            label: isDau ? 'Active Users' : 'Telemetry Events',
            data: dataPoints.length ? dataPoints : [0],
            backgroundColor: fillColor,
            borderColor: mainColor,
            borderWidth: 2.5,
            fill: true,
            tension: 0.35,
            pointBackgroundColor: mainColor,
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
    const res = await api.getTopPrompts(currentTopPromptMetric, 5, currentFilterRange, customFromDate, customToDate);
    cachedTopPrompts = res.data || [];

    if (cachedTopPrompts.length === 0) {
      topPromptsEl.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted);">No published prompts found in this period</div>`;
      return;
    }

    topPromptsEl.innerHTML = `
      <table class="data-table" style="margin: 0;">
        <thead>
          <tr>
            <th style="width: 44px; text-align: center;">Rank</th>
            <th style="width: 54px;">Media</th>
            <th>Prompt & Category</th>
            <th style="text-align: right;">Period Stats</th>
          </tr>
        </thead>
        <tbody>
          ${cachedTopPrompts.map((p, idx) => {
            const media = p.media && p.media.length > 0 ? p.media[0] : null;
            const thumbUrl = media ? (media.thumbnailUrl || media.secureUrl) : '';
            const isVideo = media && media.mediaType === 'VIDEO';
            const statValue = currentFilterRange === 'all_time' ? (p[currentTopPromptMetric] || 0) : (p.periodViews ?? p[currentTopPromptMetric] ?? 0);

            return `
              <tr class="clickable-prompt-row" data-prompt-id="${p.id}" style="cursor: pointer;">
                <td style="text-align: center; font-weight: 800; font-size: 0.9rem; color: ${idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : '#64748b'};">
                  #${idx + 1}
                </td>
                <td style="padding: 6px 8px;">
                  <div class="prompt-thumb-box" data-url="${media?.secureUrl || thumbUrl}" data-title="${escapeHtml(p.title)}" style="width: 46px; height: 46px; border-radius: 8px; overflow: hidden; background: #0f172a; border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center; position: relative;">
                    ${thumbUrl ? `
                      <img src="${thumbUrl}" alt="Thumb" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />
                    ` : `
                      <i data-lucide="image" style="width: 18px; height: 18px; color: var(--text-muted);"></i>
                    `}
                    ${isVideo ? `
                      <span style="position: absolute; bottom: 2px; right: 2px; background: rgba(0,0,0,0.8); border-radius: 3px; padding: 1px 3px; font-size: 0.6rem; color: #fff;">VIDEO</span>
                    ` : ''}
                  </div>
                </td>
                <td>
                  <div style="font-weight: 600; color: #fff; font-size: 0.88rem; max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${escapeHtml(p.title)}
                  </div>
                  <div style="display: flex; align-items: center; gap: 6px; margin-top: 3px;">
                    ${p.category ? `<span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #a5b4fc; font-size: 0.7rem; padding: 1px 6px;">${escapeHtml(p.category.name)}</span>` : ''}
                    <span style="font-size: 0.72rem; color: var(--text-muted);">
                      ${p.viewCount} views &bull; ${p.copyCount} copies
                    </span>
                  </div>
                </td>
                <td style="text-align: right;">
                  <div style="font-weight: 700; color: #818cf8; font-size: 0.95rem;">
                    ${statValue.toLocaleString()}
                  </div>
                  <div style="font-size: 0.7rem; color: #34d399; font-weight: 600;">
                    ${p.copyConversionRate || '0%'} copy rate
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    if (window.lucide) window.lucide.createIcons();

    topPromptsEl.querySelectorAll('.clickable-prompt-row').forEach((row) => {
      row.addEventListener('click', (e) => {
        if (e.target.closest('.prompt-thumb-box')) return;
        const id = row.getAttribute('data-prompt-id');
        if (id && app) app.navigate('prompt-editor', { promptId: id });
      });
    });

    topPromptsEl.querySelectorAll('.prompt-thumb-box').forEach((box) => {
      box.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = box.getAttribute('data-url');
        const title = box.getAttribute('data-title') || 'Prompt Preview';
        if (url && modal.imageLightbox) modal.imageLightbox(url, title);
      });
    });
  } catch (err) {
    topPromptsEl.innerHTML = `<div style="padding: 24px; text-align: center; color: #ef4444;">Failed to load top prompts</div>`;
  }
}

async function loadTopCategoriesData(container, app) {
  const topCatEl = container.querySelector('#top-categories-container');
  if (!topCatEl) return;

  try {
    const res = await api.getTopCategories(5, currentFilterRange, customFromDate, customToDate);
    cachedTopCategories = res.data || [];

    if (cachedTopCategories.length === 0) {
      topCatEl.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted);">No category data found in this period</div>`;
      return;
    }

    topCatEl.innerHTML = `
      <table class="data-table" style="margin: 0;">
        <thead>
          <tr>
            <th style="width: 44px; text-align: center;">Rank</th>
            <th style="width: 54px;">Media</th>
            <th>Category</th>
            <th>Prompts</th>
            <th style="text-align: right;">Period Views</th>
          </tr>
        </thead>
        <tbody>
          ${cachedTopCategories.map((item, idx) => {
            const cat = item.category;
            const imgUrl = cat?.coverImageUrl || cat?.iconUrl || '';

            return `
              <tr class="clickable-cat-row" data-cat-id="${cat?.id}" style="cursor: pointer;">
                <td style="text-align: center; font-weight: 800; font-size: 0.9rem; color: ${idx === 0 ? '#06b6d4' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : '#64748b'};">
                  #${idx + 1}
                </td>
                <td style="padding: 6px 8px;">
                  <div style="width: 46px; height: 46px; border-radius: 8px; overflow: hidden; background: #0f172a; border: 1px solid rgba(255,255,255,0.08); display: flex; align-items: center; justify-content: center;">
                    ${imgUrl ? `
                      <img src="${imgUrl}" alt="Category" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />
                    ` : `
                      <i data-lucide="folder" style="width: 18px; height: 18px; color: #06b6d4;"></i>
                    `}
                  </div>
                </td>
                <td>
                  <div style="font-weight: 600; color: #fff; font-size: 0.88rem;">
                    ${cat ? escapeHtml(cat.name) : 'Unknown'}
                  </div>
                  <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
                    ${item.explorationCount || 0} explorations &bull; ${item.totalCopies || 0} copies
                  </div>
                </td>
                <td style="font-size: 0.82rem; color: #cbd5e1;">
                  <span class="badge" style="background: rgba(255,255,255,0.06); font-weight: 600;">${item.promptCount} prompts</span>
                </td>
                <td style="text-align: right;">
                  <div style="font-weight: 700; color: #22d3ee; font-size: 0.95rem;">
                    ${item.totalViews.toLocaleString()}
                  </div>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    if (window.lucide) window.lucide.createIcons();

    topCatEl.querySelectorAll('.clickable-cat-row').forEach((row) => {
      row.addEventListener('click', () => {
        const id = row.getAttribute('data-cat-id');
        if (id && app) app.navigate('categories');
      });
    });
  } catch (err) {
    topCatEl.innerHTML = `<div style="padding: 24px; text-align: center; color: #ef4444;">Failed to load categories</div>`;
  }
}

async function loadDetailedEngagementData(container, app) {
  const catExplorationEl = container.querySelector('#category-exploration-container');
  const promptEngagementEl = container.querySelector('#prompt-engagement-container');

  try {
    const res = await api.getEngagementStats(currentFilterRange, customFromDate, customToDate);
    const data = res.data || {};
    const catList = data.categoryExplorations || [];
    const promptList = data.promptEngagement || [];

    // Render Category Exploration Breakdown Table
    if (catExplorationEl) {
      if (catList.length === 0) {
        catExplorationEl.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted);">No category exploration data recorded in this period</div>`;
      } else {
        catExplorationEl.innerHTML = `
          <table class="data-table" style="margin: 0; font-size: 0.82rem;">
            <thead>
              <tr>
                <th>Category</th>
                <th style="text-align: center;">Explorations</th>
                <th style="text-align: center;">Unique Users</th>
                <th style="text-align: right;">Prompt Views</th>
                <th style="text-align: right;">Prompt Copies</th>
              </tr>
            </thead>
            <tbody>
              ${catList.map((c) => {
                const cat = c.category;
                const img = cat?.coverImageUrl || cat?.iconUrl || '';
                return `
                  <tr>
                    <td>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 28px; height: 28px; border-radius: 6px; overflow: hidden; background: #0f172a; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                          ${img ? `<img src="${img}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />` : `<i data-lucide="layers" style="width: 14px; height: 14px; color: #06b6d4;"></i>`}
                        </div>
                        <span style="font-weight: 600; color: #fff;">${cat ? escapeHtml(cat.name) : 'Unknown'}</span>
                      </div>
                    </td>
                    <td style="text-align: center; font-weight: 700; color: #10b981;">
                      ${c.explorationCount.toLocaleString()}
                    </td>
                    <td style="text-align: center; color: #cbd5e1;">
                      ${c.uniqueExplorers.toLocaleString()}
                    </td>
                    <td style="text-align: right; color: #818cf8; font-weight: 600;">
                      ${c.totalViews.toLocaleString()}
                    </td>
                    <td style="text-align: right; color: #c084fc; font-weight: 600;">
                      ${c.totalCopies.toLocaleString()}
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `;
      }
    }

    // Render Prompt Engagement Breakdown Table
    if (promptEngagementEl) {
      if (promptList.length === 0) {
        promptEngagementEl.innerHTML = `<div style="padding: 24px; text-align: center; color: var(--text-muted);">No prompt engagement data recorded in this period</div>`;
      } else {
        promptEngagementEl.innerHTML = `
          <table class="data-table" style="margin: 0; font-size: 0.82rem;">
            <thead>
              <tr>
                <th>Prompt</th>
                <th style="text-align: center;">Viewers</th>
                <th style="text-align: center;">Copiers</th>
                <th style="text-align: right;">Copy Rate</th>
              </tr>
            </thead>
            <tbody>
              ${promptList.slice(0, 15).map((p) => {
                const media = p.media && p.media.length > 0 ? p.media[0] : null;
                const thumb = media?.thumbnailUrl || media?.secureUrl || '';
                return `
                  <tr class="clickable-prompt-row" data-prompt-id="${p.id}" style="cursor: pointer;">
                    <td>
                      <div style="display: flex; align-items: center; gap: 8px;">
                        <div style="width: 32px; height: 32px; border-radius: 6px; overflow: hidden; background: #0f172a; flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                          ${thumb ? `<img src="${thumb}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />` : `<i data-lucide="image" style="width: 14px; height: 14px; color: var(--text-muted);"></i>`}
                        </div>
                        <div style="max-width: 150px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight: 600; color: #fff;">
                          ${escapeHtml(p.title)}
                        </div>
                      </div>
                    </td>
                    <td style="text-align: center;">
                      <div style="font-weight: 700; color: #818cf8;">${(p.periodViews ?? p.viewCount).toLocaleString()}</div>
                      <div style="font-size: 0.68rem; color: var(--text-muted);">${p.uniqueViewers} users</div>
                    </td>
                    <td style="text-align: center;">
                      <div style="font-weight: 700; color: #c084fc;">${(p.periodCopies ?? p.copyCount).toLocaleString()}</div>
                      <div style="font-size: 0.68rem; color: var(--text-muted);">${p.uniqueCopiers} users</div>
                    </td>
                    <td style="text-align: right;">
                      <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; font-weight: 700; border: 1px solid rgba(16, 185, 129, 0.3);">
                        ${p.copyConversionRate || '0%'}
                      </span>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        `;

        promptEngagementEl.querySelectorAll('.clickable-prompt-row').forEach((row) => {
          row.addEventListener('click', () => {
            const id = row.getAttribute('data-prompt-id');
            if (id && app) app.navigate('prompt-editor', { promptId: id });
          });
        });
      }
    }

    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    if (catExplorationEl) catExplorationEl.innerHTML = `<div style="padding: 24px; text-align: center; color: #ef4444;">Failed to load category analytics</div>`;
    if (promptEngagementEl) promptEngagementEl.innerHTML = `<div style="padding: 24px; text-align: center; color: #ef4444;">Failed to load prompt analytics</div>`;
  }
}

// Modal: "View All Prompts"
async function showAllPromptsModal(app) {
  let allPrompts = [];
  let currentSort = 'viewCount';
  let searchTerm = '';

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  backdrop.innerHTML = `
    <div class="modal-dialog" style="max-width: 960px; width: 95%;">
      <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(245, 158, 11, 0.15); color: #f59e0b; display: flex; align-items: center; justify-content: center;">
            <i data-lucide="award" style="width: 20px; height: 20px;"></i>
          </div>
          <div>
            <h3 class="modal-title" style="margin: 0; font-size: 1.15rem; font-weight: 700;">Top Performing Prompts — Full Leaderboard</h3>
            <span style="font-size: 0.78rem; color: var(--text-muted);">Ranked list of all prompts (${getFilterLabel(currentFilterRange, customFromDate, customToDate)})</span>
          </div>
        </div>
        <button type="button" class="btn-icon" id="all-prompts-modal-close" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer;">
          <i data-lucide="x" style="width: 20px; height: 20px;"></i>
        </button>
      </div>

      <div class="modal-body" style="padding: 16px 20px; display: flex; flex-direction: column; gap: 14px;">
        <!-- Filter Controls -->
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;">
          <input type="text" id="all-prompts-search" class="input-text" placeholder="Search prompts by title or category..." style="flex: 1; min-width: 200px; padding: 7px 12px; font-size: 0.85rem;" />
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="font-size: 0.8rem; color: var(--text-muted);">Sort By:</span>
            <select id="all-prompts-sort-select" class="input-select" style="padding: 6px 12px; font-size: 0.82rem;">
              <option value="viewCount">Most Viewed</option>
              <option value="copyCount">Most Copied</option>
              <option value="favoriteCount">Most Saved</option>
              <option value="shareCount">Most Shared</option>
              <option value="trendingScore">Top Trending</option>
            </select>
          </div>
        </div>

        <!-- Table Container -->
        <div id="all-prompts-table-container" style="max-height: 480px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
          <div style="padding: 30px; text-align: center; color: var(--text-muted);">Loading full leaderboard...</div>
        </div>
      </div>

      <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
        <span id="all-prompts-count-label" style="font-size: 0.82rem; color: var(--text-muted);">Loading...</span>
        <button type="button" class="btn btn-secondary" id="all-prompts-modal-cancel">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  if (window.lucide) window.lucide.createIcons();
  requestAnimationFrame(() => backdrop.classList.add('open'));

  const close = () => {
    backdrop.classList.remove('open');
    setTimeout(() => backdrop.remove(), 200);
  };

  backdrop.querySelector('#all-prompts-modal-close')?.addEventListener('click', close);
  backdrop.querySelector('#all-prompts-modal-cancel')?.addEventListener('click', close);

  async function fetchAndRender() {
    const tableContainer = backdrop.querySelector('#all-prompts-table-container');
    const countLabel = backdrop.querySelector('#all-prompts-count-label');
    if (!tableContainer) return;

    tableContainer.innerHTML = `<div style="padding: 30px; text-align: center; color: var(--text-muted);"><i data-lucide="loader" style="width: 20px; height: 20px; animation: spin 1s linear infinite;"></i> Loading prompts...</div>`;
    if (window.lucide) window.lucide.createIcons();

    try {
      const res = await api.getTopPrompts(currentSort, 100, currentFilterRange, customFromDate, customToDate);
      allPrompts = res.data || [];
      renderTable();
    } catch (err) {
      tableContainer.innerHTML = `<div style="padding: 30px; text-align: center; color: #ef4444;">Failed to load leaderboard: ${err.message}</div>`;
    }
  }

  function renderTable() {
    const tableContainer = backdrop.querySelector('#all-prompts-table-container');
    const countLabel = backdrop.querySelector('#all-prompts-count-label');
    if (!tableContainer) return;

    const filtered = allPrompts.filter((p) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (p.title || '').toLowerCase().includes(q) || (p.category?.name || '').toLowerCase().includes(q);
    });

    if (countLabel) countLabel.textContent = `Showing ${filtered.length} of ${allPrompts.length} prompts`;

    if (filtered.length === 0) {
      tableContainer.innerHTML = `<div style="padding: 30px; text-align: center; color: var(--text-muted);">No prompts matching "${escapeHtml(searchTerm)}"</div>`;
      return;
    }

    tableContainer.innerHTML = `
      <table class="data-table" style="margin: 0; font-size: 0.85rem;">
        <thead>
          <tr>
            <th style="width: 44px; text-align: center;">#</th>
            <th style="width: 54px;">Media</th>
            <th>Title & Category</th>
            <th style="text-align: center;">Views (Users)</th>
            <th style="text-align: center;">Copies (Users)</th>
            <th style="text-align: center;">Saves</th>
            <th style="text-align: center;">Conversion</th>
            <th style="text-align: right;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map((p, idx) => {
            const media = p.media && p.media.length > 0 ? p.media[0] : null;
            const thumb = media?.thumbnailUrl || media?.secureUrl || '';
            const isVideo = media && media.mediaType === 'VIDEO';

            return `
              <tr>
                <td style="text-align: center; font-weight: 800; color: ${idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : '#64748b'};">
                  #${idx + 1}
                </td>
                <td style="padding: 6px 8px;">
                  <div style="width: 44px; height: 44px; border-radius: 8px; overflow: hidden; background: #0f172a; position: relative;">
                    ${thumb ? `<img src="${thumb}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />` : `<i data-lucide="image" style="width: 16px; height: 16px; color: var(--text-muted);"></i>`}
                    ${isVideo ? `<span style="position: absolute; bottom: 2px; right: 2px; background: rgba(0,0,0,0.8); border-radius: 2px; padding: 1px 3px; font-size: 0.55rem; color: #fff;">VID</span>` : ''}
                  </div>
                </td>
                <td>
                  <div style="font-weight: 600; color: #fff; max-width: 250px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
                    ${escapeHtml(p.title)}
                  </div>
                  <div style="margin-top: 2px;">
                    ${p.category ? `<span class="badge" style="background: rgba(99, 102, 241, 0.15); color: #a5b4fc; font-size: 0.7rem; padding: 1px 6px;">${escapeHtml(p.category.name)}</span>` : ''}
                  </div>
                </td>
                <td style="text-align: center;">
                  <div style="font-weight: 700; color: #818cf8;">${(p.periodViews ?? p.viewCount).toLocaleString()}</div>
                  <div style="font-size: 0.7rem; color: var(--text-muted);">${p.uniqueViewers || p.viewCount} users</div>
                </td>
                <td style="text-align: center;">
                  <div style="font-weight: 700; color: #c084fc;">${(p.periodCopies ?? p.copyCount).toLocaleString()}</div>
                  <div style="font-size: 0.7rem; color: var(--text-muted);">${p.uniqueCopiers || p.copyCount} users</div>
                </td>
                <td style="text-align: center; color: #f43f5e; font-weight: 600;">
                  ${(p.favoriteCount || 0).toLocaleString()}
                </td>
                <td style="text-align: center;">
                  <span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #34d399; font-weight: 700;">
                    ${p.copyConversionRate || '0%'}
                  </span>
                </td>
                <td style="text-align: right;">
                  <button type="button" class="btn btn-secondary btn-sm edit-prompt-btn" data-id="${p.id}" style="padding: 4px 10px; font-size: 0.75rem;">
                    Edit
                  </button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    if (window.lucide) window.lucide.createIcons();

    tableContainer.querySelectorAll('.edit-prompt-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        close();
        if (id && app) app.navigate('prompt-editor', { promptId: id, returnTo: 'dashboard' });
      });
    });
  }

  backdrop.querySelector('#all-prompts-search')?.addEventListener('input', (e) => {
    searchTerm = e.target.value.trim();
    renderTable();
  });

  backdrop.querySelector('#all-prompts-sort-select')?.addEventListener('change', (e) => {
    currentSort = e.target.value;
    fetchAndRender();
  });

  fetchAndRender();
}

// Modal: "View All Categories"
async function showAllCategoriesModal(app) {
  let allCats = [];
  let searchTerm = '';

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';

  backdrop.innerHTML = `
    <div class="modal-dialog" style="max-width: 860px; width: 95%;">
      <div class="modal-header" style="display: flex; justify-content: space-between; align-items: center;">
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(6, 182, 212, 0.15); color: #06b6d4; display: flex; align-items: center; justify-content: center;">
            <i data-lucide="layers" style="width: 20px; height: 20px;"></i>
          </div>
          <div>
            <h3 class="modal-title" style="margin: 0; font-size: 1.15rem; font-weight: 700;">All Categories by Popularity</h3>
            <span style="font-size: 0.78rem; color: var(--text-muted);">Explore user interactions, total prompt volume, views, and copies per category (${getFilterLabel(currentFilterRange, customFromDate, customToDate)})</span>
          </div>
        </div>
        <button type="button" class="btn-icon" id="all-cats-modal-close" style="background: transparent; border: none; color: var(--text-muted); cursor: pointer;">
          <i data-lucide="x" style="width: 20px; height: 20px;"></i>
        </button>
      </div>

      <div class="modal-body" style="padding: 16px 20px; display: flex; flex-direction: column; gap: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px;">
          <input type="text" id="all-cats-search" class="input-text" placeholder="Search categories..." style="flex: 1; padding: 7px 12px; font-size: 0.85rem;" />
        </div>

        <div id="all-cats-table-container" style="max-height: 480px; overflow-y: auto; border: 1px solid var(--border-color); border-radius: var(--radius-md);">
          <div style="padding: 30px; text-align: center; color: var(--text-muted);">Loading categories...</div>
        </div>
      </div>

      <div class="modal-footer" style="display: flex; justify-content: space-between; align-items: center;">
        <span id="all-cats-count-label" style="font-size: 0.82rem; color: var(--text-muted);">Loading...</span>
        <button type="button" class="btn btn-secondary" id="all-cats-modal-cancel">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(backdrop);
  if (window.lucide) window.lucide.createIcons();
  requestAnimationFrame(() => backdrop.classList.add('open'));

  const close = () => {
    backdrop.classList.remove('open');
    setTimeout(() => backdrop.remove(), 200);
  };

  backdrop.querySelector('#all-cats-modal-close')?.addEventListener('click', close);
  backdrop.querySelector('#all-cats-modal-cancel')?.addEventListener('click', close);

  async function fetchAndRender() {
    const tableContainer = backdrop.querySelector('#all-cats-table-container');
    if (!tableContainer) return;

    try {
      const res = await api.getTopCategories(100, currentFilterRange, customFromDate, customToDate);
      allCats = res.data || [];
      renderTable();
    } catch (err) {
      tableContainer.innerHTML = `<div style="padding: 30px; text-align: center; color: #ef4444;">Failed to load categories: ${err.message}</div>`;
    }
  }

  function renderTable() {
    const tableContainer = backdrop.querySelector('#all-cats-table-container');
    const countLabel = backdrop.querySelector('#all-cats-count-label');
    if (!tableContainer) return;

    const filtered = allCats.filter((c) => {
      if (!searchTerm) return true;
      const q = searchTerm.toLowerCase();
      return (c.category?.name || '').toLowerCase().includes(q) || (c.category?.slug || '').toLowerCase().includes(q);
    });

    if (countLabel) countLabel.textContent = `Showing ${filtered.length} of ${allCats.length} categories`;

    if (filtered.length === 0) {
      tableContainer.innerHTML = `<div style="padding: 30px; text-align: center; color: var(--text-muted);">No categories matching "${escapeHtml(searchTerm)}"</div>`;
      return;
    }

    tableContainer.innerHTML = `
      <table class="data-table" style="margin: 0; font-size: 0.85rem;">
        <thead>
          <tr>
            <th style="width: 44px; text-align: center;">#</th>
            <th style="width: 54px;">Media</th>
            <th>Category Name</th>
            <th style="text-align: center;">Prompts</th>
            <th style="text-align: center;">Explorations</th>
            <th style="text-align: right;">Period Views</th>
            <th style="text-align: right;">Total Copies</th>
            <th style="text-align: right;">Action</th>
          </tr>
        </thead>
        <tbody>
          ${filtered.map((item, idx) => {
            const cat = item.category;
            const img = cat?.coverImageUrl || cat?.iconUrl || '';

            return `
              <tr>
                <td style="text-align: center; font-weight: 800; color: ${idx === 0 ? '#06b6d4' : idx === 1 ? '#94a3b8' : idx === 2 ? '#b45309' : '#64748b'};">
                  #${idx + 1}
                </td>
                <td style="padding: 6px 8px;">
                  <div style="width: 44px; height: 44px; border-radius: 8px; overflow: hidden; background: #0f172a; display: flex; align-items: center; justify-content: center;">
                    ${img ? `<img src="${img}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.style.display='none'" />` : `<i data-lucide="folder" style="width: 18px; height: 18px; color: #06b6d4;"></i>`}
                  </div>
                </td>
                <td>
                  <div style="font-weight: 600; color: #fff;">${cat ? escapeHtml(cat.name) : 'Unknown'}</div>
                  <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 2px;">
                    ${cat?.slug || ''}
                  </div>
                </td>
                <td style="text-align: center; color: #cbd5e1;">
                  <span class="badge" style="background: rgba(255,255,255,0.06); font-weight: 600;">${item.promptCount}</span>
                </td>
                <td style="text-align: center; font-weight: 700; color: #10b981;">
                  ${item.explorationCount.toLocaleString()}
                </td>
                <td style="text-align: right; color: #818cf8; font-weight: 600;">
                  ${item.totalViews.toLocaleString()}
                </td>
                <td style="text-align: right; color: #c084fc; font-weight: 600;">
                  ${item.totalCopies.toLocaleString()}
                </td>
                <td style="text-align: right;">
                  <button type="button" class="btn btn-secondary btn-sm view-cat-prompts-btn" data-id="${cat?.id}" style="padding: 4px 10px; font-size: 0.75rem;">
                    View
                  </button>
                </td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    if (window.lucide) window.lucide.createIcons();

    tableContainer.querySelectorAll('.view-cat-prompts-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        close();
        if (id && app) app.navigate('categories');
      });
    });
  }

  backdrop.querySelector('#all-cats-search')?.addEventListener('input', (e) => {
    searchTerm = e.target.value.trim();
    renderTable();
  });

  fetchAndRender();
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
