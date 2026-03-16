import { serverConfig } from "../config";
import { redis } from "../config/redis";

export class CacheRepository {
  async getNextId(): Promise<number> {
    const key = serverConfig.REDIS_COUNTER_KEY;
    const result = await redis.incr(key);
    return result;
  }

  async setUrlMapping(shortUrl: string, originalUrl: string) {
    const key = `url:${shortUrl}`;
    await redis.set(key, originalUrl, "EX", 86400); // TTL 1 day
  }

  async getUrlMapping(shortUrl: string): Promise<string | null> {
    const key = `url:${shortUrl}`;
    return await redis.get(key);
  }

  async deleteUrlMapping(shortUrl: string) {
    const key = `url:${shortUrl}`;
    await redis.del(key);
  }
}
