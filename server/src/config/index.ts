// This file contains all the basic configuration logic for the app server to work
import dotenv from "dotenv";
import logger from "./logger.config";

type ServerConfig = {
  PORT: number;
  NODE_ENV: string;
  DB_URL: string;
  REDIS_URL: string;
  BASE_URL: string;
  ANALYTICS_QUEUE: string;
  JWT_ACCESS_SECRET: string;
  REDIS_COUNTER_KEY: string;
  JWT_REFRESH_SECRET: string;
  ACCESS_TOKEN_EXPIRE: string;
  REFRESH_TOKEN_EXPIRE: string;
  URL_EXPIRY_SCHEDULER: string;
  ANALYTICS_DEAD_LETTER_QUEUE: string;
  AGGREGATION_ANALYTICS_SCHEDULER: string;
  EMAIL_TRANSPORTER: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: string;
  SMTP_USER: string;
  SMTP_PASS: string;
  EMAIL_FROM_ADDRESS: string;
  EMAIL_FROM_NAME: string;
  EMAIL_TEMPLATES_PATH: string;
  VERIFICATION_TOKEN_EXPIRE: string;
  RESET_TOKEN_EXPIRE: string;
  EMAIL_REQUEST_RATE_LIMIT: number;
  CLIENT_URL: string;
};

function loadEnv() {
  dotenv.config();
  logger.info(`Environment variables loaded`);
}

loadEnv();

export const serverConfig: ServerConfig = {
  PORT: Number(process.env.PORT) || 4000,
  NODE_ENV: process.env.NODE_ENV || "development",
  DB_URL: process.env.DB_URL || "mongodb://localhost:27017/url_shortener",
  REDIS_URL: process.env.REDIS_URL || "redis://redis:6379", // for docker
  REDIS_COUNTER_KEY: process.env.REDIS_COUNTER_KEY || "url_shortener_counter",
  BASE_URL: process.env.BASE_URL || "http://localhost:4000",
  ANALYTICS_QUEUE: process.env.ANALYTICS_QUEUE || "analytics_queue",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "access_secret_123",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "refresh_secret_123",
  ACCESS_TOKEN_EXPIRE: process.env.ACCESS_TOKEN_EXPIRE || "10m",
  REFRESH_TOKEN_EXPIRE: process.env.REFRESH_TOKEN_EXPIRE || "7d",
  ANALYTICS_DEAD_LETTER_QUEUE: process.env.ANALYTICS_DEAD_LETTER_QUEUE || "analytics_dead_letter_queue",
  AGGREGATION_ANALYTICS_SCHEDULER:
    process.env.AGGREGATION_ANALYTICS_SCHEDULER ||
    "aggregation_analytics_scheduler",

  URL_EXPIRY_SCHEDULER:
    process.env.URL_EXPIRY_SCHEDULER || "url_expiry_scheduler",
  
  EMAIL_TRANSPORTER: process.env.EMAIL_TRANSPORTER || "gmail",
  SMTP_HOST: process.env.SMTP_HOST || "localhost",
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_SECURE: process.env.SMTP_SECURE || "false",
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  EMAIL_FROM_ADDRESS: process.env.EMAIL_FROM_ADDRESS || "noreply@linkforge.com",
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME || "LinkForge",
  EMAIL_TEMPLATES_PATH: process.env.EMAIL_TEMPLATES_PATH || "./src/utils/email-templates",
  VERIFICATION_TOKEN_EXPIRE: process.env.VERIFICATION_TOKEN_EXPIRE || "24h",
  RESET_TOKEN_EXPIRE: process.env.RESET_TOKEN_EXPIRE || "30m",
  EMAIL_REQUEST_RATE_LIMIT: Number(process.env.EMAIL_REQUEST_RATE_LIMIT) || 3,
  CLIENT_URL: process.env.CLIENT_URL || "http://localhost:3000",
};
