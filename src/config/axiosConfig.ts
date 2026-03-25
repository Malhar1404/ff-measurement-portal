import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s — generous for heavy GLB/JSON payloads

  headers: {
    Accept: 'application/json',
  },
});

// ── Request interceptor ──────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available (e.g. from localStorage)
    // const token = localStorage.getItem('authToken');
    // if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor ─────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with a non-2xx status
      const detail =
        error.response.data?.detail ?? error.response.statusText ?? 'Server error';
      return Promise.reject(new Error(detail));
    } else if (error.request) {
      // Request was made but no response received (network/timeout)
      return Promise.reject(
        new Error('No response from server. Check your network or backend.'),
      );
    }
    return Promise.reject(error);
  },
);

export default apiClient;
