import { api } from '../api.js';
import { drawer } from '../drawer.js';
import { modal } from '../modal.js';
import { toast } from '../toast.js';

export async function renderCategories(container, options = {}) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <!-- Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 class="page-header-title">Categories Management</h1>
          <p style="font-size: 0.88rem; color: var(--text-secondary);">Organize and curate prompt inspiration categories</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" id="btn-refresh-categories">
            <i data-lucide="refresh-cw" style="width: 15px; height: 15px;"></i> Refresh
          </button>
          <button class="btn btn-primary" id="btn-create-category">
            <i data-lucide="plus" style="width: 16px; height: 16px;"></i> + Add Category
          </button>
        </div>
      </div>

      <!-- Categories Table Card -->
      <div class="card" style="padding: 0; overflow: hidden;">
        <div class="table-responsive">
          <table class="data-table" style="margin: 0;">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Featured</th>
                <th>Status</th>
                <th style="text-align: right; width: 120px;">Actions</th>
              </tr>
            </thead>
            <tbody id="categories-table-body">
              <tr><td colspan="4" style="text-align: center; padding: 40px; color: var(--text-muted);">Loading categories...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  await fetchCategories(container);

  container.querySelector('#btn-refresh-categories')?.addEventListener('click', () => {
    fetchCategories(container);
  });

  container.querySelector('#btn-create-category')?.addEventListener('click', () => openCategoryDrawer(null, container));

  if (options.create) {
    openCategoryDrawer(null, container);
  }
}

async function fetchCategories(container) {
  const tbody = container.querySelector('#categories-table-body');
  if (!tbody) return;

  try {
    const res = await api.getCategories();
    const categories = res.data || [];

    if (!categories.length) {
      tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; padding: 48px; color: var(--text-muted);">No categories created yet. Click "+ Add Category" to create one.</td></tr>`;
      return;
    }

    tbody.innerHTML = categories
      .map((c) => `
        <tr>
          <td>
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 38px; height: 38px; border-radius: 10px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.2)); border: 1px solid rgba(99, 102, 241, 0.3); display: flex; align-items: center; justify-content: center; color: #818cf8; font-weight: 700; font-size: 1rem;">
                ${(c.name || 'C')[0].toUpperCase()}
              </div>
              <div>
                <div style="font-weight: 600; color: var(--text-primary); font-size: 0.95rem;">${c.name}</div>
                <div style="font-size: 0.76rem; color: var(--text-muted);">/${c.slug}</div>
              </div>
            </div>
          </td>
          <td>
            <span class="badge ${c.isFeatured ? 'badge-purple' : 'badge-secondary'}">
              ${c.isFeatured ? '★ Featured' : 'Standard'}
            </span>
          </td>
          <td>
            <span class="badge ${c.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}">
              ${c.status}
            </span>
          </td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 6px;">
              <button class="btn btn-secondary btn-sm edit-cat-btn" data-id="${c.id}" title="Edit Category">
                <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
              </button>
              <button class="btn btn-danger btn-sm delete-cat-btn" data-id="${c.id}" title="Delete Category">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
              </button>
            </div>
          </td>
        </tr>
      `)
      .join('');

    if (window.lucide) window.lucide.createIcons();

    tbody.querySelectorAll('.edit-cat-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const cat = categories.find((c) => c.id === id);
        if (cat) openCategoryDrawer(cat, container);
      });
    });

    tbody.querySelectorAll('.delete-cat-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const cat = categories.find((c) => c.id === id);
        modal.confirm({
          title: 'Delete Category',
          message: `Are you sure you want to delete category "<strong>${cat ? cat.name : ''}</strong>"? Prompts in this category must be reassigned first.`,
          confirmText: 'Delete Category',
          confirmType: 'danger',
          onConfirm: async () => {
            try {
              await api.deleteCategory(id);
              toast.success('Category deleted successfully');
              await fetchCategories(container);
            } catch (err) {
              toast.error(err.message || 'Failed to delete category');
              throw err;
            }
          },
        });
      });
    });
  } catch (err) {
    toast.error('Failed to load categories');
  }
}

function openCategoryDrawer(cat, mainContainer) {
  const isEdit = !!cat;

  const bodyHtml = `
    <form id="cat-form" style="display: flex; flex-direction: column; gap: 20px;">
      <div class="form-group">
        <label class="form-label" for="drawer-cat-name">Category Name *</label>
        <input type="text" id="drawer-cat-name" class="input-text" placeholder="e.g. Cinematic, Anime, 3D Art, Photography" value="${cat ? cat.name : ''}" required />
      </div>

      <div class="form-group">
        <label class="form-label" for="drawer-cat-status">Status</label>
        <select id="drawer-cat-status" class="input-select">
          <option value="ACTIVE" ${!cat || cat.status === 'ACTIVE' ? 'selected' : ''}>ACTIVE (Visible)</option>
          <option value="INACTIVE" ${cat && cat.status === 'INACTIVE' ? 'selected' : ''}>INACTIVE (Hidden)</option>
        </select>
      </div>

      <label class="toggle-switch" style="margin-top: 6px;">
        <div>
          <div style="font-size: 0.9rem; font-weight: 600; color: #fff;">Featured Category</div>
          <div style="font-size: 0.76rem; color: var(--text-secondary);">Highlight prominently on app home & explore screen</div>
        </div>
        <label class="switch">
          <input type="checkbox" id="drawer-cat-featured" ${cat && cat.isFeatured ? 'checked' : ''} />
          <span class="slider"></span>
        </label>
      </label>
    </form>
  `;

  drawer.open({
    title: isEdit ? 'Edit Category' : 'Create New Category',
    bodyHtml,
    saveText: isEdit ? 'Save Changes' : 'Create Category',
    onSave: async () => {
      const name = document.getElementById('drawer-cat-name').value.trim();
      const status = document.getElementById('drawer-cat-status').value;
      const isFeatured = document.getElementById('drawer-cat-featured').checked;

      if (!name) {
        toast.error('Category name is required');
        throw new Error('Name required');
      }

      const payload = {
        name,
        status,
        isFeatured,
      };

      try {
        if (isEdit) {
          await api.updateCategory(cat.id, payload);
          toast.success('Category updated successfully');
        } else {
          await api.createCategory(payload);
          toast.success('Category created successfully');
        }
        fetchCategories(mainContainer);
      } catch (err) {
        toast.error(err.message || 'Failed to save category');
        throw err;
      }
    },
  });
}

