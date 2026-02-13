import api from './axios';

export const journalAPI = {
  getAll: (filters) => api.get('/journal', { params: filters }),
  getByDate: (date) => api.get(`/journal/${date}`),
  saveEntry: (date, content, tags = []) => api.put(`/journal/${date}`, { content, tags }),
  delete: (date) => api.delete(`/journal/${date}`)
};
