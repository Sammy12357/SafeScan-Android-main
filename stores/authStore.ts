import * as SecureStore from "expo-secure-store";
import { create } from "zustand";
import { api, clearApiTokens, setApiTokens, type User } from "@/services/api";
import { roleForEmail } from "@/constants/config";

const AUTH_TOKEN_KEY = "auth_token";
const REFRESH_TOKEN_KEY = "refresh_token";

type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
};

type AuthStore = AuthState & {
  loginWithGoogle: (idToken: string) => Promise<void>;
  logout: () => Promise<void>;
  hydrateFromStorage: () => Promise<void>;
  setUser: (user: User) => void;
};

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

function normalizeUser(user: User): User {
  return { ...user, role: roleForEmail(user.email) };
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  ...initialState,
  loginWithGoogle: async (idToken) => {
    set({ isLoading: true, error: null });
    try {
      const result = await api.auth.verifyToken(idToken);
      await Promise.all([
        SecureStore.setItemAsync(AUTH_TOKEN_KEY, result.accessToken),
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, result.refreshToken)
      ]);
      setApiTokens({ accessToken: result.accessToken, refreshToken: result.refreshToken });
      set({
        user: normalizeUser(result.user),
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "SafeScan sign-in failed.";
      clearApiTokens();
      await Promise.all([
        SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
      ]);
      set({ ...initialState, isLoading: false, error: message });
      throw error;
    }
  },
  logout: async () => {
    clearApiTokens();
    await Promise.all([
      SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY)
    ]);
    set({ ...initialState, isLoading: false });
  },
  hydrateFromStorage: async () => {
    set({ isLoading: true, error: null });
    const token = await SecureStore.getItemAsync(AUTH_TOKEN_KEY);
    if (!token) {
      clearApiTokens();
      set({ ...initialState, isLoading: false });
      return;
    }

    const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    setApiTokens({ accessToken: token, refreshToken: refreshToken ?? token });

    try {
      const profile = await api.user.profile();
      set({
        user: normalizeUser(profile),
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
    } catch {
      await get().logout();
    }
  },
  setUser: (user) => {
    set({ user: normalizeUser(user) });
  }
}));
