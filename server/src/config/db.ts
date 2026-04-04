import mongoose from "mongoose";
import { HourlyAggregatedAnalytics } from "../models/analytics.model";
import logger from "./logger.config";
import { serverConfig } from ".";

const mongooseConfig = {
  maxPoolSize: 10,
  minPoolSize: 2,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
  retryWrites: true
}

export async function connectDB() {
  try {
    logger.info("Attempting to connect to MongoDB", {
      event: "DB_CONNECT_ATTEMPT",
      url: serverConfig.DB_URL.replace(/\/\/.*@/, "//***:***@") // Mask credentials
    });
    
    await mongoose.connect(serverConfig.DB_URL, mongooseConfig);
    
    logger.info("MongoDB connection established, syncing indexes", {
      event: "DB_SYNC_INDEXES_START"
    });
    
    await HourlyAggregatedAnalytics.syncIndexes();
    
    logger.info("Database connection and index sync completed successfully", {
      event: "DB_CONNECT_SUCCESS",
      readyState: mongoose.connection.readyState
    });
  } catch (error) {
    logger.error("Database connection failed", {
      event: "DB_CONNECT_FAILED",
      err: error instanceof Error ? error : undefined
    });
    throw error;
  }
}

export async function disconnectDB() {
  try {
    logger.info("Disconnecting from database", {
      event: "DB_DISCONNECT_START",
    });
    
    await mongoose.connection.close();
    
    logger.info("Database disconnected successfully", {
      event: "DB_DISCONNECT_SUCCESS"
    });
  } catch (error) {
    logger.error("Database disconnection failed", {
      event: "DB_DISCONNECT_FAILED",
      err: error instanceof Error ? error : undefined
    });
  }
}

export async function checkMongo(): Promise<boolean> {
  try {
    if (mongoose.connection.readyState !== 1) {
      logger.warn("MongoDB not ready for health check", {
        event: "DB_HEALTH_NOT_READY",
        readyState: mongoose.connection.readyState
      });
      return false;
    }

    logger.debug("Performing MongoDB health check", {
      event: "DB_HEALTH_CHECK_START"
    });

    await mongoose.connection.db?.admin().ping();

    logger.debug("MongoDB health check passed", {
      event: "DB_HEALTH_CHECK_SUCCESS"
    });

    return true;
  } catch (error) {
    logger.error("MongoDB health check failed", {
      event: "DB_HEALTH_CHECK_FAILED",
      err: error instanceof Error ? error : undefined
    });
    return false;
  }
}
