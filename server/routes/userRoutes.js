const express = require("express");
const router = express.Router();
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");
const { requirePermission } = require("../middleware/permissionMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

router.use(protect);
router.use(requirePermission("userManagement"));
router.use(authorizeRoles("Admin")); // Only Admin can manage users

router.route("/").get(getUsers).post(createUser);
router.route("/:id").get(getUserById).put(updateUser).delete(deleteUser);

module.exports = router;
