import axios from 'axios';

const baseURL = import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL || '/api')
  : `http://${window.location.hostname}:5000/api`;

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - add token to all requests
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

// Response interceptor - handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      // Only redirect if not already on login/register
      if (!window.location.pathname.includes('/login')) {
        window.location.reload(); // Trigger auth check
      }
    }
    return Promise.reject(error);
  }
);

export default api;
