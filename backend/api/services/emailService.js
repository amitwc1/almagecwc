const nodemailer = require('nodemailer');
const { logger } = require('../services_config/logger');


/**
 * Email service using Nodemailer
 * Supports SMTP (Gmail, Outlook, etc.) via environment variables
 * Falls back to console logging in development when no SMTP is configured
 */
class EmailService {
  constructor() {
    this.transporter = null;
    this.initialized = false;
    this._init();
  }

  _init() {
    try {
      if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        this.transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
          }
        });
        this.initialized = true;
        logger.info('Email service initialized with SMTP');
      } else {
        logger.warn('Email service running in dev mode (no SMTP configured). Emails will be logged to console.');
      }
    } catch (err) {
      logger.error('Failed to initialize email service:', err.message);
    }
  }

  /**
   * Send an email
   * @param {Object} options - { to, subject, html, text }
   */
  async send({ to, subject, html, text }) {
    const from = process.env.SMTP_FROM || '"GEC Alumni Network" <noreply@gecwc.ac.in>';

    if (!this.initialized) {
      logger.info(`[DEV EMAIL] To: ${to} | Subject: ${subject}`);
      logger.info(`[DEV EMAIL] Body: ${text || html?.substring(0, 200)}`);
      return { success: true, dev: true };
    }

    try {
      const info = await this.transporter.sendMail({ from, to, subject, html, text });
      logger.info(`Email sent to ${to}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      logger.error(`Failed to send email to ${to}:`, err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Welcome email on registration
   */
  async sendWelcome(user) {
    return this.send({
      to: user.email,
      subject: 'Welcome to GEC Alumni Network!',
      html: `
        <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f7f8; padding: 40px 20px;">
          <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <div style="width: 60px; height: 60px; background: #003366; border-radius: 12px; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 28px; font-weight: bold;">G</div>
              <h1 style="color: #003366; margin: 16px 0 0;">GEC Alumni Network</h1>
            </div>
            <h2 style="color: #1e293b; margin-bottom: 16px;">Welcome aboard, ${user.name}! 🎓</h2>
            <p style="color: #64748b; line-height: 1.6;">
              You've successfully joined the GEC West Champaran Alumni Network. Connect with thousands of graduates, find career opportunities, and mentor the next generation.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/dashboard" 
                 style="background: #003366; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                Go to Dashboard
              </a>
            </div>
            <p style="color: #94a3b8; font-size: 13px; text-align: center;">
              © ${new Date().getFullYear()} GEC West Champaran Alumni Association
            </p>
          </div>
        </div>
      `
    });
  }

  /**
   * Job alert email
   */
  async sendJobAlert(userEmail, job) {
    return this.send({
      to: userEmail,
      subject: `New Job: ${job.title} at ${job.company}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #003366;">New Job Opportunity</h2>
          <div style="background: #f5f7f8; border-radius: 12px; padding: 20px; margin: 16px 0;">
            <h3 style="margin: 0 0 8px;">${job.title}</h3>
            <p style="color: #64748b; margin: 4px 0;">🏢 ${job.company}</p>
            ${job.location ? `<p style="color: #64748b; margin: 4px 0;">📍 ${job.location}</p>` : ''}
            ${job.salary ? `<p style="color: #64748b; margin: 4px 0;">💰 ${job.salary}</p>` : ''}
          </div>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/jobs" 
             style="background: #003366; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            View Job
          </a>
        </div>
      `
    });
  }

  /**
   * Event reminder email
   */
  async sendEventReminder(userEmail, event) {
    return this.send({
      to: userEmail,
      subject: `Reminder: ${event.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #003366;">Event Reminder</h2>
          <div style="background: #f5f7f8; border-radius: 12px; padding: 20px; margin: 16px 0;">
            <h3 style="margin: 0 0 8px;">${event.title}</h3>
            <p style="color: #64748b; margin: 4px 0;">📅 ${new Date(event.event_date).toLocaleString()}</p>
            ${event.location ? `<p style="color: #64748b; margin: 4px 0;">📍 ${event.location}</p>` : ''}
          </div>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/events" 
             style="background: #003366; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            View Event
          </a>
        </div>
      `
    });
  }

  /**
   * Mentorship notification email
   */
  async sendMentorshipNotification(mentorEmail, student, status) {
    const isRequest = status === 'pending';
    return this.send({
      to: mentorEmail,
      subject: isRequest ? `New Mentorship Request from ${student.name}` : `Mentorship Request ${status}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #003366;">${isRequest ? 'New Mentorship Request' : `Request ${status}`}</h2>
          <p style="color: #64748b;">${isRequest ? `${student.name} would like to connect with you for mentorship.` : `Your mentorship request has been ${status}.`}</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/mentorship" 
             style="background: #003366; color: white; padding: 10px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
            View Details
          </a>
        </div>
      `
    });
  }
}

// Singleton instance
module.exports = new EmailService();
