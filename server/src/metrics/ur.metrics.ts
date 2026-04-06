import client from "prom-client";
import { register } from "../config/prometheus";

export const urlCreatedTotal = new client.Counter({
  name: "url_created_total",
  help: "Total number of URLs created",
  registers: [register],
});

export const urlRedirectedTotal = new client.Counter({
  name: "url_redirected_total",
  help: "Total number of URL redirects",
  registers: [register],
});

export const urlNotFoundTotal = new client.Counter({
  name: "url_not_found_total",
  help: "Total number of URL not found",
  registers: [register],
});
