import { Request, Response, NextFunction } from "express";
import { ApiKeyService } from "../services/apiKey.service";
import { ApiKeyRepository } from "../repositories/apiKey.repository";
import logger from "../config/logger.config";

const apiKeyService = new ApiKeyService(new ApiKeyRepository());

export async function apiKeyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    res.status(401).json({ message: "API key is required" });
    return;
  }

  try {
    const apiKeyData = await apiKeyService.verifyApiKey(apiKey as string);

    if (!apiKeyData) {
      res.status(401).json({ message: "Invalid API key" });
      return;
    }

    (req as any).user = apiKeyData.userId;

    next();
  } catch (error) {
    logger.error("API key verification failed:", error);
    res.status(500).json({ message: "Internal server error" });
  }
}
