const mongoose = require('mongoose');

const serviceRecordSchema = new mongoose.Schema(
  {
    serviceId: {
      type: String,
      required: [true, 'Service ID is required'],
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
    serviceType: {
      type: String,
      enum: ['Preventive', 'Corrective', 'Emergency', 'AMC Inspection'],
      default: 'Preventive',
    },
    technician: {
      type: String,
      required: [true, 'Technician name is required'],
      trim: true,
    },
    serviceDate: {
      type: Date,
      default: Date.now,
    },
    nextServiceDate: {
      type: Date,
    },
    issue: {
      type: String,
      default: 'Routine Maintenance',
    },
    resolution: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['Pending', 'Assigned', 'In Progress', 'Completed', 'Escalated'],
      default: 'Pending',
    },
    remarks: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ServiceRecord', serviceRecordSchema);
