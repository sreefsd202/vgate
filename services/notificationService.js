// services/notificationService.js
const axios = require('axios');
const Logger = require('../utils/logger');

class NotificationService {
  /**
   * Validate phone number format (Indian format: 10 digits)
   */
  static validatePhoneNumber(phone) {
    if (!phone) {
      throw new Error('Phone number is required');
    }

    const phoneStr = String(phone).trim();

    // Check if it's a valid 10-digit Indian phone number
    if (!/^\d{10}$/.test(phoneStr)) {
      throw new Error('Phone number must be 10 digits');
    }

    return phoneStr;
  }

  /**
   * Validate message content
   */
  static validateMessage(message) {
    if (!message) {
      throw new Error('Message cannot be empty');
    }

    if (typeof message !== 'string') {
      throw new Error('Message must be a string');
    }

    if (message.length > 160) {
      Logger.warn(`Message exceeds 160 characters (${message.length})`);
    }

    return String(message).substring(0, 320); // Limit to 2 SMS parts
  }

  /**
   * Generic SMS sender using Fast2SMS
   */
  static async sendSMS(phoneNumber, message) {
    try {
      // Validate inputs
      const validatedPhone = this.validatePhoneNumber(phoneNumber);
      const validatedMessage = this.validateMessage(message);

      if (!process.env.FAST2SMS_API_KEY) {
        Logger.warn('Fast2SMS not configured - SMS simulation');
        console.log(`📱 SMS to ${validatedPhone}: ${validatedMessage}`);
        return {
          simulated: true,
          message: 'SMS simulation - Fast2SMS not configured'
        };
      }

      const response = await axios.post(
        'https://www.fast2sms.com/dev/bulkV2',
        {
          route: 'v3',
          sender_id: process.env.FAST2SMS_SENDER_ID || 'TXTIND',
          message: validatedMessage,
          language: 'english',
          flash: 0,
          numbers: validatedPhone
        },
        {
          headers: {
            'authorization': process.env.FAST2SMS_API_KEY,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      if (response.data.return === true) {
        Logger.info(`✅ SMS sent successfully to ${validatedPhone}`);
        return {
          success: true,
          messageId: response.data.request_id,
          data: response.data
        };
      } else {
        throw new Error(response.data.message || 'SMS sending failed');
      }
    } catch (error) {
      Logger.error('Fast2SMS Error:', error);
      throw error;
    }
  }

  /**
   * Send departure notification (when student leaves campus)
   */
  static async sendStudentDepartureNotification(
    phone,
    name,
    admNo,
    dept,
    purpose,
    returnTime
  ) {
    try {
      const validatedPhone = this.validatePhoneNumber(phone);
      const message = `Your ward ${name} (${admNo}) from ${dept} has departed campus. Purpose: ${purpose}. Expected return: ${returnTime}. - Campus Gate Pass System`;

      return await this.sendSMS(validatedPhone, message);
    } catch (error) {
      Logger.error('Error sending departure notification:', error);
      throw error;
    }
  }

  /**
   * Send approval notification (when gate pass is approved by tutor)
   */
  static async sendApprovalNotification(phone, studentName, admNo, purpose, date) {
    try {
      const validatedPhone = this.validatePhoneNumber(phone);
      const formattedDate = new Date(date).toLocaleDateString('en-IN');
      const message = `Gate pass approved for ${studentName} (${admNo}). Purpose: ${purpose}. Date: ${formattedDate}. Generate QR code from app to proceed. - Campus Gate Pass System`;

      return await this.sendSMS(validatedPhone, message);
    } catch (error) {
      Logger.error('Error sending approval notification:', error);
      throw error;
    }
  }

  /**
   * Send rejection notification (when gate pass is rejected by tutor)
   */
  static async sendRejectionNotification(phone, studentName, admNo, reason) {
    try {
      const validatedPhone = this.validatePhoneNumber(phone);
      const sanitizedReason = String(reason || 'Not specified').substring(0, 50);
      const message = `Gate pass rejected for ${studentName} (${admNo}). Reason: ${sanitizedReason}. Contact your tutor for more details. - Campus Gate Pass System`;

      return await this.sendSMS(validatedPhone, message);
    } catch (error) {
      Logger.error('Error sending rejection notification:', error);
      throw error;
    }
  }

  /**
   * Send verified departure notification (when security verifies and student leaves)
   */
  static async sendVerifiedDepartureNotification(
    phone,
    studentName,
    admNo,
    dept,
    purpose,
    returnTime,
    verifiedTime
  ) {
    try {
      const validatedPhone = this.validatePhoneNumber(phone);
      const message = `VERIFIED: ${studentName} (${admNo}) from ${dept} has LEFT CAMPUS at ${verifiedTime}. Reason: ${purpose}. Expected back: ${returnTime}. - Campus Gate Pass System`;

      return await this.sendSMS(validatedPhone, message);
    } catch (error) {
      Logger.error('Error sending verified departure notification:', error);
      throw error;
    }
  }

  /**
   * Send form submission notification (when student submits gate pass form)
   */
  static async sendFormSubmissionNotification(
    tutorPhone,
    tutorName,
    studentName,
    admNo,
    purpose,
    date
  ) {
    try {
      const validatedPhone = this.validatePhoneNumber(tutorPhone);
      const formattedDate = new Date(date).toLocaleDateString('en-IN');
      const message = `Dear ${tutorName}, ${studentName} (${admNo}) submitted gate pass request. Purpose: ${purpose}. Date: ${formattedDate}. Review from app. - Campus Gate Pass System`;

      return await this.sendSMS(validatedPhone, message);
    } catch (error) {
      Logger.error('Error sending form submission notification:', error);
      throw error;
    }
  }

  /**
   * Batch send notification to multiple recipients
   */
  static async sendBatchNotification(recipients, message) {
    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new Error('Recipients array is required');
    }

    const validatedMessage = this.validateMessage(message);
    const results = [];

    for (const recipient of recipients) {
      try {
        if (!recipient || !recipient.phone) {
          results.push({
            phone: recipient?.phone || 'unknown',
            name: recipient?.name || 'unknown',
            status: 'failed',
            error: 'Invalid phone number'
          });
          continue;
        }

        const validatedPhone = this.validatePhoneNumber(recipient.phone);
        const result = await this.sendSMS(validatedPhone, validatedMessage);

        results.push({
          phone: validatedPhone,
          name: recipient.name || 'unknown',
          status: 'success',
          result
        });
      } catch (error) {
        results.push({
          phone: recipient?.phone || 'unknown',
          name: recipient?.name || 'unknown',
          status: 'failed',
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = NotificationService;