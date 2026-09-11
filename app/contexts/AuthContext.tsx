"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getCurrentUser, type CbhUser } from "../lib/api";
import { clearAuthToken, getAuthToken } from "../lib/auth";

interface AuthContextValue {
  user: CbhUser | null;
  loading: boolean;
  loggedIn: boolean;
  refresh: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  loggedIn: false,
  refresh: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CbhUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getAuthToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      // getCurrentUser() only ever resolves null on a genuine 401/403 -
      // anything else (network blip, 500) throws and is swallowed below,
      // keeping whatever session state we already had. The user should
      // only ever be logged out by getCurrentUser() confirming the token
      // is dead, or by pressing "Đăng xuất" (see logout() below).
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Failed to load current user:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // The only path that intentionally signs the user out - clears the
  // shared cookie so the main site sees the same logged-out state, and
  // immediately updates local state rather than waiting on a refetch.
  const logout = useCallback(() => {
    clearAuthToken();
    setUser(null);
  }, []);

  useEffect(() => {
    refresh();

    // The shared auth_token cookie can appear/disappear from an action on
    // *another* CBH tab (e.g. logging in/out on the main site in a
    // different tab) - re-check whenever this tab regains focus so the
    // header doesn't keep showing a stale logged-out/logged-in state.
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  return (
    <AuthContext.Provider
      value={{ user, loading, loggedIn: !!user, refresh, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
