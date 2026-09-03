<script setup lang="ts">
/**
 * 跨端图标组件（H5/小程序/App 通用）。
 * 方案：Unicode 字符 + CSS 伪图形。避免 SVG（小程序 WXML 不支持 <svg>）与图片资源。
 * 简单几何符号直接用 Unicode 字符渲染；个别复杂图标用相近字符近似。
 */
const props = withDefaults(
  defineProps<{
    name: string
    size?: number
    color?: string
    strokeWidth?: number
  }>(),
  { size: 40, color: 'currentColor', strokeWidth: 4 }
)

/** 图标字符表（rpx 单位由 style 控制 font-size） */
const GLYPHS: Record<string, string> = {
  // 设备类
  thermometer: '🌡',
  lightbulb: '💡',
  plug: '🔌',
  wind: '🌬',
  curtain: '🪟',
  cpu: '🖥',
  // 导航与操作
  home: '⌂',
  plus: '+',
  user: '👤',
  bell: '🔔',
  refresh: '⟳',
  wifi: '📶',
  battery: '🔋',
  'chevron-left': '‹',
  'chevron-right': '›',
  more: '⋯',
  power: '⏻',
  clock: '🕐',
  radio: '📡',
  alert: '⚠',
  info: 'ℹ',
  shield: '🛡',
  lock: '🔒',
  eye: '👁',
  'eye-off': '🚫',
  check: '✓',
  'check-circle': '✓',
  x: '✕',
  settings: '⚙',
  edit: '✎',
  trash: '🗑',
  copy: '⧉',
  logout: '⇥',
  calendar: '📅',
  qrcode: '▦',
  scan: '▣',
  keyboard: '⌨',
  users: '👥',
  sparkles: '✨',
  phone: '📱',
  rotate: '↻',
  'check-double': '✓✓',
}

const glyph = GLYPHS[props.name] ?? '◇'

/** 部分字符需要加粗视觉的替代样式 */
const isThin = ['chevron-left', 'chevron-right', 'more', 'check', 'x', 'plus', 'home', 'qrcode', 'scan', 'check-double'].includes(props.name)
const isSymbol = ['chevron-left', 'chevron-right', 'more', 'check', 'x', 'plus', 'home', 'alert', 'info', 'refresh', 'rotate', 'power', 'edit', 'copy', 'logout', 'qrcode', 'scan', 'check-double', 'shield'].includes(props.name)
</script>

<template>
  <text
    class="zicon"
    :class="{ 'zicon--thin': isThin, 'zicon--symbol': isSymbol }"
    :style="{
      fontSize: `${size}rpx`,
      color: color,
      fontWeight: isThin ? 700 : 400,
    }"
  >{{ glyph }}</text>
</template>

<style scoped>
.zicon {
  display: inline-block;
  vertical-align: middle;
  line-height: 1;
  font-family:
    'Segoe UI Symbol',
    'PingFang SC',
    'Microsoft YaHei',
    system-ui,
    sans-serif;
}

.zicon--thin {
  letter-spacing: 0;
}

/* 纯符号字符（✓ ✕ ‹ › ⋯ ⟳）不用 emoji 字体渲染，保持单色 */
.zicon--symbol {
  font-family:
    -apple-system,
    'Segoe UI',
    'PingFang SC',
    system-ui,
    sans-serif;
  font-style: normal;
}
</style>
