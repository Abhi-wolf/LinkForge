import mongoose from "mongoose";
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
    await mongoose.connect(serverConfig.DB_URL, mongooseConfig);
    logger.info("Connected to database");
  } catch (error) {
    logger.error("Error connecting to database", error);
  }
}

export async function disconnectDB() {
  try {
    await mongoose.connection.close();
    logger.info("Disconnected from database");
  } catch (error) {
    logger.error("Error disconnecting from database", error);
  }
}

export async function checkMongo(): Promise<boolean> {
  try {
    if (mongoose.connection.readyState !== 1) {
      return false;
    }

    await mongoose.connection.db?.admin().ping();

    return true;
  } catch (error) {
    logger.error("Mongo health check failed", error)
    return false;
  }
}
