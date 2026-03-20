// This file contains all the basic configuration logic for the app server to work
import dotenv from "dotenv";
import logger from "./logger.config";

type ServerConfig = {
  PORT: number;
  DB_URL: string;
  REDIS_URL: string;
  REDIS_COUNTER_KEY: string;
  BASE_URL: string;
  ANALYTICS_QUEUE: string;
  AGGREGATION_ANALYTICS_SCHEDULER: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ACCESS_TOKEN_EXPIRE: string;
  REFRESH_TOKEN_EXPIRE: string;
  URL_EXPIRY_SCHEDULER: string;
};

function loadEnv() {
  dotenv.config();
  logger.info(`Environment variables loaded`);
}

loadEnv();

export const serverConfig: ServerConfig = {
  PORT: Number(process.env.PORT) || 3001,
  DB_URL: process.env.DB_URL || "mongodb://localhost:27017/url_shortener",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  REDIS_COUNTER_KEY: process.env.REDIS_COUNTER_KEY || "url_shortener_counter",
  BASE_URL: process.env.BASE_URL || "http://localhost:4000",
  ANALYTICS_QUEUE: process.env.ANALYTICS_QUEUE || "analytics_queue",
  AGGREGATION_ANALYTICS_SCHEDULER:
    process.env.AGGREGATION_ANALYTICS_SCHEDULER ||
    "aggregation_analytics_scheduler",
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || "access_secret_123",
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || "refresh_secret_123",
  ACCESS_TOKEN_EXPIRE: process.env.ACCESS_TOKEN_EXPIRE || "60m",
  REFRESH_TOKEN_EXPIRE: process.env.REFRESH_TOKEN_EXPIRE || "7d",
  URL_EXPIRY_SCHEDULER:
    process.env.URL_EXPIRY_SCHEDULER || "url_expiry_scheduler",
};
