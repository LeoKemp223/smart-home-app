/**
 * 真实状态栏高度（px）。
 * 小程序/App 端 CSS 变量 --status-bar-height 不存在（会走 44px 回退值，
 * 刘海屏/灵动岛机型实际为 47~59px），需读取系统值以内联 CSS 变量注入；
 * H5 端返回 null，沿用样式表中的变量/回退值。
 */
export function statusBarHeightPx(): number | null {
  // #ifdef H5
  return null
  // #endif
  // #ifndef H5
  try {
    const h = Number(uni.getSystemInfoSync().statusBarHeight) || 0
    return h > 0 ? h : null
  } catch {
    return null
  }
  // #endif
}

/** 供 :style 绑定使用的状态栏变量（H5 返回空对象，不覆盖样式表） */
export function statusBarStyle(): Record<string, string> {
  const px = statusBarHeightPx()
  return px == null ? {} : { '--status-bar-height': `${px}px` }
}
