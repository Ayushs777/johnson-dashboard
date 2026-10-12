"use strict";

const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");

const router = express.Router();

router.get("/", protect, requirePermission("employeeDetails"), (req, res) => {
  const { userId, name, email, department, type, permissionGroup } = req.user;
  res.json({
    success: true,
    data: { userId, name, email, department, type, permissionGroup },
  });
});

module.exports = router;
