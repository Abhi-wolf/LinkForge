import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface AuthState {
  isAuthenticated: boolean;
  user: { id: string; email: string; name: string } | null;
  accessToken: string | null;
  // 👇 removed refreshToken — it lives in httpOnly cookie now
  setAccessToken: (token: string) => void;
  login: (data: {
    user: { id: string; email: string; name: string };
    accessToken: string;
  }) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      accessToken: null,

      setAccessToken: (token) => set({ accessToken: token }),

      login: (data) =>
        set({
          isAuthenticated: true,
          user: data.user,
          accessToken: data.accessToken,
        }),

      logout: () =>
        set({
          isAuthenticated: false,
          user: null,
          accessToken: null,
        }),
    }),
    {
      name: "auth",
      storage: createJSONStorage(() => sessionStorage), // 👈 sessionStorage
      // 👇 only persist what's needed — don't persist sensitive data unnecessarily
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accessToken: state.accessToken,
      }),
    },
  ),
);
