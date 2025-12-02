// models/GatePass.js
const mongoose = require('mongoose');

const gatePassSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required'],
    index: true
  },
  purpose: {
    type: String,
    required: [true, 'Purpose is required'],
    maxlength: [500, 'Purpose cannot exceed 500 characters'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },
  returnTime: {
    type: String,
    required: [true, 'Return time is required']
  },
  groupMembers: [
    {
      name: {
        type: String,
        trim: true
      },
      admNo: Number,
      admissionNo: Number,
      dept: {
        type: String,
        trim: true
      },
      _id: false
    }
  ],
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'verified'],
    default: 'pending',
    index: true
  },
  verified: {
    type: Boolean,
    default: false,
    index: true
  },
  verifiedAt: {
    type: Date,
    default: null
  },
  verifiedBy: {
    type: String,
    default: null
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tutor',
    default: null
  },
  approvedAt: {
    type: Date,
    default: null
  },
  rejectionReason: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes for better query performance
gatePassSchema.index({ studentId: 1, status: 1 });
gatePassSchema.index({ date: 1 });
gatePassSchema.index({ status: 1 });
gatePassSchema.index({ createdAt: -1 });
gatePassSchema.index({ verified: 1 });

const GatePass = mongoose.model('GatePass', gatePassSchema);
module.exports = GatePass;