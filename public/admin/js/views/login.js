import { api, authState } from '../api.js';
import { toast } from '../toast.js';

export function renderLogin(container, onLoginSuccess) {
  container.innerHTML = `
    <div class="login-wrapper">
      <div class="login-card">
        <div style="text-align: center; margin-bottom: 32px;">
          <div class="logo-badge" style="width: 52px; height: 52px; margin: 0 auto 16px auto; font-size: 1.5rem;">
            <i data-lucide="sparkles"></i>
          </div>
          <h2 style="font-family: 'Outfit', sans-serif; font-size: 1.6rem; font-weight: 700; color: #fff; margin-bottom: 6px;">Admin Portal</h2>
          <p style="color: #94a3b8; font-size: 0.88rem;">AI Prompt Inspiration Platform</p>
        </div>

        <form id="login-form" style="display: flex; flex-direction: column; gap: 20px;">
          <div class="form-group">
            <label class="form-label" for="login-email">Admin Email</label>
            <input type="email" id="login-email" class="input-text" placeholder="admin@example.com" required autocomplete="email" />
          </div>

          <div class="form-group">
            <label class="form-label" for="login-password">Password</label>
            <input type="password" id="login-password" class="input-text" placeholder="••••••••" required autocomplete="current-password" />
          </div>

          <button type="submit" class="btn btn-primary" id="login-submit-btn" style="padding: 12px; font-size: 0.95rem; margin-top: 8px;">
            <i data-lucide="log-in" style="width: 18px; height: 18px;"></i>
            Sign In to Dashboard
          </button>
        </form>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  const form = container.querySelector('#login-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = container.querySelector('#login-email').value.trim();
    const password = container.querySelector('#login-password').value;
    const btn = container.querySelector('#login-submit-btn');

    btn.disabled = true;
    btn.innerHTML = `<i data-lucide="loader" style="width: 18px; height: 18px; animation: spin 1s linear infinite;"></i> Authenticating...`;
    if (window.lucide) window.lucide.createIcons();

    try {
      const res = await api.login(email, password);
      authState.token = res.data.accessToken;
      if (res.data.refreshToken) {
        localStorage.setItem('admin_refresh_token', res.data.refreshToken);
      }
      authState.admin = res.data.admin;
      toast.success(`Welcome back, ${res.data.admin.name || 'Admin'}!`);
      onLoginSuccess();
    } catch (err) {
      toast.error(err.message || 'Login failed. Please check credentials.');
      btn.disabled = false;
      btn.innerHTML = `<i data-lucide="log-in" style="width: 18px; height: 18px;"></i> Sign In to Dashboard`;
      if (window.lucide) window.lucide.createIcons();
    }
  });
}
