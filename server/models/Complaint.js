const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    complaintId: {
      type: String,
      required: [true, 'Complaint ID is required'],
      unique: true,
      trim: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer reference is required'],
    },
    installation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Installation',
    },
    liftId: {
      type: String,
      required: [true, 'Lift ID is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    complaintType: {
      type: String,
      enum: ['Breakdown', 'Noise', 'Door Issue', 'Leveling Fault', 'Power Issue', 'Other'],
      default: 'Breakdown',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    assignedTechnician: {
      type: String,
      default: 'Unassigned',
    },
    createdDate: {
      type: Date,
      default: Date.now,
    },
    resolutionDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['Open', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
      default: 'Open',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Complaint', complaintSchema);
