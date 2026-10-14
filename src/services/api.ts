/**
 * API 服务层基础配置
 * - Axios 实例配置
 * - 请求/响应拦截器
 * - Token 管理
 * - 统一错误处理
 */

import axios from "axios";
import type {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { API_BASE_URL, WEBSOCKET_URL, API_TIMEOUT } from "../config/constants";
import logger from "../utils/logger";

// API 基础配置（使用常量文件中的配置）
export const config = {
  baseURL: API_BASE_URL,
  wsURL: WEBSOCKET_URL,
};

// 通用响应格式
export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  timestamp: string;
}

// 分页响应格式
export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 错误码定义
export const ErrorCode = {
  SUCCESS: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  SERVER_ERROR: 500,
} as const;

export function tokenActor(token: string | null): string | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    );
    return payload.sub ?? payload.userId ?? null;
  } catch {
    return token;
  }
}

// Token 管理
export const tokenManager = {
  getToken(): string | null {
    return localStorage.getItem("token");
  },

  setToken(token: string): void {
    localStorage.setItem("token", token);
  },

  removeToken(): void {
    localStorage.removeItem("token");
  },

  getRefreshToken(): string | null {
    return localStorage.getItem("refreshToken");
  },

  setRefreshToken(token: string): void {
    localStorage.setItem("refreshToken", token);
  },

  removeRefreshToken(): void {
    localStorage.removeItem("refreshToken");
  },

  clearAll(): void {
    this.removeToken();
    this.removeRefreshToken();
    localStorage.removeItem("user");
  },

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // JWT 解析 payload
      const payload = JSON.parse(
        atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
      );
      const exp = payload.exp * 1000; // 转换为毫秒
      return (
        payload.purpose !== "access" ||
        !Number.isFinite(exp) ||
        Date.now() >= exp
      );
    } catch {
      return true;
    }
  },
};

let refreshFlight: Promise<
  ApiResponse<{ token: string; refreshToken: string; expiresIn: number }>
> | null = null;
let refreshingCredential: string | null = null;
export async function refreshAccessToken(): Promise<
  ApiResponse<{ token: string; refreshToken: string; expiresIn: number }>
> {
  const credential = tokenManager.getRefreshToken();
  if (!credential) throw new Error("请重新登录");
  if (refreshFlight && refreshingCredential === credential)
    return refreshFlight;
  refreshingCredential = credential;
  const flight = (async () => {
    const response = await axios.post<
      ApiResponse<{ token: string; refreshToken: string; expiresIn: number }>
    >(
      `${config.baseURL}/auth/refresh`,
      {},
      { headers: { Authorization: `Bearer ${credential}` } },
    );
    if (tokenManager.getRefreshToken() !== credential)
      throw new Error("账号已切换");
    if (
      response.data.code !== 200 ||
      !response.data.data.token ||
      !response.data.data.refreshToken
    )
      throw new Error("刷新失败，请重新登录");
    tokenManager.setToken(response.data.data.token);
    tokenManager.setRefreshToken(response.data.data.refreshToken);
    return response.data;
  })();
  refreshFlight = flight;
  try {
    return await flight;
  } finally {
    if (refreshFlight === flight) {
      refreshFlight = null;
      refreshingCredential = null;
    }
  }
}

// 创建 Axios 实例
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: config.baseURL,
    timeout: API_TIMEOUT,
    headers: {
      "Content-Type": "application/json",
    },
  });

  logger.info("[API] Axios 实例已创建", {
    baseURL: config.baseURL,
    timeout: API_TIMEOUT,
  });

  // 请求拦截器 - 添加 Token
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = tokenManager.getToken();
      const scoped = config as InternalAxiosRequestConfig & {
        _actor?: string | null;
      };
      const actor = tokenActor(token);
      if (scoped._actor !== undefined && scoped._actor !== actor)
        throw new Error("账号已切换");
      scoped._actor = actor;
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  // 响应拦截器 - 统一处理响应和错误
  instance.interceptors.response.use(
    (response) => {
      // 直接返回 data，简化调用
      return response.data;
    },
    async (error: AxiosError<ApiResponse>) => {
      if (!error.config) return Promise.reject(error);
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
        _actor?: string | null;
      };

      if (
        originalRequest._actor !== undefined &&
        originalRequest._actor !== tokenActor(tokenManager.getToken())
      )
        return Promise.reject(new Error("账号已切换"));
      // Token 过期处理 - 尝试刷新
      // 注意：登录和注册接口返回 401 不应触发刷新逻辑
      const refreshCredential = tokenManager.getRefreshToken();
      const isAuthEndpoint =
        originalRequest.url?.includes("/auth/login") ||
        originalRequest.url?.includes("/auth/register") ||
        originalRequest.url?.includes("/auth/refresh");

      if (
        error.response?.status === 401 &&
        !originalRequest._retry &&
        !isAuthEndpoint
      ) {
        originalRequest._retry = true;

        try {
          const refreshToken = tokenManager.getRefreshToken();
          if (refreshToken) {
            // 尝试刷新 Token
            const response = await refreshAccessToken();
            if (response.code === 200) {
              const newToken = response.data.token;
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return instance(originalRequest);
            }
          }
        } catch (refreshError) {
          // 刷新失败，清除 Token 并跳转登录
          if (tokenManager.getRefreshToken() !== refreshCredential)
            return Promise.reject(refreshError);
          tokenManager.clearAll();
          // 使用 replace 避免用户通过浏览器后退按钮返回
          window.location.replace("/login");
          return Promise.reject(refreshError);
        }

        // 无 refreshToken，清除并跳转
        tokenManager.clearAll();
        // 使用 replace 避免用户通过浏览器后退按钮返回
        window.location.replace("/login");
      }

      // 构造统一错误对象
      const apiError: ApiError = {
        code: error.response?.data?.code || error.response?.status || 500,
        message: error.response?.data?.message || getErrorMessage(error),
        originalError: error,
        businessCode: (
          error.response?.data as
            | (ApiResponse & { businessCode?: string })
            | undefined
        )?.businessCode,
        details: error.response?.data?.data as
          | Record<string, unknown>
          | undefined,
      };

      return Promise.reject(apiError);
    },
  );

  return instance;
};

// API 错误类型
export interface ApiError {
  businessCode?: string;
  details?: Record<string, unknown>;
  code: number;
  message: string;
  originalError?: AxiosError;
}

// 错误消息映射
const getErrorMessage = (error: AxiosError): string => {
  if (!error.response) {
    if (error.code === "ECONNABORTED") {
      return "请求超时，请稍后重试";
    }
    return "网络连接失败，请检查网络";
  }

  switch (error.response.status) {
    case 400:
      return "请求参数错误";
    case 401:
      return "未授权，请重新登录";
    case 403:
      return "无权限访问";
    case 404:
      return "请求的资源不存在";
    case 409:
      return "资源冲突";
    case 422:
      return "验证失败";
    case 500:
      return "服务器内部错误";
    default:
      return `请求失败 (${error.response.status})`;
  }
};

// 导出 API 实例
export const api = createApiInstance();

// 便捷方法 - 带类型的请求
export const apiRequest = {
  get: <T>(url: string, params?: object) =>
    api.get<unknown, ApiResponse<T>>(url, { params }),

  post: <T>(url: string, data?: object) =>
    api.post<unknown, ApiResponse<T>>(url, data),

  put: <T>(url: string, data?: object) =>
    api.put<unknown, ApiResponse<T>>(url, data),

  delete: <T>(url: string, params?: object) =>
    api.delete<unknown, ApiResponse<T>>(url, { params }),

  // 文件上传
  upload: <T>(url: string, formData: FormData) =>
    api.post<unknown, ApiResponse<T>>(url, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export default api;
