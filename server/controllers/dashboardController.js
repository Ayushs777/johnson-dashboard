const Customer = require("../models/Customer");
const Installation = require("../models/Installation");
const ServiceRecord = require("../models/ServiceRecord");
const Complaint = require("../models/Complaint");
const User = require("../models/User");
const Notification = require("../models/Notification");

const { getWorkOrdersData } = require("../services/googleSheetsService");

// @desc    Get dashboard summary statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    if (["ecode", "kcode"].includes(req.user?.type)) {
      let totalWorkOrders = 0;
      if (req.user.permissions?.includes("workOrder")) {
        const kcodeFilter = req.user.type === "kcode" ? req.user.kcode : null;
        const emailFilter = req.user.type === "ecode" ? req.user.email : null;
        const workOrders = await getWorkOrdersData(
          kcodeFilter,
          false,
          emailFilter,
        );
        totalWorkOrders = workOrders.length;
      }

      return res.json({
        success: true,
        data: {
          totalWorkOrders,
          totalCustomers: 0,
          totalInstallations: 0,
          activeLifts: 0,
          pendingServices: 0,
          openComplaints: 0,
          criticalComplaints: 0,
          activeUsers: 0,
        },
      });
    }

    let totalWorkOrders = 0;
    try {
      const { type, kcode: jwtKCode, role } = req.user || {};
      const isAdminOrManager =
        ["Admin", "Manager"].includes(role) || type === "mongo";
      const kcodeFilter = isAdminOrManager ? null : jwtKCode;
      const wos = await getWorkOrdersData(kcodeFilter, isAdminOrManager);
      totalWorkOrders = wos ? wos.length : 0;
    } catch (woErr) {
      console.warn(
        "[DashboardStats] Could not fetch work orders from Google Sheets:",
        woErr.message,
      );
    }

    let totalCustomers = 0;
    let totalInstallations = 0;
    let totalActiveLifts = 0;
    let pendingServices = 0;
    let openComplaints = 0;
    let criticalComplaints = 0;
    let activeUsers = 0;

    try {
      totalCustomers = await Customer.countDocuments();
      totalInstallations = await Installation.countDocuments();
      const activeLifts = await Customer.aggregate([
        { $match: { serviceStatus: "Operational" } },
        { $group: { _id: null, total: { $sum: "$numberOfLifts" } } },
      ]);
      totalActiveLifts = activeLifts.length > 0 ? activeLifts[0].total : 0;

      pendingServices = await ServiceRecord.countDocuments({
        status: { $in: ["Pending", "Assigned", "In Progress"] },
      });

      openComplaints = await Complaint.countDocuments({
        status: { $in: ["Open", "Assigned", "In Progress"] },
      });

      criticalComplaints = await Complaint.countDocuments({
        priority: "Critical",
        status: { $nin: ["Resolved", "Closed"] },
      });

      activeUsers = await User.countDocuments({ status: "Active" });
    } catch (dbErr) {
      console.warn("[DashboardStats] MongoDB query error:", dbErr.message);
    }

    res.json({
      success: true,
      data: {
        totalWorkOrders,
        totalCustomers,
        totalInstallations,
        activeLifts: totalActiveLifts,
        pendingServices,
        openComplaints,
        criticalComplaints,
        activeUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get analytics chart data using aggregation
// @route   GET /api/analytics
// @access  Private
const getAnalyticsData = async (req, res, next) => {
  try {
    // 1. Installation Status distribution
    const installationStatusAgg = await Installation.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);
    const installationStatusData = installationStatusAgg.map((item) => ({
      name: item._id,
      value: item.count,
    }));

    // 2. Complaints by Priority
    const complaintPriorityAgg = await Complaint.aggregate([
      { $group: { _id: "$priority", count: { $sum: 1 } } },
    ]);
    const complaintsByPriorityData = complaintPriorityAgg.map((item) => ({
      name: item._id,
      count: item.count,
    }));

    // 3. Services by Location (Top Cities / Locations)
    const servicesByLocationAgg = await ServiceRecord.aggregate([
      { $group: { _id: "$location", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 },
    ]);
    const servicesByLocationData = servicesByLocationAgg.map((item) => ({
      location: item._id,
      services: item.count,
    }));

    // 4. Monthly Service Requests (aggregated by month)
    const monthlyServicesAgg = await ServiceRecord.aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$serviceDate" },
            year: { $year: "$serviceDate" },
          },
          count: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "Completed"] }, 1, 0] },
          },
          pending: {
            $sum: { $cond: [{ $ne: ["$status", "Completed"] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const monthlyServiceRequestsData = monthlyServicesAgg.map((item) => ({
      month: `${months[item._id.month - 1]} ${item._id.year}`,
      total: item.count,
      completed: item.completed,
      pending: item.pending,
    }));

    // 5. Customer Growth Timeline
    const customerGrowthAgg = await Customer.aggregate([
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    let runningTotal = 0;
    const customerGrowthData = customerGrowthAgg.map((item) => {
      runningTotal += item.count;
      return {
        month: `${months[item._id.month - 1]} ${item._id.year}`,
        newCustomers: item.count,
        totalCustomers: runningTotal,
      };
    });

    res.json({
      success: true,
      data: {
        installationStatus: installationStatusData,
        complaintsByPriority: complaintsByPriorityData,
        servicesByLocation: servicesByLocationData,
        monthlyServiceRequests: monthlyServiceRequestsData,
        customerGrowth: customerGrowthData,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get notifications
// @route   GET /api/dashboard/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    let notifications = [];
    let unreadCount = 0;
    try {
      notifications = await Notification.find()
        .sort({ createdAt: -1 })
        .limit(10);
      unreadCount = await Notification.countDocuments({ isRead: false });
    } catch (dbError) {
      console.warn(
        "[Dashboard] MongoDB unavailable for notifications, returning empty:",
        dbError.message,
      );
    }

    res.json({
      success: true,
      data: notifications,
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark notification as read
// @route   PUT /api/dashboard/notifications/:id/read
// @access  Private
const markNotificationRead = async (req, res, next) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) {
      return res
        .status(404)
        .json({ success: false, message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    res.json({ success: true, message: "Notification marked as read" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getAnalyticsData,
  getNotifications,
  markNotificationRead,
};
