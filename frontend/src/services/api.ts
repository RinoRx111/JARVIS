import axios from 'axios';

const getBaseURL = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return url.endsWith('/api/v1') ? url : `${url}/api/v1`;
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
});

// Automatically inject JWT access tokens into request headers
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('jarvis_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
