import { request } from './request'
import type { AppCommand, Device, DeviceShadow } from '@/types'

export interface CommandInput { prop?: string; service?: string; value?: unknown }

export const listDevices = () => request<{ items: Device[] }>('/api/v1/app/devices').then((data) => data.items)
export const getDevice = (deviceId: string) => listDevices().then((items) => items.find((item) => item.device_id === deviceId))
export const getDeviceShadow = (deviceId: string) => request<DeviceShadow>(`/api/v1/app/devices/${encodeURIComponent(deviceId)}/shadow`)
export const bindDevice = (code: string) => request<Device>('/api/v1/app/devices/bind', { method: 'POST', data: { code } })
export const updateDeviceAlias = (deviceId: string, alias: string | null) => request<Device>(`/api/v1/app/devices/${encodeURIComponent(deviceId)}`, { method: 'PATCH', data: { alias: alias ?? '' } })
export const unbindDevice = (deviceId: string) => request<{ device_id: string; unbound_at: string }>(`/api/v1/app/devices/${encodeURIComponent(deviceId)}`, { method: 'DELETE' })
export function sendCommandSync(deviceId: string, command: CommandInput) {
  const data = command.prop ? { kind: 'property_set', params: { [command.prop]: command.value } } : { kind: 'service', identifier: command.service, params: {} }
  return request<AppCommand>(`/api/v1/app/devices/${encodeURIComponent(deviceId)}/commands:sync`, { method: 'POST', data })
}
export const getCommand = (commandId: string) => request<AppCommand>(`/api/v1/app/commands/${encodeURIComponent(commandId)}`)

export function parseBindingCode(raw: string): string {
  const value = raw.trim()
  const index = value.indexOf('#')
  return (index >= 0 ? value.slice(index + 1) : value).replace(/-/g, '').toUpperCase()
}
