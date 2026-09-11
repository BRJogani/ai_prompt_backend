import { api } from '../api.js';
import { toast } from '../toast.js';

export async function renderAppConfig(container) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 28px;">
      <!-- Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 class="page-header-title">Remote Configuration & Feature Flags</h1>
          <p style="font-size: 0.88rem; color: #94a3b8;">Real-time flags and settings pushed directly to mobile apps without app store updates</p>
        </div>
      </div>

      <!-- Synchronized Shuffle Management -->
      <div class="card" style="border: 1px solid rgba(99, 102, 241, 0.3); background: linear-gradient(135deg, rgba(30, 27, 75, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%);">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div class="card-title">
            <i data-lucide="shuffle" style="color: #818cf8;"></i>
            Synchronized Feed Shuffling & Intervals
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-force-reshuffle" style="border-color: rgba(99, 102, 241, 0.5);">
            <i data-lucide="refresh-cw" style="width: 14px; height: 14px;"></i> Reshuffle Feed Now
          </button>
        </div>
        <div class="card-body" style="display: flex; flex-direction: column; gap: 16px;">
          <p style="font-size: 0.85rem; color: #cbd5e1; margin: 0; line-height: 1.5;">
            Prompts are deterministically randomized so that <strong>all devices worldwide see the exact same order</strong> for the given time window. Order rotates automatically according to the configured interval.
          </p>

          <!-- Shuffle On/Off Master Toggle -->
          <div style="display: flex; gap: 20px; align-items: center; justify-content: space-between; flex-wrap: wrap; background: rgba(0,0,0,0.3); padding: 16px 20px; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.08);">
            <div>
              <div style="display: flex; align-items: center; gap: 10px;">
                <span style="font-weight: 700; color: #fff; font-size: 0.95rem;">Feed Shuffling</span>
                <span id="shuffle-status-badge" class="badge badge-success">ACTIVE</span>
              </div>
              <p style="font-size: 0.78rem; color: #94a3b8; margin: 4px 0 0 0;">
                Turn feed shuffling ON or OFF. When OFF, prompts display in standard chronological order.
              </p>
            </div>
            <div style="display: flex; align-items: center; gap: 12px;">
              <label class="switch">
                <input type="checkbox" id="shuffle-master-toggle" checked />
                <span class="slider"></span>
              </label>
              <span id="shuffle-master-toggle-label" style="font-size: 0.88rem; font-weight: 600; color: #f8fafc; min-width: 32px;">ON</span>
            </div>
          </div>

          <!-- Shuffle Interval Selector -->
          <div style="display: flex; gap: 20px; align-items: center; justify-content: space-between; flex-wrap: wrap; background: rgba(0,0,0,0.22); padding: 16px 20px; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.06);">
            <div>
              <div style="font-weight: 700; color: #fff; font-size: 0.95rem;">Shuffle Rotation Interval</div>
              <p style="font-size: 0.78rem; color: #94a3b8; margin: 4px 0 0 0;">
                Configure how often the synchronized random feed rotates worldwide (e.g. Daily, Weekly, Monthly, Hourly).
              </p>
            </div>
            <div style="min-width: 240px;">
              <select id="shuffle-interval-select" class="input-select" style="background: #1e1b4b; border-color: rgba(99, 102, 241, 0.5); color: #fff; font-weight: 600;">
                <option value="HOURLY">Hourly (Every 1 Hour)</option>
                <option value="DAILY" selected>Daily (Midnight UTC - Default)</option>
                <option value="WEEKLY">Weekly (Every Monday UTC)</option>
                <option value="MONTHLY">Monthly (1st of every month)</option>
              </select>
            </div>
          </div>

          <div style="display: flex; gap: 16px; align-items: center; flex-wrap: wrap; background: rgba(0,0,0,0.2); padding: 12px 16px; border-radius: var(--radius-md); border: 1px solid rgba(255,255,255,0.05);">
            <div style="font-size: 0.82rem; color: #94a3b8;">
              <strong style="color: #38bdf8;">📌 Top Selected Images Section:</strong> Prompts selected in the <strong>Top Pinned Section</strong> on the Prompts page will <strong>always display first</strong> at the top of the feed, followed by the shuffled prompts.
            </div>
          </div>
        </div>
      </div>

      <!-- Feature Flags Section -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <i data-lucide="toggle-left" style="color: #6366f1;"></i>
            Core Feature Flags
          </div>
        </div>
        <div class="card-body" id="feature-flags-container" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
          <div style="padding: 20px; color: #94a3b8; text-align: center;">Loading flags...</div>
        </div>
      </div>

      <!-- General App Settings -->
      <div class="card">
        <div class="card-header">
          <div class="card-title">
            <i data-lucide="sliders" style="color: #06b6d4;"></i>
            General App Parameters & Copy
          </div>
        </div>
        <div class="card-body" id="general-settings-container" style="display: flex; flex-direction: column; gap: 18px;">
          <div style="padding: 20px; color: #94a3b8; text-align: center;">Loading settings...</div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Wire force reshuffle button
  container.querySelector('#btn-force-reshuffle')?.addEventListener('click', async () => {
    const btn = container.querySelector('#btn-force-reshuffle');
    if (!btn) return;
    btn.disabled = true;
    const origHtml = btn.innerHTML;
    btn.innerHTML = `<i data-lucide="loader" style="width: 14px; height: 14px; animation: spin 1s linear infinite;"></i> Reshuffling...`;
    if (window.lucide) window.lucide.createIcons();

    try {
      const newSalt = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      await api.updateAppSetting('daily_shuffle_salt', newSalt);
      toast.success('Shuffled! All devices now receive this fresh synchronized order.');
    } catch (err) {
      toast.error(err.message || 'Failed to trigger reshuffle');
    } finally {
      btn.disabled = false;
      btn.innerHTML = origHtml;
      if (window.lucide) window.lucide.createIcons();
    }
  });

  await fetchAndRenderConfig(container);
}

async function fetchAndRenderConfig(container) {
  try {
    const res = await api.getAppConfig();
    const settings = res.data || [];

    // 1. Populate and Wire Dedicated Shuffle Controls
    const shuffleMasterToggle = container.querySelector('#shuffle-master-toggle');
    const shuffleMasterLabel = container.querySelector('#shuffle-master-toggle-label');
    const shuffleStatusBadge = container.querySelector('#shuffle-status-badge');
    const shuffleIntervalSelect = container.querySelector('#shuffle-interval-select');

    const shuffleEnabledSetting = settings.find((s) => s.key === 'shuffle_enabled') || settings.find((s) => s.key === 'daily_shuffle_enabled');
    const isShuffleEnabled = shuffleEnabledSetting ? shuffleEnabledSetting.value !== 'false' : true;
    const intervalSetting = settings.find((s) => s.key === 'shuffle_interval');
    const currentInterval = intervalSetting?.value?.toUpperCase() || 'DAILY';

    if (shuffleMasterToggle && shuffleMasterLabel && shuffleStatusBadge) {
      shuffleMasterToggle.checked = isShuffleEnabled;
      shuffleMasterLabel.textContent = isShuffleEnabled ? 'ON' : 'OFF';
      shuffleStatusBadge.textContent = isShuffleEnabled ? 'ACTIVE' : 'DISABLED';
      shuffleStatusBadge.className = isShuffleEnabled ? 'badge badge-success' : 'badge badge-secondary';

      shuffleMasterToggle.addEventListener('change', async (e) => {
        const enabled = e.target.checked;
        const val = enabled ? 'true' : 'false';
        shuffleMasterLabel.textContent = enabled ? 'ON' : 'OFF';
        shuffleStatusBadge.textContent = enabled ? 'ACTIVE' : 'DISABLED';
        shuffleStatusBadge.className = enabled ? 'badge badge-success' : 'badge badge-secondary';

        try {
          await Promise.all([
            api.updateAppSetting('shuffle_enabled', val),
            api.updateAppSetting('daily_shuffle_enabled', val),
          ]);
          toast.success(`Feed shuffling turned ${enabled ? 'ON' : 'OFF'}`);
        } catch (err) {
          toast.error(err.message || 'Failed to update shuffle state');
          e.target.checked = !enabled;
        }
      });
    }

    if (shuffleIntervalSelect) {
      shuffleIntervalSelect.value = currentInterval;
      shuffleIntervalSelect.addEventListener('change', async (e) => {
        const newInterval = e.target.value;
        try {
          await api.updateAppSetting('shuffle_interval', newInterval);
          toast.success(`Shuffle interval updated to ${newInterval}`);
        } catch (err) {
          toast.error(err.message || 'Failed to update shuffle interval');
        }
      });
    }

    // Filter out shuffle-specific keys from generic list
    const excludedKeys = new Set([
      'shuffle_enabled',
      'daily_shuffle_enabled',
      'shuffle_interval',
      'daily_shuffle_salt',
      'top_pinned_prompt_ids',
    ]);

    const booleanFlags = settings.filter((s) => !excludedKeys.has(s.key) && (s.valueType === 'boolean' || s.value === 'true' || s.value === 'false'));
    const textSettings = settings.filter((s) => !excludedKeys.has(s.key) && s.valueType !== 'boolean' && s.value !== 'true' && s.value !== 'false');

    const flagsContainer = container.querySelector('#feature-flags-container');
    const settingsContainer = container.querySelector('#general-settings-container');

    // Render Boolean Feature Flags
    if (flagsContainer) {
      flagsContainer.innerHTML = booleanFlags
        .map((f) => {
          const isChecked = f.value === 'true';
          return `
          <div class="toggle-switch" style="align-items: center;">
            <div>
              <div style="font-weight: 600; color: #fff; font-size: 0.9rem;">${formatSettingKey(f.key)}</div>
              <div style="font-size: 0.76rem; color: #94a3b8; margin-top: 2px;">${f.description || f.key}</div>
            </div>
            <label class="switch">
              <input type="checkbox" class="setting-toggle-input" data-key="${f.key}" ${isChecked ? 'checked' : ''} />
              <span class="slider"></span>
            </label>
          </div>
        `;
        })
        .join('');

      flagsContainer.querySelectorAll('.setting-toggle-input').forEach((input) => {
        input.addEventListener('change', async (e) => {
          const key = input.getAttribute('data-key');
          const newValue = e.target.checked ? 'true' : 'false';
          try {
            await api.updateAppSetting(key, newValue);
            toast.success(`Flag "${formatSettingKey(key)}" set to ${newValue}`);
          } catch (err) {
            toast.error(err.message || 'Failed to update setting');
            e.target.checked = !e.target.checked;
          }
        });
      });
    }

    // Render Text Settings with Inline Save
    if (settingsContainer) {
      settingsContainer.innerHTML = textSettings
        .map(
          (s) => `
        <div style="background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: var(--radius-md); padding: 18px; display: flex; flex-direction: column; gap: 10px;">
          <div style="display: flex; justify-content: space-between; align-items: baseline;">
            <label class="form-label" style="color: #fff; font-size: 0.9rem;">${formatSettingKey(s.key)}</label>
            <span style="font-size: 0.72rem; color: #64748b; font-family: monospace;">key: ${s.key}</span>
          </div>
          <p style="font-size: 0.78rem; color: #94a3b8; margin-top: -6px;">${s.description || ''}</p>
          <div style="display: flex; gap: 10px;">
            ${
              s.value.length > 80 || s.key.includes('message') || s.key.includes('text')
                ? `<textarea id="input-setting-${s.key}" class="input-textarea" rows="2">${s.value}</textarea>`
                : `<input type="text" id="input-setting-${s.key}" class="input-text" value="${s.value}" />`
            }
            <button class="btn btn-secondary save-setting-btn" data-key="${s.key}" style="align-self: flex-start;">
              <i data-lucide="check" style="width: 15px; height: 15px;"></i> Save
            </button>
          </div>
        </div>
      `,
        )
        .join('');

      settingsContainer.querySelectorAll('.save-setting-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          const key = btn.getAttribute('data-key');
          const inputEl = settingsContainer.querySelector(`#input-setting-${key}`);
          if (!inputEl) return;
          const val = inputEl.value.trim();

          btn.disabled = true;
          try {
            await api.updateAppSetting(key, val);
            toast.success(`Saved "${formatSettingKey(key)}"`);
          } catch (err) {
            toast.error(err.message || 'Failed to update setting');
          } finally {
            btn.disabled = false;
          }
        });
      });
    }

    if (window.lucide) window.lucide.createIcons();
  } catch (err) {
    toast.error('Failed to load remote configuration');
  }
}

function formatSettingKey(key) {
  return key
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
