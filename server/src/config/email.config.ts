import { EmailConfig } from "../types/email.types";
import { env } from "./env";

export const emailConfig: EmailConfig = {
  transporter: env.EMAIL_TRANSPORTER,
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  auth: {
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
  },
  from: {
    address: env.EMAIL_FROM_ADDRESS,
    name: env.EMAIL_FROM_NAME,
  },
};

export const emailSettings = {
  templatesPath: env.EMAIL_TEMPLATES_PATH,
  verificationTokenExpire: env.VERIFICATION_TOKEN_EXPIRE,
  resetTokenExpire: env.RESET_TOKEN_EXPIRE,
  emailRequestRateLimit: env.EMAIL_REQUEST_RATE_LIMIT,
};
