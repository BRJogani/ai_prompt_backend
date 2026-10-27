import { api } from '../api.js';
import { modal } from '../modal.js';
import { toast } from '../toast.js';

let state = {
  prompts: [],
  pinnedPrompts: [],
  pinnedIds: [],
  categories: [],
  tags: [],
  page: 1,
  limit: 20,
  total: 0,
  search: '',
  categoryId: '',
  status: '',
  isPremium: '',
  isFeatured: '',
  viewMode: localStorage.getItem('prompts_view_mode') || 'list',
  gridCols: parseInt(localStorage.getItem('prompts_grid_cols') || '4', 10),
  isLoadingMore: false,
  hasMore: true,
};

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getUncroppedImageUrl(m) {
  if (!m) return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800';
  if (typeof m === 'string') {
    return m.replace(/\/c_thumb,g_auto[^\/]*\//, '/c_limit,w_1600/');
  }
  const url = m.mediaUrl || m.secureUrl || m.thumbnailUrl || '';
  if (url) {
    return url.replace(/\/c_thumb,g_auto[^\/]*\//, '/c_limit,w_1600/');
  }
  return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800';
}

export async function renderPrompts(container, router, options = {}) {
  if (options && options.refresh) {
    state.page = 1;
    state.search = '';
    state.categoryId = '';
    state.status = '';
    state.isPremium = '';
    state.isFeatured = '';
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

      <!-- Top Selected Images Section (Show First, Then Shuffled) -->
      <div class="card" style="border: 1px solid rgba(245, 158, 11, 0.4); background: linear-gradient(135deg, rgba(30, 27, 75, 0.5) 0%, rgba(20, 15, 35, 0.7) 100%);">
        <div class="card-header" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div>
            <div class="card-title" style="color: #fbbf24; display: flex; align-items: center; gap: 8px;">
              <i data-lucide="pin" style="color: #fbbf24; width: 20px; height: 20px;"></i>
              Top Selected Images Section (Show on Top, Then Shuffled)
            </div>
            <p style="font-size: 0.82rem; color: #cbd5e1; margin: 4px 0 0 0;">
              Selected prompt images will <strong>always display first at the top of the feed</strong> in this exact sequence (#1, #2, #3...), followed by the synchronized shuffled prompts.
            </p>
          </div>
          <button class="btn btn-primary btn-sm" id="btn-open-pin-picker" style="background: linear-gradient(135deg, #f59e0b, #d97706); border: none; font-weight: 600;">
            <i data-lucide="plus-circle" style="width: 15px; height: 15px;"></i> + Select Image to Pin at Top
          </button>
        </div>
        <div class="card-body" id="top-pinned-cards-container" style="padding: 16px; overflow-x: auto;">
          <div style="text-align: center; padding: 20px; color: var(--text-muted);">Loading pinned showcase...</div>
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

          <select id="filter-premium" class="input-select" style="width: auto; min-width: 130px;">
            <option value="" ${state.isPremium === '' ? 'selected' : ''}>All Tiers</option>
            <option value="false" ${state.isPremium === 'false' ? 'selected' : ''}>Free</option>
            <option value="true" ${state.isPremium === 'true' ? 'selected' : ''}>⭐ Premium</option>
          </select>

          <select id="filter-priority" class="input-select" style="width: auto; min-width: 135px;">
            <option value="" ${state.isFeatured === '' ? 'selected' : ''}>All Priority</option>
            <option value="true" ${state.isFeatured === 'true' ? 'selected' : ''}>⭐ Priority First</option>
            <option value="false" ${state.isFeatured === 'false' ? 'selected' : ''}>Standard Only</option>
          </select>

          ${state.search || state.categoryId || state.status || state.isPremium || state.isFeatured ? `
            <button class="btn btn-secondary btn-sm" id="btn-clear-filters">
              <i data-lucide="x" style="width: 14px; height: 14px;"></i> Clear
            </button>
          ` : ''}

          <!-- View Mode Toggle (List vs Grid) + Columns Selector -->
          <div style="display: inline-flex; align-items: center; gap: 8px; margin-left: auto;">
            <div id="grid-columns-control" style="${state.viewMode === 'grid' ? 'display: inline-flex;' : 'display: none;'} align-items: center; gap: 6px;">
              <span style="font-size: 0.8rem; color: var(--text-muted); font-weight: 500;">Columns:</span>
              <select id="grid-columns-select" class="input-select" style="padding: 4px 8px; font-size: 0.82rem; height: 32px; width: auto; min-width: 90px;">
                <option value="2" ${state.gridCols === 2 ? 'selected' : ''}>2 Cols</option>
                <option value="3" ${state.gridCols === 3 ? 'selected' : ''}>3 Cols</option>
                <option value="4" ${state.gridCols === 4 ? 'selected' : ''}>4 Cols (Default)</option>
                <option value="5" ${state.gridCols === 5 ? 'selected' : ''}>5 Cols</option>
                <option value="6" ${state.gridCols === 6 ? 'selected' : ''}>6 Cols</option>
              </select>
            </div>

            <div style="display: inline-flex; border: 1px solid var(--border-color); border-radius: var(--radius-md); overflow: hidden;">
              <button type="button" class="btn btn-sm ${state.viewMode === 'list' ? 'btn-primary' : 'btn-secondary'}" id="btn-view-list" title="Table List View" style="border-radius: 0; padding: 6px 12px; display: inline-flex; align-items: center; gap: 5px;">
                <i data-lucide="list" style="width: 15px; height: 15px;"></i> List
              </button>
              <button type="button" class="btn btn-sm ${state.viewMode === 'grid' ? 'btn-primary' : 'btn-secondary'}" id="btn-view-grid" title="Cards Grid View" style="border-radius: 0; padding: 6px 12px; display: inline-flex; align-items: center; gap: 5px;">
                <i data-lucide="grid" style="width: 15px; height: 15px;"></i> Grid
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Prompts Content Card -->
      <div class="card" style="padding: 0; overflow: hidden;">
        <!-- List View Table Container -->
        <div class="table-responsive" id="prompts-table-container" style="${state.viewMode === 'grid' ? 'display: none;' : ''}">
          <table class="data-table" style="margin: 0;">
            <thead>
              <tr>
                <th style="width: 60px;">Preview</th>
                <th>Prompt Text & Category</th>
                <th>Format</th>
                <th>Status</th>
                <th>Copy & Interaction Counters</th>
                <th>Trending</th>
                <th style="text-align: right; width: 170px;">Actions</th>
              </tr>
            </thead>
            <tbody id="prompts-table-body">
              <tr><td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">Loading prompt catalog...</td></tr>
            </tbody>
          </table>
        </div>

        <!-- Cards Grid View Container -->
        <div id="prompts-grid-container" class="prompts-grid" style="${state.viewMode === 'grid' ? '' : 'display: none;'} --prompts-grid-cols: ${state.gridCols};">
          <div style="text-align: center; padding: 40px; color: var(--text-muted); grid-column: 1 / -1;">Loading prompt grid...</div>
        </div>

        <!-- Infinite Scroll Footer Status -->
        <div style="padding: 14px 20px; border-top: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; background: rgba(0,0,0,0.15);">
          <span style="font-size: 0.85rem; color: var(--text-muted);" id="prompts-count-label">Showing 0 prompts</span>
          <div id="prompts-scroll-loader" style="display: none; align-items: center; gap: 8px; color: var(--accent-cyan); font-size: 0.82rem; font-weight: 600;">
            <i data-lucide="loader" style="width: 16px; height: 16px; animation: spin 1s linear infinite;"></i> Loading more prompts on scroll...
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  // Load auxiliary data (categories, tags)
  await loadAuxData(container);

  // Load top pinned showcase
  await fetchTopPinnedPrompts(container, router);

  // Load prompts list
  await fetchPrompts(container, router);

  // Bind refresh
  container.querySelector('#btn-refresh-prompts')?.addEventListener('click', async () => {
    await Promise.all([fetchTopPinnedPrompts(container, router), fetchPrompts(container, router)]);
  });

  // Bind open pin picker button
  container.querySelector('#btn-open-pin-picker')?.addEventListener('click', () => {
    openSelectImageToPinModal(container, router);
  });

  // Bind clear filters
  container.querySelector('#btn-clear-filters')?.addEventListener('click', () => {
    state.search = '';
    state.categoryId = '';
    state.status = '';
    state.isPremium = '';
    state.isFeatured = '';
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

  container.querySelector('#filter-premium')?.addEventListener('change', (e) => {
    state.isPremium = e.target.value;
    state.page = 1;
    fetchPrompts(container, router);
  });

  container.querySelector('#filter-priority')?.addEventListener('change', (e) => {
    state.isFeatured = e.target.value;
    state.page = 1;
    fetchPrompts(container, router);
  });

  container.querySelector('#btn-create-prompt')?.addEventListener('click', () => {
    router.navigate('prompt-editor');
  });

  // Wire View Mode Switcher & Column Control
  const colsControl = container.querySelector('#grid-columns-control');
  container.querySelector('#grid-columns-select')?.addEventListener('change', (e) => {
    state.gridCols = parseInt(e.target.value, 10) || 4;
    localStorage.setItem('prompts_grid_cols', state.gridCols);
    const gridWrap = container.querySelector('#prompts-grid-container');
    if (gridWrap) {
      gridWrap.style.setProperty('--prompts-grid-cols', state.gridCols);
    }
  });

  container.querySelector('#btn-view-list')?.addEventListener('click', () => {
    if (state.viewMode !== 'list') {
      state.viewMode = 'list';
      localStorage.setItem('prompts_view_mode', 'list');
      const btnList = container.querySelector('#btn-view-list');
      const btnGrid = container.querySelector('#btn-view-grid');
      btnList?.classList.remove('btn-secondary');
      btnList?.classList.add('btn-primary');
      btnGrid?.classList.remove('btn-primary');
      btnGrid?.classList.add('btn-secondary');
      const tableWrap = container.querySelector('#prompts-table-container');
      const gridWrap = container.querySelector('#prompts-grid-container');
      if (tableWrap) tableWrap.style.display = '';
      if (gridWrap) gridWrap.style.display = 'none';
      if (colsControl) colsControl.style.display = 'none';
      if (window.lucide) window.lucide.createIcons();
    }
  });

  container.querySelector('#btn-view-grid')?.addEventListener('click', () => {
    if (state.viewMode !== 'grid') {
      state.viewMode = 'grid';
      localStorage.setItem('prompts_view_mode', 'grid');
      const btnList = container.querySelector('#btn-view-list');
      const btnGrid = container.querySelector('#btn-view-grid');
      btnGrid?.classList.remove('btn-secondary');
      btnGrid?.classList.add('btn-primary');
      btnList?.classList.remove('btn-primary');
      btnList?.classList.add('btn-secondary');
      const tableWrap = container.querySelector('#prompts-table-container');
      const gridWrap = container.querySelector('#prompts-grid-container');
      if (tableWrap) tableWrap.style.display = 'none';
      if (gridWrap) {
        gridWrap.style.display = 'grid';
        gridWrap.style.setProperty('--prompts-grid-cols', state.gridCols);
      }
      if (colsControl) colsControl.style.display = 'inline-flex';
      if (window.lucide) window.lucide.createIcons();
    }
  });

  // Attach infinite scroll loading on scroll
  const handleScroll = () => {
    if (state.isLoadingMore || !state.hasMore) return;
    const scrollPosition = window.innerHeight + window.scrollY;
    const threshold = document.documentElement.scrollHeight - 380;
    if (scrollPosition >= threshold) {
      loadMorePrompts(container, router);
    }
  };
  if (window.__promptsScrollHandler) {
    window.removeEventListener('scroll', window.__promptsScrollHandler);
  }
  window.__promptsScrollHandler = handleScroll;
  window.addEventListener('scroll', handleScroll, { passive: true });
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
    console.error('Failed to load auxiliary filter data', err);
  }
}

async function fetchTopPinnedPrompts(container, router) {
  const cardsContainer = container.querySelector('#top-pinned-cards-container');
  if (!cardsContainer) return;

  try {
    const res = await api.getTopPinnedPrompts();
    state.pinnedPrompts = res.data?.items || [];
    state.pinnedIds = res.data?.pinnedIds || [];

    if (!state.pinnedPrompts.length) {
      cardsContainer.innerHTML = `
        <div style="text-align: center; padding: 24px 16px; background: rgba(0,0,0,0.25); border-radius: var(--radius-md); border: 1px dashed rgba(245, 158, 11, 0.35);">
          <i data-lucide="image" style="width: 32px; height: 32px; color: #f59e0b; margin-bottom: 6px;"></i>
          <div style="font-size: 0.92rem; font-weight: 700; color: #f8fafc;">No Prompt Images Pinned to Top Yet</div>
          <p style="font-size: 0.8rem; color: #94a3b8; max-width: 540px; margin: 4px auto 14px auto;">
            Prompts selected here will show up at the very top of the feed before shuffled items. Click below or click <strong>📌 Pin</strong> on any prompt in the catalog.
          </p>
          <button class="btn btn-primary btn-sm" id="btn-empty-pin-picker" style="background: linear-gradient(135deg, #f59e0b, #d97706); border: none; font-weight: 600;">
            <i data-lucide="plus-circle" style="width: 14px; height: 14px;"></i> Select Prompt Image to Pin
          </button>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      cardsContainer.querySelector('#btn-empty-pin-picker')?.addEventListener('click', () => openSelectImageToPinModal(container, router));
      return;
    }

    cardsContainer.innerHTML = `
      <div style="display: flex; gap: 14px; align-items: stretch; overflow-x: auto; padding-bottom: 6px;">
        ${state.pinnedPrompts.map((p, idx) => {
          const thumbUrl = p.media && p.media.length ? getUncroppedImageUrl(p.media[0]) : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800';
          const safeTitle = (p.title || '').replace(/"/g, '&quot;');
          return `
            <div class="top-pinned-card" style="width: 190px; min-width: 190px; background: rgba(15, 23, 42, 0.85); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 10px; overflow: hidden; display: flex; flex-direction: column; flex-shrink: 0; box-shadow: 0 4px 14px rgba(0,0,0,0.35);">
              <div style="position: relative; width: 100%; height: 130px; overflow: hidden; background: #000;">
                <img src="${thumbUrl}" class="prompt-thumbnail-click" alt="${safeTitle}" data-full-url="${thumbUrl}" data-title="${safeTitle}" style="width: 100%; height: 100%; object-fit: cover; cursor: pointer; transition: transform 0.2s;" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200'" />
                <span class="badge" style="position: absolute; top: 6px; left: 6px; background: #f59e0b; color: #000; font-weight: 800; font-size: 0.72rem; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">
                  ⭐ Top #${idx + 1}
                </span>
                <button class="btn-icon unpin-card-btn" data-id="${p.id}" title="Remove from Top Section" style="position: absolute; top: 6px; right: 6px; width: 26px; height: 26px; background: rgba(0,0,0,0.75); color: #f87171; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none;">
                  <i data-lucide="x" style="width: 14px; height: 14px;"></i>
                </button>
              </div>
              <div style="padding: 10px; display: flex; flex-direction: column; gap: 8px; flex: 1; justify-content: space-between;">
                <div>
                  <div style="font-size: 0.83rem; font-weight: 500; color: #f8fafc; line-height: 1.35; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${escapeHtml(p.promptText || p.title || 'Prompt')}">
                    ${escapeHtml(p.promptText || p.title || 'Prompt')}
                  </div>
                  <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 3px;">
                    ${p.category ? p.category.name : 'Uncategorized'}
                  </div>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(255,255,255,0.08); padding-top: 8px; margin-top: 4px;">
                  <button class="btn btn-secondary btn-sm reorder-pin-btn" data-id="${p.id}" data-dir="left" ${idx === 0 ? 'disabled' : ''} style="padding: 2px 8px; font-size: 0.75rem;" title="Move earlier in feed">
                    ◀
                  </button>
                  <span style="font-size: 0.72rem; font-weight: 700; color: #fbbf24;">Pos #${idx + 1}</span>
                  <button class="btn btn-secondary btn-sm reorder-pin-btn" data-id="${p.id}" data-dir="right" ${idx === state.pinnedPrompts.length - 1 ? 'disabled' : ''} style="padding: 2px 8px; font-size: 0.75rem;" title="Move later in feed">
                    ▶
                  </button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Wire unpin buttons
    cardsContainer.querySelectorAll('.unpin-card-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        try {
          await api.toggleTopPinnedPrompt(id);
          toast.success('Prompt unpinned from top section');
          await Promise.all([fetchTopPinnedPrompts(container, router), fetchPrompts(container, router)]);
        } catch (err) {
          toast.error(err.message || 'Failed to unpin prompt');
        }
      });
    });

    // Wire reorder buttons
    cardsContainer.querySelectorAll('.reorder-pin-btn').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const dir = btn.getAttribute('data-dir');
        const currIdx = state.pinnedIds.indexOf(id);
        if (currIdx === -1) return;

        const newIds = [...state.pinnedIds];
        const targetIdx = dir === 'left' ? currIdx - 1 : currIdx + 1;
        if (targetIdx < 0 || targetIdx >= newIds.length) return;

        const temp = newIds[currIdx];
        newIds[currIdx] = newIds[targetIdx];
        newIds[targetIdx] = temp;

        try {
          await api.reorderTopPinnedPrompts(newIds);
          await Promise.all([fetchTopPinnedPrompts(container, router), fetchPrompts(container, router)]);
        } catch (err) {
          toast.error(err.message || 'Failed to reorder prompts');
        }
      });
    });

    // Wire thumbnail lightbox
    cardsContainer.querySelectorAll('.prompt-thumbnail-click').forEach((img) => {
      img.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = img.getAttribute('data-full-url');
        const title = img.getAttribute('data-title') || 'Prompt Preview';
        if (url) modal.imageLightbox(url, title);
      });
    });
  } catch (err) {
    cardsContainer.innerHTML = `<div style="color: #f87171; font-size: 0.82rem; padding: 10px;">Failed to load top pinned showcase</div>`;
  }
}

async function openSelectImageToPinModal(container, router) {
  document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove());

  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.innerHTML = `
    <div class="modal-dialog" style="max-width: 780px; width: 92vw;">
      <div class="modal-header">
        <div style="display: flex; align-items: center; gap: 8px;">
          <i data-lucide="pin" style="color: #f59e0b; width: 18px; height: 18px;"></i>
          <h3 class="modal-title">Select Prompt Image to Show on Top</h3>
        </div>
        <button type="button" class="btn-icon modal-close-btn" id="picker-close-btn" aria-label="Close dialog">
          <i data-lucide="x" style="width: 18px; height: 18px;"></i>
        </button>
      </div>
      <div class="modal-body" style="display: flex; flex-direction: column; gap: 16px; max-height: 65vh; overflow-y: auto;">
        <p style="font-size: 0.85rem; color: #94a3b8; margin: 0;">
          Click on any prompt image below to add or remove it from the <strong>Top Selected Images Section</strong>. Selected images appear first on all mobile devices, followed by the shuffled prompts.
        </p>
        <div id="picker-grid-container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px;">
          <div style="text-align: center; padding: 30px; color: var(--text-muted); grid-column: 1 / -1;">Loading prompt library...</div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" id="picker-done-btn">Done</button>
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

  backdrop.querySelector('#picker-close-btn')?.addEventListener('click', close);
  backdrop.querySelector('#picker-done-btn')?.addEventListener('click', close);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) close();
  });

  try {
    const res = await api.getPrompts({ page: 1, limit: 60, status: 'PUBLISHED' });
    const prompts = res.data || [];
    const grid = backdrop.querySelector('#picker-grid-container');
    if (!grid) return;

    if (!prompts.length) {
      grid.innerHTML = `<div style="text-align: center; padding: 30px; color: var(--text-muted); grid-column: 1 / -1;">No published prompts available to pin.</div>`;
      return;
    }

    const renderPickerItems = () => {
      grid.innerHTML = prompts.map((p) => {
        const thumbUrl = p.media && p.media.length ? getUncroppedImageUrl(p.media[0]) : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400';
        const isPinned = state.pinnedIds.includes(p.id);
        const pinRank = isPinned ? state.pinnedIds.indexOf(p.id) + 1 : 0;
        const safeTitle = (p.title || '').replace(/"/g, '&quot;');

        return `
          <div class="picker-item-card" data-id="${p.id}" style="position: relative; border-radius: 8px; overflow: hidden; border: 2px solid ${isPinned ? '#f59e0b' : 'rgba(255,255,255,0.08)'}; cursor: pointer; transition: all 0.2s ease; background: #0f172a; display: flex; flex-direction: column;">
            <div style="position: relative; width: 100%; height: 115px; overflow: hidden;">
              <img src="${thumbUrl}" alt="${safeTitle}" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200'" />
              ${isPinned ? `
                <div style="position: absolute; top: 6px; left: 6px; background: #f59e0b; color: #000; font-size: 0.7rem; font-weight: 800; padding: 2px 7px; border-radius: 4px; box-shadow: 0 2px 6px rgba(0,0,0,0.5);">
                  ⭐ Top #${pinRank}
                </div>
              ` : ''}
            </div>
            <div style="padding: 8px; display: flex; flex-direction: column; gap: 6px; flex: 1; justify-content: space-between;">
              <div style="font-size: 0.78rem; font-weight: 600; color: #f8fafc; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                ${p.title || 'Untitled'}
              </div>
              <button class="btn ${isPinned ? 'btn-danger' : 'btn-secondary'} btn-sm" style="width: 100%; font-size: 0.72rem; padding: 3px 6px;">
                ${isPinned ? '✕ Unpin' : '+ Pin to Top'}
              </button>
            </div>
          </div>
        `;
      }).join('');

      grid.querySelectorAll('.picker-item-card').forEach((card) => {
        card.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = card.getAttribute('data-id');
          try {
            const toggleRes = await api.toggleTopPinnedPrompt(id);
            state.pinnedIds = toggleRes.data?.pinnedIds || [];
            toast.success(toggleRes.message || 'Updated top pinned prompt');
            renderPickerItems();
            await Promise.all([fetchTopPinnedPrompts(container, router), fetchPrompts(container, router)]);
          } catch (err) {
            toast.error(err.message || 'Failed to toggle pin');
          }
        });
      });
    };

    renderPickerItems();
  } catch (err) {
    const grid = backdrop.querySelector('#picker-grid-container');
    if (grid) grid.innerHTML = `<div style="color: #f87171; padding: 20px;">Failed to load prompts: ${err.message}</div>`;
  }
}

async function loadMorePrompts(container, router) {
  if (state.isLoadingMore || !state.hasMore) return;
  state.isLoadingMore = true;
  state.page += 1;
  const loader = container.querySelector('#prompts-scroll-loader');
  if (loader) {
    loader.style.display = 'inline-flex';
    if (window.lucide) window.lucide.createIcons();
  }

  try {
    await fetchPrompts(container, router, true);
  } catch (err) {
    state.page -= 1;
  } finally {
    state.isLoadingMore = false;
    if (loader) loader.style.display = 'none';
  }
}

function renderPromptRowHtml(p) {
  const thumbUrl = p.media && p.media.length ? getUncroppedImageUrl(p.media[0]) : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800';
  const trendingScore = (p.trendingScore != null && typeof p.trendingScore === 'number') ? p.trendingScore.toFixed(1) : '0.0';
  const copyCount = p.copyCount ?? 0;
  const viewCount = p.viewCount ?? 0;
  const favoriteCount = p.favoriteCount ?? 0;
  const safeTitle = (p.title || '').replace(/"/g, '&quot;');
  const isPinned = state.pinnedIds.includes(p.id);
  const pinRank = isPinned ? state.pinnedIds.indexOf(p.id) + 1 : 0;
  const isPublished = p.status === 'PUBLISHED';
  const promptSnippet = escapeHtml(p.promptText || p.title || 'No prompt script entered');

  return `
    <tr data-id="${p.id}">
      <td>
        <img src="${thumbUrl}" class="thumbnail-preview prompt-thumbnail-click" alt="${safeTitle}" data-full-url="${thumbUrl}" data-title="${safeTitle}" title="Click to view full uncropped image" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100'" />
      </td>
      <td>
        <div style="font-weight: 500; color: #f1f5f9; font-size: 0.88rem; line-height: 1.45; max-width: 440px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;" title="${promptSnippet}">
          ${p.isPremium ? '<span style="color: #fbbf24; margin-right: 4px;" title="Premium Prompt">★</span>' : ''}${promptSnippet}
        </div>
        <div style="font-size: 0.78rem; color: var(--text-muted); margin-top: 3px;">
          <span style="color: var(--accent-cyan); font-weight: 600;">${p.category ? p.category.name : 'Uncategorized'}</span> &bull; /${p.slug}
        </div>
      </td>
      <td>
        <div style="display: flex; gap: 4px; flex-wrap: wrap;">
          <span class="badge badge-cyan">${p.contentType || 'IMAGE'}</span>
          ${isPinned ? `<span class="badge" style="background: rgba(245, 158, 11, 0.25); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.5); font-weight: 700;">📌 Top #${pinRank}</span>` : ''}
          ${(p.isFeatured || (p.sortOrder && p.sortOrder > 0)) && !isPinned ? `<span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); font-weight: 700;">⭐ Priority ${p.sortOrder > 0 ? '#' + p.sortOrder : ''}</span>` : ''}
          ${p.isPremium ? '<span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4); font-weight: 700;">PREMIUM</span>' : ''}
        </div>
      </td>
      <td>
        <div style="display: flex; align-items: center; gap: 8px;">
          <label class="switch switch-sm" title="Toggle Published / Draft">
            <input type="checkbox" class="prompt-status-toggle" data-id="${p.id}" ${isPublished ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
          <span class="badge ${isPublished ? 'badge-success' : p.status === 'DRAFT' ? 'badge-secondary' : 'badge-warning'}" id="prompt-badge-${p.id}">
            ${p.status || 'DRAFT'}
          </span>
        </div>
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
        <div style="display: inline-flex; gap: 6px; align-items: center;">
          <button class="btn btn-sm toggle-pin-action-btn ${isPinned ? 'btn-warning' : 'btn-secondary'}" data-id="${p.id}" title="${isPinned ? 'Currently Top #' + pinRank + ' of feed. Click to unpin.' : 'Pin this image to show at the very top of the feed'}" style="font-size: 0.76rem; font-weight: 600; padding: 3px 8px;">
            ${isPinned ? '⭐ #' + pinRank : '📌 Pin'}
          </button>
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
}

function renderPromptGridCardHtml(p) {
  const thumbUrl = p.media && p.media.length ? getUncroppedImageUrl(p.media[0]) : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800';
  const trendingScore = (p.trendingScore != null && typeof p.trendingScore === 'number') ? p.trendingScore.toFixed(1) : '0.0';
  const copyCount = p.copyCount ?? 0;
  const viewCount = p.viewCount ?? 0;
  const favoriteCount = p.favoriteCount ?? 0;
  const safeTitle = (p.title || '').replace(/"/g, '&quot;');
  const isPinned = state.pinnedIds.includes(p.id);
  const pinRank = isPinned ? state.pinnedIds.indexOf(p.id) + 1 : 0;
  const isPublished = p.status === 'PUBLISHED';
  const promptSnippet = escapeHtml(p.promptText || p.title || 'No prompt script entered');

  return `
    <div class="prompt-grid-item" data-id="${p.id}">
      <div class="prompt-grid-thumb">
        <img src="${thumbUrl}" class="prompt-thumbnail-click" alt="${safeTitle}" data-full-url="${thumbUrl}" data-title="${safeTitle}" title="Click to view full image" onerror="this.src='https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400'" />
        <div style="position: absolute; top: 8px; left: 8px; display: flex; flex-wrap: wrap; gap: 4px;">
          <span class="badge badge-cyan" style="font-size: 0.68rem; padding: 2px 6px;">${p.contentType || 'IMAGE'}</span>
          ${isPinned ? `<span class="badge" style="background: rgba(245, 158, 11, 0.9); color: #000; font-weight: 800; font-size: 0.68rem; padding: 2px 6px;">📌 Top #${pinRank}</span>` : ''}
          ${(p.isFeatured || (p.sortOrder && p.sortOrder > 0)) && !isPinned ? `<span class="badge" style="background: #f59e0b; color: #000; font-weight: 700; font-size: 0.68rem; padding: 2px 6px;">⭐ Priority</span>` : ''}
          ${p.isPremium ? '<span class="badge" style="background: #fbbf24; color: #000; font-weight: 800; font-size: 0.68rem; padding: 2px 6px;">PRO</span>' : ''}
        </div>
        <div style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.7); padding: 3px 6px; border-radius: 20px; display: flex; align-items: center; gap: 6px;">
          <label class="switch switch-sm" title="Toggle Published / Draft">
            <input type="checkbox" class="prompt-status-toggle" data-id="${p.id}" ${isPublished ? 'checked' : ''}>
            <span class="slider"></span>
          </label>
          <span class="badge ${isPublished ? 'badge-success' : 'badge-secondary'}" id="prompt-grid-badge-${p.id}" style="font-size: 0.66rem; padding: 2px 5px;">
            ${p.status || 'DRAFT'}
          </span>
        </div>
      </div>
      <div class="prompt-grid-body">
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px;">
            <span style="font-size: 0.74rem; color: var(--accent-cyan); font-weight: 600;">${p.category ? p.category.name : 'Uncategorized'}</span>
            <span style="font-size: 0.74rem; color: ${p.isTrending ? '#34d399' : 'var(--text-muted)'}; font-weight: 600;">${trendingScore} ${p.isTrending ? '🔥' : ''}</span>
          </div>
          <p class="prompt-grid-text" title="${promptSnippet}">
            ${p.isPremium ? '<span style="color: #fbbf24; margin-right: 3px;" title="Premium Prompt">★</span>' : ''}${promptSnippet}
          </p>
        </div>
        <div>
          <div style="display: flex; gap: 8px; align-items: center; font-size: 0.74rem; color: var(--text-muted); margin-bottom: 8px;">
            <span class="badge badge-purple" style="font-size: 0.68rem;">📋 ${copyCount} copies</span>
            <span>👁️ ${viewCount}</span>
            <span>❤️ ${favoriteCount}</span>
          </div>
          <div class="prompt-grid-footer">
            <button class="btn btn-sm toggle-pin-action-btn ${isPinned ? 'btn-warning' : 'btn-secondary'}" data-id="${p.id}" title="${isPinned ? 'Currently Top #' + pinRank + '. Click to unpin.' : 'Pin this image to show at top'}" style="font-size: 0.74rem; font-weight: 600; padding: 3px 8px;">
              ${isPinned ? '⭐ Top #' + pinRank : '📌 Pin'}
            </button>
            <div style="display: inline-flex; gap: 6px;">
              <button class="btn btn-secondary btn-sm edit-prompt-btn" data-id="${p.id}" title="Edit Full-Screen" style="padding: 3px 7px;">
                <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
              </button>
              <button class="btn btn-danger btn-sm delete-prompt-btn" data-id="${p.id}" title="Delete Prompt" style="padding: 3px 7px;">
                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function fetchPrompts(container, router, append = false) {
  const tbody = container.querySelector('#prompts-table-body');
  if (!tbody) return;

  if (!append) {
    state.page = 1;
    state.hasMore = true;
  }

  try {
    const params = {
      page: state.page,
      limit: state.limit,
      ...(state.search ? { search: state.search } : {}),
      ...(state.categoryId ? { categoryId: state.categoryId } : {}),
      ...(state.status ? { status: state.status } : {}),
      ...(state.isPremium !== '' ? { isPremium: state.isPremium === 'true' } : {}),
      ...(state.isFeatured !== '' ? { isFeatured: state.isFeatured === 'true' } : {}),
    };

    const res = await api.getPrompts(params);
    const newItems = res.data || [];
    state.total = res.pagination ? res.pagination.total : newItems.length;

    if (append) {
      state.prompts = [...state.prompts, ...newItems];
    } else {
      state.prompts = newItems;
    }

    state.hasMore = state.prompts.length < state.total && newItems.length > 0;

    const gridContainer = container.querySelector('#prompts-grid-container');

    if (!state.prompts.length) {
      tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 48px; color: var(--text-muted);">No prompts found matching the criteria.</td></tr>`;
      if (gridContainer) {
        gridContainer.innerHTML = `<div style="text-align: center; padding: 48px; color: var(--text-muted); grid-column: 1 / -1;">No prompts found matching the criteria.</div>`;
      }
      container.querySelector('#prompts-count-label').textContent = 'Showing 0 prompts';
      return;
    }

    if (append) {
      const rowsHtml = newItems.map((p) => renderPromptRowHtml(p)).join('');
      tbody.insertAdjacentHTML('beforeend', rowsHtml);

      if (gridContainer) {
        const gridHtml = newItems.map((p) => renderPromptGridCardHtml(p)).join('');
        gridContainer.insertAdjacentHTML('beforeend', gridHtml);
      }
    } else {
      tbody.innerHTML = state.prompts.map((p) => renderPromptRowHtml(p)).join('');

      if (gridContainer) {
        gridContainer.innerHTML = state.prompts.map((p) => renderPromptGridCardHtml(p)).join('');
      }
    }

    if (window.lucide) window.lucide.createIcons();

    // Render count status
    const countLabel = container.querySelector('#prompts-count-label');
    if (countLabel) {
      countLabel.textContent = `Showing ${state.prompts.length} of ${state.total} prompts${!state.hasMore && state.total > 0 ? ' • All loaded' : ' • Scroll for more'}`;
    }

    // Bind event handlers on container
    bindPromptActionListeners(container, router);
  } catch (err) {
    toast.error('Failed to load prompts');
  }
}

function bindPromptActionListeners(container, router) {
  // Bind status switch toggles
  container.querySelectorAll('.prompt-status-toggle').forEach((toggle) => {
    toggle.onchange = async () => {
      const id = toggle.getAttribute('data-id');
      const isChecked = toggle.checked;
      const nextStatus = isChecked ? 'PUBLISHED' : 'DRAFT';
      try {
        await api.updatePrompt(id, { status: nextStatus });
        toast.success(`Prompt status set to ${nextStatus}`);

        const listBadge = container.querySelector(`#prompt-badge-${id}`);
        if (listBadge) {
          listBadge.className = `badge ${isChecked ? 'badge-success' : 'badge-secondary'}`;
          listBadge.textContent = nextStatus;
        }
        const gridBadge = container.querySelector(`#prompt-grid-badge-${id}`);
        if (gridBadge) {
          gridBadge.className = `badge ${isChecked ? 'badge-success' : 'badge-secondary'}`;
          gridBadge.textContent = nextStatus;
        }
        container.querySelectorAll(`.prompt-status-toggle[data-id="${id}"]`).forEach((t) => {
          t.checked = isChecked;
        });

        const p = state.prompts.find((pr) => pr.id === id);
        if (p) p.status = nextStatus;
      } catch (err) {
        toggle.checked = !isChecked;
        toast.error(err.message || 'Failed to update prompt status');
      }
    };
  });

  // Bind thumbnail lightbox click
  container.querySelectorAll('.prompt-thumbnail-click').forEach((img) => {
    img.onclick = (e) => {
      e.stopPropagation();
      const url = img.getAttribute('data-full-url');
      const title = img.getAttribute('data-title') || 'Prompt Preview';
      if (url) modal.imageLightbox(url, title);
    };
  });

  // Bind pin toggle buttons
  container.querySelectorAll('.toggle-pin-action-btn').forEach((btn) => {
    btn.onclick = async (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      try {
        const toggleRes = await api.toggleTopPinnedPrompt(id);
        toast.success(toggleRes.message || 'Updated top pinned prompt');
        await Promise.all([fetchTopPinnedPrompts(container, router), fetchPrompts(container, router)]);
      } catch (err) {
        toast.error(err.message || 'Failed to update pinned status');
      }
    };
  });

  // Bind edit buttons
  container.querySelectorAll('.edit-prompt-btn').forEach((btn) => {
    btn.onclick = () => {
      const id = btn.getAttribute('data-id');
      router.navigate('prompt-editor', { promptId: id });
    };
  });

  // Bind delete buttons
  container.querySelectorAll('.delete-prompt-btn').forEach((btn) => {
    btn.onclick = () => {
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
            await Promise.all([fetchTopPinnedPrompts(container, router), fetchPrompts(container, router)]);
          } catch (err) {
            toast.error(err.message || 'Failed to delete prompt');
            throw err;
          }
        },
      });
    };
  });
}
