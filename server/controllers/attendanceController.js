'use strict';

/**
 * Attendance Controller
 * ─────────────────────────────────────────────────────────────────────────────
 * All attendance data comes from Google Sheets via googleSheetsService.
 * ECode filtering ALWAYS uses req.user.ecode from the verified JWT.
 * Frontend-supplied ecode query parameters are IGNORED for employee users.
 *
 * Department enrichment: after fetching records, each unique ECode is looked up
 * in the employee sheet (header-driven) to get department. One lookup per unique
 * ECode, results are cached per request.
 */

const { getAttendanceData, lookupEmployeeProfile } = require('../services/googleSheetsService');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/attendance
// Private — ECode users: see only their own; Admin/Manager: see all or filter
// ─────────────────────────────────────────────────────────────────────────────
const getMyAttendance = async (req, res) => {
  try {
    const { type, ecode: jwtECode, role, department: jwtDept } = req.user;

    let ecodeFilter = null;
    let isManagement = false;

    if (type === 'ecode') {
      ecodeFilter = jwtECode;
      isManagement = false;
    } else if (type === 'kcode') {
      const isAdminOrManager = ['Admin', 'Manager'].includes(role);
      if (isAdminOrManager) {
        isManagement = true;
        const queryECode = req.query.ecode ? String(req.query.ecode).trim().toUpperCase() : null;
        ecodeFilter = queryECode || null;
      } else {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to access attendance records.',
        });
      }
    } else if (type === 'mongo') {
      isManagement = true;
      const queryECode = req.query.ecode ? String(req.query.ecode).trim().toUpperCase() : null;
      ecodeFilter = queryECode || null;
    } else {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access attendance records.',
      });
    }

    const queryMonth = req.query.month ? parseInt(req.query.month, 10) : null;
    const queryYear  = req.query.year  ? parseInt(req.query.year,  10) : null;

    const attendance = await getAttendanceData(ecodeFilter, isManagement, queryMonth, queryYear);

    // ── Bulk department enrichment (one lookup per unique ECode) ──────────────
    // Build a set of unique ecodes that are missing department info
    const uniqueECodes = [...new Set(attendance.map(r => r.ecode).filter(Boolean))];
    const deptCache = {}; // { 'E17208': 'ERECTION' }

    // If requesting user already has dept in JWT, seed the cache with it
    if (ecodeFilter && jwtDept) {
      deptCache[ecodeFilter] = jwtDept;
    }

    await Promise.all(
      uniqueECodes.map(async (ec) => {
        if (deptCache[ec] !== undefined) return; // already known
        try {
          const profile = await lookupEmployeeProfile({ empCode: ec });
          deptCache[ec] = profile?.department || '';
        } catch (_) {
          deptCache[ec] = '';
        }
      })
    );

    // Attach department to every attendance record
    const enriched = attendance.map(r => ({
      ...r,
      department: deptCache[r.ecode] || '',
    }));

    return res.json({
      success: true,
      count: enriched.length,
      attendance: enriched,
    });
  } catch (err) {
    console.error('[Attendance] Error fetching attendance:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Unable to retrieve attendance records. Please try again.',
    });
  }
};

module.exports = {
  getMyAttendance,
};
