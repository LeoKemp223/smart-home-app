/** ZIOT App 端类型定义（对齐后端 app-api.md v0.2，界面阶段先配 mock 服务层） */

export interface User {
  id: string
  phone: string
  nickname: string
  status: 'active' | 'inactive'
  created_at: string
}

export interface AuthTokens {
  access_token: string
  refresh_token: string
  access_token_expires_at?: string
  refresh_token_expires_at?: string
}

export type OnlineStatus = 'online' | 'offline' | 'unknown'

export interface DeviceShadow {
  reported: Record<string, any>
  desired?: Record<string, any>
  version?: number
  updated_at: string
}

export type DeviceCategory = 'sensor' | 'light' | 'socket' | 'ac' | 'curtain' | 'other'

export interface Device {
  device_id: string
  name: string
  alias?: string | null
  product_id: string
  product_key?: string
  product_name: string
  category: DeviceCategory
  status?: 'active' | 'disabled'
  online_status: OnlineStatus
  firmware_version: string | null
  bound_at: string
  shadow_reported: Record<string, any>
  shadow_updated_at: string | null
}

export type ControlType = 'switch' | 'slider' | 'enum' | 'action'

export interface ControlItem {
  id: string
  type: ControlType
  prop?: string
  service?: string
  label: string
  unit?: string
  min?: number
  max?: number
  step?: number
  options?: { value: any; label: string }[]
  confirm?: string
}

export interface MainStat {
  prop: string
  label: string
  unit?: string
}

export interface ProductPanel {
  productKey: string
  productName: string
  category: DeviceCategory
  icon: string
  mainStats: MainStat[]
  controls: ControlItem[]
}

export type SSEEventType =
  | 'ready'
  | 'device.shadow.updated'
  | 'device.status.changed'
  | 'heartbeat'
  | 'error'

export interface SSEEvent {
  type: SSEEventType
  device_id?: string
  payload: any
  timestamp: string
}

export interface NotificationItem {
  id: string
  title: string
  content: string
  time: string
  type: 'status' | 'control' | 'system'
  read: boolean
  device_id?: string
}

export interface DeviceEventLog {
  id: string
  device_id: string
  time: string
  type: 'property_report' | 'command_sent' | 'status_change' | 'service_call'
  title: string
  detail: string
}

export interface AppCommand {
  id: string
  device_id: string
  identifier: string
  params: unknown
  status: 'pending' | 'success' | 'failed' | string
  error_message: string | null
  created_at: string
}
