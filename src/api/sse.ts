import { API_BASE_URL } from './request'
import { getTokens } from './session'
import type { SSEEvent, SSEEventType } from '@/types'

type Listener = (event: SSEEvent) => void
const listeners = new Set<Listener>()
let controller: AbortController | null = null
let reconnectTimer: ReturnType<typeof setTimeout> | null = null
let reconnectDelay = 1000
let lastEventAt = 0
let watchdog: ReturnType<typeof setInterval> | null = null
let running = false

export function subscribeSSE(listener: Listener) { listeners.add(listener); return () => listeners.delete(listener) }
function emit(event: SSEEvent) { lastEventAt = Date.now(); listeners.forEach((listener) => { try { listener(event) } catch (error) { console.error(error) } }) }
function parseFrame(frame: string) {
  let eventType: SSEEventType = 'message' as SSEEventType
  const data: string[] = []
  frame.split(/\r?\n/).forEach((line) => {
    if (line.startsWith('event:')) eventType = line.slice(6).trim() as SSEEventType
    if (line.startsWith('data:')) data.push(line.slice(5).trim())
  })
  if (!data.length) return
  try {
    const payload = JSON.parse(data.join('\n'))
    emit({ type: eventType, device_id: payload.device_id, payload, timestamp: payload.occurred_at || payload.updated_at || payload.now || new Date().toISOString() })
  } catch { emit({ type: 'error', payload: { message: 'SSE data 解析失败' }, timestamp: new Date().toISOString() }) }
}
async function connect() {
  if (!running || !getTokens()?.access_token || typeof fetch === 'undefined') return
  controller = new AbortController()
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/app/events/stream`, { headers: { Authorization: `Bearer ${getTokens()!.access_token}`, Accept: 'text/event-stream' }, signal: controller.signal })
    if (!response.ok || !response.body) throw new Error(`SSE 连接失败: ${response.status}`)
    reconnectDelay = 1000
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    while (running) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const frames = buffer.split(/\r?\n\r?\n/)
      buffer = frames.pop() || ''
      frames.forEach(parseFrame)
    }
  } catch (error) { if (running && (error as Error).name !== 'AbortError') emit({ type: 'error', payload: { message: (error as Error).message }, timestamp: new Date().toISOString() }) }
  finally {
    controller = null
    if (running && !reconnectTimer) { reconnectTimer = setTimeout(() => { reconnectTimer = null; reconnectDelay = Math.min(reconnectDelay * 2, 60000); connect() }, reconnectDelay) }
  }
}
export function startSSE() {
  if (running) return
  running = true; lastEventAt = Date.now(); connect()
  watchdog = setInterval(() => { if (running && Date.now() - lastEventAt >= 60000) { controller?.abort(); lastEventAt = Date.now() } }, 5000)
}
export function stopSSE() {
  running = false; controller?.abort(); controller = null
  if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null }
  if (watchdog) { clearInterval(watchdog); watchdog = null }
}
