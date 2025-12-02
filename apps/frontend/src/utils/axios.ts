import axios from 'axios';
import type { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { message } from 'antd';
import { useUserStore } from '../store/userStore';

export const apiAxiosInstance = axios.create({
  baseURL: '/baseUrl/api',
});

export const merchantAxiosInstance = axios.create({
  // 商家端mock地址
  baseURL: 'http://127.0.0.1:4523/m1/7446832-7180926-6608925/api/merchant',
});

// 为每个请求添加Authorization头
const attachAuth = (config: InternalAxiosRequestConfig) => {
  const { token } = useUserStore.getState();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// 为每个请求添加请求拦截
apiAxiosInstance.interceptors.request.use(attachAuth);
merchantAxiosInstance.interceptors.request.use(attachAuth);

// 处理响应
const handleResponse = <T = unknown>(response: AxiosResponse<T>) => {
  const payload = response.data as unknown as { title?: string; status?: number; message?: string };
  const msg = payload?.message;
  const title = payload?.title;
  const statusCode = payload?.status;
  if (msg) {
    if (statusCode! >= 200 || statusCode! < 300) {
      message.success(msg);
    } else if (title === 'error' || statusCode! >= 400) {
      message.error(msg);
    } else {
      message.info(msg);
    }
  }
  return response;
};

// 处理响应错误
const handleError = (error: AxiosError) => {
  const data = error.response?.data as { message?: string } | undefined;
  const msg = data?.message ?? error.message ?? '请求失败';
  message.error(msg);
  return Promise.reject(error);
};

// 为每个请求添加响应拦截
apiAxiosInstance.interceptors.response.use(handleResponse, handleError);
merchantAxiosInstance.interceptors.response.use(handleResponse, handleError);
