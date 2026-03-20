import { UrlStatus } from "../models/url.model";

export interface CreateUrlDto {
  originalUrl: string;
  tags?: string[];
  expirationDate?: Date;
}


export interface IUrlCachDto {
  shortUrl: string;
  originalUrl: string;
  urlId: string;
  status: UrlStatus;
  expirationDate: string;
}