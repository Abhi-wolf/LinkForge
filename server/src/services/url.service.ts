import { serverConfig } from "../config";
import type { CreateUrlDto } from "../dtos/url.dto";
import { type IUrl, UrlStatus } from "../models/url.model";
import { AnalyticsRepository } from "../repositories/analytics.repository";
import { CacheRepository } from "../repositories/cache.repository";
import { UrlRepository } from "../repositories/url.repository";
import { toBase62 } from "../utils/base62";
import { BadRequestError, ForbiddenError, InternalServerError, NotFoundError } from "../utils/errors/app.error";

export class UrlService {
  constructor(
    private readonly urlRepository: UrlRepository,
    private readonly cacheRepository: CacheRepository,
    private readonly analyticsRepository: AnalyticsRepository,
  ) { }

  async createShortUrl(urlData: CreateUrlDto, userId?: string) {
    let shortUrl: string;
    let url;

    // unauthorized user can only create url with 7 days expiration date
    if (!userId) {
      urlData.expirationDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    }

    const MAX_ATTEMPTS=10;
    let attempts=0;

    while (attempts < MAX_ATTEMPTS) {
      const nextId = await this.cacheRepository.getNextId();

      shortUrl = toBase62(nextId);

      // Check if the generated short URL already exists (unlikely but possible)
      const existingUrl = await this.urlRepository.findByShortUrl(shortUrl);

      if (existingUrl) {
        attempts++;
        continue; // Collision occurred, generate a new short URL
      }

      url = await this.urlRepository.create({
        originalUrl: urlData.originalUrl,
        tags: urlData.tags,
        expirationDate: urlData.expirationDate,
        shortUrl: shortUrl,
        userId: userId ? userId : undefined,
      });

      break;
    }

    if(attempts >= MAX_ATTEMPTS) {
      throw new InternalServerError("Failed to generate unique short URL after multiple attempts");
    }

    await this.cacheRepository.setUrlMapping({
      shortUrl: url!.shortUrl,
      originalUrl: url!.originalUrl,
      urlId: url!._id?.toString(),
      status: url!.status,
      expirationDate: url!.expirationDate?.toISOString() ?? "",
    });

    const baseUrl = serverConfig.BASE_URL;
    const fullUrl = `${baseUrl}/${url!.shortUrl}`;

    return {
      id: url!._id?.toString(),
      fullUrl,
      shortUrl: url!.shortUrl,
      originalUrl: urlData.originalUrl,
      tags: urlData.tags,
      expirationDate: urlData.expirationDate,
      clicks: url!.clicks,
      createdAt: url!.createdAt,
      updatedAt: url!.updatedAt,
    };
  }

  async getOriginalUrl(shortUrl: string) {
    const cacheData = await this.cacheRepository.getUrlMapping(shortUrl);

    if (cacheData) {

      if (cacheData.status && cacheData.status !== UrlStatus.ACTIVE) {
        throw new NotFoundError("Url not found");
      }

      // if(cacheData.expirationDate && new Date(cacheData.expirationDate) < new Date()){
      //   throw new NotFoundError("Url not found");
      // }

      return {
        originalUrl: cacheData.originalUrl,
        shortUrl,
        urlId: cacheData.urlId,
        status: cacheData.status,
        expirationDate: cacheData.expirationDate,
      };
    }

    const url = await this.urlRepository.findByShortUrl(shortUrl);

    if (!url) {
      throw new NotFoundError("Url not found");
    }

    if (url.status !== UrlStatus.ACTIVE) {
      throw new NotFoundError("Url not found");
    }
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

  async getAllUrlsOfUser(userId: string, options: {
    search?: string;
    status?: UrlStatus;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const [urls, total] = await Promise.all([
      this.urlRepository.getUrlsOfUser(userId, options),
      this.urlRepository.countUrlsOfUser(userId, options),
    ]);

    const baseUrl = serverConfig.BASE_URL;

    const formattedUrls = urls.map((url) => {
      return {
        id: url._id?.toString(),
        originalUrl: url.originalUrl,
        shortUrl: url.shortUrl,
        fullUrl: `${baseUrl}/${url.shortUrl}`,
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

  async updateUrl(id: string, data: Partial<IUrl>, userId: string) {
    // console.log("Updating URL with data:", { id, data, userId });

    if (data.shortUrl) {
      throw new ForbiddenError("Short URL cannot be updated");
    }

    const existingUrl = await this.urlRepository.findById(id);

    if (!existingUrl) {
      throw new NotFoundError("Url not found");
    }

    if (!existingUrl.userId || existingUrl.userId.toString() !== userId) {
      throw new ForbiddenError("You do not have permission to update this URL");
    }

    if (existingUrl.status === UrlStatus.DELETED) {
      throw new NotFoundError("Url not found");
    }

    if (existingUrl.status === UrlStatus.EXPIRED) {
      throw new BadRequestError("Expired URL cannot be updated");
    }

    if (data.expirationDate && new Date(data.expirationDate) < new Date()) {
      throw new BadRequestError("Expiration date cannot be in the past");
    }



    const updatedUrl = await this.urlRepository.updateUrl(id, data);

    if (!updatedUrl) {
      throw new NotFoundError("Url not found");
    }

    // if status changed to inactive then remove that from cache
    if (updatedUrl.status !== UrlStatus.ACTIVE) {
      await this.cacheRepository.deleteUrlMapping(updatedUrl.shortUrl);
    } else if (data.originalUrl) {
      await this.cacheRepository.setUrlMapping({
        shortUrl: updatedUrl.shortUrl,
        originalUrl: updatedUrl.originalUrl,
        urlId: updatedUrl._id?.toString(),
        status: updatedUrl.status,
        expirationDate: updatedUrl.expirationDate?.toISOString() ?? "",
      });
    }

    return {
      id: updatedUrl._id?.toString(),
      originalUrl: updatedUrl.originalUrl,
      shortUrl: updatedUrl.shortUrl,
      clicks: updatedUrl.clicks,
      tags: updatedUrl.tags,
      status: updatedUrl.status,
      expirationDate: updatedUrl.expirationDate,
      createdAt: updatedUrl.createdAt,
      updatedAt: updatedUrl.updatedAt,
    };
  }

  async deleteUrl(id: string, userId: string) {
    const existingUrl = await this.urlRepository.findById(id);

    if (!existingUrl) {
      throw new NotFoundError("Url not found");
    }

    if (!existingUrl.userId || existingUrl.userId.toString() !== userId) {
      throw new ForbiddenError("You do not have permission to delete this URL");
    }

    await this.analyticsRepository.deleteAnalyticsByUrlId(id);
    await this.urlRepository.updateUrl(id, { status: UrlStatus.DELETED });
    await this.cacheRepository.deleteUrlMapping(existingUrl.shortUrl);

    return;
  }
}
