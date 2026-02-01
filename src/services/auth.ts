/**
 * @file API服务配置
 * @description 统一管理API调用和类型定义
 */

// API基础配置
const API_BASE_URL = '/api/user-ms/v1'
const CLIENT_TYPE = 'merchant'

// API响应基础类型
export interface BaseResponse<T = unknown> {
  code: number
  data?: T
  err_msg?: string
}

// 用户相关类型定义
export interface UserVO {
  id?: number
  email: string
  password: string
}

export interface UserActivateReq {
  code: string
}

// API服务类
export class AuthAPI {
  /**
   * 用户登录
   * @param userInfo 用户登录信息
   * @returns Promise<Response>
   */
  static async login(userInfo: UserVO): Promise<Response> {
    const response = await fetch(`${API_BASE_URL}/${CLIENT_TYPE}/login`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(userInfo),
      credentials: 'include'  // 包含cookies
    })

    return response
  }

  /**
   * 用户登出
   * @returns Promise<BaseResponse>
   */
  static async logout(): Promise<BaseResponse> {
    const response = await fetch(`${API_BASE_URL}/${CLIENT_TYPE}/logout`, {
      method: 'POST',
      credentials: 'include'  // 包含cookies
    })

    return response.json()
  }

  /**
   * 用户注册
   * @param userInfo 用户注册信息
   * @returns Promise<BaseResponse>
   */
  static async register(userInfo: UserVO): Promise<BaseResponse> {
    const response = await fetch(`${API_BASE_URL}/${CLIENT_TYPE}/users`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(userInfo)
    })

    return response.json()
  }

  /**
   * 激活用户
   * @param activateInfo 激活信息
   * @returns Promise<BaseResponse>
   */
  static async activate(activateInfo: UserActivateReq): Promise<BaseResponse> {
    const response =
        await fetch(`${API_BASE_URL}/${CLIENT_TYPE}/users/activate`, {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(activateInfo)
        })

    return response.json()
  }
}

// HTTP状态码常量
export const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500
} as const

    // 错误处理工具函数
    export const handleAPIError =
                               (error: BaseResponse | { message?: string } | Error,
                                defaultMessage = 'An error occurred') => {
                                 if (error && typeof error === 'object' && 'err_msg' in error && error.err_msg) {
                                   return error.err_msg
                                 }
                                 if (error && typeof error === 'object' && 'message' in error && error.message) {
                                   return error.message
                                 }
                                 return defaultMessage
                               }