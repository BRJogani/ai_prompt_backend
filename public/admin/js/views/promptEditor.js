import { api } from '../api.js';
import { toast } from '../toast.js';
import { modal } from '../modal.js';

export async function renderPromptEditor(container, router, promptId = null) {
  const isEdit = !!promptId;
  let prompt = null;
  let categories = [];
  let existingMedia = [];
  let newFilesQueue = []; // { file, previewUrl, type }

  container.innerHTML = `
    <div style="padding: 40px; text-align: center; color: var(--text-muted);">
      <i data-lucide="loader" style="width: 28px; height: 28px; animation: spin 1s linear infinite;"></i>
      <p style="margin-top: 12px;">Loading prompt editor...</p>
    </div>
  `;
  if (window.lucide) window.lucide.createIcons();

  try {
    const [catRes, promptRes] = await Promise.all([
      api.getCategories().catch(() => ({ data: [] })),
      isEdit ? api.getPrompt(promptId).catch(() => ({ data: null })) : Promise.resolve({ data: null }),
    ]);

    categories = catRes.data || [];
    prompt = promptRes.data || null;
    if (prompt && prompt.media) {
      existingMedia = [...prompt.media];
    }
  } catch (err) {
    toast.error('Failed to load required editor data');
    router.navigate('prompts');
    return;
  }

  container.innerHTML = `
    <div class="editor-wrapper">
      <!-- Top Header -->
      <div class="editor-topbar">
        <div style="display: flex; align-items: center; gap: 16px;">
          <button class="btn btn-secondary btn-sm" id="editor-back-btn">
            <i data-lucide="arrow-left" style="width: 16px; height: 16px;"></i> Back to Prompts
          </button>
          <div>
            <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.25rem; font-weight: 700; color: #fff;">
              ${isEdit ? 'Edit Prompt' : 'Create New Prompt'}
            </h2>
            <div style="font-size: 0.78rem; color: var(--text-muted);">
              Fill in the required prompt information and upload visual media previews
            </div>
          </div>
        </div>

        <div style="display: flex; align-items: center; gap: 12px;">
          <button type="button" class="btn btn-secondary" id="editor-cancel-btn">Cancel</button>
          <button type="button" class="btn btn-primary" id="editor-save-btn">
            <i data-lucide="check" style="width: 16px; height: 16px;"></i>
            ${isEdit ? 'Save Changes' : 'Publish & Save'}
          </button>
        </div>
      </div>

      <!-- Main Form Layout -->
      <div class="editor-grid">
        <!-- LEFT COLUMN: Core Prompt Details -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <div class="editor-section">
            <div class="editor-section-title">
              <i data-lucide="file-text" style="color: var(--primary);"></i>
              Prompt Details
            </div>

            <!-- Title -->
            <div class="form-group">
              <label class="form-label" for="editor-title">Prompt Title *</label>
              <input type="text" id="editor-title" class="input-text" placeholder="e.g. Cinematic Luxury Portrait in Golden Hour" value="${prompt ? escapeHtml(prompt.title) : ''}" required />
            </div>

            <!-- Category & Target Format -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div class="form-group">
                <label class="form-label" for="editor-category">Category *</label>
                <select id="editor-category" class="input-select" required>
                  ${categories.map((c) => `<option value="${c.id}" ${prompt && prompt.categoryId === c.id ? 'selected' : ''}>${c.name}</option>`).join('')}
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="editor-content-type">Target Generation Format</label>
                <select id="editor-content-type" class="input-select">
                  <option value="IMAGE" ${!prompt || prompt.contentType === 'IMAGE' ? 'selected' : ''}>IMAGE (Photo / 3D / Illustration)</option>
                  <option value="VIDEO" ${prompt && prompt.contentType === 'VIDEO' ? 'selected' : ''}>VIDEO (Motion / Cinematic Animation)</option>
                  <option value="BOTH" ${prompt && prompt.contentType === 'BOTH' ? 'selected' : ''}>BOTH (Image & Video)</option>
                </select>
              </div>
            </div>

            <!-- Publication Status & Access Tier -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
              <div class="form-group">
                <label class="form-label" for="editor-status">Publication Status</label>
                <select id="editor-status" class="input-select">
                  <option value="PUBLISHED" ${prompt && prompt.status === 'PUBLISHED' ? 'selected' : ''}>PUBLISHED (Live in mobile app)</option>
                  <option value="DRAFT" ${!prompt || prompt.status === 'DRAFT' ? 'selected' : ''}>DRAFT (Hidden)</option>
                  <option value="REVIEW" ${prompt && prompt.status === 'REVIEW' ? 'selected' : ''}>REVIEW</option>
                  <option value="ARCHIVED" ${prompt && prompt.status === 'ARCHIVED' ? 'selected' : ''}>ARCHIVED</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label" for="editor-is-premium">Pricing Tier</label>
                <select id="editor-is-premium" class="input-select">
                  <option value="false" ${!prompt || !prompt.isPremium ? 'selected' : ''}>FREE (Standard access)</option>
                  <option value="true" ${prompt && prompt.isPremium ? 'selected' : ''}>PREMIUM (Exclusive tier)</option>
                </select>
              </div>
            </div>

            <!-- Feed Priority / Pin to Top -->
            <div style="background: rgba(99, 102, 241, 0.08); border: 1px solid rgba(99, 102, 241, 0.25); border-radius: var(--radius-md); padding: 14px 16px; display: flex; flex-direction: column; gap: 10px;">
              <div style="display: flex; align-items: center; justify-content: space-between;">
                <div>
                  <div style="font-weight: 600; color: #fff; font-size: 0.9rem; display: flex; align-items: center; gap: 6px;">
                    <i data-lucide="star" style="width: 16px; height: 16px; color: #fbbf24;"></i>
                    Prioritize in Feed (Show First)
                  </div>
                  <div style="font-size: 0.76rem; color: #94a3b8; margin-top: 2px;">
                    Prioritized prompts appear at the very top of feeds before daily shuffled content
                  </div>
                </div>
                <label class="switch">
                  <input type="checkbox" id="editor-is-priority" ${(prompt && (prompt.isFeatured || (prompt.sortOrder && prompt.sortOrder > 0))) ? 'checked' : ''} />
                  <span class="slider"></span>
                </label>
              </div>

              <div id="priority-rank-group" style="display: ${(prompt && (prompt.isFeatured || (prompt.sortOrder && prompt.sortOrder > 0))) ? 'block' : 'none'};">
                <label class="form-label" for="editor-sort-order" style="font-size: 0.8rem; color: #cbd5e1;">Priority Rank Order (1 = Top / Highest)</label>
                <input type="number" id="editor-sort-order" class="input-text" min="0" max="9999" placeholder="e.g. 1" value="${prompt && prompt.sortOrder ? prompt.sortOrder : 1}" style="width: 140px;" />
              </div>
            </div>

            <!-- Main Prompt Text -->
            <div class="form-group">
              <label class="form-label" for="editor-prompt-text">Prompt Script * (Users copy this text directly)</label>
              <textarea id="editor-prompt-text" class="input-textarea" rows="7" placeholder="e.g. Masterpiece 8k portrait of an astronaut floating in deep purple nebula, hyper-detailed helmet reflection, cinematic lighting, volumetric smoke, octane render --ar 16:9 --v 6.0" style="font-family: monospace; font-size: 0.92rem; line-height: 1.6;" required>${prompt ? escapeHtml(prompt.promptText) : ''}</textarea>
            </div>
          </div>
        </div>

        <!-- RIGHT COLUMN: Visual Media Assets -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
          <div class="editor-section">
            <div class="editor-section-title">
              <i data-lucide="image" style="color: var(--accent-emerald);"></i>
              Media Assets (Visual Previews)
            </div>

            <!-- Drag & Drop Zone -->
            <div class="media-dropzone" id="media-dropzone">
              <div class="media-dropzone-icon">
                <i data-lucide="upload-cloud" style="width: 24px; height: 24px;"></i>
              </div>
              <div style="font-weight: 600; color: #fff; font-size: 0.92rem;">
                Click to upload or drag & drop visual previews
              </div>
              <div style="font-size: 0.78rem; color: var(--text-muted);">
                Supports PNG, JPG, WebP, MP4, WebM
              </div>
              <input type="file" id="media-file-input" accept="image/*,video/*" multiple style="display: none;" />
            </div>

            <!-- Uploaded / Queued Media Grid -->
            <div>
              <div style="font-size: 0.8rem; font-weight: 600; text-transform: uppercase; color: var(--text-muted); margin-bottom: 8px;">
                Attached Visual Assets
              </div>
              <div class="media-preview-grid" id="media-preview-grid">
                <!-- Injected dynamically -->
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  renderMediaGallery();

  const priorityToggle = container.querySelector('#editor-is-priority');
  const priorityRankGroup = container.querySelector('#priority-rank-group');
  priorityToggle?.addEventListener('change', (e) => {
    if (priorityRankGroup) {
      priorityRankGroup.style.display = e.target.checked ? 'block' : 'none';
    }
  });

  container.querySelector('#editor-back-btn')?.addEventListener('click', () => router.navigate('prompts'));
  container.querySelector('#editor-cancel-btn')?.addEventListener('click', () => router.navigate('prompts'));

  const dropzone = container.querySelector('#media-dropzone');
  const fileInput = container.querySelector('#media-file-input');

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
      handleNewFiles(Array.from(e.dataTransfer.files));
    }
  });

  fileInput?.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleNewFiles(Array.from(e.target.files));
    }
  });

  function handleNewFiles(files) {
    for (const file of files) {
      const type = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
      const previewUrl = URL.createObjectURL(file);
      newFilesQueue.push({ file, previewUrl, type });
    }
    renderMediaGallery();
  }

  function renderMediaGallery() {
    const grid = container.querySelector('#media-preview-grid');
    if (!grid) return;

    if (existingMedia.length === 0 && newFilesQueue.length === 0) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.84rem; background: rgba(0,0,0,0.15); border-radius: var(--radius-md); border: 1px dashed var(--border-subtle);">
          No visual preview attached yet. Upload at least one image or video.
        </div>
      `;
      return;
    }

    let html = '';

    existingMedia.forEach((m, idx) => {
      const isVideo = m.mediaType === 'VIDEO';
      const rawUrl = m.mediaUrl || m.secureUrl || m.thumbnailUrl || '';
      const url = rawUrl.replace(/\/c_thumb,g_auto[^\/]*\//, '/c_limit,w_1600/');
      const mediaTitle = (prompt ? prompt.title : '') || `Attached Asset ${idx + 1}`;
      html += `
        <div class="media-card" data-existing-id="${m.id}" data-url="${url}" data-title="${mediaTitle.replace(/"/g, '&quot;')}" title="Click to view full uncropped image" style="cursor: pointer;">
          ${isVideo ? `<video src="${m.secureUrl || m.mediaUrl}" muted autoplay loop></video>` : `<img src="${url}" alt="Preview" />`}
          <span class="media-card-badge">${isVideo ? 'VIDEO' : 'IMAGE'} ${idx === 0 ? '• Primary' : ''}</span>
          <button type="button" class="media-card-delete delete-existing-media" data-id="${m.id}" title="Remove Media">
            <i data-lucide="trash" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      `;
    });

    newFilesQueue.forEach((q, idx) => {
      const isVideo = q.type === 'VIDEO';
      const mediaTitle = (prompt ? prompt.title : '') || `Queued Asset ${idx + 1}`;
      html += `
        <div class="media-card" data-queue-idx="${idx}" data-url="${q.previewUrl}" data-title="${mediaTitle.replace(/"/g, '&quot;')}" title="Click to view full uncropped image" style="border: 2px dashed var(--accent-cyan); cursor: pointer;">
          ${isVideo ? `<video src="${q.previewUrl}" muted autoplay loop></video>` : `<img src="${q.previewUrl}" alt="Queued" />`}
          <span class="media-card-badge" style="background: var(--accent-cyan); color: #000;">Pending Upload</span>
          <button type="button" class="media-card-delete delete-queued-media" data-queue-idx="${idx}" title="Cancel File">
            <i data-lucide="x" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      `;
    });

    grid.innerHTML = html;
    if (window.lucide) window.lucide.createIcons();

    // Click card to open full-screen lightbox
    grid.querySelectorAll('.media-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('.media-card-delete')) return;
        const url = card.getAttribute('data-url');
        const title = card.getAttribute('data-title') || (prompt ? prompt.title : 'Prompt Image Preview');
        if (url) modal.imageLightbox(url, title);
      });
    });

    grid.querySelectorAll('.delete-existing-media').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const mId = btn.getAttribute('data-id');
        modal.confirm({
          title: 'Remove Media',
          message: 'Are you sure you want to remove this media asset from the prompt?',
          confirmText: 'Remove Asset',
          confirmType: 'danger',
          onConfirm: async () => {
            try {
              if (promptId) {
                if (typeof api.deletePromptMedia === 'function') {
                  await api.deletePromptMedia(promptId, mId);
                } else if (typeof api.deleteMedia === 'function') {
                  await api.deleteMedia(mId);
                }
                toast.success('Media asset removed');
              }
              existingMedia = existingMedia.filter((m) => m.id !== mId);
              renderMediaGallery();
            } catch (err) {
              toast.error(err.message || 'Failed to remove media');
            }
          },
        });
      });
    });

    grid.querySelectorAll('.delete-queued-media').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const qIdx = parseInt(btn.getAttribute('data-queue-idx'), 10);
        newFilesQueue.splice(qIdx, 1);
        renderMediaGallery();
      });
    });
  }

  const saveBtn = container.querySelector('#editor-save-btn');
  saveBtn?.addEventListener('click', async () => {
    const title = container.querySelector('#editor-title').value.trim();
    const categoryId = container.querySelector('#editor-category').value;
    const contentType = container.querySelector('#editor-content-type').value;
    const status = container.querySelector('#editor-status').value;
    const promptText = container.querySelector('#editor-prompt-text').value.trim();

    if (!title) {
      toast.error('Prompt title is required');
      container.querySelector('#editor-title').focus();
      return;
    }

    if (!categoryId) {
      toast.error('Please select a category');
      return;
    }

    if (!promptText) {
      toast.error('Prompt script text is required');
      container.querySelector('#editor-prompt-text').focus();
      return;
    }

    const isPremium = container.querySelector('#editor-is-premium')?.value === 'true';
    const isPriority = container.querySelector('#editor-is-priority')?.checked ?? false;
    const sortOrderVal = isPriority ? parseInt(container.querySelector('#editor-sort-order')?.value || '1', 10) : 0;
    const sortOrder = isNaN(sortOrderVal) ? (isPriority ? 1 : 0) : sortOrderVal;

    const payload = {
      title,
      categoryId,
      contentType,
      status,
      isPremium,
      isFeatured: isPriority,
      sortOrder,
      promptText,
    };

    saveBtn.disabled = true;
    saveBtn.innerHTML = `<i data-lucide="loader" style="width: 16px; height: 16px; animation: spin 1s linear infinite;"></i> Saving...`;
    if (window.lucide) window.lucide.createIcons();

    try {
      let savedPromptId = promptId;

      if (isEdit) {
        await api.updatePrompt(promptId, payload);
        toast.success('Prompt details updated');
      } else {
        const createRes = await api.createPrompt(payload);
        savedPromptId = createRes.data.id;
        toast.success('Prompt created successfully');
      }

      if (newFilesQueue.length > 0 && savedPromptId) {
        saveBtn.innerHTML = `<i data-lucide="upload-cloud" style="width: 16px; height: 16px; animation: pulse 1s infinite;"></i> Uploading Media (${newFilesQueue.length})...`;
        if (window.lucide) window.lucide.createIcons();

        for (let i = 0; i < newFilesQueue.length; i++) {
          const item = newFilesQueue[i];
          try {
            await api.uploadPromptMedia(savedPromptId, item.file);
            toast.success(`Uploaded visual preview #${i + 1}`);
          } catch (uploadErr) {
            toast.error(`Media upload error: ${uploadErr.message}`);
          }
        }
      }

      toast.success('Prompt saved with all visual assets!');
      router.navigate('prompts', { refresh: true });
    } catch (err) {
      toast.error(err.message || 'Failed to save prompt');
      saveBtn.disabled = false;
      saveBtn.innerHTML = `<i data-lucide="check" style="width: 16px; height: 16px;"></i> ${isEdit ? 'Save Changes' : 'Publish & Save'}`;
      if (window.lucide) window.lucide.createIcons();
    }
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
