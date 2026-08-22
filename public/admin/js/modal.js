/**
 * Modal & Dialog Utility
 */

export const modal = {
  // Confirmation Alert Dialog
  confirm({
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDanger = true,
    confirmType = 'danger',
    onConfirm = null,
  }) {
    return new Promise((resolve) => {
      const danger = isDanger || confirmType === 'danger';
      const backdrop = document.createElement('div');
      backdrop.className = 'modal-backdrop';

      backdrop.innerHTML = `
        <div class="modal-card">
          <div style="padding: 24px; display: flex; flex-direction: column; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="width: 40px; height: 40px; border-radius: 50%; background: ${danger ? 'rgba(244, 63, 94, 0.15)' : 'rgba(99, 102, 241, 0.15)'}; display: flex; align-items: center; justify-content: center; color: ${danger ? '#fb7185' : '#818cf8'}; flex-shrink: 0;">
                <i data-lucide="${danger ? 'alert-triangle' : 'help-circle'}" style="width: 20px; height: 20px;"></i>
              </div>
              <h3 style="font-size: 1.15rem; font-weight: 700; color: #fff;">${title}</h3>
            </div>
            <p style="font-size: 0.9rem; color: #94a3b8; line-height: 1.5;">${message}</p>
          </div>
          <div style="padding: 16px 24px; background: rgba(15, 23, 42, 0.8); border-top: 1px solid rgba(255, 255, 255, 0.08); display: flex; justify-content: flex-end; gap: 12px;">
            <button type="button" class="btn btn-secondary" id="modal-cancel-btn">${cancelText}</button>
            <button type="button" class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="modal-confirm-btn">${confirmText}</button>
          </div>
        </div>
      `;

      document.body.appendChild(backdrop);
      if (window.lucide) window.lucide.createIcons();

      requestAnimationFrame(() => backdrop.classList.add('open'));

      const close = (result) => {
        backdrop.classList.remove('open');
        setTimeout(() => backdrop.remove(), 200);
        resolve(result);
      };

      backdrop.querySelector('#modal-cancel-btn')?.addEventListener('click', () => close(false));

      const confirmBtn = backdrop.querySelector('#modal-confirm-btn');
      confirmBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        if (onConfirm) {
          confirmBtn.disabled = true;
          const origText = confirmBtn.innerHTML;
          confirmBtn.innerHTML = `<i data-lucide="loader" style="width: 14px; height: 14px; animation: spin 1s linear infinite;"></i> Processing...`;
          if (window.lucide) window.lucide.createIcons();
          try {
            await onConfirm();
            close(true);
          } catch (err) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = origText;
            if (window.lucide) window.lucide.createIcons();
          }
        } else {
          close(true);
        }
      });

      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) close(false);
      });
    });
  },

  // Interactive Form Dialog (Centered Modal)
  dialog({
    title,
    bodyHtml,
    confirmText = 'Save Changes',
    cancelText = 'Cancel',
    maxWidth = '540px',
    onConfirm = null,
  }) {
    // Close any active modal
    document.querySelectorAll('.modal-backdrop').forEach((el) => el.remove());

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';

    backdrop.innerHTML = `
      <div class="modal-dialog" style="max-width: ${maxWidth};">
        <div class="modal-header">
          <h3 class="modal-title">${title}</h3>
          <button type="button" class="btn-icon modal-close-btn" id="dialog-close-btn" aria-label="Close dialog">
            <i data-lucide="x" style="width: 18px; height: 18px;"></i>
          </button>
        </div>
        <div class="modal-body" id="modal-body-content">
          ${bodyHtml}
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary" id="dialog-cancel-btn">${cancelText}</button>
          <button type="button" class="btn btn-primary" id="dialog-confirm-btn">
            <i data-lucide="check" style="width: 16px; height: 16px;"></i>
            ${confirmText}
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(backdrop);
    if (window.lucide) window.lucide.createIcons();

    requestAnimationFrame(() => backdrop.classList.add('open'));

    const close = () => {
      backdrop.classList.remove('open');
      setTimeout(() => backdrop.remove(), 250);
    };

    backdrop.querySelector('#dialog-close-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      close();
    });

    backdrop.querySelector('#dialog-cancel-btn')?.addEventListener('click', (e) => {
      e.preventDefault();
      close();
    });

    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });

    const onKeydown = (e) => {
      if (e.key === 'Escape') {
        window.removeEventListener('keydown', onKeydown);
        close();
      }
    };
    window.addEventListener('keydown', onKeydown);

    if (onConfirm) {
      const confirmBtn = backdrop.querySelector('#dialog-confirm-btn');
      confirmBtn?.addEventListener('click', async (e) => {
        e.preventDefault();
        confirmBtn.disabled = true;
        const origText = confirmBtn.innerHTML;
        confirmBtn.innerHTML = `<i data-lucide="loader" style="width: 15px; height: 15px; animation: spin 1s linear infinite;"></i> Saving...`;
        if (window.lucide) window.lucide.createIcons();

        try {
          await onConfirm();
          window.removeEventListener('keydown', onKeydown);
          close();
        } catch (err) {
          // Keep dialog open on error so user can adjust inputs
        } finally {
          if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.innerHTML = origText;
            if (window.lucide) window.lucide.createIcons();
          }
        }
      });
    }

    return { backdrop, close };
  },
};


