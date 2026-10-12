import api from './api';

export const complaintService = {
  getComplaints: async (params = {}) => {
    const response = await api.get('/complaints', { params });
    return response.data;
  },

  getComplaintById: async (id) => {
    const response = await api.get(`/complaints/${id}`);
    return response.data;
  },

  createComplaint: async (complaintData) => {
    const response = await api.post('/complaints', complaintData);
    return response.data;
  },

  updateComplaint: async (id, complaintData) => {
    const response = await api.put(`/complaints/${id}`, complaintData);
    return response.data;
  },

  deleteComplaint: async (id) => {
    const response = await api.delete(`/complaints/${id}`);
    return response.data;
  },
};
