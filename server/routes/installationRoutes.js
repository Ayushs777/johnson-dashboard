const express = require("express");
const router = express.Router();
const {
  getInstallations,
  getInstallationById,
  createInstallation,
  updateInstallation,
  deleteInstallation,
} = require("../controllers/installationController");
const { protect } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.use(protect);
router.use(requirePermission("installationManagement"));

router
  .route("/")
  .get(getInstallations)
  .post(authorizeRoles("Admin", "Manager", "Employee"), createInstallation);

router
  .route("/:id")
  .get(getInstallationById)
  .put(authorizeRoles("Admin", "Manager", "Employee"), updateInstallation)
  .delete(authorizeRoles("Admin", "Manager"), deleteInstallation);

module.exports = router;
