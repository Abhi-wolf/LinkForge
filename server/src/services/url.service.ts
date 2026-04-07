import { serverConfig } from "../config";
import type { CreateUrlDto } from "../dtos/url.dto";
import { type IUrl, UrlStatus } from "../models/url.model";
import { AnalyticsRepository } from "../repositories/analytics.repository";
import { CacheRepository } from "../repositories/cache.repository";
import { UrlRepository } from "../repositories/url.repository";
import { toBase62 } from "../utils/base62";
import {
  BadRequestError,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
} from "../utils/errors/app.error";
import { createContextLogger } from "../config/logger.config";
import { urlCreatedTotal } from "../metrics/url.metrics";

const urlLogger = createContextLogger("url", "service");

export class UrlService {
  constructor(
    private readonly urlRepository: UrlRepository,
    private readonly cacheRepository: CacheRepository,
    private readonly analyticsRepository: AnalyticsRepository,
  ) {}

  /**
   * Create a short URL
   * @param urlData - URL data
   * @param userId - User ID (optional)
   * @returns Promise<IUrl> - Created URL
   */
  async createShortUrl(urlData: CreateUrlDto, userId?: string) {
    urlLogger.info("createShortUrl", "Starting short URL creation", { originalUrl: urlData.originalUrl, userId });
    
    let shortUrl: string;
    let url;

    // unauthorized user can only create url with 7 days expiration date
    if (!userId) {
      urlLogger.info("createShortUrl", "Unauthorized user: setting 7-day expiration");
      urlData.expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const MAX_ATTEMPTS = 5;
    let attempts = 0;

    while (attempts < MAX_ATTEMPTS) {
      urlLogger.info("createShortUrl", "Generating short URL attempt", { attempt: attempts + 1 });
      const nextId = await this.cacheRepository.getNextId();

      shortUrl = toBase62(nextId);
      urlLogger.info("createShortUrl", "Generated short URL candidate", { shortUrl });

      // Check if the generated short URL already exists (unlikely but possible)
      const existingUrl = await this.urlRepository.findByShortUrl(shortUrl);

      // Collision occurred, generate a new short URL
      if (existingUrl) {
        urlLogger.warn("createShortUrl", "Collision detected", { shortUrl });
        attempts++;
        continue;
      }

      urlLogger.info("createShortUrl", "Creating URL record in DB");
      url = await this.urlRepository.create({
        originalUrl: urlData.originalUrl,
        tags: urlData.tags,
        expirationDate: urlData.expirationDate,
        shortUrl: shortUrl,
        userId: userId ? userId : undefined,
      });

      break;
    }

    if (attempts >= MAX_ATTEMPTS) {
      urlLogger.error("createShortUrl", "Max attempts reached during unique URL generation", { attempts });
      throw new InternalServerError(
        "Failed to generate unique short URL after multiple attempts",
      );
    }

    urlLogger.info("createShortUrl", "Updating cache with new URL mapping", { shortUrl: url!.shortUrl });
    
    await this.cacheRepository.setUrlMapping({
      shortUrl: url!.shortUrl,
      originalUrl: url!.originalUrl,
      urlId: url!._id?.toString(),
      status: url!.status,
      expirationDate: url!.expirationDate?.toISOString() ?? "",
    });

    const baseUrl = serverConfig.BASE_URL;
    const fullUrl = `${baseUrl}/fwd/${url!.shortUrl}`;

    urlLogger.info("createShortUrl", "Short URL created successfully", {
      shortUrl: url!.shortUrl,
      userId,
    });

    urlCreatedTotal.inc();

    return {
      id: url!._id?.toString(),
      fullUrl,
      shortUrl: url!.shortUrl,
      originalUrl: urlData.originalUrl,
      tags: urlData.tags,
      expirationDate: urlData.expirationDate,
      createdAt: url!.createdAt,
      updatedAt: url!.updatedAt,
    };
  }

  /**
   * Get original URL from short URL
   * @param shortUrl - Short URL to lookup
   * @returns Promise<{ originalUrl: string; shortUrl: string; urlId: string; status: UrlStatus; expirationDate: string | null }> - URL data
   * @throws NotFoundError - If URL not found
   */
  async getOriginalUrl(shortUrl: string) {
    urlLogger.info("getOriginalUrl", "Looking up original URL", { shortUrl });
    const cacheData = await this.cacheRepository.getUrlMapping(shortUrl);

    if (cacheData) {
      urlLogger.info("getOriginalUrl", "Cache hit", { shortUrl });
      if (cacheData.status && cacheData.status !== UrlStatus.ACTIVE) {
        urlLogger.warn("getOriginalUrl", "URL is not active", { shortUrl, status: cacheData.status });
        throw new NotFoundError("Url not found");
      }

      if (
        cacheData.expirationDate &&
        new Date(cacheData.expirationDate) < new Date()
      ) {
        urlLogger.warn("getOriginalUrl", "URL has expired", { shortUrl, expirationDate: cacheData.expirationDate });
        throw new NotFoundError("Url not found");
      }

      return {
        originalUrl: cacheData.originalUrl,
        shortUrl,
        urlId: cacheData.urlId,
        status: cacheData.status,
        expirationDate: cacheData.expirationDate,
      };
    }

    urlLogger.info("getOriginalUrl", "Cache miss, fetching from DB", { shortUrl });
    const url = await this.urlRepository.findByShortUrl(shortUrl);

    if (!url) {
      urlLogger.warn("getOriginalUrl", "URL not found in DB", { shortUrl });
      throw new NotFoundError("Url not found");
    }

    if (url.expirationDate && new Date(url.expirationDate) < new Date()) {
      urlLogger.warn("getOriginalUrl", "URL has expired in DB", { shortUrl, expirationDate: url.expirationDate });
      throw new NotFoundError("Url not found");
    }

    if (url.status !== UrlStatus.ACTIVE) {
      urlLogger.warn("getOriginalUrl", "URL is not active in DB", { shortUrl, status: url.status });
      throw new NotFoundError("Url not found");
    }

    urlLogger.info("getOriginalUrl", "Updating cache after DB fetch", { shortUrl });
    await this.cacheRepository.setUrlMapping({
      shortUrl: url.shortUrl,
      originalUrl: url.originalUrl,
      urlId: url._id?.toString(),
      status: url.status,
      expirationDate: url.expirationDate?.toISOString() ?? "",
    });

    return {
      originalUrl: url.originalUrl,
      shortUrl: url.shortUrl,
      urlId: url._id?.toString(),
      status: url.status,
      expirationDate: url.expirationDate,
    };
  }

  /**
   * Get all URLs of a user
   * @param userId - User ID
   * @param options - Query options
   * @returns Promise<{ urls: IUrl[]; total: number }> - URLs and total count
   */
  async getAllUrlsOfUser(
    userId: string,
    options: {
      search?: string;
      status?: UrlStatus;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    },
  ) {
    urlLogger.info("getAllUrlsOfUser", "Fetching all URLs for user", { userId, ...options });
    const [urls, total] = await Promise.all([
      this.urlRepository.getUrlsOfUser(userId, options),
      this.urlRepository.countUrlsOfUser(userId, options),
    ]);

    urlLogger.info("getAllUrlsOfUser", "URLs fetched successfully", { userId, count: urls.length, total });

    const baseUrl = serverConfig.BASE_URL;

    const formattedUrls = urls.map((url) => {
      return {
        id: url._id?.toString(),
        originalUrl: url.originalUrl,
        shortUrl: url.shortUrl,
        fullUrl: `${baseUrl}/fwd/${url.shortUrl}`,
        tags: url.tags,
        status: url.status,
        expirationDate: url.expirationDate,
        createdAt: url.createdAt,
        updatedAt: url.updatedAt,
      };
    });

    return {
      urls: formattedUrls,
      total,
    };
  }

  /**
   * Update a URL
   * @param id - URL ID
   * @param data - URL data to update
   * @param userId - User ID
   * @returns Promise<IUrl> - Updated URL
   * @throws NotFoundError - If URL not found
   * @throws ForbiddenError - If user does not have permission to update URL
   * @throws BadRequestError - If short URL is expired or expiration date is in the past
   */
  async updateUrl(id: string, data: Partial<IUrl>, userId: string) {
    urlLogger.info("updateUrl", "Updating URL", { id, userId, updateData: data });
    if (data.shortUrl) {
      urlLogger.warn("updateUrl", "Short URL update attempted", { id });
      throw new ForbiddenError("Short URL cannot be updated");
    }

    const existingUrl = await this.urlRepository.findById(id);

    if (!existingUrl) {
      urlLogger.warn("updateUrl", "URL not found", { id });
      throw new NotFoundError("Url not found");
    }

    if (!existingUrl.userId || existingUrl.userId.toString() !== userId) {
      urlLogger.warn("updateUrl", "Permission denied", { id, userId, ownerId: existingUrl.userId });
      throw new ForbiddenError("You do not have permission to update this URL");
    }

    if (existingUrl.status === UrlStatus.DELETED) {
      urlLogger.warn("updateUrl", "Update attempted on deleted URL", { id });
      throw new NotFoundError("Url not found");
    }

    if (existingUrl.status === UrlStatus.EXPIRED) {
      urlLogger.warn("updateUrl", "Update attempted on expired URL", { id });
      throw new BadRequestError("Expired URL cannot be updated");
    }

    if (data.expirationDate && new Date(data.expirationDate) < new Date()) {
      urlLogger.warn("updateUrl", "Invalid expiration date", { id, expirationDate: data.expirationDate });
      throw new BadRequestError("Expiration date cannot be in the past");
    }

    urlLogger.info("updateUrl", "Performing update in DB", { id });
    const updatedUrl = await this.urlRepository.updateUrl(id, data);

    if (!updatedUrl) {
      urlLogger.error("updateUrl", "Update failed to return updated document", { id });
      throw new NotFoundError("Url not found");
    }

    // if status changed to inactive then remove that from cache
    if (updatedUrl.status !== UrlStatus.ACTIVE) {
      urlLogger.info("updateUrl", "Status changed to non-active, deleting cache", { id, status: updatedUrl.status });
      await this.cacheRepository.deleteUrlMapping(updatedUrl.shortUrl);
    } else if (data.originalUrl) {
      urlLogger.info("updateUrl", "Updating cache with new original URL", { id });
      await this.cacheRepository.setUrlMapping({
        shortUrl: updatedUrl.shortUrl,
        originalUrl: updatedUrl.originalUrl,
        urlId: updatedUrl._id?.toString(),
        status: updatedUrl.status,
        expirationDate: updatedUrl.expirationDate?.toISOString() ?? "",
      });
    }

    urlLogger.info("updateUrl", "URL updated successfully", { id });
    return {
      id: updatedUrl._id?.toString(),
      originalUrl: updatedUrl.originalUrl,
      shortUrl: updatedUrl.shortUrl,
      tags: updatedUrl.tags,
      status: updatedUrl.status,
      expirationDate: updatedUrl.expirationDate,
      createdAt: updatedUrl.createdAt,
      updatedAt: updatedUrl.updatedAt,
    };
  }

  /**
   * Delete a URL
   * @param id - URL ID
   * @param userId - User ID
   * @returns Promise<void>
   * @throws NotFoundError - If URL not found
   * @throws ForbiddenError - If user does not have permission to delete URL
   */
  async deleteUrl(id: string, userId: string) {
    urlLogger.info("deleteUrl", "Deleting URL", { id, userId });
    const existingUrl = await this.urlRepository.findById(id);

    if (!existingUrl) {
      urlLogger.warn("deleteUrl", "URL not found", { id });
      throw new NotFoundError("Url not found");
    }

    if (!existingUrl.userId || existingUrl.userId.toString() !== userId) {
      urlLogger.warn("deleteUrl", "Permission denied", { id, userId, ownerId: existingUrl.userId });
      throw new ForbiddenError("You do not have permission to delete this URL");
    }

    urlLogger.info("deleteUrl", "Deleting analytics and updating status to DELETED", { id });
    await this.analyticsRepository.deleteAnalyticsByUrlId(id);
    await this.urlRepository.updateUrl(id, { status: UrlStatus.DELETED });
    
    urlLogger.info("deleteUrl", "Deleting cache mapping", { shortUrl: existingUrl.shortUrl });
    await this.cacheRepository.deleteUrlMapping(existingUrl.shortUrl);

    urlLogger.info("deleteUrl", "URL deleted successfully", { id });
    return;
  }

  /**
   * Get URL that belongs to a user
   * @param shortUrl - Short URL
   * @param userId - User ID
   * @returns Promise<{ urlId: string; originalUrl: string; shortUrl: string; tags: string[]; status: UrlStatus; expirationDate: Date | null }> - URL details
   * @throws NotFoundError - If URL not found
   * @throws ForbiddenError - If user does not have permission to access URL
   */
  async getUrlBelongsToUser(shortUrl: string, userId: string) {
    urlLogger.info("getUrlBelongsToUser", "Verifying URL ownership", { shortUrl, userId });
    const existingUrl = await this.urlRepository.findByShortUrl(shortUrl);

    if (!existingUrl) {
      urlLogger.warn("getUrlBelongsToUser", "URL not found", { shortUrl });
      throw new NotFoundError("Url not found");
    }

    if (!existingUrl.userId || existingUrl.userId.toString() !== userId) {
      urlLogger.warn("getUrlBelongsToUser", "Permission denied", { shortUrl, userId, ownerId: existingUrl.userId });
      throw new ForbiddenError("You do not have permission to access this URL");
    }

    return {
      urlId: existingUrl._id?.toString(),
      originalUrl: existingUrl.originalUrl,
      shortUrl: existingUrl.shortUrl,
      tags: existingUrl.tags,
      status: existingUrl.status,
      expirationDate: existingUrl.expirationDate,
    };
  }

  async runUrlExpiryJob() {
    urlLogger.info("runUrlExpiryJob", "Starting URL expiry job");
    const expiredUrls = await this.urlRepository.findExpiredUrls();

    if (expiredUrls?.length > 0) {
      urlLogger.info("runUrlExpiryJob", "Expired URLs found", { count: expiredUrls.length });
      await this.urlRepository.updateExpireStatus();

      urlLogger.info("runUrlExpiryJob", "URL expiry status updated in DB", {
        event: "URL_EXPIRY_JOB_SUCCESS",
        expiredCount: expiredUrls.length
      });

      // Clear cache for each expired URL
      urlLogger.info("runUrlExpiryJob", "Clearing cache for expired URLs");
      await Promise.all(
        expiredUrls.map((url) =>
          this.cacheRepository.deleteUrlMapping(url.shortUrl),
        ),
      );

      urlLogger.info("runUrlExpiryJob", "Expired URLs processed and cache cleared", {
        event: "URL_EXPIRY_CACHE_CLEAR_SUCCESS",
        expiredCount: expiredUrls.length
      });
    } else {
      urlLogger.info("runUrlExpiryJob", "No expired URLs found to process");
    }
  }
}
