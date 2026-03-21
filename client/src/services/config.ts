export const serverConfig = {
  VITE_TRPC_URL: import.meta.env.VITE_TRPC_URL || "http://server:4000/trpc",   // for docker
  VITE_BASE_URL: import.meta.env.VITE_BASE_URL || "http://server:4000",  // for docker
};
