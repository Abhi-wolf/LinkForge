import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "./components/theme-provider";
import { Toaster } from "./components/ui/sonner";

// Pages
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import EmailVerification from "./pages/EmailVerification";
import DashboardLayout from "./pages/Dashboard/DashboardLayout";
import DashboardOverview from "./pages/Dashboard/DashboardOverview";
import MyLinks from "./pages/Dashboard/MyLinks";
import Analytics from "./pages/Dashboard/Analytics";
import Settings from "./pages/Dashboard/Settings";

// Store
import { useAuthStore } from "./store/authStore";
import { useState } from "react";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "../../server/src/routers/trpc";
import { TRPCProvider } from "./services/trpc";
// import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { serverConfig } from "./services/config";
import { refreshTokenFunc } from "./services/refreshTokenService";
import ApiKeys from "./pages/Dashboard/ApiKeys";

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid refetching immediately on the client
        staleTime: 60 * 1000,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

function getQueryClient() {
  if (typeof window === "undefined") {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}

// Auth Guard
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/verify-email",
    element: <EmailVerification />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard/overview" replace />,
      },
      {
        path: "overview",
        element: <DashboardOverview />,
      },
      {
        path: "links",
        element: <MyLinks />,
      },
      {
        path: "analytics/:id",
        element: <Analytics />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "api-keys",
        element: <ApiKeys />,
      },
    ],
  },
]);

function App() {
  const queryClient = getQueryClient();

  const [trpcClient] = useState(() =>
    createTRPCClient<AppRouter>({
      links: [
        httpBatchLink({
          url: serverConfig.VITE_TRPC_URL,
          fetch: async (url, options) => {
            const res = await fetch(url, {
              ...options,
              credentials: "include",
            });

            if (res.status === 401) {
              const { refreshToken, setRefreshToken } = useAuthStore.getState();

              // console.log("Unauthorized request", refreshToken);
              if (!refreshToken) {
                // console.error("No refresh token");
                return res;
              }

              const response = await refreshTokenFunc(refreshToken);
              console.log("Refresh response", response);
              if (response.success) {
                setRefreshToken(response.refreshToken);
                return fetch(url, {
                  ...options,
                  credentials: "include",
                });
              } else {
                // ✅ Refresh failed — redirect to login
                window.location.href = "/login";
                console.error("Refresh failed");
                return res;
              }
            }
            return res;
          },
        }),
      ],
    }),
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
          <RouterProvider router={router} />
          <Toaster />
        </TRPCProvider>

        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
