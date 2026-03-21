import Redis from "ioredis";
import { serverConfig } from ".";
import logger from "./logger.config";

// const redisConfig = {
//   url: serverConfig.REDIS_URL,
//   maxRetriesPerRequest: null,
//   retryStrategy(times: number) {
//     if (times > 3) {
//       logger.error(
//         "Unable to connect to Redis server after multiple attempts.",
//       );
//       return null; // Stop retrying after 3 attempts
//     }
//     const delay = Math.min(times * 100, 3000); // Exponential backoff with a maximum delay of 3 seconds
//     return delay;
//   },
// };

// export const redis = new Redis(redisConfig);

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

redis.on("connect", () => {
  logger.info("Connected to Redis server");
});

redis.on("error", (err) => {
  logger.error("Redis connection error:", err);
});

redis.on("end", () => {
  logger.info("Redis connection closed");
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
    console.error(error);
    process.exit(1);
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
