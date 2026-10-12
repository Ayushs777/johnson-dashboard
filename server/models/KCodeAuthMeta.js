const mongoose = require('mongoose');

/**
 * KCodeAuthMeta
 *
 * Stores ONLY authentication-state metadata for KCode (Google Sheet) users.
 * This model does NOT store passwords — the Google Sheet is the sole
 * credential source of truth.
 *
 * Lifecycle:
 *  - Created automatically on the user's very first successful login.
 *  - firstLoginCompleted is set to true after the user successfully changes
 *    their initial password.
 *  - Admin can reset firstLoginCompleted = false to force another password
 *    change after an admin-initiated password reset.
 */
const kCodeAuthMetaSchema = new mongoose.Schema(
  {
    kcode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    /**
     * false  → user must change password before accessing the dashboard.
     * true   → user has completed the initial password change; normal access.
     */
    firstLoginCompleted: {
      type: Boolean,
      default: false,
    },

    /** Timestamp of the most recent successful password change. */
    passwordChangedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // createdAt, updatedAt
  }
);

module.exports = mongoose.model('KCodeAuthMeta', kCodeAuthMetaSchema);
