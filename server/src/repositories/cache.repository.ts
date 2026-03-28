import { serverConfig } from "../config";
import logger from "../config/logger.config";
import { isRedisAvailable, redis } from "../config/redis";
import type { IUrlCachDto } from "../dtos/url.dto";
import { InternalServerError } from "../utils/errors/app.error";

export class CacheRepository {
  /**
   * Check if Redis is available
   * @returns boolean - True if Redis is available, false otherwise
   */
  private isAvailable(): boolean {
    return isRedisAvailable;
  }

  /**
   * Calculate TTL for cache entry
   * @returns number - TTL in seconds
   */
  private calculateTTL(): number {
    const defaultTTL = 6 * 60 * 60; // 6 hours default
    const randomTTL = Math.floor(Math.random() * 100);
    return defaultTTL + randomTTL;
  }

  /**
   * Get the next ID from Redis counter
   * @returns Promise<number> - The next ID
   * @throws InternalServerError - If Redis is not available
   */
  async getNextId(): Promise<number> {
    if (!this.isAvailable()) {
      throw new InternalServerError("Redis is not available");
    }
    try {
      const key = serverConfig.REDIS_COUNTER_KEY;
      const result = await redis.incr(key);
      return result;
    } catch (error) {
      logger.warn("Redis incr failed:", error);
      throw new InternalServerError("Redis incr failed");
    }
  }

  /**
   * Set URL mapping in cache
   * @param data - URL cache data
   */
  async setUrlMapping(data: IUrlCachDto) {
    if (!this.isAvailable()) {
      return;
    }

    try {
      const key = `url:${data.shortUrl}`;
      const ttl = this.calculateTTL();

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
    } catch (error) {
      logger.warn("Cache write failed:", error);
    }
  }

  /**
   * Get URL mapping from cache
   * @param shortUrl - Short URL to lookup
   * @returns Promise<IUrlCachDto | null> - URL cache data or null if not found
   */
  async getUrlMapping(shortUrl: string) {
    if (!this.isAvailable()) {
      return null;
    }

    try {
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
    } catch (error) {
      logger.warn("Cache read failed:", error);
      return null;
    }
  }

  /**
   * Delete URL mapping from cache
   * @param shortUrl - Short URL to delete
   */
  async deleteUrlMapping(shortUrl: string) {
    if (!this.isAvailable()) {
      return;
    }

    try {
      const key = `url:${shortUrl}`;
      await redis.del(key);
    } catch (error) {
      logger.warn("Cache delete failed:", error);
    }
  }
}
