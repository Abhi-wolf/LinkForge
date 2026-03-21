import { serverConfig } from "../config";
import { redis } from "../config/redis";
import type { IUrlCachDto } from "../dtos/url.dto";

export class CacheRepository {
  private calculateTTL(): number {
    const defaultTTL = 6 * 60 * 60; // 6 hours default

    const randomTTL = Math.floor(Math.random() * 100);

    return defaultTTL + randomTTL;
  }

  async getNextId(): Promise<number> {
    const key = serverConfig.REDIS_COUNTER_KEY;
    const result = await redis.incr(key);
    return result;
  }

  async setUrlMapping(data: IUrlCachDto) {
    const key = `url:${data.shortUrl}`;
    const ttl = this.calculateTTL();

    // this will make two round trip
    // await redis.hset(key, {
    //   originalUrl: data.originalUrl,
    //   urlId: data.urlId,
    //   status: data.status,
    //   expirationDate: data.expirationDate,
    // });

    // await redis.expire(key, ttl);

    // this will take only one trip
    await redis
      .pipeline()
      .hset(key, {
        originalUrl: data.originalUrl,
        urlId: data.urlId,
        status: data.status,
        expirationDate: data.expirationDate,
      })
      .expire(key, ttl)
      .exec();
  }

  async getUrlMapping(shortUrl: string) {
    const key = `url:${shortUrl}`;
    const cachedData = await redis.hgetall(key);

    if (!cachedData || !cachedData.originalUrl) return null;

    // Refresh TTL on cache hit
    await redis.expire(key, this.calculateTTL());

    return {
      originalUrl: cachedData.originalUrl,
      urlId: cachedData.urlId,
      status: cachedData.status,
      expirationDate: cachedData.expirationDate || null,
    };
  }

  async deleteUrlMapping(shortUrl: string) {
    const key = `url:${shortUrl}`;
    await redis.del(key);
  }
}
