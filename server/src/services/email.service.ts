import nodemailer from 'nodemailer';
import { EmailConfig, EmailOptions, EmailService as IEmailService } from '../types/email.types';
import { EmailTemplateRenderer, maskEmail } from '../utils/email.utils';
import { emailConfig } from '../config/email.config';
import logger from '../config/logger.config';

export class EmailService implements IEmailService {
  private transporter: nodemailer.Transporter;
  private templateRenderer: EmailTemplateRenderer;

  constructor(config?: EmailConfig) {
    this.templateRenderer = new EmailTemplateRenderer();
    this.transporter = this.createTransporter(config || emailConfig);
  }

  /**
   * Create a transporter for sending emails
   * @param config - Email configuration
   * @returns nodemailer.Transporter - Transporter for sending emails
   */
  private createTransporter(config: EmailConfig): nodemailer.Transporter {
    switch (config.transporter) {
      case 'gmail':
        return nodemailer.createTransport({
          service: 'gmail',
          auth: config.auth,
        });
      
      case 'sendgrid':
        return nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          auth: {
            user: 'apikey',
            pass: config.auth?.pass,
          },
        });
      
      case 'smtp':
      default:
        return nodemailer.createTransport({
          host: config.host,
          port: config.port,
          secure: config.secure,
          auth: config.auth,
        });
    }
  }

  /**
   * Send an email
   * @param options - Email options
   * @returns Promise<void> - Promise that resolves when the email is sent
   */
  public async sendEmail(options: EmailOptions): Promise<void> {
    try {
      const { html, text } = this.templateRenderer.renderTemplate(options.template, options.data);

      const mailOptions = {
        from: `${emailConfig.from.name} <${emailConfig.from.address}>`,
        to: options.to,
        subject: options.subject,
        html,
        text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${options.to}`, { messageId: result.messageId });
    } catch (error) {
      logger.error("Email sending failed", {
        event: "EMAIL_SEND_FAILED",
        maskedEmail: maskEmail(options.to),
        err: error instanceof Error ? error : undefined
      });
      throw new Error(`Email sending failed: ${error}`);
    }
  }

  /**
   * Send a welcome email
   * @param to - Recipient email address
   * @param data - Email data
   * @returns Promise<void> - Promise that resolves when the email is sent
   */
  public async sendWelcomeEmail(to: string, data: any): Promise<void> {
    await this.sendEmail({
      to,
      subject: `Welcome to ${data.appName}!`,
      template: 'welcome',
      data,
    });
  }

  /**
   * Send an email verification email
   * @param to - Recipient email address
   * @param data - Email data
   * @returns Promise<void> - Promise that resolves when the email is sent
   */
  public async sendEmailVerification(to: string, data: any): Promise<void> {
    await this.sendEmail({
      to,
      subject: `Verify your ${data.appName} account`,
      template: 'email-verification',
      data,
    });
  }

  /**
   * Send a forgot password email
   * @param to - Recipient email address
   * @param data - Email data
   * @returns Promise<void> - Promise that resolves when the email is sent
   */
  public async sendForgotPassword(to: string, data: any): Promise<void> {
    await this.sendEmail({
      to,
      subject: `Reset your ${data.appName} password`,
      template: 'forgot-password',
      data,
    });
  }

  /**
   * Send a password reset confirmation email
   * @param to - Recipient email address
   * @param data - Email data
   * @returns Promise<void> - Promise that resolves when the email is sent
   */
  public async sendPasswordResetConfirmation(to: string, data: any): Promise<void> {
    await this.sendEmail({
      to,
      subject: `Your ${data.appName} password has been reset`,
      template: 'password-reset-confirmation',
      data,
    });
  }

  /**
   * Verify the email service connection
   * @returns Promise<boolean> - Promise that resolves to true if the connection is successful
   */
  public async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info("Email service connection verified successfully", {
        event: "EMAIL_SERVICE_CONNECTION_SUCCESS"
      });
      return true;
    } catch (error) {
      logger.error("Email service connection verification failed", {
        event: "EMAIL_SERVICE_CONNECTION_FAILED",
        err: error instanceof Error ? error : undefined
      });
      return false;
    }
  }
}

export default EmailService;
