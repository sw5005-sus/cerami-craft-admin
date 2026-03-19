/**
 * @file Axios 请求实例
 * @description 封装 axios，自动携带 HttpOnly cookie 并全局处理 401 响应。
 *   后续可逐步将 services/ 中的 fetch 调用替换为此实例。
 */

import axios from 'axios'
import { login, invalidateAuth } from '../services/auth'

/** 创建 axios 实例 */
const request = axios.create({
  baseURL: import.meta.env.VITE_API_URL as string,
  timeout: 15_000,
  withCredentials: true, // 始终携带 HttpOnly cookie
})

/**
 * 响应拦截器 —— 全局 401 处理
 * 当任何请求收到 401 时，清除缓存的认证状态并跳转到 ZITADEL 登录页。
 */
request.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      invalidateAuth()
      login() // 全页跳转，浏览器将离开当前页面
      // 返回一个永不 resolve 的 Promise，避免调用方继续执行
      return new Promise(() => {})
    }
    return Promise.reject(error)
  },
)

export default request

