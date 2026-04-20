import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { API_BASE, apiGet, apiPost } from "../lib/api";
import { User } from "../types";

interface MeResponse {
  authenticated: boolean;
  user: User | null;
}

interface AuthStatusResponse {
  googleConfigured: boolean;
}

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  googleAuthEnabled: boolean;
  refresh: () => Promise<void>;
  loginUrl: string;
  devLogin: (email: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [googleAuthEnabled, setGoogleAuthEnabled] = useState(false);

  const refresh = async () => {
    try {
      const data = await apiGet<MeResponse>("/api/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const loadAuthStatus = async () => {
    try {
      const status = await apiGet<AuthStatusResponse>("/api/auth/status");
      setGoogleAuthEnabled(status.googleConfigured);
    } catch {
      setGoogleAuthEnabled(false);
    }
  };

  useEffect(() => {
    void Promise.all([refresh(), loadAuthStatus()]);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      googleAuthEnabled,
      refresh,
      loginUrl: `${API_BASE}/api/auth/google`,
      devLogin: async (email: string, name: string) => {
        await apiPost("/api/auth/dev-login", { email, name });
        await refresh();
      },
    }),
    [user, loading, googleAuthEnabled],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return value;
}
