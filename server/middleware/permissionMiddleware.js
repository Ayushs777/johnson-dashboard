"use strict";

const { getAccessProfile } = require("../config/accessControl");

const requirePermission = (permission) => (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required." });
  }

  if (req.user.type !== "kcode" && req.user.type !== "ecode") {
    return next();
  }

  const accessProfile = getAccessProfile(req.user.type, req.user.department);
  if (!accessProfile.permissions.includes(permission)) {
    return res.status(403).json({
      success: false,
      message:
        req.user.type === "ecode" && !accessProfile.accessConfigured
          ? "Access not configured for your department."
          : "You are not authorized to access this module.",
    });
  }

  return next();
};

module.exports = { requirePermission };
