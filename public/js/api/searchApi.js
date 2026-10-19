import { http } from './httpClient.js';

export const searchApi = {
  users: (q, options) => http.get('/search/users', { ...options, query: { q, limit: 10 } }),
  posts: (q, query, options) => http.get('/search/posts', { ...options, query: { ...query, q } }),
};
