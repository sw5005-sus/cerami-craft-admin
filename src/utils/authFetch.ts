/**
 * @file 带 401 全局拦截的 fetch 封装
 * @description 替代原生 fetch，自动携带 cookie 并在收到 401 时跳转 BFF 登录。
 */

import { login, invalidateAuth } from '../services/auth'

/**
 * 与原生 fetch 签名完全一致的封装。
 * - 自动注入 credentials: 'include'（确保携带 HttpOnly cookie）
 * - 响应 401 时清除缓存并跳转到 ZITADEL 登录页
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  // 确保始终携带 cookie
  const mergedInit: RequestInit = {
    ...init,
    credentials: 'include',
  }

  const response = await fetch(input, mergedInit)

  if (response.status === 401) {
    invalidateAuth()
    login() // 全页跳转到 ZITADEL，浏览器将离开当前页面
    // 返回一个永不 resolve 的 Promise，阻止调用方继续执行
    return new Promise<Response>(() => {})
  }

  return response
}

