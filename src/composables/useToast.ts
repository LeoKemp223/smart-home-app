/**
 * 全局 Toast 单例：每个页面模板里放一个 <Toast ref>，
 * 通过 useToast() 拿到的 show() 会调用最近挂载的实例。
 */
import type { ComponentPublicInstance } from 'vue'
import Toast from '@/components/Toast.vue'

type ToastAPI = { show: (msg: string, type?: 'success' | 'error' | 'info') => void }

let current: ToastAPI | null = null

export function bindToast(ref: ComponentPublicInstance | null) {
  if (ref && 'show' in ref) {
    current = ref as unknown as ToastAPI
  }
}

export function useToast() {
  return {
    show(message: string, type: 'success' | 'error' | 'info' = 'info') {
      if (current) {
        current.show(message, type)
      } else {
        console.log('[toast]', type, message)
        uni.showToast({ title: message, icon: 'none' })
      }
    },
  }
}

export { Toast }
