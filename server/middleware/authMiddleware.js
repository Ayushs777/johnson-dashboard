const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { getAccessProfile } = require("../config/accessControl");

const JWT_SECRET =
  process.env.JWT_SECRET || "johnson_lifts_secret_jwt_key_2026_super_secure";

/**
 * protect middleware
 *
 * Supports two token types:
 *  1. MongoDB user  → JWT payload has { id }       → looks up User in DB
 *  2. KCode user    → JWT payload has { type:'kcode', kcode, role, name }
 *                     → builds req.user from the token payload (no DB hit)
 *
 * Both paths expose a consistent req.user shape used by all downstream handlers.
 */
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(token, JWT_SECRET);

      // ── KCode token path ──────────────────────────────────────────────
      if (decoded.type === "kcode") {
        const accessProfile = getAccessProfile("kcode", decoded.department);
        req.user = {
          _id: decoded.kcode,
          userId: decoded.kcode,
          kcode: decoded.kcode,
          name: decoded.name || decoded.kcode,
          role: decoded.role || "Employee",
          department: decoded.department || "",
          email: decoded.email || "",
          status: "Active",
          type: "kcode",
          firstLogin: decoded.firstLogin === true,
          ...accessProfile,
        };
        return next();
      }

      // ── ECode token path ──────────────────────────────────────────────
      if (decoded.type === "ecode") {
        const accessProfile = getAccessProfile("ecode", decoded.department);
        req.user = {
          _id: decoded.ecode,
          userId: decoded.ecode,
          ecode: decoded.ecode,
          name: decoded.name || decoded.ecode,
          role: decoded.role || "Employee",
          department: decoded.department || "",
          email: decoded.email || "",
          status: "Active",
          type: "ecode",
          ...accessProfile,
        };
        return next();
      }

      // ── MongoDB token path ────────────────────────────────────────────
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not found. Authorization denied.",
        });
      }

      if (req.user.status === "Inactive") {
        return res.status(403).json({
          success: false,
          message: "Account is inactive. Please contact system admin.",
        });
      }

      return next();
    } catch (error) {
      console.error(
        "[Auth Middleware] Token verification error:",
        error.message,
      );
      return res.status(401).json({
        success: false,
        message: "Not authorized, token invalid or expired",
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized, no token provided",
    });
  }
};

/**
 * Middleware to restrict ECode users from accessing non-attendance operational routes.
 */
const restrictECodeUsers = (req, res, next) => {
  if (req.user && req.user.type === "ecode") {
    return res.status(403).json({
      success: false,
      message: "You are not authorized to access this operational resource.",
    });
  }
  next();
};

module.exports = { protect, restrictECodeUsers };
