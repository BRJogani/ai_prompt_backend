import { api } from '../api.js';
import { modal } from '../modal.js';
import { toast } from '../toast.js';

export async function renderTags(container) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 class="page-header-title">Tags Management</h1>
          <p style="font-size: 0.88rem; color: var(--text-secondary);">Keywords used for searching and categorizing prompt aesthetics</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" id="btn-refresh-tags">
            <i data-lucide="refresh-cw" style="width: 15px; height: 15px;"></i> Refresh
          </button>
          <button class="btn btn-primary" id="btn-create-tag">
            <i data-lucide="plus" style="width: 16px; height: 16px;"></i> + Add Tag
          </button>
        </div>
      </div>

      <div class="card" style="padding: 0; overflow: hidden;">
        <div class="table-responsive">
          <table class="data-table" style="margin: 0;">
            <thead>
              <tr>
                <th>Tag Name</th>
                <th>Slug</th>
                <th>Created Date</th>
                <th style="text-align: right; width: 120px;">Actions</th>
              </tr>
            </thead>
            <tbody id="tags-table-body">
              <tr><td colspan="4" style="text-align: center; padding: 40px; color: var(--text-muted);">Loading tags catalog...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  await fetchTags(container);

  container.querySelector('#btn-refresh-tags')?.addEventListener('click', () => fetchTags(container));
  container.querySelector('#btn-create-tag')?.addEventListener('click', () => openTagDialog(null, container));
}

async function fetchTags(container) {
  const tbody = container.querySelector('#tags-table-body');
  if (!tbody) return;

  try {
    const res = await api.getTags();
    const tags = res.data || [];

    if (!tags.length) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 48px; color: var(--text-muted);">No tags defined yet. Click "+ Add Tag" to create one.</td></tr>`;
      return;
    }

    tbody.innerHTML = tags
      .map((t) => `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 8px;">
              <span class="badge badge-purple" style="font-size: 0.84rem; padding: 5px 10px;">#${escapeHtml(t.name)}</span>
            </div>
          </td>
          <td style="color: var(--text-muted); font-size: 0.84rem; font-family: monospace;">/${t.slug}</td>
          <td style="color: var(--text-muted); font-size: 0.84rem;">${t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '—'}</td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 6px;">
              <button class="btn-icon edit-tag-btn" data-id="${t.id}" title="Edit Tag">
                <i data-lucide="edit-3" style="width: 15px; height: 15px;"></i>
              </button>
              <button class="btn-icon delete-tag-btn" data-id="${t.id}" title="Delete Tag" style="color: var(--status-danger);">
                <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
              </button>
            </div>
          </td>
        </tr>
      `)
      .join('');

    if (window.lucide) window.lucide.createIcons();

    tbody.querySelectorAll('.edit-tag-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const tag = tags.find((t) => t.id === id);
        if (tag) openTagDialog(tag, container);
      });
    });

    tbody.querySelectorAll('.delete-tag-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const tag = tags.find((t) => t.id === id);
        modal.confirm({
          title: 'Delete Tag',
          message: `Are you sure you want to delete tag "<strong>#${tag ? escapeHtml(tag.name) : ''}</strong>"? Prompts with this tag will remain active.`,
          confirmText: 'Delete Tag',
          confirmType: 'danger',
          onConfirm: async () => {
            try {
              await api.deleteTag(id);
              toast.success('Tag deleted successfully');
              await fetchTags(container);
            } catch (err) {
              toast.error(err.message || 'Failed to delete tag');
              throw err;
            }
          },
        });
      });
    });
  } catch (err) {
    toast.error('Failed to load tags');
  }
}

function openTagDialog(tag, mainContainer) {
  const isEdit = !!tag;

  const bodyHtml = `
    <form id="tag-dialog-form" style="display: flex; flex-direction: column; gap: 16px;" novalidate>
      <div class="form-group">
        <label class="form-label" for="dialog-tag-name">Tag Name <span style="color: #fb7185;">*</span></label>
        <input type="text" id="dialog-tag-name" class="input-text" placeholder="e.g. Cinematic, Portrait, 3D Art, Luxury" value="${tag ? escapeHtml(tag.name) : ''}" maxlength="60" required />
        <div class="invalid-feedback" id="err-tag-name" style="display: none;"></div>
      </div>

      <div class="form-group">
        <label class="form-label" for="dialog-tag-slug">Custom Slug <span style="font-weight: 400; color: var(--text-muted);">(optional)</span></label>
        <input type="text" id="dialog-tag-slug" class="input-text" placeholder="e.g. cinematic (leave blank to auto-generate)" value="${tag && tag.slug ? escapeHtml(tag.slug) : ''}" maxlength="80" />
        <span class="form-help">Lowercase letters, numbers, and hyphens only</span>
        <div class="invalid-feedback" id="err-tag-slug" style="display: none;"></div>
      </div>
    </form>
  `;

  modal.dialog({
    title: isEdit ? 'Edit Tag' : 'Create New Tag',
    bodyHtml,
    confirmText: isEdit ? 'Update Tag' : 'Create Tag',
    maxWidth: '460px',
    onConfirm: async () => {
      const nameInput = document.getElementById('dialog-tag-name');
      const slugInput = document.getElementById('dialog-tag-slug');

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

      clearError(nameInput, document.getElementById('err-tag-name'));
      clearError(slugInput, document.getElementById('err-tag-slug'));

      let hasValidationErrors = false;

      // 1. Validate Name
      const name = nameInput.value.trim();
      if (!name) {
        setError(nameInput, document.getElementById('err-tag-name'), 'Tag name is required');
        hasValidationErrors = true;
      } else if (name.length > 60) {
        setError(nameInput, document.getElementById('err-tag-name'), 'Tag name cannot exceed 60 characters');
        hasValidationErrors = true;
      }

      // 2. Validate Slug (if provided)
      const slug = slugInput.value.trim();
      if (slug) {
        const slugRegex = /^[a-z0-9-]+$/;
        if (!slugRegex.test(slug)) {
          setError(slugInput, document.getElementById('err-tag-slug'), 'Slug must contain only lowercase letters, numbers, and hyphens');
          hasValidationErrors = true;
        } else if (slug.length > 80) {
          setError(slugInput, document.getElementById('err-tag-slug'), 'Slug cannot exceed 80 characters');
          hasValidationErrors = true;
        }
      }

      if (hasValidationErrors) {
        toast.error('Please resolve the errors highlighted in the form');
        throw new Error('Validation failed');
      }

      const payload = {
        name,
        ...(slug ? { slug } : {}),
      };

      try {
        if (isEdit) {
          await api.updateTag(tag.id, payload);
          toast.success('Tag updated successfully');
        } else {
          await api.createTag(payload);
          toast.success('Tag created successfully');
        }
        await fetchTags(mainContainer);
      } catch (err) {
        toast.error(err.message || 'Failed to save tag');
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

