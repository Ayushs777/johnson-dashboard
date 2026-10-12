const express = require("express");
const router = express.Router();
const {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} = require("../controllers/serviceController");
const { protect } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.use(protect);
router.use(requirePermission("serviceManagement"));

router
  .route("/")
  .get(getServices)
  .post(authorizeRoles("Admin", "Manager", "Employee"), createService);

router
  .route("/:id")
  .get(getServiceById)
  .put(authorizeRoles("Admin", "Manager", "Employee"), updateService)
  .delete(authorizeRoles("Admin", "Manager"), deleteService);

module.exports = router;
