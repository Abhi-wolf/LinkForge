import mongoose from "mongoose";
import logger from "./logger.config";
import { serverConfig } from ".";

export async function connectDB() {
  try {
    await mongoose.connect(serverConfig.DB_URL);
    logger.info("Connected to database");
  } catch (error) {
    logger.error("Error connecting to database");
    process.exit(1);
  }
}

export async function disconnectDB() {
  try {
    await mongoose.disconnect();
    logger.info("Disconnected from database");
  } catch (error) {
    logger.error("Error disconnecting from database");
    process.exit(1);
  }
}

export async function checkMongo(): Promise<boolean> {
  try {
    if (mongoose.connection.readyState !== 1) {
      return false;
    }

    // Optional deeper check (can remove if not needed)
    await mongoose.connection.db?.admin().ping();

    return true;
  } catch {
    return false;
  }
}
