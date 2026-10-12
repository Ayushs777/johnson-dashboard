"use strict";

const express = require("express");
const router = express.Router();

const {
  getWorkOrders,
  getWorkOrderById,
  downloadWorkOrder,
} = require("../controllers/workOrderController");
const { protect } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");

router.use(protect);

router.get("/", requirePermission("workOrder"), getWorkOrders);
router.get("/:id/download", requirePermission("workOrder"), downloadWorkOrder);
router.get("/:id", requirePermission("workOrder"), getWorkOrderById);

module.exports = router;
