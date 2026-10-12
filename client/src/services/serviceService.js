import api from './api';

export const serviceService = {
  getServices: async (params = {}) => {
    const response = await api.get('/services', { params });
    return response.data;
  },

  getServiceById: async (id) => {
    const response = await api.get(`/services/${id}`);
    return response.data;
  },

  createService: async (serviceData) => {
    const response = await api.post('/services', serviceData);
    return response.data;
  },

  updateService: async (id, serviceData) => {
    const response = await api.put(`/services/${id}`, serviceData);
    return response.data;
  },

  deleteService: async (id) => {
    const response = await api.delete(`/services/${id}`);
    return response.data;
  },
};
