import { serverConfig } from "../config";
import logger from "../config/logger.config";
import { analyticsQueue } from "../queues/analytics.queue";

export interface IAnalyticsJob {
  urlId: string;
  shortUrl: string;
  os: string;
  browser: string;
  device: string;
  country: string;
  region: string;
  city: string;
  timezone: string;
  utcDate: string;
  correlationId?: string;
  utmSource?: string;
  ref?: string;
}

export async function addAnalyticsJob(
  data: IAnalyticsJob,
): Promise<string | null> {
  try {
    const job = await analyticsQueue.add(serverConfig.ANALYTICS_QUEUE, data);

    logger.info("Analytics job added to queue successfully", {
      event: "ANALYTICS_JOB_QUEUED_SUCCESS",
      jobId: job.id,
      correlationId: data.correlationId
    });

    return job.id || null;
  } catch (error) {
    logger.error("Failed to add analytics job to queue", {
      event: "ANALYTICS_JOB_QUEUED_FAILED",
      correlationId: data.correlationId,
      err: error instanceof Error ? error : undefined
    });
    return null;
  }
}
