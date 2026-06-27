import axios from 'axios';

export const API_URL = (() => {
  const url = process.env.NEXT_PUBLIC_API_URL || (typeof window === 'undefined' ? 'http://localhost:8000' : '');
  return url.endsWith('/api/v1') ? url.replace('/api/v1', '') : url;
})();

const getBaseURL = () => {
  if (!API_URL) return '/api/v1';
  return API_URL.endsWith('/api/v1') ? API_URL : `${API_URL}/api/v1`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject Clerk JWT access tokens into request headers
api.interceptors.request.use(
  async (config) => {
    if (typeof window !== 'undefined') {
      const clerk = (window as any).Clerk;
      if (clerk?.session) {
        try {
          const token = await clerk.session.getToken();
          if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
          }
        } catch (err) {
          console.error("Failed to retrieve Clerk token:", err);
        }
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Clerk handles session refresh silently
api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
