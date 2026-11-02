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
import { renderPurchases } from './views/purchases.js';

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

    // Generate initials (e.g., "Asad Waseem" -> "AS", "Super Admin" -> "SA")
    const getInitials = (name) => {
      if (!name) return 'AS';
      const parts = name.trim().split(/\s+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.slice(0, 2).toUpperCase();
    };
    const initials = getInitials(admin.name);

    this.root.innerHTML = `
      <div id="app-layout">
        <!-- Floating Narrow Cyber-Slate Sidebar Drawer -->
        <aside class="sidebar">
          <!-- Expanded Header -->
          <div class="sidebar-header-expanded">
            <div class="sidebar-brand">
              <div class="logo-badge">
                <i data-lucide="sparkles" style="width: 20px; height: 20px;"></i>
              </div>
              <div class="logo-text-group">
                <div class="logo-title">Prompt Admin</div>
                <div class="logo-subtitle">Control Center</div>
              </div>
            </div>
            <button id="drawer-collapse-btn" class="drawer-icon-btn" title="Collapse sidebar" aria-label="Collapse sidebar">
              <i data-lucide="chevrons-left" style="width: 18px; height: 18px;"></i>
            </button>
          </div>

          <!-- Collapsed Header -->
          <div class="sidebar-header-collapsed">
            <div class="logo-badge" title="Prompt Admin &bull; Control Center">
              <i data-lucide="sparkles" style="width: 20px; height: 20px;"></i>
            </div>
            <button id="drawer-expand-btn" class="drawer-icon-btn" title="Expand sidebar" aria-label="Expand sidebar">
              <i data-lucide="chevrons-right" style="width: 18px; height: 18px;"></i>
            </button>
          </div>

          <!-- Navigation Links -->
          <div class="sidebar-nav">
            <a class="nav-item ${this.currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard" data-tooltip="Dashboard" title="Dashboard">
              <i data-lucide="home" style="width: 19px; height: 19px;"></i>
              <span class="nav-label">Dashboard</span>
            </a>

            <a class="nav-item ${this.currentView === 'prompts' ? 'active' : ''}" data-view="prompts" data-tooltip="Prompts" title="Prompts">
              <i data-lucide="file-text" style="width: 19px; height: 19px;"></i>
              <span class="nav-label">Prompts</span>
            </a>

            <a class="nav-item ${this.currentView === 'categories' ? 'active' : ''}" data-view="categories" data-tooltip="Categories" title="Categories">
              <i data-lucide="folder" style="width: 19px; height: 19px;"></i>
              <span class="nav-label">Categories</span>
            </a>

            <a class="nav-item ${this.currentView === 'ai-tools' ? 'active' : ''}" data-view="ai-tools" data-tooltip="AI Tools" title="AI Tools">
              <i data-lucide="cpu" style="width: 19px; height: 19px;"></i>
              <span class="nav-label">AI Tools</span>
            </a>

            <a class="nav-item ${this.currentView === 'tags' ? 'active' : ''}" data-view="tags" data-tooltip="Tags" title="Tags">
              <i data-lucide="tag" style="width: 19px; height: 19px;"></i>
              <span class="nav-label">Tags</span>
            </a>

            <a class="nav-item ${this.currentView === 'admin-users' ? 'active' : ''}" data-view="admin-users" data-tooltip="Users" title="Users">
              <i data-lucide="users" style="width: 19px; height: 19px;"></i>
              <span class="nav-label">Users</span>
            </a>

            <!-- APPS Section Divider -->
            <span class="nav-section-title">APPS</span>

            <a class="nav-item ${this.currentView === 'reports' ? 'active' : ''}" data-view="reports" data-tooltip="Reports" title="Reports">
              <i data-lucide="flag" style="width: 19px; height: 19px;"></i>
              <span class="nav-label">Reports</span>
              <span class="nav-badge reports-badge" style="display: none;"></span>
              <span class="nav-corner-badge reports-corner-badge" style="display: none;"></span>
            </a>

            <a class="nav-item ${this.currentView === 'app-config' ? 'active' : ''}" data-view="app-config" data-tooltip="Settings" title="Settings">
              <i data-lucide="settings" style="width: 19px; height: 19px;"></i>
              <span class="nav-label">Settings</span>
            </a>

            <a class="nav-item ${this.currentView === 'ad-config' ? 'active' : ''}" data-view="ad-config" data-tooltip="Ad Config" title="Ad Config">
              <i data-lucide="link" style="width: 19px; height: 19px;"></i>
              <span class="nav-label">Ad Config</span>
            </a>

            <a class="nav-item ${this.currentView === 'store-listing' ? 'active' : ''}" data-view="store-listing" data-tooltip="Play Store Listing" title="Play Store Listing">
              <i data-lucide="play-circle" style="width: 19px; height: 19px;"></i>
              <span class="nav-label">Play Store Listing</span>
              <span class="nav-badge badge-aso">ASO</span>
            </a>

            <a class="nav-item ${this.currentView === 'purchases' ? 'active' : ''}" data-view="purchases" data-tooltip="Purchases" title="Purchases">
              <i data-lucide="crown" style="width: 19px; height: 19px;"></i>
              <span class="nav-label">Purchases</span>
              <span class="nav-badge badge-iap">IAP</span>
            </a>

            <a class="nav-item ${this.currentView === 'audit-logs' ? 'active' : ''}" data-view="audit-logs" data-tooltip="Audit Trail" title="Audit Trail">
              <i data-lucide="shield" style="width: 19px; height: 19px;"></i>
              <span class="nav-label">Audit Trail</span>
            </a>
          </div>

          <!-- Expanded Footer Profile -->
          <div class="sidebar-footer-expanded">
            <div class="drawer-user-card">
              <div class="drawer-avatar">${initials}</div>
              <div class="drawer-user-info">
                <span class="drawer-user-name" title="${admin.name || 'Admin'}">${admin.name || 'Admin'}</span>
                <span class="drawer-user-role">${admin.role || 'Admin'}</span>
              </div>
            </div>
            <button class="drawer-logout-btn" id="logout-btn" title="Sign Out" aria-label="Sign Out">
              <i data-lucide="log-out" style="width: 16px; height: 16px;"></i>
            </button>
          </div>

          <!-- Collapsed Footer Profile -->
          <div class="sidebar-footer-collapsed">
            <div class="drawer-avatar drawer-avatar-collapsed" id="collapsed-avatar-btn" title="Sign Out (${admin.name || 'Admin'})">
              ${initials}
            </div>
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
    const collapseBtn = this.root.querySelector('#drawer-collapse-btn');
    const expandBtn = this.root.querySelector('#drawer-expand-btn');
    const collapsedAvatarBtn = this.root.querySelector('#collapsed-avatar-btn');

    // Desktop: default to narrow collapsed state unless explicitly expanded ('false')
    const isDesktop = () => window.innerWidth >= 900;
    const storedPref = localStorage.getItem('admin_sidebar_collapsed');
    if (isDesktop() && storedPref !== 'false') {
      appLayout?.classList.add('sidebar-collapsed');
    }

    const setCollapsed = (collapsed) => {
      if (collapsed) {
        appLayout?.classList.add('sidebar-collapsed');
        localStorage.setItem('admin_sidebar_collapsed', 'true');
      } else {
        appLayout?.classList.remove('sidebar-collapsed');
        localStorage.setItem('admin_sidebar_collapsed', 'false');
      }
    };

    const toggleSidebar = () => {
      if (isDesktop()) {
        const willCollapse = !appLayout?.classList.contains('sidebar-collapsed');
        setCollapsed(willCollapse);
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

    collapseBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      setCollapsed(true);
    });

    expandBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      setCollapsed(false);
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

    // Bind logout buttons
    const handleSignOut = () => {
      authState.clear();
      toast.info('Signed out successfully');
      this.render();
    };

    this.root.querySelector('#logout-btn')?.addEventListener('click', handleSignOut);
    collapsedAvatarBtn?.addEventListener('click', handleSignOut);

    // Fetch pending reports count to populate badge
    api.getReports({ status: 'PENDING', limit: 1 }).then((res) => {
      const count = res?.meta?.total || 0;
      if (count > 0) {
        this.root.querySelectorAll('.reports-badge').forEach((b) => {
          b.textContent = count;
          b.style.display = 'inline-flex';
        });
        this.root.querySelectorAll('.reports-corner-badge').forEach((b) => {
          b.textContent = count;
          b.style.display = 'flex';
        });
      }
    }).catch(() => {});

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
        renderPromptEditor(container, this, options);
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
      case 'purchases':
        renderPurchases(container, this);
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
