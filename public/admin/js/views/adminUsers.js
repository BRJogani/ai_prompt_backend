import { api, authState } from '../api.js';
import { toast } from '../toast.js';
import { modal } from '../modal.js';

let currentRoleFilter = '';
let currentPage = 1;
const limit = 20;

export async function renderAdminUsers(container) {
  const currentAdmin = authState.admin || {};
  const isSuperAdmin = currentAdmin.role === 'SUPER_ADMIN';

  container.innerHTML = `
    <div class="view-header">
      <div>
        <h1 class="view-title">Admin Staff & Permissions</h1>
        <p class="view-subtitle">Manage administrative team members, assign role permissions, and control dashboard access</p>
      </div>
      ${isSuperAdmin ? `
        <div>
          <button class="btn btn-primary" id="add-admin-user-btn">
            <i data-lucide="user-plus" style="width: 16px; height: 16px;"></i> Add Admin Staff
          </button>
        </div>
      ` : ''}
    </div>

    ${!isSuperAdmin ? `
      <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: var(--border-radius); padding: 14px 18px; margin-bottom: 20px; display: flex; align-items: center; gap: 12px;">
        <i data-lucide="shield-alert" style="color: #f59e0b; width: 22px; height: 22px; flex-shrink: 0;"></i>
        <div style="font-size: 0.875rem; color: #cbd5e1;">
          <strong style="color: #f59e0b;">Read-Only Mode:</strong> Only users with the <code>SUPER_ADMIN</code> role have permission to register, modify, or deactivate team accounts.
        </div>
      </div>
    ` : ''}

    <!-- Role Filter Tabs -->
    <div style="display: flex; gap: 8px; margin-bottom: 20px; border-bottom: 1px solid var(--border-color); padding-bottom: 12px; flex-wrap: wrap;">
      <button class="btn btn-sm ${currentRoleFilter === '' ? 'btn-primary' : 'btn-secondary'} role-tab" data-role="">
        All Roles
      </button>
      <button class="btn btn-sm ${currentRoleFilter === 'SUPER_ADMIN' ? 'btn-primary' : 'btn-secondary'} role-tab" data-role="SUPER_ADMIN">
        Super Admin
      </button>
      <button class="btn btn-sm ${currentRoleFilter === 'CONTENT_ADMIN' ? 'btn-primary' : 'btn-secondary'} role-tab" data-role="CONTENT_ADMIN">
        Content Admin
      </button>
      <button class="btn btn-sm ${currentRoleFilter === 'EDITOR' ? 'btn-primary' : 'btn-secondary'} role-tab" data-role="EDITOR">
        Editor
      </button>
      <button class="btn btn-sm ${currentRoleFilter === 'ANALYTICS' ? 'btn-primary' : 'btn-secondary'} role-tab" data-role="ANALYTICS">
        Analytics
      </button>
    </div>

    <!-- Admin Users Table Card -->
    <div class="card" style="padding: 0; overflow: hidden;">
      <div id="admin-users-table-container" style="min-height: 250px; position: relative;">
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          <i data-lucide="loader-2" class="spin" style="width: 28px; height: 28px; margin-bottom: 10px;"></i>
          <p>Loading administrative users...</p>
        </div>
      </div>
    </div>
  `;

  if (window.lucide) window.lucide.createIcons();

  container.querySelectorAll('.role-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      currentRoleFilter = tab.getAttribute('data-role') || '';
      currentPage = 1;
      renderAdminUsers(container);
    });
  });

  if (isSuperAdmin) {
    container.querySelector('#add-admin-user-btn')?.addEventListener('click', () => {
      openCreateUserModal(() => loadAdminUsersData(container, isSuperAdmin));
    });
  }

  await loadAdminUsersData(container, isSuperAdmin);
}

async function loadAdminUsersData(container, isSuperAdmin) {
  const tableContainer = container.querySelector('#admin-users-table-container');
  if (!tableContainer) return;

  try {
    const params = { page: currentPage, limit };
    if (currentRoleFilter) params.role = currentRoleFilter;

    const res = await api.getAdminUsers(params);
    const users = Array.isArray(res.data) ? res.data : (res.data?.items || []);
    const total = res.pagination?.total ?? (res.data?.total ?? users.length);
    const totalPages = Math.ceil(total / limit) || 1;

    if (users.length === 0) {
      tableContainer.innerHTML = `
        <div style="text-align: center; padding: 60px 20px; color: var(--text-muted);">
          <i data-lucide="users" style="width: 44px; height: 44px; margin-bottom: 12px; color: var(--text-muted);"></i>
          <h3 style="font-size: 1.1rem; color: #fff; font-weight: 600; margin-bottom: 4px;">No Admin Users Found</h3>
          <p style="font-size: 0.875rem;">No accounts match the current filter.</p>
        </div>
      `;
      if (window.lucide) window.lucide.createIcons();
      return;
    }

    const getRoleBadge = (role) => {
      switch (role) {
        case 'SUPER_ADMIN':
          return '<span class="badge" style="background: rgba(168, 85, 247, 0.2); color: #c084fc; border: 1px solid rgba(168, 85, 247, 0.4);"><i data-lucide="shield-check" style="width: 12px; height: 12px;"></i> SUPER ADMIN</span>';
        case 'CONTENT_ADMIN':
          return '<span class="badge" style="background: rgba(59, 130, 246, 0.2); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.4);"><i data-lucide="edit-3" style="width: 12px; height: 12px;"></i> CONTENT ADMIN</span>';
        case 'EDITOR':
          return '<span class="badge" style="background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.4);"><i data-lucide="pen-tool" style="width: 12px; height: 12px;"></i> EDITOR</span>';
        case 'ANALYTICS':
          return '<span class="badge" style="background: rgba(245, 158, 11, 0.2); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.4);"><i data-lucide="bar-chart-2" style="width: 12px; height: 12px;"></i> ANALYTICS</span>';
        default:
          return `<span class="badge badge-neutral">${role}</span>`;
      }
    };

    tableContainer.innerHTML = `
      <table class="data-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role & Access</th>
            <th>Account Status</th>
            <th>Last Login</th>
            <th>Created</th>
            <th style="text-align: right;">Actions</th>
          </tr>
        </thead>
        <tbody>
          ${users.map((u) => `
            <tr>
              <td>
                <div style="display: flex; align-items: center; gap: 12px;">
                  <div class="user-avatar" style="width: 36px; height: 36px; font-size: 0.9rem; flex-shrink: 0;">
                    ${(u.name || 'A')[0].toUpperCase()}
                  </div>
                  <div>
                    <div style="font-weight: 600; color: #f1f5f9; font-size: 0.9rem;">${u.name}</div>
                    <div style="font-size: 0.78rem; color: var(--text-muted);">${u.email}</div>
                  </div>
                </div>
              </td>
              <td>${getRoleBadge(u.role)}</td>
              <td>
                ${u.isActive ? `
                  <span class="badge badge-success" style="display: inline-flex; align-items: center; gap: 4px;">
                    <span style="width: 6px; height: 6px; border-radius: 50%; background: #22c55e;"></span> Active
                  </span>
                ` : `
                  <span class="badge badge-danger" style="display: inline-flex; align-items: center; gap: 4px;">
                    <span style="width: 6px; height: 6px; border-radius: 50%; background: #ef4444;"></span> Inactive
                  </span>
                `}
              </td>
              <td style="font-size: 0.8rem; color: var(--text-muted); white-space: nowrap;">
                ${u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '<span style="color: var(--text-muted); font-style: italic;">Never</span>'}
              </td>
              <td style="font-size: 0.8rem; color: var(--text-muted); white-space: nowrap;">
                ${new Date(u.createdAt).toLocaleDateString()}
              </td>
              <td style="text-align: right; white-space: nowrap;">
                ${isSuperAdmin ? `
                  <div style="display: inline-flex; gap: 6px;">
                    <button class="btn btn-secondary btn-sm edit-user-btn" data-user='${JSON.stringify(u).replace(/'/g, "&#39;")}' title="Edit Admin User">
                      <i data-lucide="edit-3" style="width: 13px; height: 13px;"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-sm delete-user-btn" data-id="${u.id}" data-name="${u.name}" title="Delete Account">
                      <i data-lucide="trash-2" style="width: 13px; height: 13px;"></i>
                    </button>
                  </div>
                ` : `
                  <span style="font-size: 0.75rem; color: var(--text-muted); font-style: italic;">View Only</span>
                `}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <!-- Pagination -->
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 14px 20px; border-top: 1px solid var(--border-color); background: rgba(0,0,0,0.15);">
        <div style="font-size: 0.85rem; color: var(--text-muted);">
          Showing ${(currentPage - 1) * limit + 1} - ${Math.min(currentPage * limit, total)} of ${total} admin accounts
        </div>
        <div style="display: flex; gap: 8px;">
          <button class="btn btn-secondary btn-sm" id="prev-user-page-btn" ${currentPage <= 1 ? 'disabled' : ''}>
            <i data-lucide="chevron-left" style="width: 14px; height: 14px;"></i> Prev
          </button>
          <span style="display: flex; align-items: center; font-size: 0.85rem; padding: 0 8px; color: #fff;">
            ${currentPage} / ${totalPages}
          </span>
          <button class="btn btn-secondary btn-sm" id="next-user-page-btn" ${currentPage >= totalPages ? 'disabled' : ''}>
            Next <i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i>
          </button>
        </div>
      </div>
    `;

    if (window.lucide) window.lucide.createIcons();

    if (isSuperAdmin) {
      tableContainer.querySelectorAll('.edit-user-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const userStr = btn.getAttribute('data-user');
          if (!userStr) return;
          const user = JSON.parse(userStr);
          openEditUserModal(user, () => loadAdminUsersData(container, isSuperAdmin));
        });
      });

      tableContainer.querySelectorAll('.delete-user-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          const name = btn.getAttribute('data-name');
          modal.confirm({
            title: 'Delete Admin Account',
            message: `Are you sure you want to permanently remove <strong>${name}</strong>? This user will no longer be able to access the admin portal.`,
            confirmText: 'Delete Account',
            confirmType: 'danger',
            onConfirm: async () => {
              try {
                await api.deleteAdminUser(id);
                toast.success(`Admin account "${name}" removed`);
                await loadAdminUsersData(container, isSuperAdmin);
              } catch (err) {
                toast.error(err.message || 'Failed to delete admin user');
                throw err;
              }
            },
          });
        });
      });
    }

    tableContainer.querySelector('#prev-user-page-btn')?.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        loadAdminUsersData(container, isSuperAdmin);
      }
    });

    tableContainer.querySelector('#next-user-page-btn')?.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        loadAdminUsersData(container, isSuperAdmin);
      }
    });
  } catch (err) {
    tableContainer.innerHTML = `
      <div style="text-align: center; padding: 40px; color: #ef4444;">
        <i data-lucide="alert-triangle" style="width: 32px; height: 32px; margin-bottom: 10px;"></i>
        <p>Failed to load admin users: ${err.message}</p>
      </div>
    `;
    if (window.lucide) window.lucide.createIcons();
  }
}

function openCreateUserModal(onSuccess) {
  const bodyHtml = `
    <form id="create-user-form" style="display: flex; flex-direction: column; gap: 16px;">
      <div class="form-group">
        <label class="form-label" for="new-user-name">Full Name *</label>
        <input type="text" class="input-text" id="new-user-name" placeholder="e.g. Alex Morgan" required />
      </div>

      <div class="form-group">
        <label class="form-label" for="new-user-email">Email Address *</label>
        <input type="email" class="input-text" id="new-user-email" placeholder="admin@domain.com" required />
      </div>

      <div class="form-group">
        <label class="form-label" for="new-user-password">Initial Password * (Min 8 characters)</label>
        <input type="password" class="input-text" id="new-user-password" placeholder="••••••••" minlength="8" required />
      </div>

      <div class="form-group">
        <label class="form-label" for="new-user-role">Role & Access Tier *</label>
        <select class="input-select" id="new-user-role" required>
          <option value="CONTENT_ADMIN" selected>CONTENT_ADMIN (Prompts, Categories, AI Tools, Tags)</option>
          <option value="SUPER_ADMIN">SUPER_ADMIN (Full system access & staff management)</option>
          <option value="EDITOR">EDITOR (Create & edit prompt content only)</option>
          <option value="ANALYTICS">ANALYTICS (View dashboards and statistics only)</option>
        </select>
      </div>
    </form>
  `;

  modal.dialog({
    title: 'Register New Admin Staff',
    bodyHtml,
    confirmText: 'Create Account',
    maxWidth: '500px',
    onConfirm: async () => {
      const name = document.getElementById('new-user-name')?.value.trim();
      const email = document.getElementById('new-user-email')?.value.trim();
      const password = document.getElementById('new-user-password')?.value;
      const role = document.getElementById('new-user-role')?.value;

      if (!name || !email || !password) {
        toast.error('All fields are required');
        throw new Error('Validation failed');
      }

      try {
        await api.registerAdmin({ name, email, password, role });
        toast.success(`Admin account "${name}" created successfully`);
        if (onSuccess) onSuccess();
      } catch (err) {
        toast.error(err.message || 'Failed to create admin user');
        throw err;
      }
    },
  });
}

function openEditUserModal(user, onSuccess) {
  const bodyHtml = `
    <form id="edit-user-form" style="display: flex; flex-direction: column; gap: 16px;">
      <div class="form-group">
        <label class="form-label" for="edit-user-name">Full Name *</label>
        <input type="text" class="input-text" id="edit-user-name" value="${user.name}" required />
      </div>

      <div class="form-group">
        <label class="form-label">Email Address</label>
        <input type="email" class="input-text" value="${user.email}" disabled style="opacity: 0.6; cursor: not-allowed;" />
        <span style="font-size: 0.74rem; color: var(--text-muted); margin-top: 4px; display: block;">Email addresses are permanently bound.</span>
      </div>

      <div class="form-group">
        <label class="form-label" for="edit-user-role">Role & Access Permissions *</label>
        <select class="input-select" id="edit-user-role" required>
          <option value="SUPER_ADMIN" ${user.role === 'SUPER_ADMIN' ? 'selected' : ''}>SUPER_ADMIN (Full system access)</option>
          <option value="CONTENT_ADMIN" ${user.role === 'CONTENT_ADMIN' ? 'selected' : ''}>CONTENT_ADMIN (Prompts, Categories, AI Tools, Tags)</option>
          <option value="EDITOR" ${user.role === 'EDITOR' ? 'selected' : ''}>EDITOR (Create & edit prompt content only)</option>
          <option value="ANALYTICS" ${user.role === 'ANALYTICS' ? 'selected' : ''}>ANALYTICS (View dashboards and stats only)</option>
        </select>
      </div>

      <label class="toggle-switch" style="margin-top: 4px;">
        <div>
          <div style="font-size: 0.9rem; font-weight: 600; color: #fff;">Account Active</div>
          <div style="font-size: 0.76rem; color: var(--text-secondary);">Allow this user to sign in to the admin panel</div>
        </div>
        <label class="switch">
          <input type="checkbox" id="edit-user-active" ${user.isActive ? 'checked' : ''} />
          <span class="slider"></span>
        </label>
      </label>
    </form>
  `;

  modal.dialog({
    title: `Edit Admin User: ${user.name}`,
    bodyHtml,
    confirmText: 'Save Changes',
    maxWidth: '500px',
    onConfirm: async () => {
      const name = document.getElementById('edit-user-name')?.value.trim();
      const role = document.getElementById('edit-user-role')?.value;
      const isActive = document.getElementById('edit-user-active')?.checked;

      if (!name) {
        toast.error('Name is required');
        throw new Error('Name required');
      }

      try {
        await api.updateAdminUser(user.id, { name, role, isActive });
        toast.success(`Admin user "${name}" updated successfully`);
        if (onSuccess) onSuccess();
      } catch (err) {
        toast.error(err.message || 'Failed to update admin user');
        throw err;
      }
    },
  });
}
