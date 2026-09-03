/**
 * Toast：统一走 uni.showToast 原生实现（跨端零兼容问题，自动消失）。
 * 小程序端 icon 模式标题限 7 字，故统一 icon:'none'（纯文本，最多两行）。
 */
export function useToast() {
  return {
    show(message: string, _type: 'success' | 'error' | 'info' = 'info') {
      uni.showToast({ title: message, icon: 'none', duration: 2400 })
    },
  }
}
