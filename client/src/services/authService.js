import api from './api';

export const authService = {
  /**
   * KCode login — calls Google-Sheets-backed endpoint.
   * Stores JWT and user info in localStorage (no password stored).
   * Returns the full response so the caller can inspect firstLogin.
   */
  loginWithKCode: async (kcode, password) => {
    const response = await api.post('/auth/kcode-login', { kcode, password });
    const { success, token, user } = response.data;
    if (success && token) {
      localStorage.setItem('johnson_token', token);
      const storedUser = {
        ...user,
        userId: user.kcode,
        token,
      };
      localStorage.setItem('johnson_user', JSON.stringify(storedUser));
    }
    return response.data;
  },

  /**
   * ECode login — calls Google-Sheets-backed endpoint for ECode users.
   * Stores JWT and user info in localStorage (no password stored).
   */
  loginWithECode: async (ecode, password) => {
    const response = await api.post('/auth/ecode-login', { ecode, password });
    const { success, token, user } = response.data;
    if (success && token) {
      localStorage.setItem('johnson_token', token);
      const storedUser = {
        ...user,
        userId: user.ecode,
        token,
      };
      localStorage.setItem('johnson_user', JSON.stringify(storedUser));
    }
    return response.data;
  },


  /**
   * Legacy MongoDB login (Admin accounts).
   */
  login: async (userId, password) => {
    const response = await api.post('/auth/login', { userId, password });
    if (response.data.success && response.data.data?.token) {
      localStorage.setItem('johnson_token', response.data.data.token);
      localStorage.setItem('johnson_user', JSON.stringify(response.data.data));
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('johnson_token');
    localStorage.removeItem('johnson_user');
  },

  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  /**
   * MongoDB user password change (Admin accounts via Profile page).
   */
  changePassword: async (passwordData) => {
    const response = await api.put('/auth/change-password', passwordData);
    return response.data;
  },

  /**
   * KCode user password change.
   * Writes the new password back to Google Sheet and updates MongoDB metadata.
   * Returns a fresh JWT (firstLogin: false) on success so the frontend can
   * navigate directly to /dashboard.
   */
  kcodeChangePassword: async ({ currentPassword, newPassword, confirmPassword }) => {
    const response = await api.post('/auth/kcode-change-password', {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    // If the backend returned a fresh token, persist it
    if (response.data.success && response.data.token) {
      localStorage.setItem('johnson_token', response.data.token);
      if (response.data.user) {
        const storedUser = {
          ...response.data.user,
          userId: response.data.user.kcode,
          token: response.data.token,
        };
        localStorage.setItem('johnson_user', JSON.stringify(storedUser));
      }
    }
    return response.data;
  },

  /**
   * Admin-only: reset a KCode user's password in the Google Sheet.
   * Forces the user to change the temporary password on next login.
   */
  adminResetKCodePassword: async ({ kcode, newPassword }) => {
    const response = await api.post('/auth/admin/reset-kcode-password', {
      kcode,
      newPassword,
    });
    return response.data;
  },
};
