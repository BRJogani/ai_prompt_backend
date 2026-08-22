import { api } from '../api.js';
import { modal } from '../modal.js';
import { toast } from '../toast.js';

export async function renderAiTools(container) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <!-- Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 class="page-header-title">AI Tools Management</h1>
          <p style="font-size: 0.88rem; color: var(--text-secondary);">Manage AI generation platforms (Midjourney, ChatGPT, Veo, etc.) and direct web links</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" id="btn-refresh-tools">
            <i data-lucide="refresh-cw" style="width: 15px; height: 15px;"></i> Refresh
          </button>
          <button class="btn btn-primary" id="btn-create-tool">
            <i data-lucide="plus" style="width: 16px; height: 16px;"></i> + Add AI Tool
          </button>
        </div>
      </div>

      <!-- Tools Table Card -->
      <div class="card" style="padding: 0; overflow: hidden;">
        <div class="table-responsive">
          <table class="data-table" style="margin: 0;">
            <thead>
              <tr>
                <th style="width: 70px;">Order</th>
                <th>Tool Name & Slug</th>
                <th>Official Website URL</th>
                <th>Supported Formats</th>
                <th>Status</th>
                <th style="text-align: right; width: 120px;">Actions</th>
              </tr>
            </thead>
            <tbody id="tools-table-body">
              <tr><td colspan="6" style="text-align: center; padding: 40px; color: var(--text-muted);">Loading AI tools catalog...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  await fetchTools(container);

  container.querySelector('#btn-refresh-tools')?.addEventListener('click', () => fetchTools(container));
  container.querySelector('#btn-create-tool')?.addEventListener('click', () => openToolDialog(null, container));
}

async function fetchTools(container) {
  const tbody = container.querySelector('#tools-table-body');
  if (!tbody) return;

  try {
    const res = await api.getAiTools();
    const tools = res.data || [];

    if (!tools.length) {
      tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 48px; color: var(--text-muted);">No AI tools registered yet. Click "+ Add AI Tool" to create one.</td></tr>`;
      return;
    }

    tbody.innerHTML = tools
      .map((t) => `
        <tr>
          <td style="font-weight: 700; color: var(--primary);">#${t.sortOrder ?? 0}</td>
          <td>
            <div style="display: flex; align-items: center; gap: 10px;">
              <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(168, 85, 247, 0.15); display: flex; align-items: center; justify-content: center; color: #c084fc; font-weight: 700; flex-shrink: 0;">
                <i data-lucide="cpu" style="width: 18px; height: 18px;"></i>
              </div>
              <div>
                <div style="font-weight: 600; color: var(--text-primary); font-size: 0.92rem;">${escapeHtml(t.name)}</div>
                <div style="font-size: 0.78rem; color: var(--text-muted); font-family: monospace;">/${t.slug}</div>
              </div>
            </div>
          </td>
          <td>
            ${t.websiteUrl ? `
              <a href="${t.websiteUrl}" target="_blank" rel="noopener noreferrer" style="color: var(--accent-cyan); text-decoration: none; font-size: 0.82rem; display: inline-flex; align-items: center; gap: 4px; max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                ${escapeHtml(t.websiteUrl.replace(/^https?:\/\//i, ''))}
                <i data-lucide="external-link" style="width: 12px; height: 12px; flex-shrink: 0;"></i>
              </a>
            ` : '<span style="color: var(--text-muted);">—</span>'}
          </td>
          <td>
            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
              ${(t.contentTypes || ['IMAGE']).map((ct) => `
                <span class="badge ${ct === 'VIDEO' ? 'badge-purple' : ct === 'BOTH' ? 'badge-blue' : 'badge-emerald'}">${ct}</span>
              `).join('')}
            </div>
          </td>
          <td>
            <span class="badge ${t.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}">
              ${t.status || 'ACTIVE'}
            </span>
          </td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 6px;">
              <button class="btn-icon edit-tool-btn" data-id="${t.id}" title="Edit Tool">
                <i data-lucide="edit-3" style="width: 15px; height: 15px;"></i>
              </button>
              <button class="btn-icon delete-tool-btn" data-id="${t.id}" title="Delete Tool" style="color: var(--status-danger);">
                <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
              </button>
            </div>
          </td>
        </tr>
      `)
      .join('');

    if (window.lucide) window.lucide.createIcons();

    tbody.querySelectorAll('.edit-tool-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const tool = tools.find((t) => t.id === id);
        if (tool) openToolDialog(tool, container);
      });
    });

    tbody.querySelectorAll('.delete-tool-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const tool = tools.find((t) => t.id === id);
        modal.confirm({
          title: 'Delete AI Tool',
          message: `Are you sure you want to delete AI Tool "<strong>${tool ? escapeHtml(tool.name) : ''}</strong>"? Prompts using this tool will have their tool reference unlinked.`,
          confirmText: 'Delete Tool',
          confirmType: 'danger',
          onConfirm: async () => {
            try {
              await api.deleteAiTool(id);
              toast.success('AI Tool deleted successfully');
              await fetchTools(container);
            } catch (err) {
              toast.error(err.message || 'Failed to delete AI Tool');
              throw err;
            }
          },
        });
      });
    });
  } catch (err) {
    toast.error('Failed to load AI Tools');
  }
}

function openToolDialog(tool, mainContainer) {
  const isEdit = !!tool;
  const types = tool ? tool.contentTypes || [] : ['IMAGE'];

  const bodyHtml = `
    <form id="tool-dialog-form" style="display: flex; flex-direction: column; gap: 16px;" novalidate>
      <div class="form-group">
        <label class="form-label" for="dialog-tool-name">AI Tool Name <span style="color: #fb7185;">*</span></label>
        <input type="text" id="dialog-tool-name" class="input-text" placeholder="e.g. Midjourney, ChatGPT, Veo, Flux" value="${tool ? escapeHtml(tool.name) : ''}" maxlength="120" required />
        <div class="invalid-feedback" id="err-tool-name" style="display: none;"></div>
      </div>

      <div class="form-group">
        <label class="form-label" for="dialog-tool-slug">Custom Slug <span style="font-weight: 400; color: var(--text-muted);">(optional)</span></label>
        <input type="text" id="dialog-tool-slug" class="input-text" placeholder="e.g. midjourney (leave blank to auto-generate)" value="${tool && tool.slug ? escapeHtml(tool.slug) : ''}" maxlength="140" />
        <span class="form-help">Lowercase letters, numbers, and hyphens only</span>
        <div class="invalid-feedback" id="err-tool-slug" style="display: none;"></div>
      </div>

      <div class="form-group">
        <label class="form-label" for="dialog-tool-url">Official Website URL <span style="font-weight: 400; color: var(--text-muted);">(optional)</span></label>
        <input type="url" id="dialog-tool-url" class="input-text" placeholder="https://www.midjourney.com" value="${tool && tool.websiteUrl ? escapeHtml(tool.websiteUrl) : ''}" />
        <span class="form-help">External URL opened when user clicks "Try in Tool"</span>
        <div class="invalid-feedback" id="err-tool-url" style="display: none;"></div>
      </div>

      <div class="form-group">
        <label class="form-label" for="dialog-tool-desc">Description <span style="font-weight: 400; color: var(--text-muted);">(optional)</span></label>
        <textarea id="dialog-tool-desc" class="input-textarea" rows="2" placeholder="Describe this AI tool capabilities..." maxlength="1000">${tool && tool.description ? escapeHtml(tool.description) : ''}</textarea>
        <div class="invalid-feedback" id="err-tool-desc" style="display: none;"></div>
      </div>

      <div class="form-group">
        <label class="form-label">Supported Generation Formats <span style="color: #fb7185;">*</span></label>
        <div style="display: flex; gap: 20px; margin-top: 4px; padding: 10px 14px; background: var(--bg-input); border: 1px solid var(--border-subtle); border-radius: var(--radius-md);">
          <label style="display: flex; align-items: center; gap: 8px; font-size: 0.88rem; cursor: pointer; color: var(--text-primary);">
            <input type="checkbox" id="dialog-tool-ct-image" ${types.includes('IMAGE') || types.includes('BOTH') || !isEdit ? 'checked' : ''} />
            <span>Image Generation</span>
          </label>
          <label style="display: flex; align-items: center; gap: 8px; font-size: 0.88rem; cursor: pointer; color: var(--text-primary);">
            <input type="checkbox" id="dialog-tool-ct-video" ${types.includes('VIDEO') || types.includes('BOTH') ? 'checked' : ''} />
            <span>Video Generation</span>
          </label>
        </div>
        <div class="invalid-feedback" id="err-tool-ct" style="display: none;"></div>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
        <div class="form-group">
          <label class="form-label" for="dialog-tool-order">Display Sort Order</label>
          <input type="number" id="dialog-tool-order" class="input-text" value="${tool ? tool.sortOrder ?? 0 : 0}" min="0" />
          <div class="invalid-feedback" id="err-tool-order" style="display: none;"></div>
        </div>

        <div class="form-group">
          <label class="form-label" for="dialog-tool-status">Status</label>
          <select id="dialog-tool-status" class="input-select">
            <option value="ACTIVE" ${!tool || tool.status === 'ACTIVE' ? 'selected' : ''}>ACTIVE</option>
            <option value="INACTIVE" ${tool && tool.status === 'INACTIVE' ? 'selected' : ''}>INACTIVE</option>
          </select>
        </div>
      </div>
    </form>
  `;

  modal.dialog({
    title: isEdit ? 'Edit AI Tool' : 'Add New AI Tool',
    bodyHtml,
    confirmText: isEdit ? 'Update AI Tool' : 'Create AI Tool',
    maxWidth: '540px',
    onConfirm: async () => {
      // Clear previous error messages & classes
      const nameInput = document.getElementById('dialog-tool-name');
      const slugInput = document.getElementById('dialog-tool-slug');
      const urlInput = document.getElementById('dialog-tool-url');
      const descInput = document.getElementById('dialog-tool-desc');
      const orderInput = document.getElementById('dialog-tool-order');
      const statusInput = document.getElementById('dialog-tool-status');

      const ctImage = document.getElementById('dialog-tool-ct-image');
      const ctVideo = document.getElementById('dialog-tool-ct-video');

      const clearError = (input, errEl) => {
        input?.classList.remove('is-invalid');
        if (errEl) {
          errEl.style.display = 'none';
          errEl.textContent = '';
        }
      };

      const setError = (input, errEl, msg) => {
        input?.classList.add('is-invalid');
        if (errEl) {
          errEl.style.display = 'flex';
          errEl.textContent = msg;
        }
      };

      clearError(nameInput, document.getElementById('err-tool-name'));
      clearError(slugInput, document.getElementById('err-tool-slug'));
      clearError(urlInput, document.getElementById('err-tool-url'));
      clearError(descInput, document.getElementById('err-tool-desc'));
      clearError(orderInput, document.getElementById('err-tool-order'));
      const ctErrEl = document.getElementById('err-tool-ct');
      if (ctErrEl) { ctErrEl.style.display = 'none'; ctErrEl.textContent = ''; }

      let hasValidationErrors = false;

      // 1. Validate Name
      const name = nameInput.value.trim();
      if (!name) {
        setError(nameInput, document.getElementById('err-tool-name'), 'AI Tool name is required');
        hasValidationErrors = true;
      } else if (name.length > 120) {
        setError(nameInput, document.getElementById('err-tool-name'), 'Tool name cannot exceed 120 characters');
        hasValidationErrors = true;
      }

      // 2. Validate Slug (if provided)
      const slug = slugInput.value.trim();
      if (slug) {
        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(slug)) {
          setError(slugInput, document.getElementById('err-tool-slug'), 'Slug must contain only lowercase letters, numbers, and hyphens');
          hasValidationErrors = true;
        } else if (slug.length > 140) {
          setError(slugInput, document.getElementById('err-tool-slug'), 'Slug cannot exceed 140 characters');
          hasValidationErrors = true;
        }
      }

      // 3. Validate Website URL (if provided)
      const websiteUrl = urlInput.value.trim();
      if (websiteUrl) {
        try {
          const parsed = new URL(websiteUrl);
          if (!['http:', 'https:'].includes(parsed.protocol)) {
            throw new Error('Invalid protocol');
          }
        } catch {
          setError(urlInput, document.getElementById('err-tool-url'), 'Please enter a valid URL starting with http:// or https://');
          hasValidationErrors = true;
        }
      }

      // 4. Validate Content Types
      const hasImg = ctImage?.checked;
      const hasVid = ctVideo?.checked;
      if (!hasImg && !hasVid) {
        if (ctErrEl) {
          ctErrEl.style.display = 'flex';
          ctErrEl.textContent = 'Please select at least one format (Image or Video)';
        }
        hasValidationErrors = true;
      }

      // 5. Validate Sort Order
      const sortOrderVal = orderInput.value.trim();
      const sortOrder = parseInt(sortOrderVal || '0', 10);
      if (isNaN(sortOrder) || sortOrder < 0) {
        setError(orderInput, document.getElementById('err-tool-order'), 'Sort order must be 0 or a positive number');
        hasValidationErrors = true;
      }

      if (hasValidationErrors) {
        toast.error('Please resolve the errors highlighted in the form');
        throw new Error('Validation failed');
      }

      const contentTypes = [];
      if (hasImg && hasVid) contentTypes.push('BOTH');
      else if (hasImg) contentTypes.push('IMAGE');
      else if (hasVid) contentTypes.push('VIDEO');

      const payload = {
        name,
        ...(slug ? { slug } : {}),
        websiteUrl: websiteUrl || undefined,
        description: descInput.value.trim() || undefined,
        contentTypes,
        sortOrder,
        status: statusInput.value,
      };

      try {
        if (isEdit) {
          await api.updateAiTool(tool.id, payload);
          toast.success('AI Tool updated successfully');
        } else {
          await api.createAiTool(payload);
          toast.success('AI Tool created successfully');
        }
        await fetchTools(mainContainer);
      } catch (err) {
        toast.error(err.message || 'Failed to save AI Tool');
        throw err;
      }
    },
  });
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

