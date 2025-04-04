import axios from 'axios';

// Set to false to use real API, true for mock data
const USE_MOCK_DATA = false;

// API URL from environment variable or default
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000/api/v1';

console.log('[api.js] Initializing API with base URL:', API_BASE_URL);
console.log('[api.js] Using mock data:', USE_MOCK_DATA);

// Create API instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for debugging
api.interceptors.request.use((config) => {
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

// Add auth token to requests
export const setAuthToken = (token) => {
  console.log('[api.js] Setting auth token:', token ? '(token exists)' : '(no token)');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('[api.js] Auth token set in API headers');
  }
};

// Remove auth token from requests
export const removeAuthToken = () => {
  console.log('[api.js] Removing auth token from API headers');
  delete api.defaults.headers.common['Authorization'];
};

// Initialize token from localStorage on app startup
const initializeToken = () => {
  console.log('[api.js] Initializing token from localStorage');
  const token = localStorage.getItem('vpn_admin_token');
  if (token) {
    console.log('[api.js] Found token in localStorage, setting in API headers');
    setAuthToken(token);
  } else {
    console.log('[api.js] No token found in localStorage');
  }
};

// Run the initialization
initializeToken();

// Handle API response data extraction
const extractResponseData = (response) => {
  console.log('[api.js] Extracting data from response');
  // Check if response has a data property with nested data
  if (response.data && response.data.data) {
    console.log('[api.js] Found nested data structure');
    return response.data.data;
  }
  
  // Otherwise, return the data property
  console.log('[api.js] Using top-level data structure');
  return response.data;
};

// Set up response interceptor for handling errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle token expiration
    if (error.response && error.response.status === 401) {
      // Token expired, redirect to login
      console.error('Authentication error:', error);
    }
    return Promise.reject(error);
  }
);

// Mock API implementation
export const mockApi = {
  // Dashboard data
  getDashboardStats: () => ({
    user_count: 1250,
    servers_count: 45,
    active_assignments: 890,
    pending_requests: 12
  }),
  
  getDashboardGraphData: (period = 'weekly') => ({
    labels: ['2024-03-01', '2024-03-02', '2024-03-03', '2024-03-04', '2024-03-05', '2024-03-06', '2024-03-07'],
    datasets: [
      {
        label: 'New Users',
        data: [12, 19, 3, 5, 2, 3, 8]
      },
      {
        label: 'Server Assignments',
        data: [7, 11, 5, 8, 3, 7, 9]
      }
    ]
  }),
  
  getServerStatus: () => ([
    { id: 1, name: 'Tokyo Server', status: 'online', load: 72, uptime: '99.9%' },
    { id: 2, name: 'London Server', status: 'online', load: 65, uptime: '99.8%' },
    { id: 3, name: 'New York Server', status: 'maintenance', load: 10, uptime: '89.2%' },
    { id: 4, name: 'Sydney Server', status: 'offline', load: 0, uptime: '95.6%' }
  ]),
  
  getRecentActivity: () => ([
    { id: 1, type: 'user_login', message: 'User john.doe logged in', time: '15 minutes ago' },
    { id: 2, type: 'server_update', message: 'Server Tokyo updated to maintenance mode', time: '2 hours ago' },
    { id: 3, type: 'assignment_approved', message: 'Premium server request approved', time: '4 hours ago' },
    { id: 4, type: 'security_alert', message: 'Failed login attempt blocked', time: '6 hours ago' }
  ]),
  
  // User management data
  getUsers: () => ({
    data: [
      { 
        id: "1", 
        type: "user", 
        attributes: {
          email: "john@example.com",
          username: "johndoe",
          status: "active",
          created_at: "2025-01-15T10:30:00Z",
          last_login: "2025-04-01T09:45:00Z"
        }
      },
      { 
        id: "2", 
        type: "user", 
        attributes: {
          email: "jane@example.com",
          username: "janesmith",
          status: "active",
          created_at: "2025-02-10T14:20:00Z",
          last_login: "2025-04-02T11:30:00Z"
        }
      },
      { 
        id: "3", 
        type: "user", 
        attributes: {
          email: "bob@example.com",
          username: "bobjohnson",
          status: "inactive",
          created_at: "2025-01-05T09:15:00Z",
          last_login: "2025-03-15T16:20:00Z"
        }
      },
      { 
        id: "4", 
        type: "user", 
        attributes: {
          email: "alice@example.com",
          username: "alicebrown",
          status: "pending",
          created_at: "2025-03-20T16:45:00Z",
          last_login: null
        }
      }
    ],
    meta: {
      current_page: 1,
      total_pages: 5,
      total_count: 100
    }
  }),
  
  // Server management data
  getServers: () => ({
    data: [
      {
        id: "1",
        type: "server",
        attributes: {
          name: "Tokyo Server",
          server_type: "premium",
          status: "active",
          description: "High-speed server located in Tokyo",
          ip_address: "203.0.113.1",
          created_at: "2024-12-05T08:30:00Z",
          updated_at: "2025-04-01T10:15:00Z",
          image: {
            url: "https://example.com/path/to/image.jpg"
          },
          config: {
            type: "url",
            url: "https://config.example.com/server/1"
          }
        }
      },
      {
        id: "2",
        type: "server",
        attributes: {
          name: "London Server",
          server_type: "premium",
          status: "active",
          description: "High-speed server located in London",
          ip_address: "203.0.113.2",
          created_at: "2024-12-10T09:15:00Z",
          updated_at: "2025-04-01T10:30:00Z",
          image: {
            url: "https://example.com/path/to/image.jpg"
          },
          config: {
            type: "url",
            url: "https://config.example.com/server/2"
          }
        }
      },
      {
        id: "3",
        type: "server",
        attributes: {
          name: "New York Server",
          server_type: "free",
          status: "maintenance",
          description: "Basic server located in New York",
          ip_address: "203.0.113.3",
          created_at: "2024-12-15T10:45:00Z",
          updated_at: "2025-04-02T14:20:00Z",
          image: {
            url: "https://example.com/path/to/image.jpg"
          },
          config: {
            type: "url",
            url: "https://config.example.com/server/3"
          }
        }
      },
      {
        id: "4",
        type: "server",
        attributes: {
          name: "Sydney Server",
          server_type: "free",
          status: "offline",
          description: "Basic server located in Sydney",
          ip_address: "203.0.113.4",
          created_at: "2025-01-05T11:20:00Z",
          updated_at: "2025-04-03T09:15:00Z",
          image: {
            url: "https://example.com/path/to/image.jpg"
          },
          config: {
            type: "url",
            url: "https://config.example.com/server/4"
          }
        }
      }
    ],
    meta: {
      current_page: 1,
      total_pages: 3,
      total_count: 45
    }
  }),
  
  // Server assignments data
  getServerAssignments: () => ({
    data: [
      {
        id: "1",
        type: "server_assignment",
        attributes: {
          user_id: "1",
          server_id: "1",
          status: "active",
          is_premium: true,
          is_public: false,
          request_status: "approved",
          requested_at: "2025-01-20T14:30:00Z",
          approved_at: "2025-01-20T16:20:00Z",
          approved_by_id: "admin-1",
          expires_at: "2025-07-20T14:30:00Z",
          request_notes: "",
          created_at: "2025-01-20T14:30:00Z",
          updated_at: "2025-01-20T16:20:00Z"
        },
        relationships: {
          user: {
            data: {
              id: "1",
              type: "user",
              attributes: {
                email: "john@example.com",
                username: "johndoe"
              }
            }
          },
          server: {
            data: {
              id: "1",
              type: "server",
              attributes: {
                name: "Tokyo Server"
              }
            }
          }
        }
      },
      {
        id: "2",
        type: "server_assignment",
        attributes: {
          user_id: "2",
          server_id: "2",
          status: "active",
          is_premium: true,
          is_public: false,
          request_status: "approved",
          requested_at: "2025-02-15T10:15:00Z",
          approved_at: "2025-02-15T11:20:00Z",
          approved_by_id: "admin-1",
          expires_at: "2025-08-15T10:15:00Z",
          request_notes: "",
          created_at: "2025-02-15T10:15:00Z",
          updated_at: "2025-02-15T11:20:00Z"
        },
        relationships: {
          user: {
            data: {
              id: "2",
              type: "user",
              attributes: {
                email: "jane@example.com",
                username: "janesmith"
              }
            }
          },
          server: {
            data: {
              id: "2",
              type: "server",
              attributes: {
                name: "London Server"
              }
            }
          }
        }
      }
    ],
    meta: {
      current_page: 1,
      total_pages: 45,
      total_count: 890
    }
  }),
  
  getPendingServerRequests: () => ({
    data: [
      {
        id: "1",
        type: "server_assignment_request",
        attributes: {
          user_id: "3",
          server_id: "1",
          requested_at: "2025-04-01T09:45:00Z",
          request_notes: "Need access for business purposes"
        },
        relationships: {
          user: {
            data: {
              id: "3",
              type: "user",
              attributes: {
                email: "bob@example.com",
                username: "bobjohnson"
              }
            }
          },
          server: {
            data: {
              id: "1",
              type: "server",
              attributes: {
                name: "Tokyo Server"
              }
            }
          }
        }
      },
      {
        id: "2",
        type: "server_assignment_request",
        attributes: {
          user_id: "4",
          server_id: "2",
          requested_at: "2025-04-02T14:30:00Z",
          request_notes: "Require secure connection for work"
        },
        relationships: {
          user: {
            data: {
              id: "4",
              type: "user",
              attributes: {
                email: "alice@example.com",
                username: "alicebrown"
              }
            }
          },
          server: {
            data: {
              id: "2",
              type: "server",
              attributes: {
                name: "London Server"
              }
            }
          }
        }
      }
    ],
    meta: {
      current_page: 1,
      total_pages: 1,
      total_count: 12
    }
  }),
  
  // Affiliate management data
  getAffiliates: () => ({
    data: [
      { 
        id: "1", 
        type: "affiliate", 
        attributes: {
          name: 'Tech Bloggers Inc', 
          email: 'partners@techbloggers.com', 
          website: 'https://techbloggers.com', 
          commission_rate: 15, 
          status: 'active', 
          referred_users: 48, 
          total_earnings: 1250.75,
          pending_payment: 350.50,
          payment_method: 'paypal',
          payment_details: 'payments@techbloggers.com',
          joined_at: '2025-01-15T10:30:00Z'
        }
      },
      { 
        id: "2", 
        type: "affiliate", 
        attributes: {
          name: 'VPN Review Hub', 
          email: 'affiliates@vpnreviewhub.com', 
          website: 'https://vpnreviewhub.com', 
          commission_rate: 20, 
          status: 'active', 
          referred_users: 124, 
          total_earnings: 3580.25,
          pending_payment: 780.00,
          payment_method: 'bank_transfer',
          payment_details: 'IBAN: DE89370400440532013000',
          joined_at: '2025-02-10T14:15:00Z'
        }
      },
      { 
        id: "3", 
        type: "affiliate", 
        attributes: {
          name: 'Security First Blog', 
          email: 'partnerships@securityfirst.blog', 
          website: 'https://securityfirst.blog', 
          commission_rate: 12, 
          status: 'pending', 
          referred_users: 0, 
          total_earnings: 0,
          pending_payment: 0,
          payment_method: 'crypto',
          payment_details: 'BTC: 3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5',
          joined_at: '2025-04-01T09:45:00Z'
        }
      },
      { 
        id: "4", 
        type: "affiliate", 
        attributes: {
          name: 'Privacy Advocates Network', 
          email: 'affiliates@privacyadvocates.net', 
          website: 'https://privacyadvocates.net', 
          commission_rate: 18, 
          status: 'suspended', 
          referred_users: 31, 
          total_earnings: 875.50,
          pending_payment: 120.25,
          payment_method: 'paypal',
          payment_details: 'finance@privacyadvocates.net',
          joined_at: '2025-03-05T11:20:00Z'
        }
      },
      { 
        id: "5", 
        type: "affiliate", 
        attributes: {
          name: 'Cyber Security Today', 
          email: 'partners@cybersecuritytoday.com', 
          website: 'https://cybersecuritytoday.com', 
          commission_rate: 15, 
          status: 'active', 
          referred_users: 76, 
          total_earnings: 2150.00,
          pending_payment: 525.75,
          payment_method: 'bank_transfer',
          payment_details: 'IBAN: GB29NWBK60161331926819',
          joined_at: '2025-02-20T16:00:00Z'
        }
      }
    ],
    meta: {
      current_page: 1,
      total_pages: 1,
      total_count: 5
    }
  }),
};

// API methods for different endpoints
const apiEndpoints = {
  // Auth endpoints
  login: (credentials) => api.post('/admin/login', credentials),
  refreshToken: (refreshToken) => api.post('/admin/refresh', { refresh_token: refreshToken }),
  logout: () => api.delete('/admin/logout'),
  
  // Dashboard endpoints
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getDashboardGraphData: (period = 'weekly', startDate, endDate) => {
    let url = `/admin/dashboard/graph-data?period=${period}`;
    if (startDate) url += `&start_date=${startDate}`;
    if (endDate) url += `&end_date=${endDate}`;
    return api.get(url);
  },
  getRecentActivity: () => api.get('/admin/recent-activity'),
  
  // User management endpoints
  getUsers: (page = 1, perPage = 20, search, status) => {
    let url = `/admin/users?page=${page}&per_page=${perPage}`;
    if (search) url += `&search=${search}`;
    if (status) url += `&status=${status}`;
    return api.get(url);
  },
  getUserDetails: (userId) => api.get(`/admin/users/${userId}`),
  updateUser: (userId, userData) => api.put(`/admin/users/${userId}`, { user: userData }),
  getUserDevices: (userId) => api.get(`/admin/users/${userId}/devices`),
  removeUserDevice: (userId, deviceId) => api.delete(`/admin/users/${userId}/devices/${deviceId}`),
  
  // Server management endpoints
  getServers: (page = 1, perPage = 20, status, type) => {
    let url = `/admin/servers?page=${page}&per_page=${perPage}`;
    if (status) url += `&status=${status}`;
    if (type) url += `&type=${type}`;
    return api.get(url);
  },
  getServerDetails: (serverId) => api.get(`/admin/servers/${serverId}`),
  createServer: (serverData) => {
    // Using FormData for multipart/form-data
    const formData = new FormData();
    
    // Add all server fields to formData
    Object.keys(serverData).forEach(key => {
      // Handle nested objects
      if (typeof serverData[key] === 'object' && !serverData[key] instanceof File) {
        formData.append(`server[${key}]`, JSON.stringify(serverData[key]));
      } else {
        formData.append(`server[${key}]`, serverData[key]);
      }
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
      // Handle nested objects
      if (typeof serverData[key] === 'object' && !serverData[key] instanceof File) {
        formData.append(`server[${key}]`, JSON.stringify(serverData[key]));
      } else {
        formData.append(`server[${key}]`, serverData[key]);
      }
    });
    
    return api.put(`/admin/servers/${serverId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  },
  deleteServer: (serverId) => api.delete(`/admin/servers/${serverId}`),
  
  // Server assignment endpoints
  getServerAssignments: (page = 1, perPage = 20, status, isPremium, serverId, userId) => {
    let url = `/admin/server_assignments?page=${page}&per_page=${perPage}`;
    if (status) url += `&status=${status}`;
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
  
  // Affiliate management endpoints
  getAffiliates: (page = 1, perPage = 20, search, status) => {
    let url = `/admin/affiliates?page=${page}&per_page=${perPage}`;
    if (search) url += `&search=${search}`;
    if (status && status !== 'all') url += `&status=${status}`;
    return api.get(url);
  },
  
  getAffiliateDetails: (affiliateId) => api.get(`/admin/affiliates/${affiliateId}`),
  
  createAffiliate: (affiliateData) => api.post('/admin/affiliates', { affiliate: affiliateData }),
  
  updateAffiliate: (affiliateId, affiliateData) => api.put(`/admin/affiliates/${affiliateId}`, { affiliate: affiliateData }),
  
  deleteAffiliate: (affiliateId) => api.delete(`/admin/affiliates/${affiliateId}`),
  
  updateAffiliateStatus: (affiliateId, status) => api.put(`/admin/affiliates/${affiliateId}/status`, { status }),
};

// Helper to get either real or mock data
export const getApiData = async (endpoint, mockDataFn, params = {}) => {
  // Always define fallback mock data function
  const getFallbackData = () => {
    console.log(`[api.js] Using fallback mock data for ${endpoint}`);
    if (typeof mockDataFn === 'function') {
      return mockDataFn(params);
    } else if (endpoint === '/admin/dashboard/stats') {
      return mockApi.getDashboardStats();
    } else if (endpoint === '/admin/dashboard/graph-data') {
      return mockApi.getDashboardGraphData(params.period);
    } else if (endpoint === '/admin/servers') {
      return mockApi.getServerStatus();
    } else if (endpoint === '/admin/recent-activity') {
      return mockApi.getRecentActivity();
    } else if (endpoint.includes('/admin/users')) {
      return mockApi.getUsers();
    } else if (endpoint.includes('/admin/server_assignments')) {
      return mockApi.getServerAssignments();
    } else if (endpoint.includes('/admin/affiliates')) {
      return mockApi.getAffiliates();
    } else {
      console.warn(`[api.js] No mock data available for ${endpoint}`);
      return {};
    }
  };

  if (USE_MOCK_DATA) {
    // Use mock data in development
    console.log(`[api.js] Using configured mock data for ${endpoint}`);
    return getFallbackData();
  } else {
    // Use real API in production
    try {
      // Map the endpoint to the correct API call function
      let apiCall;
      let endpointFound = true;
      
      switch (endpoint) {
        // Auth endpoints
        case '/admin/login':
          apiCall = () => apiEndpoints.login(params);
          break;
        
        // Dashboard endpoints
        case '/admin/dashboard/stats':
          apiCall = () => apiEndpoints.getDashboardStats();
          break;
        case '/admin/dashboard/graph-data':
          apiCall = () => apiEndpoints.getDashboardGraphData(params.period);
          break;
        case '/admin/recent-activity':
          apiCall = () => apiEndpoints.getRecentActivity();
          break;
        
        // User endpoints
        case '/admin/users':
          apiCall = () => apiEndpoints.getUsers(params.page, params.perPage, params.search, params.status);
          break;
        case `/admin/users/${params.userId}`:
          apiCall = () => apiEndpoints.getUserDetails(params.userId);
          break;
        case `/admin/users/${params.userId}/update`:
          apiCall = () => apiEndpoints.updateUser(params.userId, params.userData);
          break;
        case `/admin/users/${params.userId}/devices`:
          apiCall = () => apiEndpoints.getUserDevices(params.userId);
          break;
          
        // Server endpoints
        case '/admin/servers':
          apiCall = () => apiEndpoints.getServers(params.page, params.per_page, params.status, params.type);
          break;
        case `/admin/servers/${params.serverId}`:
          apiCall = () => apiEndpoints.getServerDetails(params.serverId);
          break;
        case '/admin/servers/create':
          apiCall = () => apiEndpoints.createServer(params.serverData);
          break;
        case `/admin/servers/${params.serverId}/update`:
          apiCall = () => apiEndpoints.updateServer(params.serverId, params.serverData);
          break;
        case `/admin/servers/${params.serverId}/delete`:
          apiCall = () => apiEndpoints.deleteServer(params.serverId);
          break;
          
        // Server assignment endpoints
        case '/admin/server_assignments':
          apiCall = () => apiEndpoints.getServerAssignments(
            params.page, 
            params.perPage, 
            params.status, 
            params.isPremium, 
            params.serverId, 
            params.userId
          );
          break;
        case '/admin/server_assignments/pending_requests':
          apiCall = () => apiEndpoints.getPendingRequests(params.page, params.perPage);
          break;
        case `/admin/server_assignments/${params.assignmentId}`:
          apiCall = () => apiEndpoints.getServerAssignment(params.assignmentId);
          break;
        case '/admin/server_assignments/create':
          apiCall = () => apiEndpoints.createServerAssignment(params.assignmentData);
          break;
        case `/admin/server_assignments/${params.assignmentId}/update`:
          apiCall = () => apiEndpoints.updateServerAssignment(params.assignmentId, params.assignmentData);
          break;
        case `/admin/server_assignments/${params.assignmentId}/delete`:
          apiCall = () => apiEndpoints.deleteServerAssignment(params.assignmentId);
          break;
        case `/admin/server_assignments/${params.requestId}/approve`:
          apiCall = () => apiEndpoints.approveRequest(params.requestId, params.expiresAt);
          break;
        case `/admin/server_assignments/${params.requestId}/reject`:
          apiCall = () => apiEndpoints.rejectRequest(params.requestId);
          break;
          
        // Affiliate endpoints
        case '/admin/affiliates':
          apiCall = () => apiEndpoints.getAffiliates(params.page, params.perPage, params.search, params.status);
          break;
        case `/admin/affiliates/${params.affiliateId}`:
          apiCall = () => apiEndpoints.getAffiliateDetails(params.affiliateId);
          break;
        case '/admin/affiliates/create':
          apiCall = () => apiEndpoints.createAffiliate(params.affiliateData);
          break;
        case `/admin/affiliates/${params.affiliateId}/update`:
          apiCall = () => apiEndpoints.updateAffiliate(params.affiliateId, params.affiliateData);
          break;
        case `/admin/affiliates/${params.affiliateId}/delete`:
          apiCall = () => apiEndpoints.deleteAffiliate(params.affiliateId);
          break;
        case `/admin/affiliates/${params.affiliateId}/status`:
          apiCall = () => apiEndpoints.updateAffiliateStatus(params.affiliateId, params.status);
          break;
          
        default:
          console.warn(`[api.js] Unknown endpoint: ${endpoint}`);
          endpointFound = false;
          apiCall = null;
      }
      
      // If no endpoint mapping found, use mock data
      if (!endpointFound || !apiCall) {
        console.warn(`[api.js] Endpoint ${endpoint} not implemented, using mock data`);
        return getFallbackData();
      }
      
      try {
        const response = await apiCall();
        return extractResponseData(response);
      } catch (apiError) {
        console.error(`[api.js] API call to ${endpoint} failed:`, apiError);
        // Check error type
        if (apiError.response) {
          // Server responded with an error status
          const status = apiError.response.status;
          console.error(`[api.js] Server returned status ${status} for ${endpoint}`);
          
          if (status === 404) {
            console.warn(`[api.js] Endpoint ${endpoint} not found on server, using mock data`);
          } else if (status === 500) {
            console.error(`[api.js] Server error for ${endpoint}, using mock data`);
          } else if (status === 401 || status === 403) {
            // Authentication/Authorization error - don't fallback to mock for security reasons
            throw apiError;
          }
        } else if (apiError.request) {
          // Request was made but no response received (network error)
          console.error(`[api.js] Network error for ${endpoint}, using mock data`);
        }
        
        // Fallback to mock data for most errors
        return getFallbackData();
      }
    } catch (error) {
      console.error(`[api.js] Critical error fetching ${endpoint}:`, error);
      
      // Pass through authentication errors
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        throw error;
      }
      
      // Fallback to mock data for other errors
      return getFallbackData();
    }
  }
};

// Export API endpoints for direct use
export const apiService = apiEndpoints;
