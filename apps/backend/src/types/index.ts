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

// 分页参数
export interface PaginationParams {
  offset: number; // 开始获取数据的位置
  limit: number; // 每次获取数据的数量限制
}

// 排序参数
export interface SortParams {
  sort: 'asc' | 'desc'; // 排序顺序
  sortBy: string; // 排序字段
}

/** 工具类型：将对象中选中的属性变为可选 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
