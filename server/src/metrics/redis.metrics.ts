import promClient from "../config/prometheus";

export const cacheUrlHitsTotal = new promClient.Counter({
  name: "linkforge_redis_cache_url_hits_total",
  help: "Total number of cache url hits",
  registers: [promClient.register],
});

export const cacheUrlMissesTotal = new promClient.Counter({
  name: "linkforge_redis_cache_url_misses_total",
  help: "Total number of cache url misses",
  registers: [promClient.register],
});

export const cacheApiKeyHitsTotal = new promClient.Counter({
  name: "linkforge_redis_cache_api_key_hits_total",
  help: "Total number of cache api key hits",
  registers: [promClient.register],
});

export const cacheApiKeyMissesTotal = new promClient.Counter({
  name: "linkforge_redis_cache_api_key_misses_total",
  help: "Total number of cache api key misses",
  registers: [promClient.register],
});
