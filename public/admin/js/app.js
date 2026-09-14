import { authState, api } from './api.js';
import { toast } from './toast.js';
import { renderLogin } from './views/login.js';
import { renderDashboard } from './views/dashboard.js';
import { renderPrompts } from './views/prompts.js';
import { renderCategories } from './views/categories.js';
import { renderAiTools } from './views/aiTools.js';
import { renderTags } from './views/tags.js';
import { renderAppConfig } from './views/appConfig.js';
import { renderAdConfig } from './views/adConfig.js';
import { renderAuditLogs } from './views/auditLogs.js';
import { renderReports } from './views/reports.js';
import { renderAdminUsers } from './views/adminUsers.js';
import { renderPromptEditor } from './views/promptEditor.js';
import { renderStoreListing } from './views/storeListing.js';

class AdminApp {
  constructor() {
    this.currentView = 'dashboard';
    this.root = document.getElementById('app-root');
    this.init();
  }

  async init() {
    window.addEventListener('auth:unauthorized', () => {
      this.render();
    });

    // Check if token exists
    const token = localStorage.getItem('admin_token');
    if (token) {
      try {
        const meRes = await api.getMe();
        if (meRes && meRes.data) {
          authState.admin = meRes.data;
        }
      } catch (err) {
        authState.clear();
      }
    }

    this.render();
  }

  isAuthenticated() {
    return !!localStorage.getItem('admin_token');
  }

  navigate(viewName, options = {}) {
    this.currentView = viewName;
    this.renderMainContent(options);

    // Update active nav link
    document.querySelectorAll('.nav-item').forEach((item) => {
      if (item.getAttribute('data-view') === viewName) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  render() {
    if (!this.isAuthenticated()) {
      renderLogin(this.root, () => {
        this.render();
      });
      return;
    }

    const admin = authState.admin || { name: 'Super Admin', email: 'admin@example.com', role: 'SUPER_ADMIN' };

    this.root.innerHTML = `
      <div id="app-layout">
        <!-- Sidebar -->
        <aside class="sidebar">
          <div class="sidebar-header">
            <div class="logo-badge">
              <i data-lucide="sparkles" style="width: 22px; height: 22px;"></i>
            </div>
            <div>
              <div class="logo-title">Prompt Admin</div>
              <div class="logo-subtitle">Control Center</div>
            </div>
          </div>

          <div class="sidebar-nav">
            <span class="nav-section-title">Core</span>
            <a class="nav-item ${this.currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard">
              <i data-lucide="layout-dashboard" style="width: 18px; height: 18px;"></i>
              <span>Dashboard</span>
            </a>

            <span class="nav-section-title">Content</span>
            <a class="nav-item ${this.currentView === 'prompts' ? 'active' : ''}" data-view="prompts">
              <i data-lucide="file-text" style="width: 18px; height: 18px;"></i>
              <span>Prompts</span>
            </a>
            <a class="nav-item ${this.currentView === 'categories' ? 'active' : ''}" data-view="categories">
              <i data-lucide="folder" style="width: 18px; height: 18px;"></i>
              <span>Categories</span>
            </a>
            <a class="nav-item ${this.currentView === 'ai-tools' ? 'active' : ''}" data-view="ai-tools">
              <i data-lucide="cpu" style="width: 18px; height: 18px;"></i>
              <span>AI Tools</span>
            </a>
            <a class="nav-item ${this.currentView === 'tags' ? 'active' : ''}" data-view="tags">
              <i data-lucide="tag" style="width: 18px; height: 18px;"></i>
              <span>Tags</span>
            </a>

            <span class="nav-section-title">Mobile App</span>
            <a class="nav-item ${this.currentView === 'app-config' ? 'active' : ''}" data-view="app-config">
              <i data-lucide="sliders" style="width: 18px; height: 18px;"></i>
              <span>App Settings</span>
            </a>
            <a class="nav-item ${this.currentView === 'ad-config' ? 'active' : ''}" data-view="ad-config">
              <i data-lucide="dollar-sign" style="width: 18px; height: 18px;"></i>
              <span>Ad Config</span>
            </a>
            <a class="nav-item ${this.currentView === 'store-listing' ? 'active' : ''}" data-view="store-listing">
              <i data-lucide="play-circle" style="width: 18px; height: 18px;"></i>
              <span>Play Store Listing</span>
              <span class="nav-badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399;">ASO</span>
            </a>

            <span class="nav-section-title">Moderation & Staff</span>
            <a class="nav-item ${this.currentView === 'reports' ? 'active' : ''}" data-view="reports">
              <i data-lucide="flag" style="width: 18px; height: 18px;"></i>
              <span>Reports</span>
            </a>
            <a class="nav-item ${this.currentView === 'admin-users' ? 'active' : ''}" data-view="admin-users">
              <i data-lucide="users" style="width: 18px; height: 18px;"></i>
              <span>Admin Staff</span>
            </a>

            <span class="nav-section-title">System</span>
            <a class="nav-item ${this.currentView === 'audit-logs' ? 'active' : ''}" data-view="audit-logs">
              <i data-lucide="shield" style="width: 18px; height: 18px;"></i>
              <span>Audit Trail</span>
            </a>
          </div>

          <div class="sidebar-footer">
            <div class="user-profile">
              <div class="user-avatar">${(admin.name || 'A')[0].toUpperCase()}</div>
              <div class="user-info">
                <span class="user-name">${admin.name || 'Admin'}</span>
                <span class="user-role">${admin.role || 'SUPER_ADMIN'}</span>
              </div>
            </div>
            <button class="btn-icon" id="logout-btn" title="Sign Out">
              <i data-lucide="log-out" style="width: 16px; height: 16px;"></i>
            </button>
          </div>
        </aside>

        <!-- Main Viewport -->
        <div class="main-wrapper">
          <div id="mobile-sidebar-backdrop" class="mobile-sidebar-backdrop"></div>
          <header class="top-nav">
            <div style="display: flex; align-items: center; gap: 14px;">
              <button id="sidebar-toggle-btn" class="sidebar-toggle-btn" title="Toggle navigation drawer" aria-label="Toggle navigation drawer">
                <i data-lucide="menu" style="width: 19px; height: 19px;"></i>
              </button>
              <div style="font-size: 0.85rem; color: var(--text-secondary);">
                Viral AI Photo Prompt &bull; <span style="color: var(--primary); font-weight: 600;">Control Panel</span>
              </div>
            </div>

            <div class="nav-actions">
              <div class="system-status-pill">
                <span class="status-dot"></span>
                <span>MongoDB Atlas &bull; Live</span>
              </div>

              <a href="/api/docs" target="_blank" class="btn btn-secondary btn-sm" id="top-nav-api-docs">
                <i data-lucide="book-open" style="width: 14px; height: 14px;"></i> API Docs
              </a>

              <a href="http://localhost:5555" target="_blank" class="btn btn-secondary btn-sm">
                <i data-lucide="database" style="width: 14px; height: 14px;"></i> Studio
              </a>
            </div>
          </header>

          <main class="content-container" id="main-content"></main>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    // Universal Sidebar / Drawer Toggle for all screen sizes
    const appLayout = this.root.querySelector('#app-layout');
    const sidebar = this.root.querySelector('.sidebar');
    const mobileBackdrop = this.root.querySelector('#mobile-sidebar-backdrop');
    const toggleBtn = this.root.querySelector('#sidebar-toggle-btn');

    // Restore desktop preference
    const isDesktop = () => window.innerWidth >= 900;
    if (isDesktop() && localStorage.getItem('admin_sidebar_collapsed') === 'true') {
      appLayout?.classList.add('sidebar-collapsed');
    }

    const toggleSidebar = () => {
      if (isDesktop()) {
        appLayout?.classList.toggle('sidebar-collapsed');
        const collapsed = appLayout?.classList.contains('sidebar-collapsed');
        localStorage.setItem('admin_sidebar_collapsed', collapsed ? 'true' : 'false');
      } else {
        sidebar?.classList.toggle('mobile-open');
        mobileBackdrop?.classList.toggle('active');
      }
    };

    const closeMobileSidebar = () => {
      sidebar?.classList.remove('mobile-open');
      mobileBackdrop?.classList.remove('active');
    };

    toggleBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      toggleSidebar();
    });

    mobileBackdrop?.addEventListener('click', closeMobileSidebar);

    // Bind sidebar item clicks
    this.root.querySelectorAll('.nav-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        closeMobileSidebar();
        const view = item.getAttribute('data-view');
        if (view) this.navigate(view);
      });
    });

    // Bind logout button
    this.root.querySelector('#logout-btn')?.addEventListener('click', () => {
      authState.clear();
      toast.info('Signed out successfully');
      this.render();
    });

    // Bind API Docs link to include current session token
    const apiDocsLink = this.root.querySelector('#top-nav-api-docs');
    if (apiDocsLink) {
      apiDocsLink.addEventListener('click', () => {
        const token = localStorage.getItem('admin_token');
        if (token) {
          apiDocsLink.href = `/api/docs?token=${encodeURIComponent(token)}`;
        }
      });
    }

    // Render initial view
    this.renderMainContent();
  }

  renderMainContent(options = {}) {
    const container = document.getElementById('main-content');
    if (!container) return;

    switch (this.currentView) {
      case 'dashboard':
        renderDashboard(container, this);
        break;
      case 'prompts':
        renderPrompts(container, this, options);
        break;
      case 'prompt-editor':
        renderPromptEditor(container, this, options.promptId);
        break;
      case 'categories':
        renderCategories(container, options);
        break;
      case 'ai-tools':
        renderAiTools(container, options);
        break;
      case 'tags':
        renderTags(container, options);
        break;
      case 'app-config':
        renderAppConfig(container, options);
        break;
      case 'ad-config':
        renderAdConfig(container, options);
        break;
      case 'store-listing':
        renderStoreListing(container, options);
        break;
      case 'reports':
        renderReports(container, this);
        break;
      case 'admin-users':
        renderAdminUsers(container);
        break;
      case 'audit-logs':
        renderAuditLogs(container, options);
        break;
      default:
        renderDashboard(container, this);
    }
  }
}

// Boot application
window.addEventListener('DOMContentLoaded', () => {
  window.app = new AdminApp();
});
