import { create } from 'zustand'

interface AuthState {
    isAuthenticated: boolean;
    user: { name: string; email: string } | null;
    login: (email: string) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    isAuthenticated: false,
    user: null,
    login: (email: string) => set({
        isAuthenticated: true,
        user: { name: 'Demo User', email }
    }),
    logout: () => set({ isAuthenticated: false, user: null }),
}))
