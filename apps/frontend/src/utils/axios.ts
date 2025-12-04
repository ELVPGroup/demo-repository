import axios, { type AxiosInstance, type AxiosRequestConfig } from "axios";

// 公共配置
const BASE_URL = "http://8.134.211.162:3000/api";

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
      const token = localStorage.getItem('token');
      if (token) {
        // 确保 headers 对象存在
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
      return response;
    },
    (error) => {
      // 统一错误处理
      if (error.response) {
        const { status, data } = error.response;
        
        // 401: 未授权，token 过期或无效
        if (status === 401) {
          // 清除 token
          localStorage.removeItem('token');
          // 可以在这里跳转到登录页
          if (window.location.pathname !== '/') {
            window.location.href = '/';
          }
        }
        
        // 403: 禁止访问
        if (status === 403) {
          console.error('无权限访问');
        }
        
        // 500: 服务器错误
        if (status >= 500) {
          console.error('服务器错误:', data?.message || '服务器异常');
        }
      } else if (error.request) {
        // 请求已发出但没有收到响应
        console.error('网络错误: 无法连接到服务器');
      } else {
        // 其他错误
        console.error('请求错误:', error.message);
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
// export const clientAxiosInstance = createAxiosInstance(`${BASE_URL}/client`);

