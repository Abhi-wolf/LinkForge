// import winston from "winston";
// import { getCorrelationId } from "../utils/helpers/request.helpers";
// import DailyRotateFile from "winston-daily-rotate-file";
// import { serverConfig } from ".";

// const logger = winston.createLogger({
//   level: "info",
//   format: winston.format.combine(
//     winston.format.timestamp({ format: "MM-DD-YYYY HH:mm:ss" }),
//     winston.format.errors({ stack: true }),
//     winston.format.printf((info) => {
//       const { timestamp, level, message, stack } = info;
//       const payload: Record<string, unknown> = {
//         timestamp,
//         level,
//         message,
//         correlationId: getCorrelationId(),
//       };
//       if (serverConfig.NODE_ENV === "development" && stack) {
//         payload.stack = stack;
//       }
//       // for (const [key, value] of Object.entries(rest)) {
//       //   if (key === "splat" || value === undefined) {
//       //     continue;
//       //   }
//       //   payload[key] = value;
//       // }
//       return JSON.stringify(payload);
//     }),
//   ),
//   transports: [
//     new winston.transports.Console(),
//     new DailyRotateFile({
//       filename: "logs/%DATE%-app.log",
//       datePattern: "YYYY-MM-DD",
//       maxSize: "20m",
//       maxFiles: "14d",
//     }),
//   ],
// });

// export default logger;


import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { getCorrelationId } from "../utils/helpers/request.helpers";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  defaultMeta: {
    service: "url-shortener",
    environment: process.env.NODE_ENV || "development",
  },
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DDTHH:mm:ss.SSSZ" }),
    winston.format.errors({ stack: true }),
    winston.format.printf((info) => {
      const { timestamp, level, message, stack, component, subComponent, ...rest } = info;

      const payload: Record<string, unknown> = {
        timestamp,
        level,
        message,
        correlationId: getCorrelationId(),
        component: component || "general",
        ...rest,
      };

      if (subComponent) {
        payload.subComponent = subComponent;
      }

      // Always log stack — keep it out of HTTP responses, not out of logs
      if (stack) {
        payload.stack = stack;
      }

      return JSON.stringify(payload);
    }),
  ),
  transports: [
    new winston.transports.Console(),
    new DailyRotateFile({
      filename: "logs/%DATE%-app.log",
      datePattern: "YYYY-MM-DD",
      maxSize: "20m",
      maxFiles: "14d",
    }),
  ],
});

/**
 * Creates a child logger with fixed component and subComponentType tags.
 */
export const createContextLogger = (component: string, subComponentType: string) => {
  return {
    info: (functionName: string, message: string, meta?: Record<string, unknown>) => 
      logger.info(message, { ...meta, component, subComponent: `${subComponentType}:${functionName}` }),
    error: (functionName: string, message: string, meta?: Record<string, unknown>) => 
      logger.error(message, { ...meta, component, subComponent: `${subComponentType}:${functionName}` }),
    warn: (functionName: string, message: string, meta?: Record<string, unknown>) => 
      logger.warn(message, { ...meta, component, subComponent: `${subComponentType}:${functionName}` }),
    debug: (functionName: string, message: string, meta?: Record<string, unknown>) => 
      logger.debug(message, { ...meta, component, subComponent: `${subComponentType}:${functionName}` }),
  };
};

export default logger;