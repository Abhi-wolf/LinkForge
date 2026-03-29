import Redis from "ioredis";
import { serverConfig } from ".";
import logger from "./logger.config";

// TODO: can try implementing circuit breaker
const retryStrategy = (times: number) => {
  if (times > 2) {
    logger.error("Redis connection retry limit exceeded, switching to 30s retry interval", {
      event: "REDIS_RETRY_LIMIT_EXCEEDED",
      attemptCount: times
    });
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
  logger.error("Redis connection error occurred", {
    event: "REDIS_CONNECTION_ERROR",
    err: err instanceof Error ? err : undefined
  });
});

redis.on("ready", () => {
  isRedisAvailable = true;
  logger.info("Redis connection established successfully", {
    event: "REDIS_CONNECTION_READY"
  });
});
redis.on("close", () => {
  isRedisAvailable = false;
  logger.warn("Redis connection closed", {
    event: "REDIS_CONNECTION_CLOSED"
  });
});
redis.on("end", () => {
  isRedisAvailable = false;
  logger.warn("Redis connection ended", {
    event: "REDIS_CONNECTION_ENDED"
  });
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
    logger.info("Initializing Redis connection", {
      event: "REDIS_INIT_START"
    });
    
    await Promise.race([
      redis.ping(), // Promise A: resolves if Redis responds
      new Promise(
        (
          _,
          reject, // Promise B: rejects after 3 seconds
        ) => setTimeout(() => reject(new Error("Redis ping timeout")), 3000),
      ),
    ]);
    
    isRedisAvailable = true;
    logger.info("Redis connection initialized successfully", {
      event: "REDIS_INIT_SUCCESS"
    });
  } catch (error) {
    isRedisAvailable = false;
    logger.error("Redis initialization failed", {
      event: "REDIS_INIT_FAILED",
      err: error instanceof Error ? error : undefined
    });
  }
}

export async function closeRedis() {
  try {
    logger.info("Closing Redis connection gracefully", {
      event: "REDIS_CLOSE_START"
    });
    
    await redis.quit();
    
    logger.info("Redis connection closed successfully", {
      event: "REDIS_CLOSE_SUCCESS"
    });
  } catch (error) {
    logger.warn("Graceful Redis close failed, forcing disconnect", {
      event: "REDIS_CLOSE_FORCE",
      err: error instanceof Error ? error : undefined
    });
    redis.disconnect(); // force if quit fails
  }
}

export async function checkRedis(): Promise<boolean> {
  try {
    logger.debug("Performing Redis health check", {
      event: "REDIS_HEALTH_CHECK_START"
    });
    
    const response = await redis.ping();
    
    if (response === "PONG") {
      logger.debug("Redis health check passed", {
        event: "REDIS_HEALTH_CHECK_SUCCESS"
      });
      return true;
    } else {
      logger.warn("Redis health check returned unexpected response", {
        event: "REDIS_HEALTH_CHECK_UNEXPECTED",
        response
      });
      return false;
    }
  } catch (error) {
    logger.error("Redis health check failed", {
      event: "REDIS_HEALTH_CHECK_FAILED",
      err: error instanceof Error ? error : undefined
    });
    return false;
  }
}
