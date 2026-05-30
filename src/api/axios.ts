import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:5126/api",
  withCredentials: false,
});

// ----- Token storage helpers (localStorage) -----

const ACCESS_KEY = "scango.accessToken";
const REFRESH_KEY = "scango.refreshToken";

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS_KEY, access);
    localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

// ----- Attach bearer token on every request -----

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ----- 401 → try refresh once, else logout -----

let refreshInFlight: Promise<string | null> | null = null;
let onSessionExpired: (() => void) | null = null;

export function setSessionExpiredHandler(handler: () => void) {
  onSessionExpired = handler;
}

async function doRefresh(): Promise<string | null> {
  const refresh = tokenStore.getRefresh();
  if (!refresh) return null;
  try {
    const res = await axios.post(
      `${api.defaults.baseURL}/auth/refresh`,
      { refreshToken: refresh, platform: "web" },
    );
    const { accessToken, refreshToken } = res.data as {
      accessToken: string;
      refreshToken: string;
    };
    tokenStore.set(accessToken, refreshToken);
    return accessToken;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as
      | (InternalAxiosRequestConfig & { _retried?: boolean })
      | undefined;

    if (
      error.response?.status !== 401 ||
      !original ||
      original._retried ||
      original.url?.includes("/auth/refresh") ||
      original.url?.includes("/auth/login") ||
      original.url?.includes("/auth/register")
    ) {
      return Promise.reject(error);
    }

    original._retried = true;
    refreshInFlight ??= doRefresh().finally(() => {
      refreshInFlight = null;
    });
    const newToken = await refreshInFlight;

    if (!newToken) {
      tokenStore.clear();
      onSessionExpired?.();
      return Promise.reject(error);
    }

    original.headers.Authorization = `Bearer ${newToken}`;
    return api(original);
  },
);

export default api;
