/**
 * API 服务层基础配置
 * - Axios 实例配置
 * - 请求/响应拦截器
 * - Token 管理
 * - 统一错误处理
 */

import axios from 'axios';
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API 基础配置
const API_CONFIG = {
  // 开发环境
  development: {
    baseURL: 'http://localhost:8080/api/v1',
    wsURL: 'ws://localhost:8080/ws',
  },
  // 生产环境
  production: {
    baseURL: 'https://api.tink.chat/api/v1',
    wsURL: 'wss://api.tink.chat/ws',
  },
};

// 获取当前环境配置
const env = import.meta.env.MODE === 'production' ? 'production' : 'development';
export const config = API_CONFIG[env];

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

// Token 管理
export const tokenManager = {
  getToken(): string | null {
    return localStorage.getItem('token');
  },

  setToken(token: string): void {
    localStorage.setItem('token', token);
  },

  removeToken(): void {
    localStorage.removeItem('token');
  },

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  },

  setRefreshToken(token: string): void {
    localStorage.setItem('refreshToken', token);
  },

  removeRefreshToken(): void {
    localStorage.removeItem('refreshToken');
  },

  clearAll(): void {
    this.removeToken();
    this.removeRefreshToken();
    localStorage.removeItem('user');
  },

  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    try {
      // JWT 解析 payload
      const payload = JSON.parse(atob(token.split('.')[1]));
      const exp = payload.exp * 1000; // 转换为毫秒
      return Date.now() >= exp;
    } catch {
      return true;
    }
  },
};

// 创建 Axios 实例
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: config.baseURL,
    timeout: 15000,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 请求拦截器 - 添加 Token
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = tokenManager.getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器 - 统一处理响应和错误
  instance.interceptors.response.use(
    (response) => {
      // 直接返回 data，简化调用
      return response.data;
    },
    async (error: AxiosError<ApiResponse>) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

      // Token 过期处理 - 尝试刷新
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = tokenManager.getRefreshToken();
          if (refreshToken) {
            // 尝试刷新 Token
            const response = await axios.get<ApiResponse<{ token: string; expiresAt: string }>>(
              `${config.baseURL}/auth/refresh`,
              {
                headers: { Authorization: `Bearer ${refreshToken}` },
              }
            );

            if (response.data.code === 200) {
              const newToken = response.data.data.token;
              tokenManager.setToken(newToken);
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
              return instance(originalRequest);
            }
          }
        } catch (refreshError) {
          // 刷新失败，清除 Token 并跳转登录
          tokenManager.clearAll();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }

        // 无 refreshToken，清除并跳转
        tokenManager.clearAll();
        window.location.href = '/login';
      }

      // 构造统一错误对象
      const apiError: ApiError = {
        code: error.response?.data?.code || error.response?.status || 500,
        message: error.response?.data?.message || getErrorMessage(error),
        originalError: error,
      };

      return Promise.reject(apiError);
    }
  );

  return instance;
};

// API 错误类型
export interface ApiError {
  code: number;
  message: string;
  originalError?: AxiosError;
}

// 错误消息映射
const getErrorMessage = (error: AxiosError): string => {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return '请求超时，请稍后重试';
    }
    return '网络连接失败，请检查网络';
  }

  switch (error.response.status) {
    case 400:
      return '请求参数错误';
    case 401:
      return '未授权，请重新登录';
    case 403:
      return '无权限访问';
    case 404:
      return '请求的资源不存在';
    case 409:
      return '资源冲突';
    case 422:
      return '验证失败';
    case 500:
      return '服务器内部错误';
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
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export default api;
