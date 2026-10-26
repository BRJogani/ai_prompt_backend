import { api } from '../api.js';
import { toast } from '../toast.js';

export async function renderAdConfig(container) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <!-- Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 class="page-header-title">Ad Network & Placement Configuration</h1>
          <p style="font-size: 0.88rem; color: #94a3b8;">Configure Google AdMob Unit IDs, display intervals, and global advertising toggles</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-primary" id="btn-save-all-ads" style="font-weight: 700;">
            <i data-lucide="check" style="width: 16px; height: 16px;"></i> Save All Placements
          </button>
        </div>
      </div>

      <!-- Master Ads Toggle Card -->
      <div class="card" style="border: 1px solid rgba(99, 102, 241, 0.35); background: linear-gradient(135deg, rgba(30, 27, 75, 0.5) 0%, rgba(15, 23, 42, 0.7) 100%); padding: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 1.1rem; font-weight: 700; color: #fff;">Global Advertising Kill Switch</span>
              <span id="master-ads-badge" class="badge badge-success">ACTIVE</span>
            </div>
            <p style="font-size: 0.82rem; color: #94a3b8; margin: 4px 0 0 0;">
              Master kill-switch for all advertisements. When OFF, all mobile apps immediately disable all ads and collapse all ad spaces.
            </p>
          </div>
          <div style="display: flex; align-items: center; gap: 14px;">
            <label class="switch">
              <input type="checkbox" id="master-ads-toggle" checked />
              <span class="slider"></span>
            </label>
            <span id="master-ads-toggle-label" style="font-size: 0.95rem; font-weight: 700; color: #f8fafc; min-width: 38px;">ON</span>
          </div>
        </div>
      </div>

      <!-- Simple Placement Cards Grid -->
      <div id="ads-cards-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(360px, 1fr)); gap: 20px;">
        <div style="padding: 40px; text-align: center; color: #94a3b8; grid-column: 1 / -1;">
          <i data-lucide="loader-2" class="spin" style="width: 28px; height: 28px; margin-bottom: 8px;"></i>
          <p>Loading ad configurations...</p>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  await fetchAndRenderAdPlacements(container);

  // Wire Save All button
  container.querySelector('#btn-save-all-ads')?.addEventListener('click', () => saveAllPlacements(container));
}

// Placement definition schema requested by user:
// APP_OPEN, NATIVE, BANNER, REWARDED => ask only Unit ID
// INTERSTITIAL => ask Unit ID and Interval (Prompt clicks)
const PLACEMENT_DEFS = [
  {
    type: 'APP_OPEN',
    title: 'App Open Ad',
    icon: 'smartphone',
    color: '#38bdf8',
    description: 'Displays every time the app opens or returns to foreground.',
    defaultUnitId: 'ca-app-pub-3940256099942544/9257395921',
    hasInterval: false,
  },
  {
    type: 'NATIVE',
    title: 'Native Ad',
    icon: 'layers',
    color: '#a855f7',
    description: 'Displays inside feed/explore lists. Reserves clean space with "Ads Space" label.',
    defaultUnitId: 'ca-app-pub-3940256099942544/2247696110',
    hasInterval: true,
    intervalLabel: 'Home Grid Feed Interval',
    intervalUnit: 'PROMPTS',
    intervalBadge: 'Every N Prompts',
    intervalDesc: 'Inserts native ad card after every <strong>N</strong> prompts in the home grid (e.g., 6 = shows ad after 6th, 12th prompt).',
    defaultInterval: 6,
  },
  {
    type: 'BANNER',
    title: 'Banner Ad',
    icon: 'layout',
    color: '#10b981',
    description: 'Displays persistent bottom banner. Reserves clean space with "Ads Space" label.',
    defaultUnitId: 'ca-app-pub-3940256099942544/6300978111',
    hasInterval: false,
  },
  {
    type: 'REWARDED',
    title: 'Rewarded Ad',
    icon: 'play-square',
    color: '#ec4899',
    description: 'Displays when a non-pro user wants to copy a paid/premium prompt.',
    defaultUnitId: 'ca-app-pub-3940256099942544/5224354917',
    hasInterval: false,
  },
  {
    type: 'INTERSTITIAL',
    title: 'Interstitial Ad',
    icon: 'maximize-2',
    color: '#f59e0b',
    description: 'Displays full-screen ad interval-wise when user taps on any prompt.',
    defaultUnitId: 'ca-app-pub-3940256099942544/1033173712',
    hasInterval: true,
    intervalLabel: 'Prompt Clicks Interval',
    intervalUnit: 'CLICKS',
    intervalBadge: 'Every N Clicks',
    intervalDesc: 'Triggers full-screen interstitial ad after every <strong>N</strong> prompt clicks (e.g., 3 = triggers on 3rd, 6th, 9th prompt click).',
    defaultInterval: 3,
  },
];

async function fetchAndRenderAdPlacements(container) {
  const cardsContainer = container.querySelector('#ads-cards-container');
  if (!cardsContainer) return;

  try {
    const [adsRes, configRes] = await Promise.all([
      api.getAdConfigs().catch(() => ({ data: [] })),
      api.getAppConfig().catch(() => ({ data: [] })),
    ]);

    const configs = adsRes?.data || [];
    const settings = configRes?.data || [];
    const masterSetting = settings.find((s) => s.key === 'ads_enabled');
    const isMasterEnabled = masterSetting ? masterSetting.value === 'true' || masterSetting.value === '1' : true;

    // 1. Wire Master Switch
    const masterToggle = container.querySelector('#master-ads-toggle');
    const masterBadge = container.querySelector('#master-ads-badge');
    const masterLabel = container.querySelector('#master-ads-toggle-label');

    if (masterToggle) {
      masterToggle.checked = isMasterEnabled;
      if (masterBadge) {
        masterBadge.textContent = isMasterEnabled ? 'ACTIVE' : 'DISABLED';
        masterBadge.className = `badge ${isMasterEnabled ? 'badge-success' : 'badge-danger'}`;
      }
      if (masterLabel) masterLabel.textContent = isMasterEnabled ? 'ON' : 'OFF';

      masterToggle.addEventListener('change', async (e) => {
        const val = e.target.checked;
        if (masterBadge) {
          masterBadge.textContent = val ? 'ACTIVE' : 'DISABLED';
          masterBadge.className = `badge ${val ? 'badge-success' : 'badge-danger'}`;
        }
        if (masterLabel) masterLabel.textContent = val ? 'ON' : 'OFF';
        try {
          await api.updateAppSetting('ads_enabled', val ? 'true' : 'false');
          toast.success(`Master Ads Switch set to ${val ? 'ON' : 'OFF'}`);
        } catch (err) {
          toast.error(err.message || 'Failed to update master switch');
          e.target.checked = !val;
        }
      });
    }

    // 2. Render 5 Clean Cards
    cardsContainer.innerHTML = PLACEMENT_DEFS.map((def) => {
      const existing = configs.find((c) => c.adType === def.type) || {};
      const unitId = existing.adUnitId || def.defaultUnitId;
      const enabled = existing.enabled !== undefined ? existing.enabled : true;
      const interval = (existing.frequencyValue !== undefined && existing.frequencyValue !== null && existing.frequencyValue > 0)
        ? existing.frequencyValue
        : (def.defaultInterval || 3);

      return `
        <div class="card ad-placement-card" data-type="${def.type}" data-id="${existing.id || ''}" style="display: flex; flex-direction: column; justify-content: space-between; gap: 18px; padding: 22px; border: 1px solid rgba(255, 255, 255, 0.08); background: rgba(15, 23, 42, 0.65);">
          <div>
            <!-- Card Header -->
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 14px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <span style="display: inline-flex; padding: 10px; border-radius: 10px; background: ${def.color}18; color: ${def.color};">
                  <i data-lucide="${def.icon}" style="width: 22px; height: 22px;"></i>
                </span>
                <div>
                  <div style="font-size: 1.05rem; font-weight: 700; color: #fff;">${def.title}</div>
                  <div style="font-size: 0.76rem; color: #94a3b8; font-family: monospace;">TYPE: ${def.type}</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 8px;">
                <label class="switch">
                  <input type="checkbox" id="ad-enable-${def.type}" ${enabled ? 'checked' : ''} />
                  <span class="slider"></span>
                </label>
              </div>
            </div>

            <p style="font-size: 0.8rem; color: #cbd5e1; margin: 0 0 16px 0; line-height: 1.45;">
              ${def.description}
            </p>

            <!-- Inputs -->
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div>
                <label style="font-size: 0.78rem; font-weight: 600; color: #94a3b8; display: block; margin-bottom: 6px;">
                  Ad Unit ID
                </label>
                <input
                  type="text"
                  id="ad-unit-${def.type}"
                  class="input"
                  style="width: 100%; font-family: monospace; font-size: 0.82rem; background: rgba(0,0,0,0.3); border-color: rgba(255,255,255,0.12); color: #fff;"
                  value="${escapeHtml(unitId)}"
                  placeholder="${def.defaultUnitId}"
                />
              </div>

              ${
                def.hasInterval
                  ? `
                <div>
                  <label style="font-size: 0.78rem; font-weight: 600; color: #cbd5e1; display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
                    <span>${def.intervalLabel || 'Display Interval'}</span>
                    <span style="font-size: 0.72rem; color: ${def.color}; background: ${def.color}18; border: 1px solid ${def.color}44; padding: 2px 8px; border-radius: 4px; font-weight: 700;">${def.intervalBadge || 'Every N'}</span>
                  </label>
                  <div style="position: relative; display: flex; align-items: center;">
                    <input
                      type="number"
                      id="ad-interval-${def.type}"
                      class="input"
                      style="width: 100%; font-weight: 700; font-size: 0.95rem; background: rgba(0,0,0,0.3); border: 1px solid ${def.color}66; color: ${def.color}; padding-right: 90px;"
                      value="${interval || def.defaultInterval || 3}"
                      min="1"
                      max="100"
                      placeholder="${def.defaultInterval || 3}"
                    />
                    <span style="position: absolute; right: 12px; font-size: 0.75rem; font-weight: 700; color: ${def.color}; pointer-events: none; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${def.intervalUnit || 'ACTIONS'}
                    </span>
                  </div>
                  <div style="font-size: 0.73rem; color: #94a3b8; margin-top: 5px; line-height: 1.4;">
                    ${def.intervalDesc || ''}
                  </div>
                </div>
              `
                  : ''
              }
            </div>
          </div>

          <!-- Card Footer Save -->
          <div style="display: flex; justify-content: flex-end; padding-top: 14px; border-top: 1px solid rgba(255, 255, 255, 0.06);">
            <button class="btn btn-secondary btn-sm save-single-ad-btn" data-type="${def.type}" style="border-color: rgba(255,255,255,0.15);">
              <i data-lucide="check" style="width: 14px; height: 14px;"></i> Save Placement
            </button>
          </div>
        </div>
      `;
    }).join('');

    if (window.lucide) window.lucide.createIcons();

    // Wire individual save buttons
    cardsContainer.querySelectorAll('.save-single-ad-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const adType = btn.getAttribute('data-type');
        await savePlacementCard(container, adType, btn);
      });
    });
  } catch (err) {
    console.error('Failed to load ad placements:', err);
    cardsContainer.innerHTML = `
      <div style="padding: 30px; text-align: center; color: #ef4444; grid-column: 1 / -1;">
        Failed to load ad configurations. Please refresh the page.
      </div>
    `;
  }
}

async function savePlacementCard(container, adType, buttonEl) {
  const unitInput = container.querySelector(`#ad-unit-${adType}`);
  const enableInput = container.querySelector(`#ad-enable-${adType}`);
  const intervalInput = container.querySelector(`#ad-interval-${adType}`);

  if (!unitInput) return;

  const def = PLACEMENT_DEFS.find((d) => d.type === adType) || {};
  const adUnitId = unitInput.value.trim() || def.defaultUnitId || '';
  const enabled = enableInput ? enableInput.checked : true;
  const frequencyValue = intervalInput ? parseInt(intervalInput.value || String(def.defaultInterval || '3'), 10) : (def.defaultInterval || 0);

  if (buttonEl) {
    buttonEl.disabled = true;
    buttonEl.innerHTML = `<i data-lucide="loader-2" class="spin" style="width: 14px; height: 14px;"></i> Saving...`;
    if (window.lucide) window.lucide.createIcons();
  }

  try {
    const payload = {
      adType,
      platform: 'ALL',
      adUnitId,
      enabled,
      frequencyType: (adType === 'INTERSTITIAL' || adType === 'NATIVE') ? 'EVERY_N_ACTIONS' : 'MANUAL',
      frequencyValue,
    };

    await api.upsertAdConfig(payload);

    // If enabling a placement, make sure master ads_enabled is also ON in database and UI
    if (enabled) {
      const masterToggle = container.querySelector('#master-ads-toggle');
      if (masterToggle) {
        masterToggle.checked = true;
        const masterBadge = container.querySelector('#master-ads-badge');
        const masterLabel = container.querySelector('#master-ads-toggle-label');
        if (masterBadge) {
          masterBadge.textContent = 'ACTIVE';
          masterBadge.className = 'badge badge-success';
        }
        if (masterLabel) masterLabel.textContent = 'ON';
      }
      await api.updateAppSetting('ads_enabled', 'true').catch(() => {});
    }

    toast.success(`${adType} ad placement saved successfully!`);
  } catch (err) {
    console.error(`Failed to save ${adType}:`, err);
    toast.error(err.message || `Failed to save ${adType} ad`);
  } finally {
    if (buttonEl) {
      buttonEl.disabled = false;
      buttonEl.innerHTML = `<i data-lucide="check" style="width: 14px; height: 14px;"></i> Save Placement`;
      if (window.lucide) window.lucide.createIcons();
    }
  }
}

async function saveAllPlacements(container) {
  const saveAllBtn = container.querySelector('#btn-save-all-ads');
  if (saveAllBtn) {
    saveAllBtn.disabled = true;
    saveAllBtn.innerHTML = `<i data-lucide="loader-2" class="spin" style="width: 16px; height: 16px;"></i> Saving All...`;
    if (window.lucide) window.lucide.createIcons();
  }

  try {
    const masterToggle = container.querySelector('#master-ads-toggle');
    const masterEnabled = masterToggle ? masterToggle.checked : true;
    await api.updateAppSetting('ads_enabled', masterEnabled ? 'true' : 'false').catch(() => {});

    const promises = PLACEMENT_DEFS.map((def) => {
      const unitInput = container.querySelector(`#ad-unit-${def.type}`);
      const enableInput = container.querySelector(`#ad-enable-${def.type}`);
      const intervalInput = container.querySelector(`#ad-interval-${def.type}`);

      const adUnitId = unitInput ? unitInput.value.trim() : def.defaultUnitId;
      const enabled = enableInput ? enableInput.checked : true;
      const frequencyValue = intervalInput ? parseInt(intervalInput.value || String(def.defaultInterval || '3'), 10) : (def.defaultInterval || 0);

      return api.upsertAdConfig({
        adType: def.type,
        platform: 'ALL',
        adUnitId,
        enabled,
        frequencyType: (def.type === 'INTERSTITIAL' || def.type === 'NATIVE') ? 'EVERY_N_ACTIONS' : 'MANUAL',
        frequencyValue,
      });
    });

    await Promise.all(promises);
    toast.success('All ad placements updated & active worldwide!');
  } catch (err) {
    console.error('Failed to save all ad configs:', err);
    toast.error(err.message || 'Failed to save all ad configurations');
  } finally {
    if (saveAllBtn) {
      saveAllBtn.disabled = false;
      saveAllBtn.innerHTML = `<i data-lucide="check" style="width: 16px; height: 16px;"></i> Save All Placements`;
      if (window.lucide) window.lucide.createIcons();
    }
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
