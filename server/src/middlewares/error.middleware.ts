import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/errors/app.error";
import logger from "../config/logger.config";

export const appErrorHandler = (err: AppError, req: Request, res: Response, next: NextFunction) => {
    const correlationId = req.headers['x-correlation-id'] as string;
    const requestMetadata = (req as any).requestMetadata;
    const duration = requestMetadata ? Date.now() - requestMetadata.startTime : undefined;

    logger.warn("Application error handled", {
        event: "REQUEST_APP_ERROR",
        correlationId,
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: err.statusCode,
        duration,
        userId: (req as any).user?.userId,
        err: err instanceof Error ? err : undefined
    });

    res.status(err.statusCode).json({
        success: false,
        message: err.message,
        correlationId // Include correlation ID in response for client tracking
    });
}

export const genericErrorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
    const correlationId = req.headers['x-correlation-id'] as string;
    const requestMetadata = (req as any).requestMetadata;
    const duration = requestMetadata ? Date.now() - requestMetadata.startTime : undefined;

    logger.error("Generic error handled", {
        event: "REQUEST_GENERIC_ERROR",
        correlationId,
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: 500,
        duration,
        userId: (req as any).user?.userId,
        err: err instanceof Error ? err : undefined
    });

    res.status(500).json({
        success: false,
        message: "Internal Server Error",
        correlationId // Include correlation ID in response for client tracking
    });
}