import { api } from '../api.js';
import { drawer } from '../drawer.js';
import { modal } from '../modal.js';
import { toast } from '../toast.js';

export async function renderAdConfig(container) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 class="page-header-title">Ad Network & Placement Management</h1>
          <p style="font-size: 0.88rem; color: #94a3b8;">Manage AdMob unit IDs, display frequencies, cooldowns, and kill switches</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-danger" id="btn-disable-all-ads">
            <i data-lucide="power" style="width: 16px; height: 16px;"></i> Disable All Ads
          </button>
        </div>
      </div>

      <!-- Ad Configs Table Card -->
      <div class="card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ad Type</th>
                <th>Platform</th>
                <th>Ad Unit ID</th>
                <th>Frequency Strategy</th>
                <th>Cooldown</th>
                <th>Status</th>
                <th style="text-align: right; width: 100px;">Actions</th>
              </tr>
            </thead>
            <tbody id="ads-table-body">
              <tr><td colspan="7" style="text-align: center; padding: 40px; color: #94a3b8;">Loading ad configurations...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  await fetchAdConfigs(container);

  container.querySelector('#btn-disable-all-ads')?.addEventListener('click', async () => {
    const ok = await modal.confirm({
      title: 'Emergency: Disable All Ads',
      message: 'This will immediately disable all advertising placements across all mobile apps. Proceed?',
      confirmText: 'Disable All Now',
      isDanger: true,
    });
    if (ok) {
      try {
        await api.disableAllAds();
        toast.success('All ad placements have been disabled');
        fetchAdConfigs(container);
      } catch (err) {
        toast.error(err.message || 'Failed to disable ads');
      }
    }
  });
}

async function fetchAdConfigs(container) {
  const tbody = container.querySelector('#ads-table-body');
  if (!tbody) return;

  try {
    const res = await api.getAdConfigs();
    const configs = res.data || [];

    if (!configs.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 48px; color: #64748b;">No ad configs created yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = configs
      .map((c) => `
        <tr>
          <td>
            <div style="font-weight: 700; color: #fff;">${c.adType}</div>
            <div style="font-size: 0.75rem; color: #94a3b8;">Network: ${c.adNetwork}</div>
          </td>
          <td>
            <span class="badge badge-purple">${c.platform}</span>
          </td>
          <td>
            <span style="font-family: monospace; font-size: 0.82rem; color: ${c.adUnitId ? '#cbd5e1' : '#64748b'};">
              ${c.adUnitId || 'Not configured'}
            </span>
          </td>
          <td>
            <div style="font-size: 0.84rem; color: #cbd5e1;">${c.frequencyType}</div>
            <div style="font-size: 0.74rem; color: #94a3b8;">Value: ${c.frequencyValue} • Max/Session: ${c.maxPerSession || '∞'}</div>
          </td>
          <td>
            <span style="font-size: 0.84rem; color: #cbd5e1;">${c.cooldownSeconds}s</span>
          </td>
          <td>
            <span class="badge ${c.enabled ? 'badge-success' : 'badge-danger'}">
              ${c.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </td>
          <td style="text-align: right;">
            <button class="btn-icon edit-ad-btn" data-id="${c.id}" title="Edit Config">
              <i data-lucide="edit-3" style="width: 15px; height: 15px;"></i>
            </button>
          </td>
        </tr>
      `)
      .join('');

    if (window.lucide) window.lucide.createIcons();

    tbody.querySelectorAll('.edit-ad-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const config = configs.find((c) => c.id === id);
        if (config) openAdDrawer(config, container);
      });
    });
  } catch (err) {
    toast.error('Failed to load ad configurations');
  }
}

function openAdDrawer(config, mainContainer) {
  const bodyHtml = `
    <form id="ad-form" style="display: flex; flex-direction: column; gap: 18px;">
      <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(15, 23, 42, 0.6); padding: 14px 18px; border-radius: var(--radius-md); border: 1px solid rgba(255, 255, 255, 0.08);">
        <div>
          <div style="font-weight: 700; color: #fff; font-size: 1rem;">${config.adType}</div>
          <div style="font-size: 0.78rem; color: #94a3b8;">Target Platform: ${config.platform}</div>
        </div>
        <span class="badge badge-purple">${config.adNetwork}</span>
      </div>

      <div class="form-group">
        <label class="form-label" for="drawer-ad-unit-id">Ad Unit ID</label>
        <input type="text" id="drawer-ad-unit-id" class="input-text" placeholder="ca-app-pub-3940256099942544/..." value="${config.adUnitId || ''}" />
        <span class="form-help">Provided by Google AdMob Console</span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
        <div class="form-group">
          <label class="form-label" for="drawer-ad-freq-type">Frequency Strategy</label>
          <select id="drawer-ad-freq-type" class="input-select">
            <option value="EVERY_N_ACTIONS" ${config.frequencyType === 'EVERY_N_ACTIONS' ? 'selected' : ''}>EVERY_N_ACTIONS</option>
            <option value="EVERY_N_MINUTES" ${config.frequencyType === 'EVERY_N_MINUTES' ? 'selected' : ''}>EVERY_N_MINUTES</option>
            <option value="ON_SCREEN_OPEN" ${config.frequencyType === 'ON_SCREEN_OPEN' ? 'selected' : ''}>ON_SCREEN_OPEN</option>
            <option value="MANUAL" ${config.frequencyType === 'MANUAL' ? 'selected' : ''}>MANUAL</option>
          </select>
        </div>

        <div class="form-group">
          <label class="form-label" for="drawer-ad-freq-val">Frequency Value</label>
          <input type="number" id="drawer-ad-freq-val" class="input-text" value="${config.frequencyValue ?? 0}" min="0" />
        </div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
        <div class="form-group">
          <label class="form-label" for="drawer-ad-cooldown">Cooldown (seconds)</label>
          <input type="number" id="drawer-ad-cooldown" class="input-text" value="${config.cooldownSeconds ?? 0}" min="0" />
        </div>

        <div class="form-group">
          <label class="form-label" for="drawer-ad-max-session">Max per Session</label>
          <input type="number" id="drawer-ad-max-session" class="input-text" value="${config.maxPerSession ?? 0}" min="0" />
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 6px;">
        <label class="toggle-switch">
          <div>
            <div style="font-size: 0.88rem; font-weight: 600; color: #fff;">Placement Enabled</div>
            <div style="font-size: 0.74rem; color: #94a3b8;">Serve this ad placement to mobile users</div>
          </div>
          <label class="switch">
            <input type="checkbox" id="drawer-ad-enabled" ${config.enabled ? 'checked' : ''} />
            <span class="slider"></span>
          </label>
        </label>
      </div>
    </form>
  `;

  drawer.open({
    title: `Edit ${config.adType} Ad Config`,
    bodyHtml,
    saveText: 'Save Ad Config',
    onSave: async () => {
      const adUnitId = document.getElementById('drawer-ad-unit-id').value.trim();
      const frequencyType = document.getElementById('drawer-ad-freq-type').value;
      const frequencyValue = parseInt(document.getElementById('drawer-ad-freq-val').value || '0', 10);
      const cooldownSeconds = parseInt(document.getElementById('drawer-ad-cooldown').value || '0', 10);
      const maxPerSession = parseInt(document.getElementById('drawer-ad-max-session').value || '0', 10);
      const enabled = document.getElementById('drawer-ad-enabled').checked;

      const payload = {
        adUnitId,
        frequencyType,
        frequencyValue,
        cooldownSeconds,
        maxPerSession,
        enabled,
      };

      try {
        await api.updateAdConfig(config.id, payload);
        toast.success('Ad configuration updated');
        fetchAdConfigs(mainContainer);
      } catch (err) {
        toast.error(err.message || 'Failed to update ad config');
        throw err;
      }
    },
  });
}
