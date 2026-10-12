"use strict";

const express = require("express");
const router = express.Router();

const { getMyAttendance } = require("../controllers/attendanceController");
const { protect } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");

// GET /api/attendance — allowed for: ECode users (own data), Admin/Manager (all/filtered)
// KCode regular employees are blocked inside the controller
router.get("/", protect, requirePermission("attendance"), getMyAttendance);

module.exports = router;
