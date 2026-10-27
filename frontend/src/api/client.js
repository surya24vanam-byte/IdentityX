import axios from 'axios';

const apiBase = import.meta.env.VITE_API_BASE_URL ? `${import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '')}/api` : '/api';

const api = axios.create({
  baseURL: apiBase,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for consistent error extraction
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An unexpected error occurred.';
    const errorCode = error.response?.data?.error || 'UNKNOWN_ERROR';
    const status = error.response?.status;
    const details = error.response?.data?.details;

    // Handle token invalidation
    if (status === 401 && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/otp-verify')) {
      if (errorCode === 'TOKEN_EXPIRED_OR_INVALID' || errorCode === 'SESSION_REVOKED') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?session_expired=1';
      }
    }

    return Promise.reject({
      status,
      message,
      errorCode,
      details,
      raw: error
    });
  }
);

export default api;
