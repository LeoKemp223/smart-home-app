import type { AuthTokens, User } from '@/types'

export const AUTH_KEY = 'ziot_auth_v1'

export interface Session {
  user: User
  tokens: AuthTokens
}

export function getSession(): Session | null {
  try {
    const value = uni.getStorageSync(AUTH_KEY)
    if (!value) return null
    return typeof value === 'string' ? JSON.parse(value) : value
  } catch {
    return null
  }
}

export function saveSession(session: Session) {
  uni.setStorageSync(AUTH_KEY, session)
}

export function clearSession() {
  uni.removeStorageSync(AUTH_KEY)
}

export function getTokens(): AuthTokens | null {
  const tokens = getSession()?.tokens
  return typeof tokens?.access_token === 'string' && tokens.access_token.trim() ? tokens : null
}

export function getUser(): User | null {
  return getSession()?.user || null
}
