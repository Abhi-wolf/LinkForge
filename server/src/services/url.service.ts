import { serverConfig } from "../config";
import { CreateUrlDto } from "../dtos/url.dto";
import { IUrl, UrlStatus } from "../models/url.model";
import { AnalyticsRepository } from "../repositories/analytics.repository";
import { CacheRepository } from "../repositories/cache.repository";
import { UrlRepository } from "../repositories/url.repository";
import { toBase62 } from "../utils/base62";
import { ForbiddenError, NotFoundError } from "../utils/errors/app.error";

export class UrlService {
  constructor(
    private readonly urlRepository: UrlRepository,
    private readonly cacheRepository: CacheRepository,
    private readonly analyticsRepository: AnalyticsRepository,
  ) {}

  async createShortUrl(urlData: CreateUrlDto, userId?: string) {
    let shortUrl: string;
    let url;

    while (true) {
      const nextId = await this.cacheRepository.getNextId();

      shortUrl = toBase62(nextId);

      // Check if the generated short URL already exists (unlikely but possible)
      const existingUrl = await this.urlRepository.findByShortUrl(shortUrl);

      if (existingUrl) {
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

    await this.cacheRepository.setUrlMapping(shortUrl, urlData.originalUrl);

    const baseUrl = serverConfig.BASE_URL;
    const fullUrl = `${baseUrl}/${shortUrl}`;

    return {
      id: url._id?.toString(),
      fullUrl,
      shortUrl,
      originalUrl: urlData.originalUrl,
      tags: urlData.tags,
      expirationDate: urlData.expirationDate,
      clicks: url.clicks,
      createdAt: url.createdAt,
      updatedAt: url.updatedAt,
    };
  }

  async getOriginalUrl(shortUrl: string) {
    const originalUrl = await this.cacheRepository.getUrlMapping(shortUrl);

    if (originalUrl) {
      // await this.urlRepository.incrementClicks(shortUrl);
      return {
        originalUrl,
        shortUrl,
      };
    }

    const url = await this.urlRepository.findByShortUrl(shortUrl);

    if (!url) {
      throw new NotFoundError("Url not found");
    }

    if (url.status !== UrlStatus.ACTIVE) {
      throw new NotFoundError("Url not found");
    }
    await this.cacheRepository.setUrlMapping(shortUrl, url.originalUrl);

    return {
      originalUrl: url.originalUrl,
      shortUrl: url.shortUrl,
    };
  }

  async incrementClicks(shortUrl: string) {
    await this.urlRepository.incrementClicks(shortUrl);
    return;
  }

  async getAllUrlsOfUser(userId: string) {
    const urls = await this.urlRepository.getUrlsOfUser(userId);
    const baseUrl = serverConfig.BASE_URL;

    return urls.map((url) => {
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
  }

  async updateUrl(id: string, data: Partial<IUrl>, userId: string) {
    console.log("Updating URL with data:", { id, data, userId });

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

    if (data.status === UrlStatus.DELETED) {
      throw new NotFoundError("Url not found");
    }

    const updatedUrl = await this.urlRepository.updateUrl(id, data);

    if (!updatedUrl) {
      throw new NotFoundError("Url not found");
    }

    // if status changed to inactive then remove that from cache
    if (updatedUrl.status !== UrlStatus.ACTIVE) {
      await this.cacheRepository.deleteUrlMapping(updatedUrl.shortUrl);
    } else if (data.originalUrl) {
      await this.cacheRepository.setUrlMapping(
        updatedUrl.shortUrl,
        data.originalUrl,
      );
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
