import { http } from './httpClient.js';

export const feedApi = {
  getFollowing: (query) => http.get('/feed/following', { query }),
  getExplore: (query) => http.get('/feed/explore', { query }),
};
