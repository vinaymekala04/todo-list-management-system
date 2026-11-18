import api from './axios.js';

// Auth endpoints from the project spec (Section 5).
export const authApi = {
  // POST /api/auth/register — body: { name, email, password }
  // Returns the created user and/or a JWT token, depending on backend.
  register: (data) => api.post('/auth/register', data),

  // POST /api/auth/login — body: { email, password }
  // Returns { token, user } (token field may also be named jwt / accessToken).
  login: (data) => api.post('/auth/login', data),

  // POST /api/auth/logout — optional server-side logout; the client
  // always clears localStorage as well (see AuthContext.logout).
  logout: () => api.post('/auth/logout'),

  // GET /api/users/profile — current logged-in user's profile.
  getProfile: () => api.get('/users/profile'),

  // Change password — POST /api/auth/change-password with
  // { currentPassword, newPassword } (matches backend AuthController).
  changePassword: (data) => api.post('/auth/change-password', data),
};

export default authApi;
