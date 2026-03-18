import Url, { IUrl, UrlStatus } from "../models/url.model";

export interface CreateUrl {
  originalUrl: string;
  shortUrl: string;
  tags?: string[];
  expirationDate?: Date;
  userId?: string;
}

export interface UrlStats {
  id: string;
  originalUrl: string;
  shortUrl: string;
  clicks: number;
  tags: string[];
  expirationDate: Date | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class UrlRepository {
  async create(data: CreateUrl): Promise<IUrl> {
    const url = Url.create(data);
    return url;
  }

  async updateUrl(id: string, data: Partial<IUrl>): Promise<IUrl | null> {
    const updatedUrl = await Url.findOneAndUpdate({ _id: id }, data, {
      new: true,
    });
    return updatedUrl;
  }

  async deleteUrl(id: string): Promise<void> {
    await Url.deleteOne({ _id: id });
    return;
  }

  async findByShortUrl(shortUrl: string): Promise<IUrl | null> {
    const url = await Url.findOne({
      shortUrl,
      status: { $ne: UrlStatus.DELETED },
    });
    return url;
  }

  async findById(id: string): Promise<IUrl | null> {
    const url = await Url.findOne({
      _id: id,
      status: { $ne: UrlStatus.DELETED },
    });
    return url;
  }

  async findAll() {
    const urls = await Url.find().select({
      _id: 1,
      originalUrl: 1,
      shortUrl: 1,
      clicks: 1,
      tags: 1,
      status: 1,
      expirationDate: 1,
      createdAt: 1,
      updatedAt: 1,
    });

    return urls;
  }

  async incrementClicks(shortUrl: string): Promise<void> {
    await Url.findOneAndUpdate(
      { shortUrl },
      {
        $inc: { clicks: 1 },
      },
    );

    return;
  }

  async findStatsByShortUrl(shortUrl: string): Promise<UrlStats | null> {
    const url = await Url.findOne({
      shortUrl,
      status: { $ne: UrlStatus.DELETED },
    });

    if (!url) {
      return null;
    }

    return {
      id: url._id.toString(),
      shortUrl: url.shortUrl,
      originalUrl: url.originalUrl,
      clicks: url.clicks,
      tags: url.tags,
      status: url.status,
      expirationDate: url.expirationDate,
      createdAt: url.createdAt,
      updatedAt: url.updatedAt,
    };
  }

  async getUrlsOfUser(userId: string) {
    const urls = await Url.find({ userId, status: { $ne: UrlStatus.DELETED } });

    return urls;
  }
}
