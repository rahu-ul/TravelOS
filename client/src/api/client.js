import axios from 'axios';

// Resolve API base URL:
// 1. In production on Vercel: VITE_API_URL or VITE_API_BASE_URL points to the Render backend (e.g. https://travelos-backend-ksib.onrender.com)
// 2. In local development: Defaults to '/api', which Vite dev server automatically proxies to http://localhost:5000
const rawUrl = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '').trim();
const cleanUrl = rawUrl.replace(/\/+$/, '');
export const API_BASE_URL = cleanUrl
  ? (cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`)
  : '/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 25000,
});

// Request interceptor: Attach Bearer token from localStorage for cross-origin deployments (e.g. Vercel -> Render)
api.interceptors.request.use((config) => {
  try {
    const token = localStorage.getItem('travelos_token');
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // Gracefully handle private browsing where localStorage is restricted
  }
  return config;
});

// Response interceptor:
// 1. Capture token on successful login/registration for cross-origin resilience
// 2. Clear token on 401 Unauthorized
// 3. Normalize backend error envelope { success:false, error:{ code, message } } into Error instance
api.interceptors.response.use(
  (res) => {
    const token = res.data?.data?.token;
    if (token) {
      try {
        localStorage.setItem('travelos_token', token);
      } catch {}
    }
    return res;
  },
  (err) => {
    if (err.response?.status === 401) {
      try {
        localStorage.removeItem('travelos_token');
      } catch {}
    }
    const apiError = err.response?.data?.error;
    const message = apiError?.message || err.message || 'Network error occurred. Please check your connection.';
    const e = new Error(message);
    e.code = apiError?.code || (err.response ? 'API_ERROR' : 'NETWORK_ERROR');
    e.status = err.response?.status;
    e.details = apiError?.details;
    return Promise.reject(e);
  }
);
