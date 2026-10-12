const express = require("express");
const router = express.Router();
const {
  getDashboardStats,
  getAnalyticsData,
  getNotifications,
  markNotificationRead,
} = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");

router.use(protect);

router.get("/stats", requirePermission("dashboard"), getDashboardStats);
router.get("/analytics", requirePermission("analytics"), getAnalyticsData);
router.get(
  "/notifications",
  requirePermission("notifications"),
  getNotifications,
);
router.put(
  "/notifications/:id/read",
  requirePermission("notifications"),
  markNotificationRead,
);

module.exports = router;
