import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Raffle API
export const raffleAPI = {
  getAll: () => api.get('/api/raffles'),
  getById: (id: string) => api.get(`/api/raffles/${id}`),
  getAvailable: (id: string, page: number) => 
    api.get(`/api/raffles/${id}/available?page=${page}`),
  create: (data: any) => api.post('/api/raffles', data),
  update: (id: string, data: any) => api.put(`/api/raffles/${id}`, data),
  updateStatus: (id: string, status: 'active' | 'ended') => 
    api.patch(`/api/raffles/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/api/raffles/${id}`),
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

export const healthAPI = {
  check: () => api.get('/health'),
};

export default api;
