const express = require('express');
const router  = express.Router();

const {
  login,
  kcodeLogin,
  ecodeLogin,
  kcodeChangePassword,
  adminResetKCodePassword,
  refreshKCodes,
  getMe,
  changePassword,
} = require('../controllers/authController');

const { protect }        = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

// ── Public routes ──────────────────────────────────────────────────────────

// MongoDB admin login
router.post('/login', login);

// KCode login (Google Sheet credentials, no cache)
router.post('/kcode-login', kcodeLogin);

// ECode login (Google Sheet credentials)
router.post('/ecode-login', ecodeLogin);


// ── Private routes (JWT required) ─────────────────────────────────────────

// Current user profile
router.get('/me', protect, getMe);

// KCode-specific password change → writes back to Google Sheet
// POST so it is symmetric with kcode-login
router.post('/kcode-change-password', protect, kcodeChangePassword);

// MongoDB user password change (Admin accounts)
router.put('/change-password', protect, changePassword);

// Admin-only: reset a KCode user's temporary password in the Google Sheet
router.post(
  '/admin/reset-kcode-password',
  protect,
  authorizeRoles('Admin'),
  adminResetKCodePassword
);

// Backward-compat: cache was removed; this is now a no-op
router.post('/refresh-kcodes', protect, authorizeRoles('Admin'), refreshKCodes);

module.exports = router;
