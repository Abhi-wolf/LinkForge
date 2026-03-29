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
      logger.warn("Redis unavailable for ID generation", {
        event: "CACHE_ID_GENERATION_REDIS_UNAVAILABLE"
      });
      throw new InternalServerError("Redis is not available");
    }
    try {
      const key = serverConfig.REDIS_COUNTER_KEY;
      const result = await redis.incr(key);
      
      logger.debug("Generated new ID from Redis counter", {
        event: "CACHE_ID_GENERATION_SUCCESS",
        id: result
      });
      
      return result;
    } catch (error) {
      logger.error("Redis counter increment failed", {
        event: "CACHE_ID_GENERATION_FAILED",
        err: error instanceof Error ? error : undefined
      });
      throw new InternalServerError("Redis incr failed");
    }
  }

  /**
   * Set URL mapping in cache
   * @param data - URL cache data
   */
  async setUrlMapping(data: IUrlCachDto) {
    if (!this.isAvailable()) {
      logger.debug("Redis unavailable, skipping cache write", {
        event: "CACHE_WRITE_REDIS_UNAVAILABLE",
        shortUrl: data.shortUrl
      });
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
        
      logger.debug("URL mapping cached successfully", {
        event: "CACHE_WRITE_SUCCESS",
        shortUrl: data.shortUrl,
        urlId: data.urlId,
        ttl
      });
    } catch (error) {
      logger.warn("Cache write operation failed", {
        event: "CACHE_WRITE_FAILED",
        shortUrl: data.shortUrl,
        err: error instanceof Error ? error : undefined
      });
    }
  }

  /**
   * Get URL mapping from cache
   * @param shortUrl - Short URL to lookup
   * @returns Promise<IUrlCachDto | null> - URL cache data or null if not found
   */
  async getUrlMapping(shortUrl: string) {
    if (!this.isAvailable()) {
      logger.debug("Redis unavailable, skipping cache read", {
        event: "CACHE_READ_REDIS_UNAVAILABLE",
        shortUrl
      });
      return null;
    }

    try {
      const key = `url:${shortUrl}`;
      const cachedData = await redis.hgetall(key);

      if (!cachedData || !cachedData.originalUrl) {
        logger.debug("Cache miss for URL", {
          event: "CACHE_MISS",
          shortUrl
        });
        return null;
      }

      // Refresh TTL on cache hit
      await redis.expire(key, this.calculateTTL());

      logger.debug("Cache hit for URL", {
        event: "CACHE_HIT",
        shortUrl,
        urlId: cachedData.urlId
      });

      return {
        originalUrl: cachedData.originalUrl,
        urlId: cachedData.urlId,
        status: cachedData.status,
        expirationDate: cachedData.expirationDate || null,
      };
    } catch (error) {
      logger.warn("Cache read operation failed", {
        event: "CACHE_READ_FAILED",
        shortUrl,
        err: error instanceof Error ? error : undefined
      });
      return null;
    }
  }

  /**
   * Delete URL mapping from cache
   * @param shortUrl - Short URL to delete
   */
  async deleteUrlMapping(shortUrl: string) {
    if (!this.isAvailable()) {
      logger.debug("Redis unavailable, skipping cache delete", {
        event: "CACHE_DELETE_REDIS_UNAVAILABLE",
        shortUrl
      });
      return;
    }

    try {
      const key = `url:${shortUrl}`;
      await redis.del(key);
      
      logger.debug("URL mapping deleted from cache", {
        event: "CACHE_DELETE_SUCCESS",
        shortUrl
      });
    } catch (error) {
      logger.warn("Cache delete operation failed", {
        event: "CACHE_DELETE_FAILED",
        shortUrl,
        err: error instanceof Error ? error : undefined
      });
    }
  }
}
