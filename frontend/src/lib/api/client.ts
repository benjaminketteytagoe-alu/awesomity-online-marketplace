import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '@/lib/storage';
import { ENDPOINTS } from './endpoints';
import type { ApiError } from './types';

/**
 * Base axios instance. Base URL is empty because:
 *  - Vite dev server proxies /api/* to localhost:8080
 *  - nginx in Docker proxies /api/* to backend:8080
 * Both cases use relative paths from the browser's origin.
 */
export const api = axios.create({
  baseURL: '',
  timeout: 20_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/* ---------------- Request interceptor: attach access token --------------- */

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStorage.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ---------------- Response interceptor: refresh on 401 ---------------- */

/**
 * Single-flight refresh: if multiple requests 401 at the same time,
 * only one refresh call goes out. Others wait on the same promise.
 */
let refreshPromise: Promise<string> | null = null;

async function performRefresh(): Promise<string> {
  const refreshToken = tokenStorage.getRefresh();
  if (!refreshToken) {
    throw new Error('NO_REFRESH_TOKEN');
  }

  // Use a bare axios call (not `api`) to avoid interceptor recursion.
  const { data } = await axios.post<{ accessToken: string; refreshToken?: string }>(
    ENDPOINTS.auth.refresh,
    { refreshToken },
  );

  // Backend returns new accessToken (and optionally a new refreshToken).
  if (data.refreshToken) {
    tokenStorage.set(data.accessToken, data.refreshToken);
  } else {
    tokenStorage.set(data.accessToken, refreshToken);
  }
  return data.accessToken;
}

/** Endpoints that should never trigger a refresh attempt. */
const NO_REFRESH_PATHS = [ENDPOINTS.auth.login, ENDPOINTS.auth.refresh, ENDPOINTS.auth.register];

function shouldSkipRefresh(url: string | undefined): boolean {
  if (!url) return false;
  return NO_REFRESH_PATHS.some((p) => url.includes(p));
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;

    // Only handle 401. Only retry once per request.
    if (status !== 401 || original._retry || shouldSkipRefresh(original.url)) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      refreshPromise ??= performRefresh().finally(() => {
        refreshPromise = null;
      });
      const newAccessToken = await refreshPromise;

      // Retry the original request with the new token.
      original.headers = {
        ...original.headers,
        Authorization: `Bearer ${newAccessToken}`,
      };
      return api(original);
    } catch {
      // Refresh failed — clear tokens and force re-login.
      tokenStorage.clear();
      // Let the caller see the original 401 error.
      return Promise.reject(error);
    }
  },
);

/**
 * Extract a user-friendly message from any axios error.
 * Falls back to a sensible default so UI never shows "[object Object]".
 */
export function toErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiError>(error)) {
    const body = error.response?.data;
    if (body?.errors?.length) {
      return body.errors.map((e) => e.message).join(', ');
    }
    if (body?.message) {
      return body.message;
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong. Please try again.';
}
