"use strict";

/**
 * Work Order Controller
 * ─────────────────────────────────────────────────────────────────────────────
 * All work-order data comes from Google Sheets via googleSheetsService.
 * KCode filtering ALWAYS uses req.user.kcode from the verified JWT.
 * Frontend-supplied kcode query parameters are IGNORED for employee users.
 */

const {
  getWorkOrdersData,
  downloadWorkOrderPdf,
} = require("../services/googleSheetsService");

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/work-orders
// Private — KCode users: see only their own; Admin/Manager: see all or filter
// ─────────────────────────────────────────────────────────────────────────────
const getWorkOrders = async (req, res) => {
  try {
    const { type, kcode: jwtKCode, role, email: jwtEmail } = req.user;

    let kcodeFilter = null;
    let emailFilter = null;
    let isManagement = false;

    if (type === "ecode") {
      emailFilter = jwtEmail;
      if (!emailFilter) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Employee email is not configured for work-order access.",
          });
      }
    } else if (type === "kcode") {
      const isAdminOrManager = ["Admin", "Manager"].includes(role);

      if (isAdminOrManager) {
        // Admin/Manager may optionally filter by a specific KCode
        isManagement = true;
        const queryKCode = req.query.kcode
          ? String(req.query.kcode).trim().toUpperCase()
          : null;
        kcodeFilter = queryKCode || null; // null = all work orders
      } else {
        // Regular KCode employee — always filter by their own KCode from JWT
        kcodeFilter = jwtKCode;
        isManagement = false;
      }
    } else if (type === "mongo") {
      // MongoDB admin — can see all
      isManagement = true;
      const queryKCode = req.query.kcode
        ? String(req.query.kcode).trim().toUpperCase()
        : null;
      kcodeFilter = queryKCode || null;
    } else {
      // ECode users should never reach here (blocked by requireKCodeOrAdmin middleware)
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access work orders.",
      });
    }

    const workOrders = await getWorkOrdersData(
      kcodeFilter,
      isManagement,
      emailFilter,
    );

    return res.json({
      success: true,
      count: workOrders.length,
      workOrders,
    });
  } catch (err) {
    console.error("[WorkOrders] Error fetching work orders:", err.message);
    return res.status(500).json({
      success: false,
      message: "Unable to retrieve work orders. Please try again.",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/work-orders/:id
// Private — verifies the work order belongs to the requesting KCode user
// ─────────────────────────────────────────────────────────────────────────────
const getWorkOrderById = async (req, res) => {
  try {
    const { type, kcode: jwtKCode, role, email: jwtEmail } = req.user;
    const { id } = req.params;

    let kcodeFilter = null;
    let emailFilter = null;
    let isManagement = false;

    if (type === "ecode") {
      emailFilter = jwtEmail;
      if (!emailFilter) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Employee email is not configured for work-order access.",
          });
      }
    } else if (type === "kcode") {
      const isAdminOrManager = ["Admin", "Manager"].includes(role);
      if (isAdminOrManager) {
        isManagement = true;
      } else {
        kcodeFilter = jwtKCode;
      }
    } else if (type === "mongo") {
      isManagement = true;
    } else {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to access work orders.",
      });
    }

    // Fetch all relevant work orders (filtered by KCode or all for management)
    const workOrders = await getWorkOrdersData(
      kcodeFilter,
      isManagement,
      emailFilter,
    );

    // Find the specific work order by id/workOrderId
    const wo = workOrders.find((w) => w.workOrderId === id || w.id === id);

    if (!wo) {
      // Return 404 regardless of whether the ID exists for another user
      // This prevents leaking whether a work order exists at all
      return res.status(404).json({
        success: false,
        message: "Work order not found.",
      });
    }

    // Extra safety: if non-management, confirm the work order belongs to this user
    if (type === "kcode" && !isManagement && wo.scCode !== jwtKCode) {
      return res.status(404).json({
        success: false,
        message: "Work order not found.",
      });
    }

    if (
      type === "ecode" &&
      wo.scEmailId.toLowerCase() !== jwtEmail.toLowerCase()
    ) {
      return res.status(404).json({
        success: false,
        message: "Work order not found.",
      });
    }

    return res.json({
      success: true,
      workOrder: wo,
    });
  } catch (err) {
    console.error("[WorkOrders] Error fetching work order by id:", err.message);
    return res.status(500).json({
      success: false,
      message:
        err.message || "Unable to retrieve work order. Please try again.",
    });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/work-orders/:id/download
// Private — verifies the work order belongs to the requesting KCode user, then downloads PDF
// ─────────────────────────────────────────────────────────────────────────────
const downloadWorkOrder = async (req, res) => {
  try {
    const { type, kcode: jwtKCode, role, email: jwtEmail } = req.user;
    const { id } = req.params;

    let kcodeFilter = null;
    let emailFilter = null;
    let isManagement = false;

    if (type === "ecode") {
      emailFilter = jwtEmail;
      if (!emailFilter) {
        return res
          .status(403)
          .json({
            success: false,
            message: "Employee email is not configured for work-order access.",
          });
      }
    } else if (type === "kcode") {
      const isAdminOrManager = ["Admin", "Manager"].includes(role);
      if (isAdminOrManager) {
        isManagement = true;
      } else {
        kcodeFilter = jwtKCode;
      }
    } else if (type === "mongo") {
      isManagement = true;
    } else {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to download work orders.",
      });
    }

    const { stream, fileName } = await downloadWorkOrderPdf(
      id,
      kcodeFilter,
      isManagement,
      emailFilter,
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);

    stream.pipe(res);
  } catch (err) {
    console.error(
      "[WorkOrders] Error downloading work order pdf:",
      err.message,
    );
    return res.status(500).json({
      success: false,
      message:
        err.message || "Unable to download work order pdf. Please try again.",
    });
  }
};

module.exports = {
  getWorkOrders,
  getWorkOrderById,
  downloadWorkOrder,
};
