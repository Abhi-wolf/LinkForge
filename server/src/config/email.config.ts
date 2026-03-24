import dotenv from "dotenv";
import { EmailConfig } from "../types/email.types";

dotenv.config();

export const emailConfig: EmailConfig = {
  transporter: (process.env.EMAIL_TRANSPORTER as 'smtp' | 'gmail' | 'sendgrid') || 'smtp',
  host: process.env.SMTP_HOST || 'localhost',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
  from: {
    address: process.env.EMAIL_FROM_ADDRESS || 'noreply@linkforge.com',
    name: process.env.EMAIL_FROM_NAME || 'LinkForge',
  },
};

export const emailSettings = {
  templatesPath: process.env.EMAIL_TEMPLATES_PATH || './src/utils/email-templates',
  verificationTokenExpire: process.env.VERIFICATION_TOKEN_EXPIRE || '24h',
  resetTokenExpire: process.env.RESET_TOKEN_EXPIRE || '30m',
  emailRequestRateLimit: Number(process.env.EMAIL_REQUEST_RATE_LIMIT) || 3,
};
