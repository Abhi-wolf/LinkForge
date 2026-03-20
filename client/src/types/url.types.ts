export enum UrlStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
  DELETED = "deleted",
  EXPIRED = "expired",
}

export type ShortLink = {
  id: string;
  originalUrl: string;
  shortUrl: string;
  alias?: string;
  createdAt: string | Date;
  expirationDate?: string | Date | null;
  clicks: number;
  status: string;
  tags?: string[];
  fullUrl: string;
};
