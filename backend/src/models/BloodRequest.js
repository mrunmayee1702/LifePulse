const mongoose = require('mongoose');
const { BLOOD_GROUPS } = require('./User');

const URGENCY_LEVELS = ['CRITICAL', 'URGENT', 'HIGH', 'NORMAL'];
const REQUEST_STATUSES = ['OPEN', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED'];

const bloodRequestSchema = new mongoose.Schema(
  {
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HospitalProfile',
      required: true,
    },
    hospitalName: {
      type: String,
      required: true,
      trim: true,
    },
    bloodGroup: {
      type: String,
      enum: {
        values: BLOOD_GROUPS,
        message: 'Invalid blood group',
      },
      required: [true, 'Blood Group is required'],
    },
    unitsRequired: {
      type: Number,
      required: [true, 'Units required is required'],
      min: [1, 'Minimum 1 unit required'],
      max: [20, 'Maximum 20 units per request'],
    },
    unitsFulfilled: {
      type: Number,
      default: 0,
      min: 0,
    },
    urgency: {
      type: String,
      enum: {
        values: URGENCY_LEVELS,
        message: 'Urgency must be CRITICAL, URGENT, HIGH, or NORMAL',
      },
      required: [true, 'Urgency level is required'],
    },
    requiredDate: {
      type: Date,
      required: [true, 'Required date is required'],
    },
    reason: {
      type: String,
      required: [true, 'Reason for request is required'],
      trim: true,
    },
    patientReference: {
      type: String,
      required: [true, 'Non-identifying patient reference (e.g. PT-2026-001) is required'],
      trim: true,
    },
    location: {
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
    },
    status: {
      type: String,
      enum: REQUEST_STATUSES,
      default: 'OPEN',
    },
    fulfilledAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// High-Performance Query Indexes
bloodRequestSchema.index({ hospitalId: 1, createdAt: -1 });
bloodRequestSchema.index({ status: 1, bloodGroup: 1, requiredDate: 1 });

// Pre-save hook to compute status based on unitsFulfilled vs unitsRequired
bloodRequestSchema.pre('save', function (next) {
  if (this.status !== 'CANCELLED') {
    if (this.unitsFulfilled >= this.unitsRequired) {
      this.status = 'FULFILLED';
      if (!this.fulfilledAt) {
        this.fulfilledAt = new Date();
      }
    } else if (this.unitsFulfilled > 0 && this.unitsFulfilled < this.unitsRequired) {
      this.status = 'PARTIALLY_FULFILLED';
      this.fulfilledAt = null;
    } else if (this.unitsFulfilled === 0) {
      this.status = 'OPEN';
      this.fulfilledAt = null;
    }
  }
  next();
});

module.exports = {
  BloodRequest: mongoose.model('BloodRequest', bloodRequestSchema),
  URGENCY_LEVELS,
  REQUEST_STATUSES,
};
