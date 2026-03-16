import { analyticsRouter } from "./analytics";
import { router } from "./context";
import { urlRouter } from "./url";

export const trpcRouter = router({
  url: urlRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof trpcRouter;
