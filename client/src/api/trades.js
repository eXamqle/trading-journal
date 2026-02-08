import api from './axios';

export const tradesAPI = {
  getAll: (filters) => api.get('/trades', { params: filters }),
  create: (trade) => api.post('/trades', trade),
  update: (id, trade) => api.put(`/trades/${id}`, trade),
  delete: (id) => api.delete(`/trades/${id}`)
};
