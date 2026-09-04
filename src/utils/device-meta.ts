import type { Device } from '@/types'

/** 设备本地元信息（用户自定义名称 / 摆放位置），仅存本机 Storage，不上云 */
export interface DeviceMeta {
  name?: string
  location?: string
}

const STORAGE_KEY = 'ziot:device_meta'

function readAll(): Record<string, DeviceMeta> {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    return raw ? (JSON.parse(raw as string) as Record<string, DeviceMeta>) : {}
  } catch {
    return {}
  }
}

function writeAll(map: Record<string, DeviceMeta>) {
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(map))
}

export function getDeviceMeta(deviceId: string): DeviceMeta | null {
  return readAll()[deviceId] || null
}

/** 覆盖式写入：空白字段视为未设置；两者皆空则删除该条目 */
export function setDeviceMeta(deviceId: string, meta: DeviceMeta) {
  const map = readAll()
  const next: DeviceMeta = {}
  const name = meta.name?.trim()
  const location = meta.location?.trim()
  if (name) next.name = name
  if (location) next.location = location
  if (next.name || next.location) map[deviceId] = next
  else delete map[deviceId]
  writeAll(map)
}

export function removeDeviceMeta(deviceId: string) {
  const map = readAll()
  delete map[deviceId]
  writeAll(map)
}

/** 展示名优先级：本地自定义名 > 云端别名(alias) > 设备默认名(name) */
export function deviceDisplayName(device: Pick<Device, 'device_id' | 'name' | 'alias'>): string {
  return getDeviceMeta(device.device_id)?.name || device.alias?.trim() || device.name
}
