import { http } from './httpClient.js';

export const commentsApi = {
  list: (postId, query) => http.get(`/posts/${postId}/comments`, { query }),
  listReplies: (commentId, query) => http.get(`/comments/${commentId}/replies`, { query }),
  create: (postId, content, parentId) =>
    http.post(`/posts/${postId}/comments`, { content, parentId }),
  remove: (commentId) => http.delete(`/comments/${commentId}`),
  like: (commentId) => http.put(`/comments/${commentId}/like`),
  unlike: (commentId) => http.delete(`/comments/${commentId}/like`),
};
