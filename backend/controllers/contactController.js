const ContactMessage = require('../models/ContactMessage');
const nodemailer = require('nodemailer');

class ContactController {
  // Submit contact message (public)
  static async submitMessage(req, res) {
    try {
      const {
        name,
        email,
        phone,
        subject,
        message
      } = req.body;

      // Validate required fields
      if (!name || !email || !message) {
        return res.status(400).json({
          success: false,
          message: 'Name, email, and message are required'
        });
      }

      const messageData = {
        name,
        email,
        phone,
        subject,
        message
      };

      const savedMessage = await ContactMessage.create(messageData);

      // Send notification email to admin (optional)
      await this.sendNotificationEmail(savedMessage);

      res.status(201).json({
        success: true,
        message: 'Message sent successfully',
        data: savedMessage
      });
    } catch (error) {
      console.error('Submit message error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get all messages (admin)
  static async getAllMessages(req, res) {
    try {
      const { status, limit, page } = req.query;
      
      const messages = await ContactMessage.findAll(
        status || null,
        limit ? parseInt(limit) : 50,
        page ? parseInt(page) : 1
      );

      res.json({
        success: true,
        data: messages
      });
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get message by ID (admin)
  static async getMessageById(req, res) {
    try {
      const { id } = req.params;
      const message = await ContactMessage.findById(id);
      
      if (!message) {
        return res.status(404).json({
          success: false,
          message: 'Message not found'
        });
      }

      res.json({
        success: true,
        data: message
      });
    } catch (error) {
      console.error('Get message error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Update message status (admin)
  static async updateMessageStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, response } = req.body;

      if (!status || !['new', 'read', 'replied'].includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Valid status is required'
        });
      }

      const updatedMessage = await ContactMessage.updateStatus(id, status, response);

      // If status is 'replied' and response is provided, send email to user
      if (status === 'replied' && response) {
        await this.sendReplyEmail(updatedMessage, response);
      }

      res.json({
        success: true,
        message: 'Message status updated successfully',
        data: updatedMessage
      });
    } catch (error) {
      console.error('Update message status error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Delete message (admin)
  static async deleteMessage(req, res) {
    try {
      const { id } = req.params;
      
      await ContactMessage.delete(id);

      res.json({
        success: true,
        message: 'Message deleted successfully'
      });
    } catch (error) {
      console.error('Delete message error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Get contact statistics (admin)
  static async getStatistics(req, res) {
    try {
      const statistics = await ContactMessage.getStatistics();
      
      res.json({
        success: true,
        data: statistics
      });
    } catch (error) {
      console.error('Get contact statistics error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
  }

  // Send notification email to admin
  static async sendNotificationEmail(message) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: process.env.ADMIN_EMAIL,
        subject: `New Contact Message: ${message.subject || 'No Subject'}`,
        html: `
          <h2>New Contact Message Received</h2>
          <p><strong>From:</strong> ${message.name} (${message.email})</p>
          <p><strong>Phone:</strong> ${message.phone || 'Not provided'}</p>
          <p><strong>Subject:</strong> ${message.subject || 'No subject'}</p>
          <p><strong>Message:</strong></p>
          <p>${message.message}</p>
          <hr>
          <p><em>Received at: ${new Date(message.created_at).toLocaleString()}</em></p>
        `
      };

      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Send notification email error:', error);
      // Don't throw error, just log it
    }
  }

  // Send reply email to user
  static async sendReplyEmail(message, response) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const companyName = process.env.COMPANY_NAME || 'Our Company';
      const adminEmail = process.env.ADMIN_EMAIL;

      const mailOptions = {
        from: process.env.SMTP_FROM,
        to: message.email,
        cc: adminEmail,
        subject: `Re: ${message.subject || 'Your Inquiry'}`,
        html: `
          <h2>Response to Your Inquiry</h2>
          <p>Dear ${message.name},</p>
          <p>Thank you for contacting ${companyName}. Here is our response to your inquiry:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-left: 4px solid #007bff; margin: 20px 0;">
            <p><strong>Your original message:</strong></p>
            <p>${message.message}</p>
          </div>
          <div style="background-color: #e8f4fd; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
            <p><strong>Our response:</strong></p>
            <p>${response}</p>
          </div>
          <p>If you have any further questions, please don't hesitate to reply to this email.</p>
          <p>Best regards,<br>The ${companyName} Team</p>
          <hr>
          <p style="font-size: 12px; color: #666;">
            This is an automated response. Please do not reply to this email directly.
          </p>
        `
      };

      await transporter.sendMail(mailOptions);
    } catch (error) {
      console.error('Send reply email error:', error);
      // Don't throw error, just log it
    }
  }
}

module.exports = ContactController;
