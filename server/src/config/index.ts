// This file contains all the basic configuration logic for the app server to work
import dotenv from "dotenv";

type ServerConfig = {
  PORT: number;
  DB_URL: string;
  REDIS_URL: string;
  REDIS_COUNTER_KEY: string;
  BASE_URL: string;
  ANALYTICS_QUEUE: string;
  AGGREGATION_ANALYTICS_QUEUE: string;
};

function loadEnv() {
  dotenv.config();
  console.log(`Environment variables loaded`);
}

loadEnv();

export const serverConfig: ServerConfig = {
  PORT: Number(process.env.PORT) || 3001,
  DB_URL: process.env.DB_URL || "mongodb://localhost:27017/url_shortener",
  REDIS_URL: process.env.REDIS_URL || "redis://localhost:6379",
  REDIS_COUNTER_KEY: process.env.REDIS_COUNTER_KEY || "url_shortener_counter",
  BASE_URL: process.env.BASE_URL || "http://localhost:4000",
  ANALYTICS_QUEUE: process.env.ANALYTICS_QUEUE || "analytics_queue",
  AGGREGATION_ANALYTICS_QUEUE:
    process.env.AGGREGATION_ANALYTICS_QUEUE || "aggregation_analytics_queue",
};
