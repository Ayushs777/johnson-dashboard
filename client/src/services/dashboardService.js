import api from './api';

export const dashboardService = {
  getStats: async () => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },

  getAnalytics: async () => {
    const response = await api.get('/dashboard/analytics');
    return response.data;
  },

  getNotifications: async () => {
    const response = await api.get('/dashboard/notifications');
    return response.data;
  },

  markNotificationRead: async (id) => {
    const response = await api.put(`/dashboard/notifications/${id}/read`);
    return response.data;
  },
};
