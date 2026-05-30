import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import api, { setSessionExpiredHandler, tokenStore } from "../api/axios";
import type { User } from "../types/message";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  /** True once we've checked localStorage + /me on mount. */
  ready: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  const refreshMe = useCallback(async () => {
    try {
      const res = await api.get<User>("/me");
      setUser(res.data);
    } catch {
      setUser(null);
    }
  }, []);

  // Bootstrap: if token in storage → fetch /me, else show login
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (tokenStore.getAccess()) {
        try {
          const res = await api.get<User>("/me");
          if (!cancelled) setUser(res.data);
        } catch {
          if (!cancelled) {
            tokenStore.clear();
            setUser(null);
          }
        }
      }
      if (!cancelled) setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // When axios decides session is dead → drop user state
  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await api.post<AuthResponse>("/auth/login", {
        email,
        password,
        platform: "web",
      });
      tokenStore.set(res.data.accessToken, res.data.refreshToken);
      setUser(res.data.user);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(
    async (email: string, password: string, name: string) => {
      setLoading(true);
      try {
        const res = await api.post<AuthResponse>("/auth/register", {
          email,
          password,
          name,
          termsAccepted: true,
          privacyAccepted: true,
          platform: "web",
        });
        tokenStore.set(res.data.accessToken, res.data.refreshToken);
        setUser(res.data.user);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    const refresh = tokenStore.getRefresh();
    if (refresh) {
      try {
        await api.post("/auth/logout", { refreshToken: refresh });
      } catch {
        /* even if API fails, drop local state */
      }
    }
    tokenStore.clear();
    setUser(null);
  }, []);

  return createElement(
    AuthContext.Provider,
    { value: { user, loading, ready, login, register, logout, refreshMe } },
    children,
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
