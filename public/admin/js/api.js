/**
 * API Client for Admin Panel
 */

const API_BASE = '/api/v1';

export const authState = {
  get token() {
    return localStorage.getItem('admin_token');
  },
  set token(val) {
    if (val) {
      localStorage.setItem('admin_token', val);
      // 1 year persistence (31536000 seconds)
      document.cookie = `admin_token=${encodeURIComponent(val)}; path=/; max-age=31536000; SameSite=Lax`;
    } else {
      localStorage.removeItem('admin_token');
      document.cookie = 'admin_token=; path=/; max-age=0; SameSite=Lax';
    }
  },
  get admin() {
    try {
      return JSON.parse(localStorage.getItem('admin_profile') || 'null');
    } catch {
      return null;
    }
  },
  set admin(val) {
    if (val) localStorage.setItem('admin_profile', JSON.stringify(val));
    else localStorage.removeItem('admin_profile');
  },
  clear() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_profile');
    document.cookie = 'admin_token=; path=/; max-age=0; SameSite=Lax';
  },
};

let isRefreshing = false;
let refreshQueue = [];

function processRefreshQueue(error, newToken = null) {
  refreshQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(newToken);
    }
  });
  refreshQueue = [];
}

async function tryRefreshToken() {
  const refreshToken = localStorage.getItem('admin_refresh_token');
  if (!refreshToken) return null;
  try {
    const res = await fetch(`${API_BASE}/admin/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data?.data?.accessToken) {
      authState.token = data.data.accessToken;
      if (data.data.refreshToken) {
        localStorage.setItem('admin_refresh_token', data.data.refreshToken);
      }
      return data.data.accessToken;
    }
    return null;
  } catch {
    return null;
  }
}

export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('admin_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && !endpoint.includes('/admin/auth/login') && !endpoint.includes('/admin/auth/refresh')) {
      const refreshToken = localStorage.getItem('admin_refresh_token');
      if (refreshToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          try {
            const newToken = await tryRefreshToken();
            isRefreshing = false;
            if (newToken) {
              processRefreshQueue(null, newToken);
              // Retry current failed request with new access token
              return apiRequest(endpoint, {
                ...options,
                headers: {
                  ...(options.headers || {}),
                  Authorization: `Bearer ${newToken}`,
                },
              });
            } else {
              processRefreshQueue(new Error('Refresh failed'));
            }
          } catch (refreshErr) {
            isRefreshing = false;
            processRefreshQueue(refreshErr);
          }
        } else {
          // Another request is currently refreshing the token; wait for it
          return new Promise((resolve, reject) => {
            refreshQueue.push({
              resolve: (newToken) => {
                resolve(
                  apiRequest(endpoint, {
                    ...options,
                    headers: {
                      ...(options.headers || {}),
                      Authorization: `Bearer ${newToken}`,
                    },
                  })
                );
              },
              reject: (err) => reject(err),
            });
          });
        }
      }

      // Only clear and dispatch unauthorized if there is no token at all or refresh definitively failed
      authState.clear();
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      throw new Error('Session expired. Please sign in again.');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      let errorMsg = data.message;
      if (Array.isArray(data.errors) && data.errors.length > 0) {
        errorMsg = data.errors.map((e) => e.message || (typeof e === 'string' ? e : JSON.stringify(e))).join('; ');
      }
      if (!errorMsg) {
        errorMsg = `Request failed with status ${response.status}`;
      }
      const err = new Error(errorMsg);
      err.data = data;
      err.status = response.status;
      throw err;
    }

    return data;
  } catch (err) {
    throw err;
  }
}

export const api = {
  // Auth
  login: (email, password) => apiRequest('/admin/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => apiRequest('/admin/auth/me'),
  registerAdmin: (data) => apiRequest('/admin/auth/register-admin', { method: 'POST', body: JSON.stringify(data) }),

  // Phase 9: Dashboard & Analytics
  getDashboardOverview: () => apiRequest('/admin/dashboard/overview'),
  getTopPrompts: (metric = 'viewCount', limit = 10) => apiRequest(`/admin/dashboard/top-prompts?metric=${metric}&limit=${limit}`),
  getTopCategories: (limit = 10) => apiRequest(`/admin/dashboard/top-categories?limit=${limit}`),
  getEventsTimeseries: (range = '30d', eventType) => {
    const params = new URLSearchParams({ range });
    if (eventType) params.set('eventType', eventType);
    return apiRequest(`/admin/dashboard/timeseries?${params.toString()}`);
  },
  recalculateTrending: () => apiRequest('/admin/analytics/recalculate-trending', { method: 'POST' }),

  // Phase 9: Reports Management
  getReports: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/admin/reports?${q}`);
  },
  getReport: (id) => apiRequest(`/admin/reports/${id}`),
  updateReportStatus: (id, status) => apiRequest(`/admin/reports/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Phase 9: Admin User Management
  getAdminUsers: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/admin/admin-users?${q}`);
  },
  getAdminUser: (id) => apiRequest(`/admin/admin-users/${id}`),
  updateAdminUser: (id, data) => apiRequest(`/admin/admin-users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteAdminUser: (id) => apiRequest(`/admin/admin-users/${id}`, { method: 'DELETE' }),

  // Phase 9: Dedicated Audit Logs
  getAuditLogs: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/admin/audit-logs?${q}`);
  },

  // Prompts
  getPrompts: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/admin/prompts?${q}`);
  },
  getPrompt: (id) => apiRequest(`/admin/prompts/${id}`),
  createPrompt: (data) => apiRequest('/admin/prompts', { method: 'POST', body: JSON.stringify(data) }),
  updatePrompt: (id, data) => apiRequest(`/admin/prompts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePrompt: (id) => apiRequest(`/admin/prompts/${id}`, { method: 'DELETE' }),
  getTopPinnedPrompts: () => apiRequest('/admin/prompts/top-pinned'),
  toggleTopPinnedPrompt: (promptId) => apiRequest('/admin/prompts/top-pinned/toggle', { method: 'POST', body: JSON.stringify({ promptId }) }),
  reorderTopPinnedPrompts: (pinnedIds) => apiRequest('/admin/prompts/top-pinned/reorder', { method: 'PUT', body: JSON.stringify({ pinnedIds }) }),

  // Categories
  getCategories: () => apiRequest('/admin/categories'),
  createCategory: (data) => apiRequest('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => apiRequest(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => apiRequest(`/admin/categories/${id}`, { method: 'DELETE' }),
  uploadCategoryImage: (categoryId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('admin_token');
    const endpoint = categoryId ? `/admin/categories/${categoryId}/image` : `/admin/categories/upload-image`;
    return fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }).then(async (r) => {
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.message || 'Category image upload failed');
      return data;
    });
  },

  // AI Tools
  getAiTools: () => apiRequest('/admin/ai-tools'),
  createAiTool: (data) => apiRequest('/admin/ai-tools', { method: 'POST', body: JSON.stringify(data) }),
  updateAiTool: (id, data) => apiRequest(`/admin/ai-tools/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteAiTool: (id) => apiRequest(`/admin/ai-tools/${id}`, { method: 'DELETE' }),

  // Tags
  getTags: () => apiRequest('/admin/tags'),
  createTag: (data) => apiRequest('/admin/tags', { method: 'POST', body: JSON.stringify(data) }),
  updateTag: (id, data) => apiRequest(`/admin/tags/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTag: (id) => apiRequest(`/admin/tags/${id}`, { method: 'DELETE' }),

  // App Config & Settings
  getAppConfig: () => apiRequest('/admin/app-config'),
  updateAppSetting: (key, value) => apiRequest(`/admin/app-config/${key}`, { method: 'PATCH', body: JSON.stringify({ value }) }),
  getAppVersions: () => apiRequest('/admin/app-version'),
  updateAppVersion: (platform, data) => apiRequest(`/admin/app-version/${platform}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Ad Config
  getAdConfigs: () => apiRequest('/admin/ads'),
  createAdConfig: (data) => apiRequest('/admin/ads', { method: 'POST', body: JSON.stringify(data) }),
  updateAdConfig: (id, data) => apiRequest(`/admin/ads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  upsertAdConfig: (data) => apiRequest('/admin/ads/upsert', { method: 'POST', body: JSON.stringify(data) }),
  disableAllAds: () => apiRequest('/admin/ads/disable-all', { method: 'POST' }),

  // Media & Uploads (Cloudinary backed)
  getPromptMedia: (promptId) => apiRequest(`/admin/prompts/${promptId}/media`),
  uploadPromptMedia: (promptId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('admin_token');
    return fetch(`${API_BASE}/admin/prompts/${promptId}/media`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }).then(async (r) => {
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.message || 'Media upload failed');
      return data;
    });
  },
  deletePromptMedia: (promptId, mediaId) => apiRequest(`/admin/media/${mediaId}`, { method: 'DELETE' }),
  deleteMedia: (mediaId) => apiRequest(`/admin/media/${mediaId}`, { method: 'DELETE' }),
  reorderMedia: (promptId, order) => apiRequest(`/admin/prompts/${promptId}/media/reorder`, { method: 'PATCH', body: JSON.stringify({ order }) }),

  // In-App Purchases & Premium Transactions
  getPurchases: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/admin/purchases${q ? `?${q}` : ''}`);
  },
  getPurchaseStats: () => apiRequest('/admin/purchases/stats'),
  getPurchaseProducts: () => apiRequest('/purchases/products'),

  // Health
  getHealth: () => apiRequest('/health'),
};

