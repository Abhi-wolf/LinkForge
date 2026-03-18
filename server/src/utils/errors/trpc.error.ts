import { TRPCError } from "@trpc/server";
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from "./app.error";

export function handleAppError(error: any): never {
  if (error instanceof UnauthorizedError) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: error.message,
    });
  }
  if (error instanceof BadRequestError) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: error.message,
    });
  }
  if (error instanceof NotFoundError) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: error.message,
    });
  }
  if (error instanceof ForbiddenError) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: error.message,
    });
  }
  if (error instanceof ConflictError) {
    throw new TRPCError({
      code: "CONFLICT",
      message: error.message,
    });
  }

  // Fallback for generic errors
  console.error("Unhandle Error:", error);
  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: error instanceof Error ? error.message : "An unexpected error occurred",
    cause: error,
  });
}
