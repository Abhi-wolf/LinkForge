import promClient from "../config/prometheus";

export const urlCreatedTotal = new promClient.Counter({
  name: "linkforge_url_created_total",
  help: "Total number of URLs created",
  registers: [promClient.register],
});

export const urlRedirectedTotal = new promClient.Counter({
  name: "linkforge_url_redirected_total",
  help: "Total number of URL redirects",
  registers: [promClient.register],
});
