import { serverConfig } from "./index";

export const serverSettings = {
  port: serverConfig.PORT,
  timeout: serverConfig.SERVER_TIMEOUT,
  keepAliveTimeout: serverConfig.KEEP_ALIVE_TIMEOUT,
  headersTimeout: serverConfig.HEADERS_TIMEOUT,
  maxConnections: serverConfig.MAX_CONNECTIONS,
  cors: {
    origin: serverConfig.CORS_ORIGINS.split(","),
    credentials: true,
  },
  healthCheck: {
    timeout: serverConfig.HEALTH_CHECK_TIMEOUT,
  },
};
