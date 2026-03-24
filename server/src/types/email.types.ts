export interface EmailConfig {
  transporter: 'smtp' | 'gmail' | 'sendgrid';
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  from: {
    address: string;
    name: string;
  };
}

export interface EmailTemplateData {
  [key: string]: any;
}

export interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: EmailTemplateData;
}

export interface WelcomeEmailData extends EmailTemplateData {
  userName: string;
  verificationLink?: string;
  appName: string;
}

export interface EmailVerificationData extends EmailTemplateData {
  userName: string;
  verificationLink: string;
  appName: string;
}

export interface ForgotPasswordData extends EmailTemplateData {
  userName: string;
  resetLink: string;
  appName: string;
  expiryMinutes: number;
}

export interface PasswordResetConfirmationData extends EmailTemplateData {
  userName: string;
  appName: string;
}

export type EmailTemplateType = 'welcome' | 'email-verification' | 'forgot-password' | 'password-reset-confirmation';

export interface EmailService {
  sendEmail(options: EmailOptions): Promise<void>;
  sendWelcomeEmail(to: string, data: WelcomeEmailData): Promise<void>;
  sendEmailVerification(to: string, data: EmailVerificationData): Promise<void>;
  sendForgotPassword(to: string, data: ForgotPasswordData): Promise<void>;
  sendPasswordResetConfirmation(to: string, data: PasswordResetConfirmationData): Promise<void>;
}
