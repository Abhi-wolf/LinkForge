import { Application } from "express";
import client from "prom-client";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { trpcRouter } from "../routers/trpc";
import { createContext } from "../routers/trpc/trpc";
import { redirectUrl } from "../controllers/url.controller";
import {
  analyticsDeadLetterQueue,
  analyticsQueue,
} from "../queues/analytics.queue";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

export function setupRoutes(app: Application): void {
  // tRPC routes
  app.use(
    "/trpc",
    createExpressMiddleware({
      router: trpcRouter,
      createContext,
    }),
  );

  const collectDefaultMetrics = client.collectDefaultMetrics;
  collectDefaultMetrics({ register: client.register });

  // Bull Board UI for queue monitoring
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/ui");

  createBullBoard({
    queues: [
      new BullMQAdapter(analyticsQueue),
      new BullMQAdapter(analyticsDeadLetterQueue),
    ],
    serverAdapter,
  });

  app.use("/ui", serverAdapter.getRouter());

  // observability routes
  app.get("/metrics", async (req, res) => {
    res.set("Content-Type", client.register.contentType);
    res.end(await client.register.metrics());
  });

  // URL redirect route
  app.get("/fwd/:shortUrl", redirectUrl);
}
