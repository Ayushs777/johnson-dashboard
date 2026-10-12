const mongoose = require('mongoose');

const installationSchema = new mongoose.Schema(
  {
    installationId: {
      type: String,
      required: [true, 'Installation ID is required'],
      unique: true,
      trim: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Customer',
      required: [true, 'Customer reference is required'],
    },
    projectName: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
      trim: true,
    },
    liftType: {
      type: String,
      enum: ['Passenger', 'Goods', 'Home Lift', 'Escalator', 'Hospital Lift'],
      default: 'Passenger',
    },
    liftCapacity: {
      type: String, // e.g. "8 Persons / 544 kg" or "1000 kg"
      default: '8 Persons / 544 kg',
    },
    numberOfFloors: {
      type: Number,
      default: 4,
    },
    installationDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Planned', 'In Progress', 'Completed', 'On Hold', 'Cancelled'],
      default: 'Completed',
    },
    technician: {
      type: String,
      default: 'Unassigned',
    },
    projectManager: {
      type: String,
      default: 'Unassigned',
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

module.exports = mongoose.model('Installation', installationSchema);
