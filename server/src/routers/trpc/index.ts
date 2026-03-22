import { authController } from "../../controllers/auth.controller";
import { analyticsRouter } from "./analytics";
import { apiKeyRouter } from "./apiKey";
import { router } from "./context";
import { urlRouter } from "./url";

export const trpcRouter = router({
  url: urlRouter,
  auth: authController,
  analytics: analyticsRouter,
  apiKey: apiKeyRouter,
});

export type AppRouter = typeof trpcRouter;
