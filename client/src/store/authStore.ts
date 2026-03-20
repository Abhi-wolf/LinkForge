import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AuthState {
  isAuthenticated: boolean;
  // user: { id: string; email: string; name: string } | null;
  refreshToken: string | null;
  setRefreshToken: (token: string) => void;
  login: (data: {
    // user: { id: string; email: string; name: string };
    refreshToken: string;
  }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      refreshToken: null,

      setRefreshToken: (token) => set({ refreshToken: token }),

      login: (data) =>
        set({
          isAuthenticated: true,
          // user: data.user,
          refreshToken: data.refreshToken,
        }),

      logout: () =>
        set({
          isAuthenticated: false,
          // user: null,
          refreshToken: null,
        }),
    }),
    {
      name: "auth",
      storage: createJSONStorage(() => sessionStorage), // 👈 sessionStorage
      // 👇 only persist what's needed — don't persist sensitive data unnecessarily
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        // user: state.user,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);
