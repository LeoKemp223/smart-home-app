/**
 * 设备事件订阅（mock SSE）：全局一条事件总线按 device_id 分发。
 * 真实接入后：内部换成 api/sse.ts 的长连接 + 断线重连，页面层不用改。
 */
import { ref, onUnmounted } from 'vue'
import { subscribeSSE, startSSE } from '@/api/mock/ziot-mock'
import type { SSEEvent } from '@/types'

export function useDeviceEvents(targetDeviceId?: string) {
  const sseConnected = ref(true)
  const lastHeartbeat = ref(Date.now())
  const listeners: Array<(e: SSEEvent) => void> = []

  const unsubscribe = subscribeSSE((event) => {
    if (event.type === 'heartbeat') {
      lastHeartbeat.value = Date.now()
      sseConnected.value = true
      return
    }
    if (!targetDeviceId || !event.device_id || event.device_id === targetDeviceId) {
      listeners.forEach((fn) => {
        try {
          fn(event)
        } catch (e) {
          console.error(e)
        }
      })
    }
  })
  startSSE()

  // 25s 无心跳视为断连（服务端 20s 心跳）
  const timer = setInterval(() => {
    if (Date.now() - lastHeartbeat.value > 25000) sseConnected.value = false
  }, 5000)

  onUnmounted(() => {
    unsubscribe()
    clearInterval(timer)
  })

  return {
    sseConnected,
    onEvent(cb: (e: SSEEvent) => void) {
      listeners.push(cb)
    },
  }
}

/** 登录态守卫：无 token 跳登录页（返回 true 表示已登录） */
export function requireAuth(): boolean {
  const tokens = uni.getStorageSync('ziot_tokens_v2')
  if (!tokens) {
    uni.reLaunch({ url: '/pages/login/index' })
    return false
  }
  return true
}
