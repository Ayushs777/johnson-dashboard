"use strict";

const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");

const createFutureModuleRouter = (permission, moduleName) => {
  const router = express.Router();

  router.get("/", protect, requirePermission(permission), (req, res) =>
    res.status(501).json({
      success: false,
      message: `${moduleName} is not implemented yet.`,
    }),
  );

  return router;
};

module.exports = { createFutureModuleRouter };
