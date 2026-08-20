import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/authStore";
import type { ApiErrorShape } from "@/types/api";

declare module "axios" {
  export interface AxiosRequestConfig {
    /** route_key this request maps to (e.g. "admin.pay-grades") — lets the
     * response interceptor record a 403 against the permission store so the
     * sidebar can hide screens the active role can't reach. */
    screenKey?: string;
  }
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (
    error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>,
  ) => {
    const status = error.response?.status ?? 0;
    const screenKey = error.config?.screenKey;

    if (status === 401) {
      const hadSession = !!useAuthStore.getState().token;
      useAuthStore.getState().clearSession();
      const loginPath = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/login`;
      if (!window.location.pathname.includes("/login")) {
        if (hadSession) sessionStorage.setItem("hmis-session-expired", "1");
        window.location.assign(loginPath);
      }
    }

    if (status === 403 && screenKey) {
      useAuthStore.getState().denyScreen(screenKey);
    }

    const shaped: ApiErrorShape = {
      status,
      message:
        error.response?.data?.message ??
        (status === 0
          ? "Network error. Please check your connection."
          : "An unexpected error occurred."),
      errors: error.response?.data?.errors,
    };

    return Promise.reject(shaped);
  },
);
