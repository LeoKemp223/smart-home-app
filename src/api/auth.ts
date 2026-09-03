import { request } from './request'
import { clearSession, getSession, getUser, saveSession } from './session'

export { getUser }
import type { AuthTokens, User } from '@/types'

export interface AuthData { user: User; access_token: string; refresh_token: string; access_token_expires_at?: string; refresh_token_expires_at?: string }

function storeAuth(data: AuthData) {
  saveSession({ user: data.user, tokens: {
    access_token: data.access_token, refresh_token: data.refresh_token,
    access_token_expires_at: data.access_token_expires_at, refresh_token_expires_at: data.refresh_token_expires_at,
  } })
  return { user: data.user, tokens: getSession()!.tokens }
}

export async function login(phone: string, password: string) { return storeAuth(await request<AuthData>('/api/v1/app/auth/login', { method: 'POST', data: { phone, password } })) }
export async function register(phone: string, password: string, nickname?: string) { return storeAuth(await request<AuthData>('/api/v1/app/auth/register', { method: 'POST', data: { phone, password, ...(nickname?.trim() ? { nickname: nickname.trim() } : {}) } })) }
export async function changePassword(oldPassword: string, newPassword: string) { return storeAuth(await request<AuthData>('/api/v1/app/auth/change-password', { method: 'POST', data: { old_password: oldPassword, new_password: newPassword } })) }
export async function logout() { const refresh_token = getSession()?.tokens.refresh_token; try { if (refresh_token) await request('/api/v1/app/auth/logout', { method: 'POST', data: { refresh_token }, skipRefresh: true }) } finally { clearSession() } }
export async function getMe() { const user = await request<User>('/api/v1/app/me'); const session = getSession(); if (session) saveSession({ ...session, user }); return user }
