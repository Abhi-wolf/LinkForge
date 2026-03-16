import { createTRPCContext } from "@trpc/tanstack-react-query";
import type { AppRouter } from "../../../../server/src/routers/trpc/index";

export const { TRPCProvider, useTRPC, useTRPCClient } =
  createTRPCContext<AppRouter>();
