/**
 * 用户认证相关的类型定义
 */

export interface User {
  userId: number;
  name: string;
  phone: string;
}

export interface AuthResponse {
  userId: number;
  name: string;
  phone: string;
  token: string;
}

export interface TokenPayload {
  userId: number;
  phone: string;
}

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
}
