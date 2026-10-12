const express = require("express");
const router = express.Router();
const {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
} = require("../controllers/customerController");
const { protect } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.use(protect);
router.use(requirePermission("customerManagement"));

router
  .route("/")
  .get(getCustomers)
  .post(authorizeRoles("Admin", "Manager", "Employee"), createCustomer);

router
  .route("/:id")
  .get(getCustomerById)
  .put(authorizeRoles("Admin", "Manager", "Employee"), updateCustomer)
  .delete(authorizeRoles("Admin", "Manager"), deleteCustomer);

module.exports = router;
