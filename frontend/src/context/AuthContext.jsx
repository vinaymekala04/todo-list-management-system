import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '../api/auth.js';
import { getErrorMessage } from '../api/axios.js';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// The backend may return the token under different keys; accept them all.
function extractToken(data) {
  if (!data) return null;
  return data.token || data.jwt || data.accessToken || null;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // On first load, if a token exists but no user was stored, fetch the profile.
  useEffect(() => {
    async function restoreSession() {
      if (localStorage.getItem('token') && !readStoredUser()) {
        try {
          const { data } = await authApi.getProfile();
          setUser(data);
          localStorage.setItem('user', JSON.stringify(data));
        } catch {
          // Invalid/expired token — the axios 401 interceptor clears it.
        }
      }
      setLoading(false);
    }
    restoreSession();
  }, []);

  function saveSession(data) {
    const newToken = extractToken(data);
    const newUser = data.user || data;
    if (newToken) {
      localStorage.setItem('token', newToken);
      setToken(newToken);
    }
    if (newUser && newUser.email) {
      localStorage.setItem('user', JSON.stringify(newUser));
      setUser(newUser);
    }
  }

  async function login(email, password) {
    try {
      const { data } = await authApi.login({ email, password });
      saveSession(data);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: getErrorMessage(error, 'Login failed. Check your email and password.') };
    }
  }

  async function register(name, email, password) {
    try {
      const { data } = await authApi.register({ name, email, password });
      // Some backends return a token on register (auto-login); others
      // require a separate login. Handle both.
      if (extractToken(data)) {
        saveSession(data);
        return { ok: true, autoLoggedIn: true };
      }
      return { ok: true, autoLoggedIn: false };
    } catch (error) {
      return { ok: false, message: getErrorMessage(error, 'Registration failed. Try a different email.') };
    }
  }

  async function logout() {
    try {
      await authApi.logout();
    } catch {
      // Logout is best-effort; always clear the local session.
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token),
    loading,
    login,
    register,
    logout,
    setUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
