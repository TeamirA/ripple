import { http } from './httpClient.js';

const userPath = (username) => `/users/${encodeURIComponent(username)}`;

export const usersApi = {
  getProfile: (username) => http.get(userPath(username)),
  getPosts: (username, query) => http.get(`${userPath(username)}/posts`, { query }),
  updateProfile: (changes) => http.patch('/users/me', changes),
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append('avatar', file);
    return http.put('/users/me/avatar', form);
  },
  removeAvatar: () => http.delete('/users/me/avatar'),
};
