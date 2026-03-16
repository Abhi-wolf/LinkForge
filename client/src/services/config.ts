export const serverConfig = {
  VITE_TRPC_URL: import.meta.env.VITE_TRPC_URL || "http://localhost:4000/trpc",
  VITE_BASE_URL: import.meta.env.VITE_BASE_URL,
};
