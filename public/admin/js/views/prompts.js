import { api } from '../api.js';
import { modal } from '../modal.js';
import { toast } from '../toast.js';

let state = {
  prompts: [],
  categories: [],
  tags: [],
  page: 1,
  limit: 15,
  total: 0,
  search: '',
  categoryId: '',
  status: '',
};

export async function renderPrompts(container, router, options = {}) {
  if (options && options.refresh) {
    state.page = 1;
    state.search = '';
    state.categoryId = '';
    state.status = '';
  }

  container.innerHTML = `
    <div style="display: flex; flex-direction: column; gap: 24px;">
      <!-- Header -->
      <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
        <div>
          <h1 class="page-header-title">Prompt Inspirations Management</h1>
          <p style="font-size: 0.88rem; color: var(--text-secondary);">Browse, curate, and publish AI prompt inspirations</p>
        </div>
        <div style="display: flex; gap: 10px;">
          <button class="btn btn-secondary" id="btn-refresh-prompts">
            <i data-lucide="refresh-cw" style="width: 15px; height: 15px;"></i> Refresh
          </button>
          <button class="btn btn-primary" id="btn-create-prompt">
            <i data-lucide="plus" style="width: 16px; height: 16px;"></i> + Create New Prompt
          </button>
        </div>
      </div>

      <!-- Filters & Search Toolbar -->
      <div class="table-controls">
        <div class="search-input-wrapper">
          <i data-lucide="search" class="search-icon" style="width: 18px; height: 18px;"></i>
          <input type="text" id="prompt-search-input" class="input-text" placeholder="Search prompts by title or prompt text..." value="${state.search}" />
        </div>

        <div style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
          <select id="filter-category" class="input-select" style="width: auto; min-width: 170px;">
            <option value="">All Categories</option>
          </select>

          <select id="filter-status" class="input-select" style="width: auto; min-width: 140px;">
            <option value="" ${state.status === '' ? 'selected' : ''}>All Statuses</option>
            <option value="PUBLISHED" ${state.status === 'PUBLISHED' ? 'selected' : ''}>Published</option>
            <option value="DRAFT" ${state.status === 'DRAFT' ? 'selected' : ''}>Draft</option>
            <option value="REVIEW" ${state.status === 'REVIEW' ? 'selected' : ''}>Review</option>
            <option value="ARCHIVED" ${state.status === 'ARCHIVED' ? 'selected' : ''}>Archived</option>
          </select>

          ${state.search || state.categoryId || state.status ? `
            <button class="btn btn-secondary btn-sm" id="btn-clear-filters">
              <i data-lucide="x" style="width: 14px; height: 14px;"></i> Clear
            </button>
          ` : ''}
        </div>
      </div>

      <!-- Data Table Card -->
      <div class="card" style="padding: 0; overflow: hidden;">
        <div class="table-responsive">
          <table class="data-table" style="margin: 0;">
            <thead>
              <tr>
                <th style="width: 60px;">Preview</th>
                <th>Prompt Title & Category</th>
                <th>Format</th>
                <th>Status</th>
                <th>Copy & Interaction Counters</th>
                <th>Trending</th>
                <th style="text-align: right; width: 120px;">Actions</th>
              </tr>
            </thead>
            <tbody id="prompts-table-body">
              <tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">Loading prompt catalog...</td></tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div style="padding: 14px 20px; border-top: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; background: rgba(0,0,0,0.15);">
          <span style="font-size: 0.85rem; color: var(--text-muted);" id="prompts-count-label">Showing 0 prompts</span>
          <div style="display: flex; gap: 8px;" id="prompts-pagination-buttons"></div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Load auxiliary data (categories, tags)
  await loadAuxData(container);

  // Load prompts list
  await fetchPrompts(container, router);

  // Bind refresh
  container.querySelector('#btn-refresh-prompts')?.addEventListener('click', () => {
    fetchPrompts(container, router);
  });

  // Bind clear filters
  container.querySelector('#btn-clear-filters')?.addEventListener('click', () => {
    state.search = '';
    state.categoryId = '';
    state.status = '';
    state.page = 1;
    renderPrompts(container, router);
  });

  // Bind filter & search events
  const searchInput = container.querySelector('#prompt-search-input');
  let searchTimeout = null;
  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      state.search = e.target.value.trim();
      state.page = 1;
      fetchPrompts(container, router);
    }, 350);
  });

  container.querySelector('#filter-category')?.addEventListener('change', (e) => {
    state.categoryId = e.target.value;
    state.page = 1;
    fetchPrompts(container, router);
  });

  container.querySelector('#filter-status')?.addEventListener('change', (e) => {
    state.status = e.target.value;
    state.page = 1;
    fetchPrompts(container, router);
  });

  container.querySelector('#btn-create-prompt')?.addEventListener('click', () => {
    router.navigate('prompt-editor');
  });
}

async function loadAuxData(container) {
  try {
    const [catRes, tagsRes] = await Promise.all([
      api.getCategories().catch(() => ({ data: [] })),
      api.getTags().catch(() => ({ data: [] })),
    ]);

    state.categories = catRes.data || [];
    state.tags = tagsRes.data || [];

    const catSelect = container.querySelector('#filter-category');
    if (catSelect) {
      catSelect.innerHTML = `<option value="">All Categories</option>` + state.categories.map((c) => `<option value="${c.id}" ${state.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`).join('');
    }
  } catch (err) {
    console.error('Failed to load aux data', err);
  }
}

async function fetchPrompts(container, router) {
  const tbody = container.querySelector('#prompts-table-body');
  if (!tbody) return;

  try {
    const params = {
      page: state.page,
      limit: state.limit,
      ...(state.search ? { search: state.search } : {}),
      ...(state.categoryId ? { categoryId: state.categoryId } : {}),
      ...(state.status ? { status: state.status } : {}),
    };

    const res = await api.getPrompts(params);
    state.prompts = res.data || [];
    state.total = res.pagination ? res.pagination.total : state.prompts.length;

    if (!state.prompts.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 48px; color: var(--text-muted);">No prompts found matching the criteria.</td></tr>`;
      container.querySelector('#prompts-count-label').textContent = 'Showing 0 prompts';
      container.querySelector('#prompts-pagination-buttons').innerHTML = '';
      return;
    }

    tbody.innerHTML = state.prompts
      .map((p) => {
        const thumbUrl = p.media && p.media.length ? p.media[0].thumbnailUrl || p.media[0].secureUrl : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100';
        const trendingScore = (p.trendingScore != null && typeof p.trendingScore === 'number') ? p.trendingScore.toFixed(1) : '0.0';
        const copyCount = p.copyCount ?? 0;
        const viewCount = p.viewCount ?? 0;
        const favoriteCount = p.favoriteCount ?? 0;

        return `
          <tr>
            <td>
              <img src="${thumbUrl}" class="thumbnail-preview" alt="Thumbnail" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'" />
            </td>
            <td>
              <div style="font-weight: 600; color: var(--text-main); max-width: 320px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.title}</div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">${p.category ? p.category.name : 'Uncategorized'} &bull; /${p.slug}</div>
            </td>
            <td>
              <span class="badge badge-cyan">${p.contentType || 'IMAGE'}</span>
            </td>
            <td>
              <span class="badge ${p.status === 'PUBLISHED' ? 'badge-success' : p.status === 'DRAFT' ? 'badge-secondary' : 'badge-warning'}">
                ${p.status || 'DRAFT'}
              </span>
            </td>
            <td>
              <div style="display: flex; gap: 8px; align-items: center; font-size: 0.8rem;">
                <span class="badge badge-purple" style="font-size: 0.72rem; font-weight: 600;">📋 ${copyCount} copies</span>
                <span style="color: var(--text-muted); font-size: 0.76rem;">👁️ ${viewCount} &bull; ❤️ ${favoriteCount}</span>
              </div>
            </td>
            <td>
              <span style="font-size: 0.84rem; font-weight: 600; color: ${p.isTrending ? '#34d399' : 'var(--text-muted)'};">
                ${trendingScore} ${p.isTrending ? '🔥' : ''}
              </span>
            </td>
            <td style="text-align: right;">
              <div style="display: inline-flex; gap: 6px;">
                <button class="btn btn-secondary btn-sm edit-prompt-btn" data-id="${p.id}" title="Edit Full-Screen">
                  <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
                </button>
                <button class="btn btn-danger btn-sm delete-prompt-btn" data-id="${p.id}" title="Delete Prompt">
                  <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');

    if (window.lucide) window.lucide.createIcons();

    // Render count label & pagination
    container.querySelector('#prompts-count-label').textContent = `Showing ${(state.page - 1) * state.limit + 1} - ${Math.min(state.page * state.limit, state.total)} of ${state.total} prompts`;
    renderPagination(container, router);

    // Bind row action buttons
    tbody.querySelectorAll('.edit-prompt-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        router.navigate('prompt-editor', { promptId: id });
      });
    });

    tbody.querySelectorAll('.delete-prompt-btn').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const id = btn.getAttribute('data-id');
        const prompt = state.prompts.find((p) => p.id === id);
        modal.confirm({
          title: 'Delete Prompt',
          message: `Are you sure you want to delete prompt "<strong>${prompt ? prompt.title : ''}</strong>"? This action cannot be undone.`,
          confirmText: 'Delete Prompt',
          confirmType: 'danger',
          onConfirm: async () => {
            try {
              await api.deletePrompt(id);
              toast.success('Prompt deleted successfully');
              await fetchPrompts(container, router);
            } catch (err) {
              toast.error(err.message || 'Failed to delete prompt');
              throw err;
            }
          },
        });
      });
    });
  } catch (err) {
    toast.error('Failed to load prompts');
  }
}

function renderPagination(container, router) {
  const paginationDiv = container.querySelector('#prompts-pagination-buttons');
  if (!paginationDiv) return;

  const totalPages = Math.ceil(state.total / state.limit) || 1;
  if (totalPages <= 1) {
    paginationDiv.innerHTML = '';
    return;
  }

  paginationDiv.innerHTML = `
    <button class="btn btn-secondary btn-sm" id="prev-page-btn" ${state.page <= 1 ? 'disabled' : ''}>Previous</button>
    <span style="font-size: 0.82rem; align-self: center; color: var(--text-muted); padding: 0 6px;">Page ${state.page} of ${totalPages}</span>
    <button class="btn btn-secondary btn-sm" id="next-page-btn" ${state.page >= totalPages ? 'disabled' : ''}>Next</button>
  `;

  paginationDiv.querySelector('#prev-page-btn')?.addEventListener('click', () => {
    if (state.page > 1) {
      state.page -= 1;
      fetchPrompts(container, router);
    }
  });

  paginationDiv.querySelector('#next-page-btn')?.addEventListener('click', () => {
    if (state.page < totalPages) {
      state.page += 1;
      fetchPrompts(container, router);
    }
  });
}
