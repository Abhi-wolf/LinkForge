import Redis from "ioredis";
import { serverConfig } from ".";
import logger from "./logger.config";

// TODO: can try implementing circuit breaker
const retryStrategy = (times: number) => {
  if (times > 2) {
    logger.error("Unable to connect to Redis server after multiple attempts.");
    // Return a delay instead of null — keeps retrying every 30s indefinitely
    return 30000;
  }
  return Math.min(times * 100, 3000);
};

export let isRedisAvailable = false;

// ✅ Pass URL as first argument, options as second
export const redis = new Redis(serverConfig.REDIS_URL, {
  maxRetriesPerRequest: null, // ← means retry forever, ping never rejects
  retryStrategy,
});

redis.on("error", (err) => {
  isRedisAvailable = false;
  logger.error("Redis connection error:", err);
});

redis.on("ready", () => {
  isRedisAvailable = true;
});
redis.on("close", () => {
  isRedisAvailable = false;
});
redis.on("end", () => {
  isRedisAvailable = false;
});

export const createNewRedisConnection = () => {
  return new Redis(serverConfig.REDIS_URL, {
    maxRetriesPerRequest: null,
    retryStrategy,
  });
};

/*
  NOTES:
  - When we call redis.ping(), it doesn't directly send to Redis — it enqueues the command and 
      waits for a connection to send it through, It never rejects.
  - Promise.race() resolves or rejects with whichever promise settles first:
  Full Flow From Start to Finish


**Scenario A — Redis down at startup:**
Server starts
    ↓
initRedis() → Promise.race → times out after 3s
    ↓
isRedisAvailable = false
    ↓
connectDB() runs
    ↓
startUrlExpiryWorker()
    → isRedisAvailable false → startLocalUrlExpiryWorker() ✓
    → registers redis.on("ready") listener for future recovery
    ↓
Bootstrap completes, local worker running

... later Redis comes back ...
    ↓
ioredis retryStrategy reconnects
    ↓
"ready" event fires
    ↓
redis.on("ready") handler:
    → stopLocalUrlExpiryWorker()
    → startUrlExpiryBullScheduler()
    → startUrlExpiryBullWorker()  ✓

**Scenario B — Redis up at startup:**
Server starts
    ↓
initRedis() → ping resolves in ~10ms
    ↓
isRedisAvailable = true
    ↓
connectDB() runs
    ↓
startUrlExpiryWorker()
    → isRedisAvailable true → BullMQ starts ✓
    → registers redis.on("close") listener for future failures
    ↓
Bootstrap completes, BullMQ running

... later Redis goes down ...
    ↓
"close" fires
    ↓
redis.on("close") handler:
    → stopUrlExpiryBullWorkerAndScheduler()
    → startLocalUrlExpiryWorker() ✓

... Redis recovers ...
    ↓
"ready" fires → switches back to BullMQ ✓
*/

export async function initRedis() {
  try {
    await Promise.race([
      redis.ping(), // Promise A: resolves if Redis responds
      new Promise(
        (
          _,
          reject, // Promise B: rejects after 3 seconds
        ) => setTimeout(() => reject(new Error("Redis ping timeout")), 3000),
      ),
    ]);
  } catch (error) {
    logger.error("Redis connection failed:", error);
  }
}

export async function closeRedis() {
  try {
    await redis.quit();
    logger.info("Redis connection closed gracefully");
  } catch {
    redis.disconnect(); // force if quit fails
  }
}

export async function checkRedis(): Promise<boolean> {
  try {
    const response = await redis.ping();
    return response === "PONG";
  } catch {
    return false;
  }
}
