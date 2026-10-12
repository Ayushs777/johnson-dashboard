import api from './api';

export const installationService = {
  getInstallations: async (params = {}) => {
    const response = await api.get('/installations', { params });
    return response.data;
  },

  getInstallationById: async (id) => {
    const response = await api.get(`/installations/${id}`);
    return response.data;
  },

  createInstallation: async (installationData) => {
    const response = await api.post('/installations', installationData);
    return response.data;
  },

  updateInstallation: async (id, installationData) => {
    const response = await api.put(`/installations/${id}`, installationData);
    return response.data;
  },

  deleteInstallation: async (id) => {
    const response = await api.delete(`/installations/${id}`);
    return response.data;
  },
};
