import { http } from './httpClient.js';

export const postsApi = {
  create: ({ content, image }) => {
    if (!image) return http.post('/posts', { content });
    const form = new FormData();
    form.append('content', content);
    form.append('image', image);
    return http.post('/posts', form);
  },
  get: (postId) => http.get(`/posts/${postId}`),
  update: (postId, content) => http.patch(`/posts/${postId}`, { content }),
  remove: (postId) => http.delete(`/posts/${postId}`),
  like: (postId) => http.put(`/posts/${postId}/like`),
  unlike: (postId) => http.delete(`/posts/${postId}/like`),
};
