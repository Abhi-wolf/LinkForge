import { NextFunction, Request, Response } from "express";
import { AnyZodObject } from "zod";
import logger from "../config/logger.config";

/**
 *
 * @param schema - Zod schema to validate the request body
 * @returns - Middleware function to validate the request body
 */
export const validateRequestBody = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      logger.info("Request body validation started", {
        event: "REQUEST_VALIDATION_START",
        path: req.path,
        method: req.method
      });
      await schema.parseAsync(req.body);
      
      logger.info("Request body validation passed", {
        event: "REQUEST_VALIDATION_SUCCESS",
        path: req.path,
        method: req.method
      });
      
      next();
    } catch (error) {
      // If the validation fails,
      logger.error("Request body validation failed", {
        event: "REQUEST_VALIDATION_FAILED",
        path: req.path,
        method: req.method,
        err: error instanceof Error ? error : undefined
      });
      res.status(400).json({
        message: "Invalid request body",
        success: false,
        error: error,
      });
    }
  };
};

/**
 *
 * @param schema - Zod schema to validate the request body
 * @returns - Middleware function to validate the request query params
 */
export const validateQueryParams = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync(req.query);
      next();
    } catch (error) {
      // If the validation fails,

      res.status(400).json({
        message: "Invalid query params",
        success: false,
        error: error,
      });
    }
  };
};
