import axios from 'axios';
import { getToken } from './auth';

// API URL from environment variable or default 
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1';

console.log('[api.js] Initializing API with base URL:', API_BASE_URL);

// Create API instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authorization
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  console.log('[api.js] Making API request:', {
    method: config.method?.toUpperCase(),
    url: config.url,
    baseURL: config.baseURL,
    headers: config.headers,
    data: config.data ? '(data present)' : '(no data)',
  });
  
  return config;
}, (error) => {
  console.error('[api.js] API request error:', error);
  return Promise.reject(error);
});

// Add response interceptor for debugging
api.interceptors.response.use((response) => {
  console.log('[api.js] API response received:', {
    status: response.status,
    statusText: response.statusText,
    url: response.config.url,
    dataReceived: !!response.data,
  });
  return response;
}, (error) => {
  console.error('[api.js] API response error:', {
    message: error.message,
    status: error.response?.status,
    statusText: error.response?.statusText,
    url: error.config?.url,
  });
  return Promise.reject(error);
});

// API endpoints based on documentation
export const apiService = {
  // Auth endpoints
  login: (credentials) => api.post('/admin/login', credentials),
  refreshToken: (refreshToken) => api.post('/admin/refresh', { refresh_token: refreshToken }),
  logout: () => api.delete('/admin/logout'),
  
  // Dashboard statistics
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getDashboardGraphData: (period = 'last_30_days', startDate, endDate) => {
    let url = `/admin/dashboard/graph-data?period=${period}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    return api.get(url);
  },
  
  // User management
  getUsers: (page = 1, perPage = 20, search, status) => {
    let url = `/admin/users?page=${page}&per_page=${perPage}`;
    if (search) url += `&search=${search}`;
    if (status && status !== 'all') url += `&status=${status}`;
    return api.get(url);
  },
  getUserDetails: (userId) => api.get(`/admin/users/${userId}`),
  createUser: (userData) => api.post('/admin/users', { user: userData }),
  updateUser: (userId, userData) => api.put(`/admin/users/${userId}`, { user: userData }),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  updateUserPassword: (userId, password) => api.post(`/admin/users/${userId}/update_password`, { user: { password } }),
  getUserDevices: (userId) => api.get(`/admin/users/${userId}/devices`),
  removeUserDevice: (userId, deviceId) => api.delete(`/admin/users/${userId}/devices/${deviceId}`),
  
  // Server management
  getServers: (page = 1, perPage = 20, status, type) => {
    let url = `/admin/servers?page=${page}&per_page=${perPage}`;
    if (status && status !== 'all') url += `&status=${status}`;
    if (type) url += `&type=${type}`;
    return api.get(url);
  },
  getServerDetails: (serverId) => api.get(`/admin/servers/${serverId}`),
  createServer: (serverData) => {
    // Using FormData for multipart/form-data
    const formData = new FormData();
    
    // Add all server fields to formData
    Object.keys(serverData).forEach(key => {
      formData.append(`server[${key}]`, serverData[key]);
    });
    
    return api.post('/admin/servers', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  updateServer: (serverId, serverData) => {
    // Using FormData for multipart/form-data
    const formData = new FormData();
    
    // Add all server fields to formData
    Object.keys(serverData).forEach(key => {
      formData.append(`server[${key}]`, serverData[key]);
    });
    
    return api.put(`/admin/servers/${serverId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  deleteServer: (serverId) => api.delete(`/admin/servers/${serverId}`),
  
  // Server assignment
  getServerAssignments: (page = 1, perPage = 20, status, isPremium, serverId, userId) => {
    let url = `/admin/server_assignments?page=${page}&per_page=${perPage}`;
    if (status && status !== 'all') url += `&status=${status}`;
    if (isPremium !== undefined) url += `&is_premium=${isPremium}`;
    if (serverId) url += `&server_id=${serverId}`;
    if (userId) url += `&user_id=${userId}`;
    return api.get(url);
  },
  getServerAssignment: (assignmentId) => api.get(`/admin/server_assignments/${assignmentId}`),
  getPendingRequests: (page = 1, perPage = 20) => 
    api.get(`/admin/server_assignments/pending_requests?page=${page}&per_page=${perPage}`),
  createServerAssignment: (assignmentData) => 
    api.post('/admin/server_assignments', { server_assignment: assignmentData }),
  updateServerAssignment: (assignmentId, assignmentData) => 
    api.put(`/admin/server_assignments/${assignmentId}`, { server_assignment: assignmentData }),
  deleteServerAssignment: (assignmentId) => 
    api.delete(`/admin/server_assignments/${assignmentId}`),
  approveRequest: (requestId, expiresAt) => 
    api.post(`/admin/server_assignments/${requestId}/approve`, expiresAt ? { expires_at: expiresAt } : {}),
  rejectRequest: (requestId) => 
    api.post(`/admin/server_assignments/${requestId}/reject`),
  
  // Admin roles
  getAdminRoles: () => api.get('/admin/admin_roles'),
  getAdminRole: (id) => api.get(`/admin/admin_roles/${id}`),
  createAdminRole: (roleData) => api.post('/admin/admin_roles', { admin_role: roleData }),
  updateAdminRole: (id, roleData) => api.put(`/admin/admin_roles/${id}`, { admin_role: roleData }),
  deleteAdminRole: (id) => api.delete(`/admin/admin_roles/${id}`),
  getAvailablePermissions: () => api.get('/admin/available_permissions'),
  
  // Affiliate management
  getAffiliateApplications: (page = 1, perPage = 20, status) => {
    let url = `/admin/affiliate-applications?page=${page}&per_page=${perPage}`;
    if (status && status !== 'all') url += `&status=${status}`;
    return api.get(url);
  },
  getAffiliateApplication: (id) => api.get(`/admin/affiliate-applications/${id}`),
  approveAffiliateApplication: (id, data) => api.post(`/admin/affiliate-applications/${id}/approve`, data || {}),
  rejectAffiliateApplication: (id, data) => api.post(`/admin/affiliate-applications/${id}/reject`, data ? { rejection_reason: data.rejection_reason } : {}),
  
  // Commission management
  getCommissions: (page = 1, perPage = 20, status, affiliateId, startDate, endDate) => {
    let url = `/admin/commissions?page=${page}&per_page=${perPage}`;
    if (status && status !== 'all') url += `&status=${status}`;
    if (affiliateId) url += `&affiliate_id=${affiliateId}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    return api.get(url);
  },
  getCommission: (id) => api.get(`/admin/commissions/${id}`),
  approveCommission: (id) => api.post(`/admin/commissions/${id}/approve`),
  rejectCommission: (id, reason) => api.post(`/admin/commissions/${id}/reject`, reason ? { rejection_reason: reason } : {}),
  
  // Withdrawal requests
  getWithdrawalRequests: (page = 1, perPage = 20, status, affiliateId) => {
    let url = `/admin/withdrawal-requests?page=${page}&per_page=${perPage}`;
    if (status && status !== 'all') url += `&status=${status}`;
    if (affiliateId) url += `&affiliate_id=${affiliateId}`;
    return api.get(url);
  },
  getWithdrawalRequest: (id) => api.get(`/admin/withdrawal-requests/${id}`),
  approveWithdrawalRequest: (id) => api.post(`/admin/withdrawal-requests/${id}/approve`),
  rejectWithdrawalRequest: (id, reason) => api.post(`/admin/withdrawal-requests/${id}/reject`, reason ? { rejection_reason: reason } : {}),
  completeWithdrawalRequest: (id, data) => api.post(`/admin/withdrawal-requests/${id}/complete`, data),
  
  // Reports
  getTopAffiliatesReport: (period = 'last_30_days', limit = 10) => 
    api.get(`/admin/reports/top-affiliates?period=${period}&limit=${limit}`),
  getAffiliateNetworkReport: (period = 'all_time') => 
    api.get(`/admin/reports/affiliate-network?period=${period}`),
  getCommissionPerformanceReport: (period = 'last_90_days') => 
    api.get(`/admin/reports/commission-performance?period=${period}`),
  getReferralConversionsReport: (period = 'last_30_days') => 
    api.get(`/admin/reports/referral-conversions?period=${period}`),
  getReferralTreeReport: (affiliateId) => 
    api.get(`/admin/reports/referral-tree/${affiliateId}`),
};

// Helper function to extract data from API responses
export const extractApiData = (response) => {
  if (!response || !response.data) {
    return null;
  }
  
  const data = response.data;
  
  // Handle different API response structures based on the documentation
  
  // If it's an array directly or contains standard collections: users, servers, applications, etc.
  if (Array.isArray(data) || 
      data.users || data.servers || data.applications || 
      data.commissions || data.withdrawal_requests ||
      data.devices) {
    return data;
  }
  
  // If it's a paginated response with data and meta properties
  if (data.data && data.meta) {
    return data;
  }
  
  // If it has a standard JSON:API format with data property
  if (data.data && !data.meta) {
    return data;
  }
  
  // If it's a single resource response like user, server, etc.
  if (data.user || data.server || data.affiliate || 
      data.commission || data.withdrawal_request || 
      data.admin_role) {
    return data;
  }
  
  // If it's a stats/reports response
  if (data.period || data.user_count || data.affiliate_count ||
      data.top_affiliates || data.conversion_stats ||
      data.network_stats || data.commission_stats) {
    return data;
  }
  
  // Default return the response data directly
  return data;
};