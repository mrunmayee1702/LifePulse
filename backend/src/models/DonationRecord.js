const mongoose = require('mongoose');

const donationRecordSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hospitalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'HospitalProfile',
      default: null,
    },
    bloodRequestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BloodRequest',
      default: null,
    },
    hospitalName: {
      type: String,
      required: true,
      trim: true,
    },
    bloodGroup: {
      type: String,
      required: true,
    },
    unitsDonated: {
      type: Number,
      default: 1,
      min: 1,
    },
    donationDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    location: {
      type: String,
      trim: true,
      default: 'Main Hospital Blood Bank',
    },
    certificateId: {
      type: String,
      unique: true,
      default: function () {
        return `LP-CERT-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
      },
    },
    status: {
      type: String,
      enum: ['COMPLETED', 'SCHEDULED', 'CANCELLED'],
      default: 'COMPLETED',
    },
  },
  {
    timestamps: true,
  }
);

donationRecordSchema.index({ donor: 1, donationDate: -1 });
donationRecordSchema.index({ bloodRequestId: 1, donor: 1 });

module.exports = mongoose.model('DonationRecord', donationRecordSchema);
