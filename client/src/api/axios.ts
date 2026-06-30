/**
 * Axios 请求封装模块
 * 提供统一的HTTP请求实例、拦截器、错误处理
 */

import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios';

/**
 * 创建 Axios 实例
 * 配置基础URL、超时时间、请求头
 */
const axiosInstance: AxiosInstance = axios.create({
  // 基础URL，所有请求自动拼接此前缀
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  // 请求超时时间：10秒
  timeout: 10000,
  // 默认请求头
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 请求拦截器
 * 在请求发送前执行，可添加认证token、loading状态等
 */
axiosInstance.interceptors.request.use(
  (config) => {
    // 可在此添加全局loading状态
    // 例如：showLoading()
    return config;
  },
  (error) => {
    // 请求发送失败
    console.error('请求发送失败:', error);
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器
 * 在收到响应后执行，统一处理错误码、格式化数据
 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse) => {
    // 隐藏全局loading
    // 例如：hideLoading()

    const { data } = response;

    // 如果后端返回success为false，抛出业务错误
    if (data && data.success === false) {
      const error = new Error(data.message || '请求失败');
      error.name = 'BusinessError';
      return Promise.reject(error);
    }

    return response;
  },
  (error) => {
    // 隐藏全局loading
    // 例如：hideLoading()

    // 统一处理HTTP错误
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          console.error('请求参数错误:', data?.message || 'Bad Request');
          break;
        case 404:
          console.error('资源不存在:', data?.message || 'Not Found');
          break;
        case 500:
          console.error('服务器内部错误:', data?.message || 'Internal Server Error');
          break;
        default:
          console.error(`HTTP错误 [${status}]:`, data?.message || 'Unknown Error');
      }
    } else if (error.request) {
      // 请求已发送但未收到响应（网络错误/超时）
      console.error('网络请求失败，请检查网络连接或后端服务是否运行');
    } else {
      // 请求配置错误
      console.error('请求配置错误:', error.message);
    }

    return Promise.reject(error);
  }
);

/**
 * 封装的GET请求方法
 * @param url - 请求路径
 * @param config - Axios请求配置
 * @returns 响应数据Promise
 */
export function get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return axiosInstance.get(url, config).then((res) => res.data);
}

/**
 * 封装的POST请求方法
 * @param url - 请求路径
 * @param data - 请求体数据
 * @param config - Axios请求配置
 * @returns 响应数据Promise
 */
export function post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return axiosInstance.post(url, data, config).then((res) => res.data);
}

/**
 * 封装的PUT请求方法
 * @param url - 请求路径
 * @param data - 请求体数据
 * @param config - Axios请求配置
 * @returns 响应数据Promise
 */
export function put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
  return axiosInstance.put(url, data, config).then((res) => res.data);
}

/**
 * 封装的DELETE请求方法
 * @param url - 请求路径
 * @param config - Axios请求配置
 * @returns 响应数据Promise
 */
export function del<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  return axiosInstance.delete(url, config).then((res) => res.data);
}

export default axiosInstance;
