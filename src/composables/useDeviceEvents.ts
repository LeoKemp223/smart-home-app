import { onUnmounted, ref } from 'vue'
import { startSSE, subscribeSSE } from '@/api/sse'
import { getTokens } from '@/api/session'
import type { SSEEvent } from '@/types'

export function useDeviceEvents(targetDeviceId?: string) {
  const sseConnected = ref(false)
  const lastHeartbeat = ref(Date.now())
  const listeners: Array<(event: SSEEvent) => void> = []
  const unsubscribe = subscribeSSE((event) => {
    if (event.type === 'heartbeat') { lastHeartbeat.value = Date.now(); sseConnected.value = true; return }
    if (event.type === 'ready') { sseConnected.value = true; return }
    if (event.type === 'error') { sseConnected.value = false; return }
    if (!targetDeviceId || event.device_id === targetDeviceId) listeners.forEach((listener) => listener(event))
  })
  if (getTokens()) startSSE()
  const timer = setInterval(() => { if (Date.now() - lastHeartbeat.value >= 60000) sseConnected.value = false }, 5000)
  onUnmounted(() => { unsubscribe(); clearInterval(timer) })
  return { sseConnected, onEvent(callback: (event: SSEEvent) => void) { listeners.push(callback) } }
}

export function requireAuth() {
  if (!getTokens()) { uni.reLaunch({ url: '/pages/login/index' }); return false }
  return true
}
