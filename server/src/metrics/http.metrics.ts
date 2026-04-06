import client from "prom-client";
// import { register } from "../config/prometheus";

export const httpRequestsTotal = new client.Counter({
  name: "linkforge_http_requests_total", // ✅ Add prefix
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
//   registers: [register],
});

export const httpRequestDuration = new client.Histogram({
  name: "linkforge_http_request_duration_seconds", // ✅ Add prefix
  help: "Duration of HTTP requests in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.1, 0.5, 1, 2, 5, 10],
//   registers: [register],
});

export const httpErrorsTotal = new client.Counter({
  name: "linkforge_http_errors_total", // ✅ Add prefix
  help: "Total number of HTTP errors",
  labelNames: ["method", "route", "status_code"],
//   registers: [register],
});