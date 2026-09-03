/**
 * ZIOT mock 服务层 —— 界面阶段的数据源，API 结构对齐 docs/ziot-app-integration.md。
 * 后续接入真实后端时：保持方法签名，内部换成 uni.request 调用（api/request.ts）。
 * 设备/SSE 均为本地模拟（uni.storage 持久化 + 定时器模拟事件流）。
 */
import type {
  User,
  AuthTokens,
  Device,
  SSEEvent,
  NotificationItem,
  DeviceEventLog,
  AppCommand,
  DeviceCategory,
} from '@/types'

const KEYS = {
  USER: 'ziot_user_v2',
  TOKENS: 'ziot_tokens_v2',
  DEVICES: 'ziot_devices_v2',
  MESSAGES: 'ziot_messages_v2',
  LOGS: 'ziot_logs_v2',
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))
const nowISO = () => new Date().toISOString()

function read<T>(key: string): T | null {
  try {
    const raw = uni.getStorageSync(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}
function write(key: string, value: unknown) {
  try {
    uni.setStorageSync(key, JSON.stringify(value))
  } catch {
    /* storage 异常忽略 */
  }
}
function remove(key: string) {
  try {
    uni.removeStorageSync(key)
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------- seed data

const SEED_DEVICES: Device[] = [
  {
    device_id: 'dk_th_8821',
    name: '智能温湿度计',
    alias: null,
    product_id: 'pk_sensor_th01',
    product_key: 'pk_sensor_th01',
    product_name: '米家温湿度计 Pro',
    category: 'sensor',
    status: 'active',
    online_status: 'online',
    firmware_version: 'v1.2.4',
    bound_at: '2026-08-20 14:32',
    shadow_reported: {
      temperature: 23.6,
      humidity: 58,
      battery: 92,
      temp_unit: 'C',
      comfort_prompt: true,
      report_interval: 30,
    },
    shadow_updated_at: nowISO(),
  },
  {
    device_id: 'dk_light_3302',
    name: '智能吸顶灯',
    alias: '客厅大灯',
    product_id: 'pk_light_rgb02',
    product_key: 'pk_light_rgb02',
    product_name: '智能调光吸顶灯 RGB',
    category: 'light',
    status: 'active',
    online_status: 'online',
    firmware_version: 'v2.0.1',
    bound_at: '2026-08-22 10:15',
    shadow_reported: { power: true, brightness: 75, color_temp: 4000, mode: 'reading' },
    shadow_updated_at: nowISO(),
  },
  {
    device_id: 'dk_pwr_4119',
    name: '智能计量插座',
    alias: '书房主机插座',
    product_id: 'pk_socket_pwr01',
    product_key: 'pk_socket_pwr01',
    product_name: '智能功率计量插座 16A',
    category: 'socket',
    status: 'active',
    online_status: 'offline',
    firmware_version: 'v1.0.8',
    bound_at: '2026-08-25 18:40',
    shadow_reported: { switch_main: false, power_w: 0, current_a: 0, led_indicator: true, max_power_limit: 2200 },
    shadow_updated_at: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    device_id: 'dk_ac_9022',
    name: '变频智能空调',
    alias: '主卧冷暖空调',
    product_id: 'pk_ac_inv03',
    product_key: 'pk_ac_inv03',
    product_name: '变频一级能效冷暖空调',
    category: 'ac',
    status: 'active',
    online_status: 'online',
    firmware_version: 'v3.1.0',
    bound_at: '2026-08-28 09:05',
    shadow_reported: { power: true, target_temp: 25, mode: 'cool', wind_speed: 2 },
    shadow_updated_at: nowISO(),
  },
  {
    device_id: 'dk_cur_7710',
    name: '智能窗帘电机',
    alias: '客厅双轨窗帘',
    product_id: 'pk_curtain_m01',
    product_key: 'pk_curtain_m01',
    product_name: '静音智能开合帘电机',
    category: 'curtain',
    status: 'active',
    online_status: 'online',
    firmware_version: 'v1.1.2',
    bound_at: '2026-09-01 16:20',
    shadow_reported: { position: 60, status: 'stop', reverse_direction: false },
    shadow_updated_at: nowISO(),
  },
]

const PRESET_BINDING_CATALOG: Record<
  string,
  { name: string; product_id: string; product_name: string; category: DeviceCategory; firmware: string; initial_shadow: Record<string, any> }
> = {
  'BD7K9X2M4PLQ8HZW': {
    name: '阳台空气检测仪',
    product_id: 'pk_sensor_th01',
    product_name: '高精度环境空气监测仪',
    category: 'sensor',
    firmware: 'v1.0.3',
    initial_shadow: { temperature: 24.1, humidity: 52, battery: 100, report_interval: 60 },
  },
  'WF3D8R2L9KPM1XTY': {
    name: '玄关感应夜灯',
    product_id: 'pk_light_rgb02',
    product_name: '智能人体感应夜灯',
    category: 'light',
    firmware: 'v1.0.0',
    initial_shadow: { power: true, brightness: 40, color_temp: 3000, mode: 'night' },
  },
  'GT6P4N8Q2VKX9RTY': {
    name: '智能厨房排插',
    product_id: 'pk_socket_pwr01',
    product_name: '多孔防过载智能排插',
    category: 'socket',
    firmware: 'v1.1.0',
    initial_shadow: { switch_main: true, power_w: 125, led_indicator: true, max_power_limit: 2500 },
  },
}

const SEED_MESSAGES: NotificationItem[] = [
  { id: 'msg_1', title: '设备上线提醒', content: '智能温湿度计 已在客厅正常接入 ZIOT 物联网平台。', time: '10分钟前', type: 'status', read: false, device_id: 'dk_th_8821' },
  { id: 'msg_2', title: '设备离线警告', content: '智能计量插座 心跳超时，当前已标记为离线状态。', time: '4小时前', type: 'status', read: true, device_id: 'dk_pwr_4119' },
  { id: 'msg_3', title: '安全中心提醒', content: 'ZIOT 平台全新升级 v0.2，全面支持 SSE 实时状态下发与秒级投递。', time: '昨天', type: 'system', read: true },
]

// ---------------------------------------------------------------- SSE event bus

type SSEListener = (event: SSEEvent) => void
const sseListeners = new Set<SSEListener>()
let heartbeatTimer: ReturnType<typeof setInterval> | null = null

export function subscribeSSE(cb: SSEListener): () => void {
  sseListeners.add(cb)
  return () => sseListeners.delete(cb)
}

function dispatchSSE(event: SSEEvent) {
  recordEventLog(event)
  sseListeners.forEach((fn) => {
    try {
      fn(event)
    } catch (e) {
      console.error('SSE listener error', e)
    }
  })
}

function ensureHeartbeat() {
  if (heartbeatTimer) return
  heartbeatTimer = setInterval(() => {
    dispatchSSE({ type: 'heartbeat', payload: { now: nowISO() }, timestamp: nowISO() })
  }, 20000)
}

function recordEventLog(event: SSEEvent) {
  if (event.type === 'heartbeat' || event.type === 'ready' || event.type === 'error') return
  const logs = read<DeviceEventLog[]>(KEYS.LOGS) || []
  logs.unshift({
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    device_id: event.device_id || 'system',
    time: new Date().toLocaleTimeString('zh-CN', { hour12: false }),
    type:
      event.type === 'device.status.changed'
        ? 'status_change'
        : event.type === 'device.shadow.updated'
          ? 'property_report'
          : 'service_call',
    title:
      event.type === 'device.status.changed'
        ? `设备状态变更为: ${event.payload?.online_status ?? ''}`
        : '设备 Shadow 属性上报更新',
    detail: JSON.stringify(event.payload),
  })
  write(KEYS.LOGS, logs.slice(0, 50))
}

export function getEventLogs(deviceId?: string): DeviceEventLog[] {
  const logs = read<DeviceEventLog[]>(KEYS.LOGS) || []
  return deviceId ? logs.filter((l) => l.device_id === deviceId) : logs
}

// ---------------------------------------------------------------- auth

export function getUser(): User | null {
  return read<User>(KEYS.USER)
}
export function getTokens(): AuthTokens | null {
  return read<AuthTokens>(KEYS.TOKENS)
}
function saveSession(user: User | null, tokens: AuthTokens | null) {
  if (user) write(KEYS.USER, user)
  else remove(KEYS.USER)
  if (tokens) write(KEYS.TOKENS, tokens)
  else remove(KEYS.TOKENS)
}

function makeSession(user: User): { user: User; tokens: AuthTokens } {
  const tokens: AuthTokens = {
    access_token: `at_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    refresh_token: `art_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  }
  saveSession(user, tokens)
  return { user, tokens }
}

export async function login(phone: string, password: string): Promise<{ user: User; tokens: AuthTokens }> {
  await delay(450)
  if (!/^1[3-9]\d{9}$/.test(phone)) throw new Error('请输入有效的11位手机号码')
  if (password.length < 8) throw new Error('密码长度需不少于8位')
  const user: User = {
    id: `app_${phone.slice(-4)}${Math.floor(Math.random() * 1000)}`,
    phone,
    nickname: phone === '13800138000' ? '小明' : `用户${phone.slice(-4)}`,
    status: 'active',
    created_at: nowISO(),
  }
  return makeSession(user)
}

export async function register(phone: string, password: string, nickname?: string): Promise<{ user: User; tokens: AuthTokens }> {
  await delay(500)
  if (!/^1[3-9]\d{9}$/.test(phone)) throw new Error('请输入有效的11位手机号码')
  if (password.length < 8 || password.length > 128) throw new Error('密码长度须在 8-128 位之间')
  if (phone === '13800138000') {
    const err = new Error('该手机号已注册') as Error & { code?: number }
    err.code = 409001
    throw err
  }
  const user: User = {
    id: `app_${Date.now().toString().slice(-6)}`,
    phone,
    nickname: nickname?.trim() || `用户${phone.slice(-4)}`,
    status: 'active',
    created_at: nowISO(),
  }
  return makeSession(user)
}

export async function logout(): Promise<void> {
  await delay(200)
  saveSession(null, null)
}

export async function changePassword(oldPass: string, newPass: string): Promise<void> {
  await delay(500)
  if (newPass.length < 8 || newPass.length > 128) throw new Error('新密码长度须为 8-128 位')
  if (oldPass === newPass) throw new Error('新密码不能与原密码相同')
  const user = getUser()
  if (!user) throw new Error('登录状态已失效，请重新登录')
  // 真实接口会吊销全部令牌并返回新令牌对；mock 原地续期
  ensureHeartbeat()
}

// ---------------------------------------------------------------- devices

export function getDevices(): Device[] {
  const list = read<Device[]>(KEYS.DEVICES)
  if (list && list.length >= 0 && read<User>(KEYS.USER)) return list
  // 首次进入（未做种子标记）：写入种子设备
  if (list === null) {
    write(KEYS.DEVICES, SEED_DEVICES)
    write(KEYS.MESSAGES, SEED_MESSAGES)
    return [...SEED_DEVICES]
  }
  return list
}

export function getDeviceById(id: string): Device | undefined {
  return getDevices().find((d) => d.device_id === id)
}

function saveDevices(devices: Device[]) {
  write(KEYS.DEVICES, devices)
}

export async function patchDeviceAlias(id: string, alias: string | null): Promise<Device> {
  await delay(350)
  const devices = getDevices()
  const idx = devices.findIndex((d) => d.device_id === id)
  if (idx < 0) throw new Error('设备不存在或已解绑')
  const v = alias?.trim() ?? ''
  if (v.length > 128) throw new Error('别名长度须在 1-128 位之间')
  devices[idx] = { ...devices[idx], alias: v === '' ? null : v }
  saveDevices(devices)
  return devices[idx]
}

export async function unbindDevice(id: string): Promise<{ device_id: string; unbound_at: string }> {
  await delay(450)
  const devices = getDevices()
  const idx = devices.findIndex((d) => d.device_id === id)
  if (idx < 0) throw new Error('设备不存在或已解绑')
  devices.splice(idx, 1)
  saveDevices(devices)
  const now = nowISO()
  dispatchSSE({ type: 'device.status.changed', device_id: id, payload: { online_status: 'offline', unbound: true }, timestamp: now })
  return { device_id: id, unbound_at: now }
}

// ---------------------------------------------------------------- binding

/** 解析扫码结果 / 手动输入 → 绑定码（ziot.asia/b/ URL、#fragment、裸码均可） */
export function parseBindingCode(raw: string): string {
  const text = raw.trim()
  if (!text) return ''
  if (text.includes('ziot.asia/b/')) {
    const part = text.split('ziot.asia/b/')[1]?.split(/[?#]/)[0] || ''
    return part.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  }
  if (text.includes('#')) {
    return (text.split('#')[1] || '').replace(/[^A-Za-z0-9]/g, '').toUpperCase()
  }
  return text.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
}

function maskCode(code: string): string {
  return code.length >= 8 ? `${code.slice(0, 4)}••••••••${code.slice(-4)}` : `${code.slice(0, 2)}••••${code.slice(-2)}`
}

export async function previewBinding(
  code: string
): Promise<{ name: string; product_name: string; product_id: string; category: DeviceCategory; masked_code: string }> {
  await delay(200)
  const clean = parseBindingCode(code)
  if (clean.length < 8) throw new Error('无效的绑定码，请核对后重试')
  const preset = PRESET_BINDING_CATALOG[clean] || {
    name: `智能设备 (${clean.slice(-4)})`,
    product_name: 'ZIOT 智能物联终端',
    product_id: 'pk_sensor_th01',
    category: 'sensor' as DeviceCategory,
  }
  return { ...preset, masked_code: maskCode(clean) }
}

export async function confirmBinding(code: string): Promise<Device> {
  await delay(600)
  const clean = parseBindingCode(code)
  if (clean.length < 8) throw new Error('无效的绑定码，请核对后重试')
  const preset = PRESET_BINDING_CATALOG[clean] || {
    name: `智能新设备 (${clean.slice(-4)})`,
    product_name: 'ZIOT 智能物联终端',
    product_id: 'pk_sensor_th01',
    category: 'sensor' as DeviceCategory,
    firmware: 'v1.0.0',
    initial_shadow: { temperature: 24.2, humidity: 55, battery: 98 } as Record<string, any>,
  }
  const newDevice: Device = {
    device_id: `dk_${clean.toLowerCase().slice(0, 8)}_${Math.floor(Math.random() * 1000)}`,
    name: preset.name,
    alias: null,
    product_id: preset.product_id,
    product_key: preset.product_id,
    product_name: preset.product_name,
    category: preset.category,
    status: 'active',
    online_status: 'online',
    firmware_version: 'v1.0.0',
    bound_at: nowISO().replace('T', ' ').slice(0, 16),
    shadow_reported: { ...preset.initial_shadow },
    shadow_updated_at: nowISO(),
  }
  const devices = getDevices()
  devices.unshift(newDevice)
  saveDevices(devices)
  dispatchSSE({ type: 'device.status.changed', device_id: newDevice.device_id, payload: { online_status: 'online', bound: true }, timestamp: nowISO() })
  return newDevice
}

// ---------------------------------------------------------------- commands (投递语义)

export async function sendCommandSync(
  deviceId: string,
  command: { prop?: string; service?: string; value?: any }
): Promise<AppCommand> {
  await delay(60) // 模拟几十毫秒投递返回
  const devices = getDevices()
  const idx = devices.findIndex((d) => d.device_id === deviceId)
  if (idx < 0) throw new Error('设备不存在或已解绑')
  if (devices[idx].online_status !== 'online') throw new Error('设备离线，指令无法投递')

  const identifier = command.service || 'property.set'
  const cmd: AppCommand = {
    id: `cmd_${Date.now()}`,
    org_id: 'mock_org',
    device_id: deviceId,
    device_name: devices[idx].name,
    product_key: devices[idx].product_key || devices[idx].product_id,
    device_key: deviceId,
    identifier,
    params: command.prop ? { [command.prop]: command.value } : {},
    status: 'success',
    request_id: `cmd_${Date.now()}`,
    result: null,
    error_code: null,
    error_message: null,
    timeout_at: nowISO(),
    sent_at: nowISO(),
    replied_at: null,
    created_at: nowISO(),
    updated_at: nowISO(),
  }

  // 模拟设备异步执行：450ms 后更新 shadow 并推 SSE
  setTimeout(() => {
    const list = getDevices()
    const i = list.findIndex((d) => d.device_id === deviceId)
    if (i < 0) return
    if (command.prop) {
      list[i] = {
        ...list[i],
        shadow_reported: { ...list[i].shadow_reported, [command.prop]: command.value },
        shadow_updated_at: nowISO(),
      }
    } else if (command.service === 'device_reboot') {
      list[i] = { ...list[i], online_status: 'offline', shadow_updated_at: nowISO() }
      setTimeout(() => {
        const l2 = getDevices()
        const j = l2.findIndex((d) => d.device_id === deviceId)
        if (j >= 0) {
          l2[j] = { ...l2[j], online_status: 'online' }
          saveDevices(l2)
          dispatchSSE({ type: 'device.status.changed', device_id: deviceId, payload: { online_status: 'online' }, timestamp: nowISO() })
        }
      }, 3000)
    }
    saveDevices(list)
    dispatchSSE({ type: 'device.shadow.updated', device_id: deviceId, payload: { reported: list[i].shadow_reported }, timestamp: nowISO() })
  }, 450)

  return cmd
}

// ---------------------------------------------------------------- messages

export function getMessages(): NotificationItem[] {
  return read<NotificationItem[]>(KEYS.MESSAGES) || []
}
export function markMessageRead(id: string) {
  const msgs = getMessages().map((m) => (m.id === id ? { ...m, read: true } : m))
  write(KEYS.MESSAGES, msgs)
}
export function markAllMessagesRead() {
  write(KEYS.MESSAGES, getMessages().map((m) => ({ ...m, read: true })))
}

// ---------------------------------------------------------------- session bootstrap

/** 启动时调用：已登录则初始化 SSE 心跳模拟 */
export function bootstrapSession() {
  if (getTokens() && getUser()) ensureHeartbeat()
}
export function startSSE() {
  ensureHeartbeat()
}
