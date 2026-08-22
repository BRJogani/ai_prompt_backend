/**
 * Toast notification utility
 */
export const toast = {
  show(message, type = 'info', duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const el = document.createElement('div');
    el.className = `toast toast-${type}`;

    let icon = 'info';
    if (type === 'success') icon = 'check-circle';
    if (type === 'error') icon = 'alert-triangle';

    el.innerHTML = `
      <i data-lucide="${icon}" style="width: 20px; height: 20px; flex-shrink: 0;"></i>
      <span style="flex: 1;">${message}</span>
      <button style="background: none; border: none; color: #94a3b8; cursor: pointer;" onclick="this.parentElement.remove()">
        <i data-lucide="x" style="width: 16px; height: 16px;"></i>
      </button>
    `;

    container.appendChild(el);
    if (window.lucide) window.lucide.createIcons();

    setTimeout(() => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(-10px)';
      el.style.transition = 'all 0.25s ease';
      setTimeout(() => el.remove(), 250);
    }, duration);
  },

  success(msg) {
    this.show(msg, 'success');
  },

  error(msg) {
    this.show(msg, 'error', 4500);
  },

  info(msg) {
    this.show(msg, 'info');
  },
};
