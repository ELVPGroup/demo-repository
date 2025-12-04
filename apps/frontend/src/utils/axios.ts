import axios, { type AxiosInstance, type AxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { useUserStore } from '../store/userStore';

// 公共配置
const BASE_URL = 'http://8.134.211.162:3000/api';

// 创建 axios 实例的工厂函数
const createAxiosInstance = (baseURL: string, config?: AxiosRequestConfig): AxiosInstance => {
  const instance = axios.create({
    baseURL,
    timeout: 10000, // 10秒超时
    ...config,
  });

  // 请求拦截器：自动添加 token
  instance.interceptors.request.use(
    (config) => {
      const { token } = useUserStore.getState();
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器：处理 token 过期等错误
  instance.interceptors.response.use(
    (response) => {
      const payload = response.data as unknown as {
        title?: string;
        status?: number;
        message?: string;
      };
      const msg = payload?.message;
      const statusCode = payload?.status;
      console.log(statusCode, 'statusCode');

      if (msg) {
        if (statusCode! >= 200 || statusCode! < 300) {
          message.success(msg);
        } else {
          message.info(msg);
        }
      }
      return response;
    },
    (error) => {
      // 统一错误处理
      if (error.response) {
        const { status, data } = error.response;
        console.error('响应错误:', status, data);
        const msg = data?.message || error.message || '请求失败';
        // 401: 未授权，token 过期或无效
        if (status === 401) {
          message.error(msg);
          sessionStorage.clear();
          // 清除 token
          useUserStore.getState().logout();
          // 可以在这里跳转到登录页
          if (window.location.pathname !== '/') {
            window.location.href = '/';
          }
        }

        // 403: 禁止访问
        if (status === 403) {
          console.error('无权限访问');
          message.error(msg);
        }

        // 404: 资源不存在
        if (status === 404) {
          console.error('资源不存在');
          message.error(msg);
        }

        // 500: 服务器错误
        if (status >= 500) {
          console.error('服务器错误:', data?.message || '服务器异常');
          message.error(msg);
        }
      } else if (error.request) {
        // 请求已发出但没有收到响应
        console.error('网络错误: 无法连接到服务器');
        message.error('无法连接到服务器');
      } else {
        // 其他错误
        console.error('请求错误:', error.message);
        message.error(error.message);
      }

      return Promise.reject(error);
    }
  );

  return instance;
};

// 商家端 axios 实例
export const merchantAxiosInstance = createAxiosInstance(`${BASE_URL}/merchant`);

// 通用接口 axios 实例
export const commonAxiosInstance = createAxiosInstance(BASE_URL);

// 如果需要客户端实例，可以这样添加：
export const clientAxiosInstance = createAxiosInstance(`${BASE_URL}/client`);
