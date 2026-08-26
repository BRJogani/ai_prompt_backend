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
                <th style="width: 60px;">Image</th>
                <th>Category Name</th>
                <th>Featured</th>
                <th>Status</th>
                <th style="text-align: right; width: 120px;">Actions</th>
              </tr>
            </thead>
            <tbody id="categories-table-body">
              <tr><td colspan="5" style="text-align: center; padding: 40px; color: var(--text-muted);">Loading categories...</td></tr>
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
      tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 48px; color: var(--text-muted);">No categories created yet. Click "+ Add Category" to create one.</td></tr>`;
      return;
    }

    tbody.innerHTML = categories
      .map((c) => {
        const imgUrl = c.coverImageUrl || c.iconUrl;
        const safeName = (c.name || '').replace(/"/g, '&quot;');
        const imageHtml = imgUrl
          ? `<img src="${imgUrl}" class="category-table-img cat-image-click" alt="${safeName}" data-full-url="${imgUrl}" data-title="${safeName}" title="Click to view full image" onerror="this.outerHTML='<div class=\\'cat-avatar-initial\\'>${(c.name || 'C')[0].toUpperCase()}</div>'" />`
          : `<div style="width: 44px; height: 44px; aspect-ratio: 1/1; border-radius: 8px; background: linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(6, 182, 212, 0.2)); border: 1px solid rgba(99, 102, 241, 0.3); display: flex; align-items: center; justify-content: center; color: #818cf8; font-weight: 700; font-size: 1.1rem;">${(c.name || 'C')[0].toUpperCase()}</div>`;

        return `
          <tr>
            <td>
              ${imageHtml}
            </td>
            <td>
              <div>
                <div style="font-weight: 600; color: var(--text-primary); font-size: 0.95rem;">${c.name}</div>
                <div style="font-size: 0.76rem; color: var(--text-muted);">/${c.slug}</div>
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
        `;
      })
      .join('');

    if (window.lucide) window.lucide.createIcons();

    tbody.querySelectorAll('.cat-image-click').forEach((img) => {
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = img.getAttribute('data-full-url');
        const title = img.getAttribute('data-title') || 'Category Image';
        if (url) modal.imageLightbox(url, title, { isSquare: true });
      });
    });

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
  let queuedImageFile = null;
  let currentImageUrl = cat ? (cat.coverImageUrl || cat.iconUrl || '') : '';

  const bodyHtml = `
    <form id="cat-form" style="display: flex; flex-direction: column; gap: 20px;">
      <!-- Category Cover Image Upload (1:1 Ratio) -->
      <div class="form-group">
        <label class="form-label" style="display: flex; justify-content: space-between; align-items: center;">
          <span>Category Image (1:1 Ratio)</span>
          <span style="font-size: 0.76rem; color: var(--accent-cyan); font-weight: 600;">1:1 Square &bull; PNG, JPG, WebP</span>
        </label>
        
        <input type="file" id="drawer-cat-file-input" accept="image/png, image/jpeg, image/webp" style="display: none;" />

        <div id="drawer-cat-image-container">
          <!-- Dynamically populated by renderUI -->
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="drawer-cat-name">Category Name *</label>
        <input type="text" id="drawer-cat-name" class="input-text" placeholder="e.g. Cinematic, Anime, 3D Art, Photography" value="${cat ? cat.name : ''}" required />
      </div>

      <div class="form-group">
        <label class="form-label" for="drawer-cat-desc">Description</label>
        <textarea id="drawer-cat-desc" class="input-textarea" rows="2" placeholder="Brief description of this category...">${cat ? (cat.description || '') : ''}</textarea>
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
          <div style="font-size: 0.76rem; color: var(--text-secondary);">Highlight prominently on app home & explore top chips</div>
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
      const description = document.getElementById('drawer-cat-desc').value.trim();
      const status = document.getElementById('drawer-cat-status').value;
      const isFeatured = document.getElementById('drawer-cat-featured').checked;

      if (!name) {
        toast.error('Category name is required');
        throw new Error('Name required');
      }

      let coverImageUrl = currentImageUrl;

      // If a new image file is queued, upload it to Cloudinary first
      if (queuedImageFile) {
        try {
          const uploadRes = await api.uploadCategoryImage(cat ? cat.id : null, queuedImageFile);
          if (uploadRes.data) {
            coverImageUrl = uploadRes.data.coverImageUrl || uploadRes.data.secureUrl || uploadRes.data.thumbnailUrl;
          }
        } catch (uploadErr) {
          toast.error(uploadErr.message || 'Failed to upload category image');
          throw uploadErr;
        }
      }

      const payload = {
        name,
        description: description || null,
        status,
        isFeatured,
        coverImageUrl: coverImageUrl || null,
        iconUrl: coverImageUrl || null,
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

  // Wire up dropzone and image preview in the opened drawer
  setTimeout(() => {
    setupImageDropzone();
  }, 50);

  function setupImageDropzone() {
    const fileInput = document.getElementById('drawer-cat-file-input');
    const containerEl = document.getElementById('drawer-cat-image-container');
    if (!fileInput || !containerEl) return;

    function renderUI() {
      if (currentImageUrl || queuedImageFile) {
        const displayUrl = queuedImageFile ? URL.createObjectURL(queuedImageFile) : currentImageUrl;
        containerEl.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 16px; background: rgba(15, 23, 42, 0.6); border: 1px solid var(--border-subtle); border-radius: var(--radius-lg);">
            <!-- 1:1 Aspect Ratio Preview Card -->
            <div class="category-img-preview-card" id="drawer-cat-preview-card" title="Click to view full image">
              <img src="${displayUrl}" id="drawer-cat-preview-img" alt="Category 1:1 Image" />
              <div style="position: absolute; bottom: 6px; right: 6px; background: rgba(0,0,0,0.7); border-radius: 6px; padding: 2px 6px; font-size: 0.68rem; font-weight: 700; color: #38bdf8; backdrop-filter: blur(4px);">
                1:1
              </div>
            </div>

            <!-- Action Controls -->
            <div style="display: flex; gap: 8px;">
              <button type="button" class="btn btn-secondary btn-sm" id="btn-change-cat-image" style="padding: 6px 12px; font-size: 0.8rem;">
                <i data-lucide="upload" style="width: 14px; height: 14px;"></i> Change Image
              </button>
              <button type="button" class="btn btn-danger btn-sm" id="btn-remove-cat-image" style="padding: 6px 12px; font-size: 0.8rem;">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Remove
              </button>
            </div>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();

        containerEl.querySelector('#drawer-cat-preview-card')?.addEventListener('click', () => {
          modal.imageLightbox(displayUrl, document.getElementById('drawer-cat-name')?.value || 'Category Image', { isSquare: true });
        });

        containerEl.querySelector('#btn-change-cat-image')?.addEventListener('click', () => fileInput.click());
        containerEl.querySelector('#btn-remove-cat-image')?.addEventListener('click', () => {
          queuedImageFile = null;
          currentImageUrl = '';
          fileInput.value = '';
          renderUI();
        });
      } else {
        containerEl.innerHTML = `
          <div id="drawer-cat-dropzone" class="media-dropzone" style="padding: 24px 16px; cursor: pointer; text-align: center;">
            <div class="media-dropzone-icon" style="width: 44px; height: 44px; margin: 0 auto 10px auto;">
              <i data-lucide="image-plus" style="width: 22px; height: 22px; color: var(--accent-cyan);"></i>
            </div>
            <div style="font-size: 0.88rem; font-weight: 600; color: var(--text-primary);">Click or drag & drop category image</div>
            <div style="font-size: 0.76rem; color: var(--text-muted); margin-top: 4px;">Displays in 1:1 square ratio &bull; PNG, JPG, WebP</div>
          </div>
        `;
        if (window.lucide) window.lucide.createIcons();

        const dropzone = containerEl.querySelector('#drawer-cat-dropzone');
        dropzone?.addEventListener('click', () => fileInput.click());

        dropzone?.addEventListener('dragover', (e) => {
          e.preventDefault();
          dropzone.classList.add('dragover');
        });

        dropzone?.addEventListener('dragleave', () => {
          dropzone.classList.remove('dragover');
        });

        dropzone?.addEventListener('drop', (e) => {
          e.preventDefault();
          dropzone.classList.remove('dragover');
          if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFile(e.dataTransfer.files[0]);
          }
        });
      }
    }

    function handleFile(file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file (PNG, JPG, WebP)');
        return;
      }
      queuedImageFile = file;
      renderUI();
    }

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFile(e.target.files[0]);
      }
    });

    renderUI();
  }
}


