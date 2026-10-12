/**
 * Auth Controller
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles all authentication and password-management endpoints.
 *
 * Endpoints:
 *  POST   /api/auth/login                   — MongoDB admin login (unchanged)
 *  POST   /api/auth/kcode-login             — KCode (Google Sheet) login
 *  POST   /api/auth/kcode-change-password   — KCode password change (→ Sheet)
 *  POST   /api/auth/admin/reset-kcode-password — Admin-only KCode reset
 *  PUT    /api/auth/change-password         — MongoDB user password change
 *  GET    /api/auth/me                      — Current user profile
 *  POST   /api/auth/refresh-kcodes          — (no-op, kept for compat)
 *
 * SECURITY RULES enforced here:
 *  - Passwords are NEVER logged.
 *  - Passwords are NEVER included in any HTTP response.
 *  - Passwords are NEVER included in JWT payloads.
 *  - Google credentials are NEVER exposed to clients.
 *  - KCode identity is always taken from the JWT, never from request body.
 */

"use strict";

const jwt = require("jsonwebtoken");
const User = require("../models/User");
const KCodeAuthMeta = require("../models/KCodeAuthMeta");
const {
  findKCodeUser,
  findECodeUser,
  updateKCodePassword,
} = require("../services/googleSheetsService");
const { getAccessProfile } = require("../config/accessControl");

const JWT_SECRET =
  process.env.JWT_SECRET || "johnson_lifts_secret_jwt_key_2026_super_secure";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

// ─── Code format validator ───────────────────────────────────────────────────
const CODE_REGEX = /^[A-Z0-9]+$/;

// ─── Token helper ─────────────────────────────────────────────────────────────
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// ─── Code normaliser ─────────────────────────────────────────────────────────
function normaliseCode(raw) {
  return String(raw || "")
    .trim()
    .toUpperCase();
}
function normaliseKCode(raw) {
  return normaliseCode(raw);
}

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/kcode-login
// Public
// ─────────────────────────────────────────────────────────────────────────────
const kcodeLogin = async (req, res) => {
  try {
    const { kcode, password } = req.body;

    // 1. Presence check
    if (!kcode || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter your KCode and Password.",
      });
    }

    // 2. Normalise & validate KCode format
    const normalisedKCode = normaliseKCode(kcode);
    if (!CODE_REGEX.test(normalisedKCode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid KCode format. Only letters and numbers are allowed.",
      });
    }

    // 3. Fetch LIVE user from Google Sheet (no cache — ensures new users work immediately)
    let sheetUser;
    try {
      sheetUser = await findKCodeUser(normalisedKCode);
    } catch (sheetErr) {
      // Translate technical Google API errors to safe user-facing messages
      console.error("[KCode Login] Sheet read error:", sheetErr.message);

      const isConfigError =
        sheetErr.message.includes("duplicate") ||
        sheetErr.message.includes("configuration is missing") ||
        sheetErr.message.includes("configuration is invalid");

      return res.status(503).json({
        success: false,
        message: isConfigError
          ? sheetErr.message // safe config error, show it
          : "Authentication service is temporarily unavailable. Please try again later.",
      });
    }

    // 4. KCode not found → generic error (prevent user enumeration)
    if (!sheetUser) {
      return res.status(401).json({
        success: false,
        message: "Invalid KCode or password.",
      });
    }

    // 5. Status check — case-insensitive; blank/missing status is treated as Active
    const kcodeStatus = (sheetUser.status || "active").toLowerCase();
    if (kcodeStatus && kcodeStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: "This account is inactive. Please contact the administrator.",
      });
    }

    // 6. Password verification — plain-text comparison (business requirement)
    //    SECURITY: password is NEVER logged
    if (password !== sheetUser.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid KCode or password.",
      });
    }

    // 7. Determine first-login state from MongoDB KCodeAuthMeta
    //    If MongoDB is unavailable, default to isFirstLogin: false so the user
    //    can still access the portal via Google Sheets authentication.
    let isFirstLogin = false;
    try {
      let meta = await KCodeAuthMeta.findOne({ kcode: normalisedKCode });
      if (!meta) {
        // First ever login — create the metadata record
        meta = await KCodeAuthMeta.create({
          kcode: normalisedKCode,
          firstLoginCompleted: false,
          passwordChangedAt: null,
        });
        isFirstLogin = true;
      } else {
        isFirstLogin = !meta.firstLoginCompleted;
      }
    } catch (mongoErr) {
      // MongoDB unavailable — non-fatal, login continues with isFirstLogin: false
      console.warn(
        "[KCode Login] MongoDB unavailable for meta lookup — defaulting isFirstLogin=false:",
        mongoErr.message,
      );
      isFirstLogin = false;
    }

    // 8. Build JWT payload — NEVER include password
    const accessProfile = getAccessProfile("kcode", sheetUser.department);
    const tokenPayload = {
      userId: normalisedKCode,
      kcode: normalisedKCode,
      role: sheetUser.role || "Employee",
      name: sheetUser.name || normalisedKCode,
      type: "kcode",
      department: sheetUser.department || "",
      email: sheetUser.email || "",
      firstLogin: isFirstLogin,
      ...accessProfile,
    };

    const token = generateToken(tokenPayload);

    // 9. Respond — NEVER include password in response
    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        kcode: normalisedKCode,
        userId: normalisedKCode,
        name: sheetUser.name || normalisedKCode,
        role: sheetUser.role || "Employee",
        type: "kcode",
        department: sheetUser.department || "",
        email: sheetUser.email || "",
        firstLogin: isFirstLogin,
        ...accessProfile,
      },
    });
  } catch (err) {
    console.error("[KCode Login] Unexpected error:", err.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred. Please try again.",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/ecode-login
// Public — ECode login (Google Sheet credentials)
// ─────────────────────────────────────────────────────────────────────────────
const ecodeLogin = async (req, res) => {
  try {
    const { ecode, password } = req.body;

    // 1. Presence check
    if (!ecode || !password) {
      return res.status(400).json({
        success: false,
        message: "Please enter your ECode and Password.",
      });
    }

    // 2. Normalise & validate ECode format
    const normalisedECode = normaliseCode(ecode);
    if (!CODE_REGEX.test(normalisedECode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid ECode format. Only letters and numbers are allowed.",
      });
    }

    // 3. Fetch LIVE user from Google Sheet
    let sheetUser;
    try {
      sheetUser = await findECodeUser(normalisedECode);
    } catch (sheetErr) {
      console.error("[ECode Login] Sheet read error:", sheetErr.message);
      return res.status(503).json({
        success: false,
        message:
          "Authentication service is temporarily unavailable. Please try again later.",
      });
    }

    // 4. ECode not found → generic safe error message
    if (!sheetUser) {
      return res.status(401).json({
        success: false,
        message: "Invalid ECode or password.",
      });
    }

    // 5. Status check — case-insensitive; blank/missing status is treated as Active
    const ecodeStatus = (sheetUser.status || "active").toLowerCase();
    if (ecodeStatus && ecodeStatus !== "active") {
      return res.status(403).json({
        success: false,
        message: "Invalid ECode or password.",
      });
    }

    // 6. Password verification (plain-text, NEVER logged)
    if (password !== sheetUser.password) {
      return res.status(401).json({
        success: false,
        message: "Invalid ECode or password.",
      });
    }

    // 7. Build JWT payload with type: "ecode" — NEVER include password
    const accessProfile = getAccessProfile("ecode", sheetUser.department);
    const tokenPayload = {
      userId: normalisedECode,
      ecode: normalisedECode,
      role: sheetUser.role || "Employee",
      name: sheetUser.name || normalisedECode,
      type: "ecode",
      department: sheetUser.department || "",
      email: sheetUser.email || "",
      ...accessProfile,
    };

    const token = generateToken(tokenPayload);

    // 8. Respond — NEVER include password in response
    return res.json({
      success: true,
      message: "Login successful.",
      token,
      user: {
        ecode: normalisedECode,
        userId: normalisedECode,
        name: sheetUser.name || normalisedECode,
        role: sheetUser.role || "Employee",
        type: "ecode",
        department: sheetUser.department || "",
        email: sheetUser.email || "",
        ...accessProfile,
      },
    });
  } catch (err) {
    console.error("[ECode Login] Unexpected error:", err.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred. Please try again.",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/kcode-change-password
// Private (KCode JWT required)
// Changes a KCode user's password: verifies current → validates new → writes
// to Google Sheet → updates MongoDB meta — in that exact order (atomicity).
// ─────────────────────────────────────────────────────────────────────────────
const kcodeChangePassword = async (req, res) => {
  try {
    // 1. This endpoint is only for KCode users
    if (!req.user || req.user.type !== "kcode") {
      return res.status(403).json({
        success: false,
        message: "This endpoint is for KCode users only.",
      });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;
    const kcode = req.user.kcode; // always from JWT — never from body

    // 2. Presence validation
    if (!currentPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is required." });
    }
    if (!newPassword) {
      return res
        .status(400)
        .json({ success: false, message: "New password is required." });
    }
    if (!confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Confirm password is required." });
    }

    // 3. Match check
    if (newPassword !== confirmPassword) {
      return res
        .status(400)
        .json({ success: false, message: "Passwords do not match." });
    }

    // 4. Minimum length
    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters.",
      });
    }

    // 5. Same-as-current check — NEVER log the password values
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from your current password.",
      });
    }

    // 6. Fetch live user from Sheet (validates current password against latest sheet value)
    let sheetUser;
    try {
      sheetUser = await findKCodeUser(kcode);
    } catch (sheetErr) {
      console.error(
        "[KCode ChangePassword] Sheet read error:",
        sheetErr.message,
      );
      return res.status(503).json({
        success: false,
        message:
          "Authentication service is temporarily unavailable. Please try again later.",
      });
    }

    if (!sheetUser) {
      return res.status(404).json({
        success: false,
        message: "KCode not found in the authentication sheet.",
      });
    }

    // 7. Status check
    if ((sheetUser.status || "").toLowerCase() !== "active") {
      return res.status(403).json({
        success: false,
        message: "This account is inactive. Please contact the administrator.",
      });
    }

    // 8. Verify current password — NEVER log
    if (currentPassword !== sheetUser.password) {
      return res.status(400).json({
        success: false,
        message: "Current password is incorrect.",
      });
    }

    // ── Atomicity: write to Sheet FIRST, update MongoDB only on success ──────

    // 9. Write new password to Google Sheet (correct cell, correct column)
    try {
      await updateKCodePassword(kcode, newPassword); // NEVER log newPassword
    } catch (writeErr) {
      console.error(
        "[KCode ChangePassword] Sheet write error:",
        writeErr.message,
      );
      return res.status(503).json({
        success: false,
        message:
          writeErr.message || "Failed to update password. Please try again.",
      });
    }

    // 10. Sheet updated successfully — now update MongoDB metadata (best-effort)
    try {
      await KCodeAuthMeta.findOneAndUpdate(
        { kcode },
        {
          firstLoginCompleted: true,
          passwordChangedAt: new Date(),
        },
        { upsert: true, new: true },
      );
    } catch (mongoErr) {
      console.warn(
        "[KCode ChangePassword] MongoDB unavailable for meta update — continuing:",
        mongoErr.message,
      );
    }

    // 11. Issue a fresh JWT reflecting firstLogin: false so the frontend
    //     can navigate to the dashboard without needing to re-login.
    const accessProfile = getAccessProfile("kcode", req.user.department);
    const newTokenPayload = {
      userId: kcode,
      kcode,
      role: req.user.role || "Employee",
      name: req.user.name || kcode,
      type: "kcode",
      firstLogin: false,
      department: req.user.department || "",
      email: req.user.email || "",
      ...accessProfile,
    };
    const freshToken = generateToken(newTokenPayload);

    return res.json({
      success: true,
      message: "Password changed successfully.",
      token: freshToken,
      user: {
        kcode,
        userId: kcode,
        name: req.user.name || kcode,
        role: req.user.role || "Employee",
        type: "kcode",
        firstLogin: false,
        department: req.user.department || "",
        email: req.user.email || "",
        ...accessProfile,
      },
    });
  } catch (err) {
    console.error("[KCode ChangePassword] Unexpected error:", err.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred. Please try again.",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/admin/reset-kcode-password
// Private (Admin JWT required)
// Lets an Admin set a temporary password for a KCode user and forces them to
// change it on next login.
// ─────────────────────────────────────────────────────────────────────────────
const adminResetKCodePassword = async (req, res) => {
  try {
    // 1. Must be Admin
    if (!req.user || req.user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required.",
      });
    }

    const { kcode, newPassword } = req.body;

    if (!kcode || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "KCode and new temporary password are required.",
      });
    }

    const normalisedKCode = normaliseKCode(kcode);

    if (!CODE_REGEX.test(normalisedKCode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid KCode format.",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Temporary password must be at least 8 characters.",
      });
    }

    // 2. Confirm the KCode exists in the Sheet
    let sheetUser;
    try {
      sheetUser = await findKCodeUser(normalisedKCode);
    } catch (sheetErr) {
      console.error("[Admin Reset] Sheet read error:", sheetErr.message);
      return res.status(503).json({
        success: false,
        message:
          "Authentication service is temporarily unavailable. Please try again later.",
      });
    }

    if (!sheetUser) {
      return res.status(404).json({
        success: false,
        message: `KCode "${normalisedKCode}" not found in the authentication sheet.`,
      });
    }

    // 3. Write new password to Sheet — NEVER log newPassword
    try {
      await updateKCodePassword(normalisedKCode, newPassword);
    } catch (writeErr) {
      console.error("[Admin Reset] Sheet write error:", writeErr.message);
      return res.status(503).json({
        success: false,
        message:
          writeErr.message || "Failed to reset password. Please try again.",
      });
    }

    // 4. Reset first-login flag so the user must change the temp password (best-effort)
    try {
      await KCodeAuthMeta.findOneAndUpdate(
        { kcode: normalisedKCode },
        {
          firstLoginCompleted: false,
          passwordChangedAt: null,
        },
        { upsert: true, new: true },
      );
    } catch (mongoErr) {
      console.warn(
        "[Admin Reset] MongoDB unavailable for meta update — continuing:",
        mongoErr.message,
      );
    }

    return res.json({
      success: true,
      message: `Password for KCode "${normalisedKCode}" has been reset. The user will be required to change it on next login.`,
    });
  } catch (err) {
    console.error("[Admin Reset] Unexpected error:", err.message);
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred.",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Public — MongoDB user login (unchanged; for Admin accounts)
// ─────────────────────────────────────────────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { userId, password } = req.body;

    if (!userId || !password) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Please enter User ID and Password.",
        });
    }

    const user = await User.findOne({
      $or: [{ userId: userId.trim() }, { email: userId.trim().toLowerCase() }],
    }).select("+password");

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid User ID or password." });
    }

    if (user.status === "Inactive") {
      return res.status(403).json({
        success: false,
        message: "Account is inactive. Please contact system admin.",
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid User ID or password." });
    }

    const token = generateToken({ id: user._id });

    res.json({
      success: true,
      message: "Login successful.",
      data: {
        _id: user._id,
        userId: user.userId,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        token,
        type: "mongo",
      },
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me
// Private — current user profile
// ─────────────────────────────────────────────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    res.json({ success: true, data: req.user });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/auth/change-password
// Private — MongoDB users only (Admin).
// KCode users use POST /api/auth/kcode-change-password.
// ─────────────────────────────────────────────────────────────────────────────
const changePassword = async (req, res, next) => {
  try {
    if (req.user?.type === "kcode") {
      return res.status(400).json({
        success: false,
        message:
          "KCode users must use the /api/auth/kcode-change-password endpoint.",
      });
    }

    const { currentPassword, newPassword, confirmNewPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Please fill in all password fields.",
        });
    }
    if (newPassword !== confirmNewPassword) {
      return res
        .status(400)
        .json({ success: false, message: "New passwords do not match." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long.",
      });
    }

    const user = await User.findById(req.user._id).select("+password");
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res
        .status(400)
        .json({ success: false, message: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, message: "Password updated successfully." });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/refresh-kcodes
// Kept for backward compatibility. Cache has been removed so this is a no-op.
// ─────────────────────────────────────────────────────────────────────────────
const refreshKCodes = async (req, res) => {
  return res.json({
    success: true,
    message:
      "KCode authentication now fetches live data on every request. No cache to clear.",
  });
};

module.exports = {
  login,
  kcodeLogin,
  ecodeLogin,
  kcodeChangePassword,
  adminResetKCodePassword,
  refreshKCodes,
  getMe,
  changePassword,
};
