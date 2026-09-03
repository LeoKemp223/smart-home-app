<script setup lang="ts">
/**
 * 极简线性图标集（替代参考实现的 lucide-react）。
 * 通过 SVG path 绘制，color/size 由 props 控制。
 */
const props = withDefaults(
  defineProps<{
    name: string
    size?: number
    color?: string
    strokeWidth?: number
  }>(),
  { size: 40, color: 'currentColor', strokeWidth: 4.5 }
)

// 24x24 viewBox 线性图标 path（lucide 同款几何）
const PATHS: Record<string, string> = {
  // 设备类
  thermometer: 'M14 4a2 2 0 0 0-4 0v9.2a4 4 0 1 0 4 0Z;M14 2h4;M20 6h-3',
  lightbulb: 'M15 14c.2-1 .7-1.7 1.5-2.5A7 7 0 1 0 7.5 11.5c.8.8 1.3 1.5 1.5 2.5Z;M9 18h6;M10 22h4',
  plug: 'M12 22v-5;M9 8V2;M15 8V2;M6 8h12v3a6 6 0 0 1-12 0Z',
  wind: 'M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2;M9.6 4.6A2 2 0 1 1 11 8H2;M12.6 19.4A2 2 0 1 0 14 16H2',
  curtain: 'M4 3h16v18H4Z;M4 8h16;M8 8v13;M12 8v13;M16 8v13',
  cpu: 'M4 4h16v16H4Z;M9 9h6v6H9Z;M9 1v3;M15 1v3;M9 20v3;M15 20v3;M1 9h3;M1 15h3;M20 9h3;M20 15h3',
  // 通用
  home: 'M3 10.5 12 3l9 7.5;M5 9.5V21h14V9.5;M9.5 21v-6h5v6',
  plus: 'M12 5v14;M5 12h14',
  user: 'M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2;M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  bell: 'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9;M10.3 21a1.94 1.94 0 0 0 3.4 0',
  refresh: 'M21 12a9 9 0 1 1-2.6-6.4;M21 3v6h-6',
  wifi: 'M5 12.5a10 10 0 0 1 14 0;M8.5 15.5a5 5 0 0 1 7 0;M12 19h.01',
  battery: 'M7 7h10v10H7Z;M3 10v4;M21 10v4',
  'chevron-left': 'M15 5l-7 7 7 7',
  'chevron-right': 'M9 5l7 7-7 7',
  more: 'M12 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z;M19 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z;M5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  power: 'M12 2v10;M18.4 6.6a9 9 0 1 1-12.8 0',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z;M12 7v5l3 3',
  radio: 'M4.9 19.1a10 10 0 0 1 0-14.2;M7.8 16.2a6 6 0 0 1 0-8.4;M16.2 7.8a6 6 0 0 1 0 8.4;M19.1 4.9a10 10 0 0 1 0 14.2;M12 13.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z',
  alert: 'M12 3 2 20h20L12 3Z;M12 9v5;M12 17.5h.01',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z;M12 8h.01;M12 12v5',
  shield: 'M12 2 4 5v6c0 5.5 3.5 9.5 8 11 4.5-1.5 8-5.5 8-11V5l-8-3Z',
  lock: 'M5 11h14v11H5Z;M8 11V7a4 4 0 0 1 8 0v4',
  eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z;M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  'eye-off': 'M3 3l18 18;M10.6 10.7a3 3 0 0 0 4.2 4.2;M9.4 5.3A9.9 9.9 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-2.7 3.6;M6.1 6.3A17 17 0 0 0 2 12s3.5 7 10 7c1.4 0 2.7-.3 3.8-.8',
  check: 'M4 12.5 9.5 18 20 7',
  'check-circle': 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Z;M8.5 12.5l2.5 2.5 5-5.5',
  x: 'M5 5l14 14;M19 5 5 19',
  settings: 'M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z;M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5h.1a1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z',
  edit: 'M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z',
  trash: 'M3 6h18;M8 6V4h8v2;M19 6l-1 14H6L5 6;M10 11v5;M14 11v5',
  copy: 'M8 8h12v12H8Z;M16 8V4H4v12h4',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4;M16 17l5-5-5-5;M21 12H9',
  calendar: 'M4 5h16v16H4Z;M4 10h16;M8 3v4;M16 3v4',
  qrcode: 'M4 4h6v6H4Z;M14 4h6v6h-6Z;M4 14h6v6H4Z;M14 14h2v2h-2Z;M18 14h2v2h-2Z;M14 18h2v2h-2Z;M18 18h2v2h-2Z',
  scan: 'M4 8V5a1 1 0 0 1 1-1h3;M16 4h3a1 1 0 0 1 1 1v3;M20 16v3a1 1 0 0 1-1 1h-3;M8 20H5a1 1 0 0 1-1-1v-3;M4 12h16',
  keyboard: 'M3 6h18v12H3Z;M7 10h.01;M11 10h.01;M15 10h.01;M18 10h.01;M7 14h.01;M11 14h.01;M15 14h.01;M8 17h8',
  users: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2;M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z;M23 21v-2a4 4 0 0 0-3-3.9;M16 3.1a4 4 0 0 1 0 7.8',
  sparkles: 'M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9Z;M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9Z',
  phone: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.9a2 2 0 0 1-.4 2.1L8.1 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c1 .3 1.9.6 2.9.7a2 2 0 0 1 1.6 1.9Z',
  rotate: 'M21 12a9 9 0 1 1-2.6-6.4;M21 3v6h-6',
  'check-double': 'M2 12.5 6.5 17 15 8;M16 14.5l1.5 1.5 5-5.5',
}

const segments = (PATHS[props.name] || PATHS.cpu).split(';')
</script>

<template>
  <svg
    class="z-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    :style="{ color }"
  >
    <path v-for="(d, i) in segments" :key="i" :d="d" />
  </svg>
</template>

<style scoped>
.z-icon {
  display: inline-block;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
