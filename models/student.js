// models/student.js
const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters'],
    trim: true
  },
  admNo: {
    type: Number,
    unique: true,
    required: [true, 'Admission number is required'],
    index: true
  },
  image: {
    type: Buffer,
    default: null
  },
  dept: {
    type: String,
    required: [true, 'Department is required'],
    trim: true
  },
  sem: {
    type: Number,
    required: [true, 'Semester is required'],
    min: [1, 'Semester must be between 1 and 8'],
    max: [8, 'Semester must be between 1 and 8']
  },
  tutorName: {
    type: String,
    required: [true, 'Tutor name is required'],
    trim: true
  },
  tutorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tutor',
    default: null
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email format'],
    index: true
  },
  parent_No: {
    type: Number,
    required: [true, 'Parent phone number is required']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false
  },
  phone: {
    type: Number,
    required: [true, 'Phone number is required']
  },
  purpose: {
    type: String,
    default: null
  },
  date: {
    type: Date,
    default: null
  },
  returnTime: {
    type: String,
    default: null
  },
  verified: {
    type: Boolean,
    default: false,
    index: true
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GatePass',
    default: null,
    index: true
  },
  passStatus: {
    type: String,
    enum: ['none', 'pending', 'approved', 'rejected'],
    default: 'none'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes for better query performance
studentSchema.index({ admNo: 1 });
studentSchema.index({ email: 1 });
studentSchema.index({ tutorName: 1 });
studentSchema.index({ verified: 1 });

const Student = mongoose.model('Student', studentSchema);
module.exports = Student;