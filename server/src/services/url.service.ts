import { serverConfig } from "../config";
import { CreateUrlDto } from "../dtos/url.dto";
import { CacheRepository } from "../repositories/cache.repository";
import { UrlRepository } from "../repositories/url.repository";
import { toBase62 } from "../utils/base62";
import { NotFoundError } from "../utils/errors/app.error";

export class UrlService {
  constructor(
    private readonly urlRepository: UrlRepository,
    private readonly cacheRepository: CacheRepository,
  ) {}

  async createShortUrl(urlData: CreateUrlDto) {
    const nextId = await this.cacheRepository.getNextId();

    const shortUrl = toBase62(nextId);

    const url = await this.urlRepository.create({
      originalUrl: urlData.originalUrl,
      tags: urlData.tags,
      expirationDate: urlData.expirationDate,
      shortUrl: shortUrl,
      userId: "69b6e3b7329d6f7cf8bd16b4", // todo: get user id from auth context
    });

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

    // await this.urlRepository.incrementClicks(shortUrl);
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

  async getAllUrlsForUser() {
    const urls = await this.urlRepository.findAll();
    const baseUrl = serverConfig.BASE_URL;

    return urls.map((url) => {
      return {
        id: url._id?.toString(),
        originalUrl: url.originalUrl,
        shortUrl: url.shortUrl,
        fullUrl: `${baseUrl}/${url.shortUrl}`,
        clicks: url.clicks,
        tags: url.tags,
        status: url.status,
        expirationDate: url.expirationDate,
        createdAt: url.createdAt,
        updatedAt: url.updatedAt,
      };
    });
  }
}
