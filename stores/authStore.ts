import { create } from "zustand";
import { roleForEmail, type UserRole } from "@/constants/config";
import { deleteSecureValue, getSecureJson, getSecureString, setSecureJson, setSecureString } from "@/services/storage";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  role?: UserRole;
  avatarUrl?: string;
};

type AuthStore = {
  session: string | null;
  user: UserProfile | null;
  isLoading: boolean;
  hydrate: () => Promise<void>;
  setSession: (jwt: string) => Promise<void>;
  setUser: (user: UserProfile) => Promise<void>;
  clearAuth: () => Promise<void>;
  isAuthenticated: () => boolean;
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  user: null,
  isLoading: true,
  hydrate: async () => {
    const [session, user] = await Promise.all([
      getSecureString("safescan_session"),
      getSecureJson<UserProfile>("safescan_user")
    ]);
    set({ session, user: user ? { ...user, role: roleForEmail(user.email) } : null, isLoading: false });
  },
  setSession: async (jwt) => {
    await setSecureString("safescan_session", jwt);
    set({ session: jwt });
  },
  setUser: async (user) => {
    const normalizedUser = { ...user, role: roleForEmail(user.email) };
    await setSecureJson("safescan_user", normalizedUser);
    set({ user: normalizedUser });
  },
  clearAuth: async () => {
    set({ session: null, user: null });
    await Promise.all([
      deleteSecureValue("safescan_session"),
      deleteSecureValue("safescan_user"),
      deleteSecureValue("safescan_wallet")
    ]);
  },
  isAuthenticated: () => Boolean(get().session)
}));
