const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema(
  {
    customerId: {
      type: String,
      required: [true, 'Customer ID is required'],
      unique: true,
      trim: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    contactPerson: {
      type: String,
      required: [true, 'Contact person is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
    },
    numberOfLifts: {
      type: Number,
      default: 1,
      min: 1,
    },
    installationDate: {
      type: Date,
      default: Date.now,
    },
    amcStatus: {
      type: String,
      enum: ['Active', 'Expired', 'Pending', 'Under Maintenance'],
      default: 'Active',
    },
    serviceStatus: {
      type: String,
      enum: ['Operational', 'Degraded', 'Offline'],
      default: 'Operational',
    },
    remarks: {
      type: String,
      default: '',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Customer', customerSchema);
