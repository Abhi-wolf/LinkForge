import Redis from "ioredis";
import { serverConfig } from ".";
import logger from "./logger.config";

const retryStrategy = (times: number) => {
  if (times > 3) {
    logger.error("Unable to connect to Redis server after multiple attempts.");
    return null;
  }
  return Math.min(times * 100, 3000);
};

// ✅ Pass URL as first argument, options as second
export const redis = new Redis(serverConfig.REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy,
});

redis.on("error", (err) => {
  logger.error("Redis connection error:", err);
});

export const createNewRedisConnection = () => {
  return new Redis(serverConfig.REDIS_URL, {
    maxRetriesPerRequest: null,
    retryStrategy,
  });
};

export async function initRedis() {
  try {
    await redis.ping(); // Test the connection
    logger.info("Redis connection established successfully");
  } catch (error) {
    logger.error("Redis connection failed:", error);
  }
}

export async function closeRedis() {
  await redis.quit();
  logger.info("Redis connection closed");
}

export async function checkRedis(): Promise<boolean> {
  try {
    const response = await redis.ping();
    return response === "PONG";
  } catch {
    return false;
  }
}
