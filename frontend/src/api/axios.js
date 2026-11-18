import axios from 'axios';

// Base URL comes from VITE_API_URL (see .env.example) and falls back to
// the local Spring Boot backend. In dev, vite.config.js also proxies
// "/api" to http://localhost:8080.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach the JWT (stored by AuthContext on login/register) to every request.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 (expired/invalid token) clear the session and send the user to
// the login page. Guard against redirect loops when already on /login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Pull a readable message out of an axios error for display in the UI.
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  if (error.response && error.response.data) {
    const data = error.response.data;
    if (typeof data === 'string') return data;
    if (data.message) return data.message;
    if (data.error) return data.error;
  }
  if (error.message) return error.message;
  return fallback;
}
