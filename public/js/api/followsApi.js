import { http } from './httpClient.js';

const userPath = (username) => `/users/${encodeURIComponent(username)}`;

export const followsApi = {
  follow: (username) => http.put(`${userPath(username)}/follow`),
  unfollow: (username) => http.delete(`${userPath(username)}/follow`),
  getFollowers: (username, query) => http.get(`${userPath(username)}/followers`, { query }),
  getFollowing: (username, query) => http.get(`${userPath(username)}/following`, { query }),
  getSuggestions: (limit = 5) => http.get('/users/suggestions', { query: { limit } }),
};
