import nodemailer from 'nodemailer';
import { EmailConfig, EmailOptions, EmailService as IEmailService } from '../types/email.types';
import { EmailTemplateRenderer } from '../utils/email.utils';
import { emailConfig } from '../config/email.config';
import logger from '../config/logger.config';

export class EmailService implements IEmailService {
  private transporter: nodemailer.Transporter;
  private templateRenderer: EmailTemplateRenderer;

  constructor(config?: EmailConfig) {
    this.templateRenderer = new EmailTemplateRenderer();
    this.transporter = this.createTransporter(config || emailConfig);
  }

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
      console.error("EMAIL SEND ERROR = ",error)
      logger.error(`Failed to send email to ${options.to}`, error);
      throw new Error(`Email sending failed: ${error}`);
    }
  }

  public async sendWelcomeEmail(to: string, data: any): Promise<void> {
    await this.sendEmail({
      to,
      subject: `Welcome to ${data.appName}!`,
      template: 'welcome',
      data,
    });
  }

  public async sendEmailVerification(to: string, data: any): Promise<void> {
    await this.sendEmail({
      to,
      subject: `Verify your ${data.appName} account`,
      template: 'email-verification',
      data,
    });
  }

  public async sendForgotPassword(to: string, data: any): Promise<void> {
    await this.sendEmail({
      to,
      subject: `Reset your ${data.appName} password`,
      template: 'forgot-password',
      data,
    });
  }

  public async sendPasswordResetConfirmation(to: string, data: any): Promise<void> {
    await this.sendEmail({
      to,
      subject: `Your ${data.appName} password has been reset`,
      template: 'password-reset-confirmation',
      data,
    });
  }

  public async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('Email service connection verified');
      return true;
    } catch (error) {
      logger.error('Email service connection failed', error);
      return false;
    }
  }
}

export default EmailService;
