import { Router, Request, Response, Application } from "express";
import { Queue } from "bullmq";
import { checkRedis } from "../config/redis";
import { checkMongo } from "../config/db";
import {
  analyticsDeadLetterQueue,
  analyticsQueue,
} from "../queues/analytics.queue";
import { serverConfig } from "../config";
import os from "os";

export const healthRouter = Router();


type CheckStatus = "up" | "down";

interface ServiceCheck {
  status: CheckStatus;
  responseTimeMs: number;
}

interface MemoryCheck {
  usagePercent: number;
  status: CheckStatus;
}

interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  environment: string;
  uptimeHours: number;
  timestamp: string;
  services?: Record<string, ServiceCheck>;
  memory?: MemoryCheck;
}


const MEMORY_THRESHOLD_PERCENT = 90;
const CHECK_TIMEOUT_MS = 3000;
const CACHE_TTL_MS = 5000;


async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms),
  );
  return Promise.race([promise, timeout]);
}

async function runCheck(fn: () => Promise<boolean>): Promise<ServiceCheck> {
  const start = Date.now();
  try {
    const ok = await withTimeout(fn(), CHECK_TIMEOUT_MS);
    return { status: ok ? "up" : "down", responseTimeMs: Date.now() - start };
  } catch {
    // Error swallowed intentionally — reason is logged server-side, never surfaced externally
    return { status: "down", responseTimeMs: Date.now() - start };
  }
}

async function checkQueueHealth(queue: Queue): Promise<boolean> {
  try {
    await withTimeout(queue.getWorkers(), CHECK_TIMEOUT_MS);
    return true;
  } catch {
    return false;
  }
}

function getMemoryCheck(): MemoryCheck {
  const memory = process.memoryUsage();

  const rss = memory.rss;
  const totalSystemMemory = os.totalmem();

  const usagePercent = Math.round((rss / totalSystemMemory) * 100);

  let status: CheckStatus = "up";

  if (usagePercent > MEMORY_THRESHOLD_PERCENT) status = "down";

  return {
    usagePercent,
    status,
  };
}

function deriveStatus(
  services: Record<string, ServiceCheck>,
  memory: MemoryCheck,
): HealthResponse["status"] {
  const allChecks = [...Object.values(services), memory];
  const downCount = allChecks.filter((c) => c.status === "down").length;
  if (downCount === 0) return "healthy";
  if (downCount === allChecks.length) return "unhealthy";
  return "degraded";
}



// ─── Result Cache (prevents hammering DB on every LB poll) ───────────────────

let cachedResult: {
  body: HealthResponse;
  statusCode: number;
  at: number;
} | null = null;

async function getReadinessResult(): Promise<typeof cachedResult> {
  if (cachedResult && Date.now() - cachedResult.at < CACHE_TTL_MS) {
    return cachedResult;
  }

  const [database, redis, analyticsQ, deadLetterQ] = await Promise.all([
    runCheck(checkMongo),
    runCheck(checkRedis),
    runCheck(() => checkQueueHealth(analyticsQueue)),
    runCheck(() => checkQueueHealth(analyticsDeadLetterQueue)),
  ]);

  const services = {
    database,
    redis,
    analyticsQueue: analyticsQ,
    deadLetterQueue: deadLetterQ,
  };
  const memory = getMemoryCheck();
  const status = deriveStatus(services, memory);

  cachedResult = {
    body: {
      status,
      version: serverConfig.APP_VERSION,
      environment: serverConfig.NODE_ENV,
      uptimeHours: +(process.uptime() / 3600).toFixed(4),
      timestamp: new Date().toISOString(),
      services,
      memory,
    },
    statusCode: status === "unhealthy" ? 503 : 200,
    at: Date.now(),
  };

  return cachedResult;
}

export function setupHealthChecks(app: Application): void {
  // Liveness — is the process alive? No I/O, never fails unless process is dead
  app.get("/live", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "healthy",
      uptimeHours: +(process.uptime() / 3600).toFixed(4),
      timestamp: new Date().toISOString(),
    });
  });

  // Readiness — can the app serve traffic? Checks all dependencies
  app.get("/ready", async (_req: Request, res: Response) => {
    const result = await getReadinessResult();
    res.status(result!.statusCode).json(result!.body);
  });
}