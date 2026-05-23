/**
 * authService.js — Authentication API calls.
 * DB tables: students, teachers, admins
 */
import api from './api';

/** POST /api/auth/login → { user, token } */
export const login = (email, password, role) =>
  api.post('/auth/login', { email, password, role }).then((r) => r.data);

/** POST /api/auth/register → { user, token } */
export const register = (formData, role) =>
  api.post('/auth/register', { ...formData, role }).then((r) => r.data);

/** GET /api/auth/profile → user object (token required) */
export const getProfile = () =>
  api.get('/auth/profile').then((r) => r.data);

/** POST /api/auth/logout */
export const logout = () =>
  api.post('/auth/logout').then((r) => r.data);
