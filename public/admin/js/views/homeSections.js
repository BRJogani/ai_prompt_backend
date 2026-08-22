import { api } from '../api.js';
import { drawer } from '../drawer.js';
import { modal } from '../modal.js';
import { toast } from '../toast.js';

export async function renderHomeSections(container) {
  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 class="page-header-title">Home Page Sections</h1>
          <p style="font-size: 0.88rem; color: #94a3b8;">Order and customize dynamic content sections displayed in the mobile app feed</p>
        </div>
        <button class="btn btn-primary" id="btn-create-section">
          <i data-lucide="plus" style="width: 16px; height: 16px;"></i> Add Section
        </button>
      </div>

      <div class="card">
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 50px;">Order</th>
                <th>Section Title</th>
                <th>Section Type</th>
                <th>Category Binding</th>
                <th>Max Items</th>
                <th>Status</th>
                <th style="text-align: right; width: 120px;">Actions</th>
              </tr>
            </thead>
            <tbody id="sections-table-body">
              <tr><td colspan="7" style="text-align: center; padding: 40px; color: #94a3b8;">Loading home sections...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  await fetchSections(container);

  container.querySelector('#btn-create-section')?.addEventListener('click', () => openSectionDrawer(null, container));
}

async function fetchSections(container) {
  const tbody = container.querySelector('#sections-table-body');
  if (!tbody) return;

  try {
    const [sectionsRes, categoriesRes] = await Promise.all([
      api.getHomeSections(),
      api.getCategories().catch(() => ({ data: [] })),
    ]);

    const sections = sectionsRes.data || [];
    const categories = categoriesRes.data || [];
    const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

    if (!sections.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 48px; color: #64748b;">No home sections configured yet.</td></tr>`;
      return;
    }

    tbody.innerHTML = sections
      .map((s) => `
        <tr>
          <td style="font-weight: 700; color: #818cf8;">#${s.sortOrder ?? 0}</td>
          <td>
            <div style="font-weight: 600; color: #fff;">${s.title}</div>
          </td>
          <td>
            <span class="badge badge-cyan">${s.sectionType}</span>
          </td>
          <td>
            ${s.categoryId ? `<span class="badge badge-purple">${catMap[s.categoryId] || s.categoryId}</span>` : '<span style="color: #64748b; font-size: 0.8rem;">Global Feed</span>'}
          </td>
          <td>
            <span style="font-weight: 600; color: #cbd5e1;">${s.itemLimit ?? 10} items</span>
          </td>
          <td>
            <span class="badge ${s.status === 'ACTIVE' ? 'badge-success' : 'badge-danger'}">
              ${s.status}
            </span>
          </td>
          <td style="text-align: right;">
            <div style="display: inline-flex; gap: 6px;">
              <button class="btn-icon edit-section-btn" data-id="${s.id}" title="Edit Section">
                <i data-lucide="edit-3" style="width: 15px; height: 15px;"></i>
              </button>
              <button class="btn-icon delete-section-btn" data-id="${s.id}" title="Delete Section" style="color: #fb7185;">
                <i data-lucide="trash-2" style="width: 15px; height: 15px;"></i>
              </button>
            </div>
          </td>
        </tr>
      `)
      .join('');

    if (window.lucide) window.lucide.createIcons();

    tbody.querySelectorAll('.edit-section-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        const sec = sections.find((s) => s.id === id);
        if (sec) openSectionDrawer(sec, container, categories);
      });
    });

    tbody.querySelectorAll('.delete-section-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const sec = sections.find((s) => s.id === id);
        const ok = await modal.confirm({
          title: 'Delete Home Section',
          message: `Are you sure you want to delete section "${sec ? sec.title : ''}"?`,
          confirmText: 'Delete',
        });
        if (ok) {
          try {
            await api.deleteHomeSection(id);
            toast.success('Section deleted');
            fetchSections(container);
          } catch (err) {
            toast.error(err.message || 'Failed to delete section');
          }
        }
      });
    });
  } catch (err) {
    toast.error('Failed to load home sections');
  }
}

async function openSectionDrawer(sec, mainContainer, categories = []) {
  const isEdit = !!sec;

  if (!categories.length) {
    const catRes = await api.getCategories().catch(() => ({ data: [] }));
    categories = catRes.data || [];
  }

  const sectionTypes = ['TRENDING', 'LATEST', 'POPULAR', 'POPULAR_VIDEO', 'POPULAR_IMAGE', 'CATEGORY', 'FEATURED'];

  const bodyHtml = `
    <form id="section-form" style="display: flex; flex-direction: column; gap: 18px;">
      <div class="form-group">
        <label class="form-label" for="drawer-sec-title">Section Title *</label>
        <input type="text" id="drawer-sec-title" class="input-text" placeholder="e.g. Trending Now, Popular Videos" value="${sec ? sec.title : ''}" required />
      </div>

      <div class="form-group">
        <label class="form-label" for="drawer-sec-type">Section Type *</label>
        <select id="drawer-sec-type" class="input-select">
          ${sectionTypes.map((t) => `<option value="${t}" ${sec && sec.sectionType === t ? 'selected' : ''}>${t}</option>`).join('')}
        </select>
      </div>

      <div class="form-group" id="sec-category-group" style="${sec && sec.sectionType === 'CATEGORY' ? '' : 'display: none;'}">
        <label class="form-label" for="drawer-sec-category">Target Category (Required for CATEGORY type)</label>
        <select id="drawer-sec-category" class="input-select">
          <option value="">Select Category</option>
          ${categories.map((c) => `<option value="${c.id}" ${sec && sec.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
        </select>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 14px;">
        <div class="form-group">
          <label class="form-label" for="drawer-sec-limit">Max Item Limit (1-50)</label>
          <input type="number" id="drawer-sec-limit" class="input-text" value="${sec ? sec.itemLimit ?? 10 : 10}" min="1" max="50" />
        </div>

        <div class="form-group">
          <label class="form-label" for="drawer-sec-order">Sort Order (0-999)</label>
          <input type="number" id="drawer-sec-order" class="input-text" value="${sec ? sec.sortOrder ?? 0 : 0}" min="0" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="drawer-sec-status">Status</label>
        <select id="drawer-sec-status" class="input-select">
          <option value="ACTIVE" ${!sec || sec.status === 'ACTIVE' ? 'selected' : ''}>ACTIVE</option>
          <option value="INACTIVE" ${sec && sec.status === 'INACTIVE' ? 'selected' : ''}>INACTIVE</option>
        </select>
      </div>
    </form>
  `;

  drawer.open({
    title: isEdit ? 'Edit Home Section' : 'Create Home Section',
    bodyHtml,
    saveText: isEdit ? 'Update Section' : 'Add Section',
    onSave: async () => {
      const title = document.getElementById('drawer-sec-title').value.trim();
      const sectionType = document.getElementById('drawer-sec-type').value;
      const categoryId = document.getElementById('drawer-sec-category').value || undefined;
      const itemLimit = parseInt(document.getElementById('drawer-sec-limit').value || '10', 10);
      const sortOrder = parseInt(document.getElementById('drawer-sec-order').value || '0', 10);
      const status = document.getElementById('drawer-sec-status').value;

      if (!title) {
        toast.error('Section title is required');
        throw new Error('Title required');
      }

      if (sectionType === 'CATEGORY' && !categoryId) {
        toast.error('Category is required for CATEGORY section type');
        throw new Error('Category required');
      }

      const payload = {
        title,
        sectionType,
        ...(categoryId ? { categoryId } : {}),
        itemLimit,
        sortOrder,
        status,
      };

      try {
        if (isEdit) {
          await api.updateHomeSection(sec.id, payload);
          toast.success('Section updated');
        } else {
          await api.createHomeSection(payload);
          toast.success('Section created');
        }
        fetchSections(mainContainer);
      } catch (err) {
        toast.error(err.message || 'Failed to save home section');
        throw err;
      }
    },
  });

  // Toggle category selector on type change
  document.getElementById('drawer-sec-type')?.addEventListener('change', (e) => {
    const catGroup = document.getElementById('sec-category-group');
    if (catGroup) {
      catGroup.style.display = e.target.value === 'CATEGORY' ? 'block' : 'none';
    }
  });
}
