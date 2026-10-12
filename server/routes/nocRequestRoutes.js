"use strict";

const express = require("express");
const { submitNocRequest } = require("../controllers/nocRequestController");
const { protect } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");

const router = express.Router();

router.post("/", protect, requirePermission("nocRequest"), submitNocRequest);

module.exports = router;
