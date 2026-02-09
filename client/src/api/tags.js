import api from './axios';

export const tagsAPI = {
  getAll: () => api.get('/tags'),
  create: (tag) => api.post('/tags', tag),
  update: (id, tag) => api.put(`/tags/${id}`, tag),
  delete: (id) => api.delete(`/tags/${id}`)
};
