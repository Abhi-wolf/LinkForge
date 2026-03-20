import { serverConfig } from "../config";
import { redis } from "../config/redis";
import { IUrlCachDto } from "../dtos/url.dto";

export class CacheRepository {
  async getNextId(): Promise<number> {
    const key = serverConfig.REDIS_COUNTER_KEY;
    const result = await redis.incr(key);
    return result;
  }

  async setUrlMapping(data: IUrlCachDto) {
    const key = `url:${data.shortUrl}`;
    // await redis.set(key, originalUrl, "EX", 86400); // TTL 1 day
    await redis.hset(key, {
      originalUrl: data.originalUrl,
      urlId: data.urlId,
      status: data.status,
      expirationDate: data.expirationDate,
    });

    await redis.expire(key, 86400);
  }

  async getUrlMapping(shortUrl: string) {
    const key = `url:${shortUrl}`;
    const cachedData = await redis.hgetall(key);

    if (!cachedData || !cachedData.originalUrl) return null;

    return {
      originalUrl: cachedData.originalUrl,
      urlId: cachedData.urlId,
      status: cachedData.status,
      expirationDate: cachedData.expirationDate,
    };
  }

  async deleteUrlMapping(shortUrl: string) {
    const key = `url:${shortUrl}`;
    await redis.del(key);
  }
}
