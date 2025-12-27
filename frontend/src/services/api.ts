import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// CSRF token management
let csrfToken: string | null = null;
let sessionId: string | null = null;

// Fetch CSRF token on initialization
async function fetchCsrfToken() {
  try {
    const response = await axios.get(`${API_URL}/api/csrf-token`);
    csrfToken = response.data.csrfToken;
    sessionId = response.data.sessionId;
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
  }
}

// Initialize CSRF token
fetchCsrfToken();

// Add token and CSRF to requests
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add CSRF token for state-changing operations
  if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
    if (!csrfToken) {
      await fetchCsrfToken();
    }
    if (csrfToken && sessionId) {
      config.headers['X-CSRF-Token'] = csrfToken;
      config.headers['X-Session-Id'] = sessionId;
    }
  }
  
  return config;
});

// Handle CSRF token expiration
api.interceptors.response.use(
  (response) => {
    if (typeof response.data === 'string') {
      try {
        response.data = JSON.parse(response.data);
      } catch (e) {
        // If parsing fails, leave as string
      }
    }
    return response;
  },
  async (error) => {
    // If CSRF error, refresh token and retry
    if (error.response?.status === 403 && error.response?.data?.message?.includes('CSRF')) {
      await fetchCsrfToken();
      return api.request(error.config);
    }
    return Promise.reject(error);
  }
);

// Raffle API
export const raffleAPI = {
  getAll: () => api.get('/api/raffles'),
  getById: (id: string) => api.get(`/api/raffles/${id}`),
  getWinner: (id: string) => api.get(`/api/raffles/${id}/winner`),
  getAvailable: (id: string, page: number) => 
    api.get(`/api/raffles/${id}/available?page=${page}`),
  create: (data: any) => api.post('/api/raffles', data),
  update: (id: string, data: any) => api.put(`/api/raffles/${id}`, data),
  updateStatus: (id: string, status: 'open' | 'waiting' | 'closed', winningReceiptId?: string) => 
    api.patch(`/api/raffles/${id}/status`, { status, winningReceiptId }),
  delete: (id: string) => api.delete(`/api/raffles/${id}`),
  downloadCSV: (id: string) => api.get(`/api/raffles/${id}/csv`, { responseType: 'blob' }),
};

// Selection API
export const selectionAPI = {
  getByRaffle: (raffleId: string) => api.get(`/api/selections/${raffleId}`),
  getReceipt: (receiptId: string) => api.get(`/api/selections/receipt/${receiptId}`),
  create: (raffleId: string, data: any) => api.post(`/api/selections/${raffleId}`, data),
};

// Admin API
export const adminAPI = {
  login: (username: string, password: string) => 
    api.post('/api/admin/login', { username, password }),
  init: (username: string, password: string) => 
    api.post('/api/admin/init', { username, password }),
  getSelections: (raffleId: string) => 
    api.get(`/api/admin/selections/${raffleId}`),
  getSelection: (raffleId: string, pageNumber: number, number: number) => 
    api.get(`/api/admin/selection/${raffleId}/${pageNumber}/${number}`),
};

export const receiptAPI = {
  getByRaffle: (raffleId: string) => api.get(`/api/receipts/${raffleId}`),
  getById: (receiptId: string) => api.get(`/api/receipts/detail/${receiptId}`),
  updateStatus: (receiptId: string, status: 'waiting_payment' | 'receipt_uploaded' | 'expired' | 'paid', changedBy?: string, note?: string) =>
    api.patch(`/api/receipts/${receiptId}/status`, { status, changedBy, note }),
  uploadReceipt: (receiptId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/receipts/${receiptId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
