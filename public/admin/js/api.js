/**
 * API Client for Admin Panel
 */

const API_BASE = '/api/v1';

export const authState = {
  get token() {
    return localStorage.getItem('admin_token');
  },
  set token(val) {
    if (val) localStorage.getItem('admin_token', val);
    else localStorage.removeItem('admin_token');
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
  },
};

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

    if (response.status === 401 && !endpoint.includes('/admin/auth/login')) {
      authState.clear();
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      throw new Error('Session expired. Please sign in again.');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.message || `Request failed with status ${response.status}`;
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

  // Categories
  getCategories: () => apiRequest('/admin/categories'),
  createCategory: (data) => apiRequest('/admin/categories', { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => apiRequest(`/admin/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => apiRequest(`/admin/categories/${id}`, { method: 'DELETE' }),

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

  // Home Sections
  getHomeSections: () => apiRequest('/admin/home-sections'),
  createHomeSection: (data) => apiRequest('/admin/home-sections', { method: 'POST', body: JSON.stringify(data) }),
  updateHomeSection: (id, data) => apiRequest(`/admin/home-sections/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteHomeSection: (id) => apiRequest(`/admin/home-sections/${id}`, { method: 'DELETE' }),

  // App Config & Settings
  getAppConfig: () => apiRequest('/admin/app-config'),
  updateAppSetting: (key, value) => apiRequest(`/admin/app-config/${key}`, { method: 'PATCH', body: JSON.stringify({ value }) }),
  getAppVersions: () => apiRequest('/admin/app-version'),
  updateAppVersion: (platform, data) => apiRequest(`/admin/app-version/${platform}`, { method: 'PUT', body: JSON.stringify(data) }),

  // Ad Config
  getAdConfigs: () => apiRequest('/admin/ads'),
  createAdConfig: (data) => apiRequest('/admin/ads', { method: 'POST', body: JSON.stringify(data) }),
  updateAdConfig: (id, data) => apiRequest(`/admin/ads/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
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
  deleteMedia: (mediaId) => apiRequest(`/admin/media/${mediaId}`, { method: 'DELETE' }),
  reorderMedia: (promptId, order) => apiRequest(`/admin/prompts/${promptId}/media/reorder`, { method: 'PATCH', body: JSON.stringify({ order }) }),

  // Health
  getHealth: () => apiRequest('/health'),
};
