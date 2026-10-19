import { http } from './httpClient.js';

export const authApi = {
  getCurrentUser: () => http.get('/auth/me'),
  register: (input) => http.post('/auth/register', input),
  login: (identifier, password) => http.post('/auth/login', { identifier, password }),
  loginDemo: () => http.post('/auth/demo'),
  logout: () => http.post('/auth/logout'),
  changePassword: (currentPassword, newPassword) =>
    http.patch('/auth/password', { currentPassword, newPassword }),
};
