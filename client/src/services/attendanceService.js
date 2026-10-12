import api from './api';

export const attendanceService = {
  /**
   * GET /api/attendance
   * For ECode users: returns only their own attendance (backend filters by JWT ecode).
   * For Admin/Manager: optionally pass ecodeFilter to filter by a specific ECode.
   * Pass month (1-12) and year to retrieve a specific month's data from the sheet.
   */
  getAttendance: async (ecodeFilter = null, month = null, year = null) => {
    const params = {};
    if (ecodeFilter) params.ecode = ecodeFilter;
    if (month)  params.month = month;
    if (year)   params.year  = year;
    const response = await api.get('/attendance', { params });
    return response.data;
  },
};
