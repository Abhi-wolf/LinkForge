import dotenv from "dotenv";
import { z } from "zod";
import logger from "./logger.config";

function loadEnv() {
  dotenv.config();
}

loadEnv();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  MCP_SERVER_PORT: z.coerce.number().default(4200),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  APP_NAME: z.string().default("LinkForge"),
  APP_VERSION: z.string().default("1.0.0"),
  DB_URL: z.string().min(1, "MONGO_URI is required"),
  REDIS_URL: z.string().min(1, "REDIS_URL is required"),
  BASE_URL: z.string().min(1, "BASE_URL is required"),
  REDIS_COUNTER_KEY: z.string().default("url_shortener_counter"),
  JWT_ACCESS_SECRET: z
    .string()
    .min(10, "JWT_ACCESS_SECRET must be at least 10 characters"),
  JWT_REFRESH_SECRET: z
    .string()
    .min(10, "JWT_REFRESH_SECRET must be at least 10 characters"),
  ACCESS_TOKEN_EXPIRE: z.string().default("10m"),
  REFRESH_TOKEN_EXPIRE: z.string().default("7d"),
  URL_EXPIRY_SCHEDULER: z.string().default("url_expiry_scheduler"),
  AGGREGATION_ANALYTICS_SCHEDULER: z
    .string()
    .default("aggregation_analytics_scheduler"),
  ANALYTICS_DEAD_LETTER_QUEUE: z
    .string()
    .default("analytics_dead_letter_queue"),

  JWT_EXPIRES_IN: z.string().default("7d"),

  ANALYTICS_QUEUE: z.string().default("analytics-queue"),

  EMAIL_TRANSPORTER: z.enum(["smtp", "gmail", "sendgrid"]).default("smtp"),
  URL_QUEUE: z.string().default("url-queue"),
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
  EMAIL_FROM_ADDRESS: z.string().default("noreply@linkforge.com"),
  EMAIL_FROM_NAME: z.string().default("LinkForge"),
  EMAIL_TEMPLATES_PATH: z.string().default("./src/utils/email-templates"),

  VERIFICATION_TOKEN_EXPIRE: z.string().default("24h"),
  RESET_TOKEN_EXPIRE: z.string().default("30m"),

  EMAIL_REQUEST_RATE_LIMIT: z.coerce.number().default(3),
  CLIENT_URL: z.string().default("http://localhost:3000"),

  // Server configuration
  SERVER_TIMEOUT: z.coerce.number().default(30000),
  KEEP_ALIVE_TIMEOUT: z.coerce.number().default(65000),
  HEADERS_TIMEOUT: z.coerce.number().default(66000),
  MAX_CONNECTIONS: z.coerce.number().default(1000),

  // Health check configuration
  HEALTH_CHECK_TIMEOUT: z.coerce.number().default(5000),

  // CORS configuration
  CORS_ORIGINS: z.string().default("http://localhost:3000"),

  LOG_LEVEL: z
    .enum(["error", "warn", "info", "http", "verbose", "debug", "silly"])
    .default("info"),
  SERVICE_NAME: z.string().default("url-shortener-server"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (parsedEnv.success === false) {
  logger.error("Invalid environment variables", {
    event: "ENV_VALIDATION_FAILED",
  });

  Object.entries(parsedEnv.error.flatten().fieldErrors).forEach(
    ([key, value]) => {
      logger.error("Environment variable validation error", {
        event: "ENV_FIELD_VALIDATION_FAILED",
        field: key,
        errors: value,
      });
    },
  );
  process.exit(1);
}

export const env = parsedEnv.data;
export type Env = typeof env;
