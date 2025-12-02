//[file name]: securityController.js
//[file content begin]
// controllers/securityController.js
const mongoose = require('mongoose');
const GatePass = require('../models/GatePass');
const Student = require('../models/student');
const Tutor = require('../models/tutor');
const NotificationService = require('../services/notificationService');
// Note: Changed from Logger to direct console.log for simplicity
// You might want to create a proper logger file

// Validate ObjectId
const validateObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error('Invalid ID format');
  }
  return id;
};

const securityController = {
  // Approve gate pass by tutor
  approveGatePass: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { gatePassId, tutorId } = req.body;

      // Validate input
      if (!gatePassId || !tutorId) {
        return res.status(400).json({
          success: false,
          error: 'gatePassId and tutorId are required'
        });
      }

      // Validate ObjectId format
      validateObjectId(gatePassId);
      validateObjectId(tutorId);

      // Find and update gate pass
      const gatePass = await GatePass.findByIdAndUpdate(
        gatePassId,
        {
          status: 'approved',
          approvedBy: tutorId,
          approvedAt: new Date()
        },
        { new: true, session }
      ).populate('studentId', 'name admNo dept parent_No phone tutorName');

      if (!gatePass) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          error: 'Gate pass not found'
        });
      }

      // Update student's pass status
      if (gatePass.studentId && gatePass.studentId._id) {
        await Student.findByIdAndUpdate(
          gatePass.studentId._id,
          { passStatus: 'approved' },
          { session }
        );
      }

      // Send approval notification to student's parent
      if (gatePass.studentId && gatePass.studentId.parent_No) {
        try {
          await NotificationService.sendApprovalNotification(
            gatePass.studentId.parent_No.toString(),
            gatePass.studentId.name,
            gatePass.studentId.admNo,
            gatePass.purpose,
            gatePass.date
          );
          console.log(`✅ Approval SMS sent to parent (${gatePass.studentId.parent_No})`);
        } catch (err) {
          console.warn(`⚠️ Failed to send approval SMS to parent: ${err.message}`);
        }
      }

      await session.commitTransaction();

      res.json({
        success: true,
        message: '✅ Gate pass approved successfully',
        gatePass
      });
    } catch (error) {
      await session.abortTransaction();
      console.error('Error approving gate pass:', error);

      if (error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    } finally {
      session.endSession();
    }
  },

  // Reject gate pass by tutor
  rejectGatePass: async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { gatePassId, reason } = req.body;

      if (!gatePassId) {
        return res.status(400).json({
          success: false,
          error: 'gatePassId is required'
        });
      }

      // Validate ObjectId format
      validateObjectId(gatePassId);

      // Sanitize reason
      const sanitizedReason = reason
        ? String(reason).trim().substring(0, 255)
        : 'Not specified';

      const gatePass = await GatePass.findByIdAndUpdate(
        gatePassId,
        {
          status: 'rejected',
          verified: false,
          rejectionReason: sanitizedReason
        },
        { new: true, session }
      ).populate('studentId', 'name admNo parent_No');

      if (!gatePass) {
        await session.abortTransaction();
        return res.status(404).json({
          success: false,
          error: 'Gate pass not found'
        });
      }

      // Update student's pass status
      if (gatePass.studentId && gatePass.studentId._id) {
        await Student.findByIdAndUpdate(
          gatePass.studentId._id,
          { passStatus: 'rejected' },
          { session }
        );
      }

      // Send rejection notification to student's parent
      if (gatePass.studentId && gatePass.studentId.parent_No) {
        try {
          await NotificationService.sendRejectionNotification(
            gatePass.studentId.parent_No.toString(),
            gatePass.studentId.name,
            gatePass.studentId.admNo,
            sanitizedReason
          );
          console.log(`✅ Rejection SMS sent to parent (${gatePass.studentId.parent_No})`);
        } catch (err) {
          console.warn(`⚠️ Failed to send rejection SMS to parent: ${err.message}`);
        }
      }

      await session.commitTransaction();

      res.json({
        success: true,
        message: '✅ Gate pass rejected successfully',
        gatePass
      });
    } catch (error) {
      await session.abortTransaction();
      console.error('Error rejecting gate pass:', error);

      if (error.message.includes('Invalid')) {
        return res.status(400).json({
          success: false,
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    } finally {
      session.endSession();
    }
  },

  // Get all pending passes (security view)
  getPendingPasses: async (req, res) => {
    try {
      const passes = await GatePass.find({ status: 'pending' })
        .populate('studentId', 'name admNo dept tutorName')
        .sort({ createdAt: -1 })
        .lean();

      res.json({
        success: true,
        count: passes.length,
        passes
      });
    } catch (error) {
      console.error('Error fetching pending passes:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  },

  // Get all approved passes (security view)
  getApprovedPasses: async (req, res) => {
    try {
      const passes = await GatePass.find({ status: 'approved' })
        .populate('studentId', 'name admNo dept tutorName')
        .sort({ approvedAt: -1 })
        .lean();

      res.json({
        success: true,
        count: passes.length,
        passes
      });
    } catch (error) {
      console.error('Error fetching approved passes:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
};

module.exports = securityController;
//[file content end]