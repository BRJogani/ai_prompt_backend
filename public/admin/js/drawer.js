/**
 * Slide-over Drawer Component
 */

let activeDrawer = null;

export const drawer = {
  open({ title, bodyHtml, onSave, saveText = 'Save Changes' }) {
    this.close(true);

    const backdrop = document.createElement('div');
    backdrop.className = 'drawer-backdrop';
    backdrop.id = 'active-drawer-backdrop';

    backdrop.innerHTML = `
      <div class="drawer-container">
        <div class="drawer-header">
          <h3 class="drawer-title">${title}</h3>
          <button type="button" class="btn-icon drawer-close-btn" id="drawer-close-btn" aria-label="Close drawer">
            <i data-lucide="x" style="width: 18px; height: 18px;"></i>
          </button>
        </div>
        <div class="drawer-body" id="drawer-body-content">
          ${bodyHtml}
        </div>
        <div class="drawer-footer">
          <button type="button" class="btn btn-secondary" id="drawer-cancel-btn">Cancel</button>
          <button type="button" class="btn btn-primary" id="drawer-save-btn">
            <i data-lucide="check" style="width: 16px; height: 16px;"></i>
            ${saveText}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    if (window.lucide) window.lucide.createIcons();

    // Trigger animation
    requestAnimationFrame(() => {
      backdrop.classList.add('open');
    });

    const closeHandler = (e) => {
      if (e) e.preventDefault();
      this.close();
    };

    backdrop.querySelector('#drawer-close-btn')?.addEventListener('click', closeHandler);
    backdrop.querySelector('#drawer-cancel-btn')?.addEventListener('click', closeHandler);

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeHandler(e);
    });

    const onKeydown = (e) => {
      if (e.key === 'Escape') closeHandler(e);
    };
    window.addEventListener('keydown', onKeydown);

    if (onSave) {
      const saveBtn = backdrop.querySelector('#drawer-save-btn');
      saveBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        saveBtn.disabled = true;
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = `<i data-lucide="loader" style="width: 16px; height: 16px; animation: spin 1s linear infinite;"></i> Saving...`;
        if (window.lucide) window.lucide.createIcons();

        try {
          await onSave();
          this.close();
        } catch (err) {
          // Error handled in onSave caller
        } finally {
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = originalText;
            if (window.lucide) window.lucide.createIcons();
          }
        }
      });
    }

    activeDrawer = {
      element: backdrop,
      cleanup: () => {
        window.removeEventListener('keydown', onKeydown);
      },
    };

    return backdrop;
  },

  close(immediate = false) {
    document.querySelectorAll('.drawer-backdrop').forEach((el) => {
      el.classList.remove('open');
      if (immediate) {
        el.remove();
      } else {
        setTimeout(() => el.remove(), 350);
      }
    });

    if (activeDrawer) {
      if (activeDrawer.cleanup) activeDrawer.cleanup();
      activeDrawer = null;
    }
  },
};

