import { clearSession, getTokens, saveSession, getSession } from './session'
import type { AuthTokens } from '@/types'

export const API_BASE_URL = (import.meta.env.VITE_ZIOT_API_BASE_URL || 'https://www.ziot.asia').replace(/\/$/, '')

export interface ApiResponse<T> {
  code: number
  message: string
  request_id?: string
  data: T | null
}

export class ApiError extends Error {
  code: number
  statusCode: number
  requestId?: string

  constructor(message: string, code: number, statusCode = 0, requestId?: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.statusCode = statusCode
    this.requestId = requestId
  }
}

type RequestOptions = Omit<UniApp.RequestOptions, 'url' | 'method' | 'data'> & {
  method?: any
  data?: unknown
  skipRefresh?: boolean
}

let refreshPromise: Promise<AuthTokens> | null = null
let redirecting = false

function redirectToLogin() {
  if (redirecting) return
  redirecting = true
  clearSession()
  uni.reLaunch({ url: '/pages/login/index', complete: () => { redirecting = false } })
}

async function refreshTokens(): Promise<AuthTokens> {
  const refreshToken = getTokens()?.refresh_token
  if (!refreshToken) throw new ApiError('登录状态已失效，请重新登录', 401001, 401)
  if (!refreshPromise) {
    refreshPromise = request<{ access_token: string; refresh_token: string; access_token_expires_at?: string; refresh_token_expires_at?: string }>('/api/v1/app/auth/refresh', {
      method: 'POST', data: { refresh_token: refreshToken }, skipRefresh: true,
    }).then((data) => ({ access_token: data.access_token, refresh_token: data.refresh_token, access_token_expires_at: data.access_token_expires_at, refresh_token_expires_at: data.refresh_token_expires_at })).finally(() => { refreshPromise = null })
  }
  return refreshPromise
}

function requestRaw<T>(path: string, options: RequestOptions, token?: string): Promise<ApiResponse<T>> {
  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      url: `${API_BASE_URL}${path}`,
      method: options.method || 'GET',
      data: options.data as any,
      header: {
        'content-type': 'application/json',
        ...(options.header || {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success: (response) => {
        const body = response.data as ApiResponse<T>
        if (!body || typeof body.code !== 'number') {
          reject(new ApiError('服务端响应格式错误', -1, response.statusCode))
          return
        }
        resolve(body)
      },
      fail: (error) => reject(new ApiError(error.errMsg || '网络请求失败', -1, 0)),
    })
  })
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getTokens()?.access_token
  let response = await requestRaw<T>(path, options, token)
  if (response.code === 401001 && !options.skipRefresh && token) {
    try {
      const session = getSession()
      const tokens = await refreshTokens()
      if (session) saveSession({ ...session, tokens })
      response = await requestRaw<T>(path, options, tokens.access_token)
    } catch (error) {
      redirectToLogin()
      throw error
    }
  }
  if (response.code !== 0) {
    if (response.code === 401001 && options.skipRefresh) clearSession()
    throw new ApiError(response.message || '请求失败', response.code, 0, response.request_id)
  }
  return response.data as T
}
