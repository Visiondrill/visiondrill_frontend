import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const ROOT_URL = API_URL.split('/api')[0]; // e.g. http://localhost:8000

// Create the API instance
export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
    'Accept': 'application/json',
  },
  // Explicitly tell Axios to look for the XSRF-TOKEN cookie and attach it as X-XSRF-TOKEN
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
});

// Helper to get cookie value
const getCookie = (name: string) => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
  return null;
};

// Request interceptor to ensure XSRF token is attached for state-changing requests
api.interceptors.request.use((config) => {
  const token = getCookie('XSRF-TOKEN');
  if (token && (config.method !== 'get' && config.method !== 'head')) {
    config.headers['X-XSRF-TOKEN'] = token;
  }
  return config;
});

// Fetch a fresh CSRF cookie from Laravel Sanctum
export const getCsrfCookie = () => {
  // Use plain axios to avoid interceptor loops and withCredentials for the cookie
  return axios.get(`${ROOT_URL}/sanctum/csrf-cookie?_=${Date.now()}`, {
    withCredentials: true
  });
};

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Retry on 419 CSRF mismatch
    if (error.response?.status === 419 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await getCsrfCookie();
        // Clear the old CSRF header so Axios re-reads it from the fresh cookie
        return api({
          ...originalRequest,
          headers: {
            ...originalRequest.headers,
            'X-XSRF-TOKEN': getCookie('XSRF-TOKEN')
          }
        });
      } catch (retryError) {
        return Promise.reject(retryError);
      }
    }

    // Redirect on 401 from protected routes
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      const path = window.location.pathname;
      const protectedRoutes = ['/student', '/instructor', '/business', '/admin'];
      if (protectedRoutes.some(r => path.startsWith(r)) && !path.includes('/login')) {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
