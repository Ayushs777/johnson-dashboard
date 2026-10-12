const express = require("express");
const router = express.Router();
const {
  getComplaints,
  getComplaintById,
  createComplaint,
  updateComplaint,
  deleteComplaint,
} = require("../controllers/complaintController");
const { protect } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.use(protect);
router.use(requirePermission("complaintManagement"));

router
  .route("/")
  .get(getComplaints)
  .post(authorizeRoles("Admin", "Manager", "Employee"), createComplaint);

router
  .route("/:id")
  .get(getComplaintById)
  .put(authorizeRoles("Admin", "Manager", "Employee"), updateComplaint)
  .delete(authorizeRoles("Admin", "Manager"), deleteComplaint);

module.exports = router;
