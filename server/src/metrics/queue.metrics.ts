import promClient from "../config/prometheus";

export const analyticsJobFailures = new promClient.Counter({
  name: "linkforge_analytics_job_failures_total",
  help: "Total failed analytics jobs",
  labelNames: ["error_type"],
  registers: [promClient.register],
});
