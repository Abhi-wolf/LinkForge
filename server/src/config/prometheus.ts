import client from "prom-client";

/**
 * Create registry
 */
export const register = new client.Registry();

/**
 * Default metrics
 * CPU
 * Memory
 * Event loop
 * GC
 */
client.collectDefaultMetrics({
  register,
  prefix: "linkforge_",
});

/**
 * Common labels
 */
register.setDefaultLabels({
  app: "linkforge",
  service: "linkforge",
  environment: process.env.NODE_ENV || "development",
});

/**
 * Content type
 */
export const metricsContentType = register.contentType;

export default client;