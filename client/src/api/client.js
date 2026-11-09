import axios from 'axios';

// Same-origin in production, proxied by Vite in development. Cookies carry the session.
export const api = axios.create({ baseURL: '/api', withCredentials: true, timeout: 15000 });

// Normalises the backend error envelope { success:false, error:{ code, message } } into an Error.
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const apiError = err.response?.data?.error;
    const e = new Error(apiError?.message || err.message || 'Network error');
    e.code = apiError?.code || 'NETWORK_ERROR';
    e.status = err.response?.status;
    e.details = apiError?.details;
    return Promise.reject(e);
  }
);
