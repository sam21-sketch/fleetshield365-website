import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API functions
export const vehicleAPI = {
  getAll: () => api.get('/vehicles'),
  getOne: (id: string) => api.get(`/vehicles/${id}`),
  create: (data: any) => api.post('/vehicles', data),
  update: (id: string, data: any) => api.put(`/vehicles/${id}`, data),
  delete: (id: string) => api.delete(`/vehicles/${id}`),
  assignDrivers: (id: string, driverIds: string[]) =>
    api.post(`/vehicles/${id}/assign`, { driver_ids: driverIds }),
};

export const driverAPI = {
  getAll: () => api.get('/drivers'),
  getOne: (id: string) => api.get(`/drivers/${id}`),
  create: (data: any) => api.post('/drivers', data),
  update: (id: string, data: any) => api.put(`/drivers/${id}`, data),
  delete: (id: string) => api.delete(`/drivers/${id}`),
  sendCredentials: (id: string) => api.post(`/drivers/${id}/send-credentials`),
};

export const inspectionAPI = {
  getAll: (params?: any) => api.get('/inspections', { params: { limit: 50, ...params } }),
  getOne: (id: string) => api.get(`/inspections/${id}`),
  getPdf: (id: string) => api.get(`/inspections/${id}/pdf?regenerate=true`),
  getCsv: (params?: any) => api.get('/inspections/export/csv', { params, responseType: 'blob' }),
};

export const fuelAPI = {
  getAll: (params?: any) => api.get('/fuel', { params: { limit: 50, ...params } }),
  getSummary: () => api.get('/fuel/summary'),
};

export const dashboardAPI = {
  getStats: () => {
    const tzOffset = new Date().getTimezoneOffset();
    return api.get(`/dashboard/stats?tz_offset=${tzOffset}`);
  },
  getAlerts: () => api.get('/alerts'),
  getChartData: (days: number = 7) => api.get(`/dashboard/chart-data?days=${days}`),
};

export const subscriptionAPI = {
  getCurrent: () => api.get('/subscription'),
  updateVehicleCount: (count: number) => api.post('/subscription/update-vehicles', { vehicle_count: count }),
  cancel: () => api.post('/subscription/cancel'),
};

export const companyAPI = {
  getSettings: () => api.get('/company/settings'),
  updateSettings: (data: any) => api.put('/company/settings', data),
  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    return api.post('/company/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const userAPI = {
  getAll: () => api.get('/users'),
  create: (data: { email: string; full_name: string; password: string; role: string }) => 
    api.post('/users', data),
  update: (id: string, data: { full_name?: string; role?: string }) => 
    api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

export const paymentAPI = {
  createCheckout: (data: any) => api.post('/payments/checkout', data),
  getStatus: (sessionId: string) => api.get(`/payments/status/${sessionId}`),
};
