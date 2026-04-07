import promClient from "../config/prometheus";

export const httpRequestsTotal = new promClient.Counter({
  name: "linkforge_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [promClient.register],
});

export const httpRequestDuration = new promClient.Histogram({
  name: "linkforge_http_request_duration_seconds",
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
  registers: [promClient.register],
});

export const httpErrorsTotal = new promClient.Counter({
  name: "linkforge_http_errors_total",
  help: "Total number of HTTP errors",
  labelNames: ["method", "route", "status_code"],
  registers: [promClient.register],
});

export const rateLimitExceededTotal = new promClient.Counter({
  name: "linkforge_rate_limit_ip_total",
  help: "Total number of times an IP was rate limited",
  labelNames: ["ip"],
  registers: [promClient.register],
});
