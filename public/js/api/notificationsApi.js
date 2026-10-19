import { http } from './httpClient.js';

export const notificationsApi = {
  list: (query) => http.get('/notifications', { query }),
  getUnreadCount: () => http.get('/notifications/unread-count'),
  markAllRead: () => http.post('/notifications/read-all'),
};
