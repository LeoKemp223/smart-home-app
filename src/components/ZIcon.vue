<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    name: string
    size?: number
    color?: string
    strokeWidth?: number
  }>(),
  { size: 40, color: 'currentColor', strokeWidth: 3.2 }
)

const ICONS: Record<string, string> = {
  thermometer: '<path d="M10 14.5V4a2 2 0 1 1 4 0v10.5a4 4 0 1 1-4 0Z"/><path d="M12 17V8"/>',
  lightbulb: '<path d="M9 18h6"/><path d="M10 22h4"/><path d="M8.2 14.1A6.5 6.5 0 1 1 15.8 14c-.9.7-1.3 1.7-1.3 2.8H9.5c0-1.1-.4-2-1.3-2.7Z"/>',
  plug: '<path d="M7 3v6M12 3v6"/><path d="M5 7h9v3a4.5 4.5 0 0 1-9 0V7Z"/><path d="M9.5 14.5V21"/>',
  wind: '<path d="M3 8h10a3 3 0 1 0-3-3"/><path d="M3 12h15a3 3 0 1 1-3 3"/><path d="M3 16h7a3 3 0 1 1-3 3"/>',
  curtain: '<path d="M4 4h16"/><path d="M6 4v16M18 4v16"/><path d="M6 7h12M9 7v13M15 7v13"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="10" y="10" width="4" height="4" rx="1"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
  home: '<path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9"/><path d="M10 20v-6h4v6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  user: '<circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c.8-3.6 3.3-5.5 7.5-5.5s6.7 1.9 7.5 5.5"/>',
  bell: '<path d="M18 10a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"/><path d="M10 22h4"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.5-4.6L3 9"/><path d="M3 4v5h5"/><path d="M4 13a8 8 0 0 0 14.5 4.6L21 15"/><path d="M21 20v-5h-5"/>',
  wifi: '<path d="M3 9a13 13 0 0 1 18 0"/><path d="M6 13a9 9 0 0 1 12 0"/><path d="M9 17a4.5 4.5 0 0 1 6 0"/><circle cx="12" cy="21" r=".8" fill="currentColor" stroke="none"/>',
  battery: '<rect x="3" y="7" width="17" height="10" rx="2"/><path d="M21 10v4"/><path d="M6 10h8v4H6z" fill="currentColor" stroke="none"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  more: '<circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/>',
  power: '<path d="M12 3v8"/><path d="M7 5.5a8 8 0 1 0 10 0"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7v5l3.5 2"/>',
  radio: '<circle cx="12" cy="12" r="2"/><path d="M5 5a10 10 0 0 0 0 14M19 5a10 10 0 0 1 0 14M8 8a5.5 5.5 0 0 0 0 8M16 8a5.5 5.5 0 0 1 0 8"/>',
  alert: '<path d="M10.4 4.2 3 18a2 2 0 0 0 1.8 3h14.4A2 2 0 0 0 21 18L13.6 4.2a1.8 1.8 0 0 0-3.2 0Z"/><path d="M12 9v4.5M12 17h.01"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  shield: '<path d="M12 3 19 6v5c0 4.5-2.8 7.8-7 10-4.2-2.2-7-5.5-7-10V6l7-3Z"/><path d="m9 12 2 2 4-4"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v2"/>',
  eye: '<path d="M3 12s3.2-5 9-5 9 5 9 5-3.2 5-9 5-9-5-9-5Z"/><circle cx="12" cy="12" r="2.5"/>',
  'eye-off': '<path d="m4 4 16 16"/><path d="M10.6 7.2A11.5 11.5 0 0 1 12 7c5.8 0 9 5 9 5a14.8 14.8 0 0 1-3.2 3.4M6.3 6.3C4.2 8 3 10 3 12c0 0 3.2 5 9 5 1.2 0 2.3-.2 3.2-.6"/><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2"/>',
  check: '<path d="m5 12 4.2 4.2L19 6.5"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8 12 2.7 2.7L16.5 9"/>',
  x: '<path d="m6 6 12 12M18 6 6 18"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.2 2.2-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-3.2v-.2a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1-2.2-2.2.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H5v-3.2h.2a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 2.2-2.2.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3.4h3.2v.2a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1 2.2 2.2-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2V13h-.2a1.7 1.7 0 0 0-1.6 2Z"/>',
  edit: '<path d="m4 16.5-.8 4.3 4.3-.8L19 8.5 15.5 5 4 16.5Z"/><path d="m13.8 6.7 3.5 3.5"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6.5 7l.8 13h9.4l.8-13M10 11v5M14 11v5"/>',
  copy: '<rect x="8" y="8" width="11" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2"/>',
  logout: '<path d="M10 5H5v14h5"/><path d="m14 8 4 4-4 4M9 12h9"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16M8 14h.01M12 14h.01M16 14h.01"/>',
  qrcode: '<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2M18 14h2v3M14 18h3M19 19h1"/>',
  scan: '<path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 12h10"/>',
  keyboard: '<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h.01M10 10h.01M13 10h.01M16 10h.01M7 14h6M16 14h1"/>',
  users: '<circle cx="9" cy="9" r="3"/><path d="M3.5 20c.5-3.2 2.4-5 5.5-5s5 1.8 5.5 5"/><path d="M16 7a3 3 0 0 1 0 5.8M17 15c2 0 3.4 1.2 4 3.5"/>',
  sparkles: '<path d="m12 3 1.1 4.9L18 9l-4.9 1.1L12 15l-1.1-4.9L6 9l4.9-1.1L12 3ZM19 15l.5 2.5L22 18l-2.5.5L19 21l-.5-2.5L16 18l2.5-.5L19 15ZM5 15l.5 2.5L8 18l-2.5.5L5 21l-.5-2.5L2 18l2.5-.5L5 15Z"/>',
  phone: '<rect x="7" y="3" width="10" height="18" rx="2"/><path d="M11 18h2"/>',
  rotate: '<path d="M20 11a8 8 0 1 0 1.2 4.2"/><path d="M20 4v7h-7"/>',
  'check-double': '<path d="m3 12 4 4 7-8M10 16l3 3 8-9"/>',
}

const iconMarkup = computed(() => ICONS[props.name] ?? ICONS.info)
</script>

<template>
  <!-- #ifdef H5 -->
  <svg
    class="zicon"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    :stroke-width="strokeWidth"
    :style="{ width: `${size}rpx`, height: `${size}rpx`, color }"
    aria-hidden="true"
    v-html="iconMarkup"
  />
  <!-- #endif -->
  <!-- #ifndef H5 -->
  <view
    class="zicon zicon--mask"
    :class="`zicon--${name}`"
    :style="{ width: `${size}rpx`, height: `${size}rpx`, backgroundColor: color }"
  />
  <!-- #endif -->
</template>

<style scoped>
.zicon {
  display: inline-block;
  flex: none;
  vertical-align: middle;
}

.zicon--mask {
  background: currentColor;
  -webkit-mask-position: center;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-size: contain;
}

.zicon--thermometer { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEwIDE0LjVWNGEyIDIgMCAxIDEgNCAwdjEwLjVhNCA0IDAgMSAxLTQgMFoiLz48cGF0aCBkPSJNMTIgMTdWOCIvPjwvc3ZnPg=="); }
.zicon--lightbulb { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTkgMThoNiIvPjxwYXRoIGQ9Ik0xMCAyMmg0Ii8+PHBhdGggZD0iTTguMiAxNC4xQTYuNSA2LjUgMCAxIDEgMTUuOCAxNGMtLjkuNy0xLjMgMS43LTEuMyAyLjhIOS41YzAtMS4xLS40LTItMS4zLTIuN1oiLz48L3N2Zz4="); }
.zicon--plug { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTcgM3Y2TTEyIDN2NiIvPjxwYXRoIGQ9Ik01IDdoOXYzYTQuNSA0LjUgMCAwIDEtOSAwVjdaIi8+PHBhdGggZD0iTTkuNSAxNC41VjIxIi8+PC9zdmc+"); }
.zicon--wind { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTMgOGgxMGEzIDMgMCAxIDAtMy0zIi8+PHBhdGggZD0iTTMgMTJoMTVhMyAzIDAgMSAxLTMgMyIvPjxwYXRoIGQ9Ik0zIDE2aDdhMyAzIDAgMSAxLTMgMyIvPjwvc3ZnPg=="); }
.zicon--curtain { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTQgNGgxNiIvPjxwYXRoIGQ9Ik02IDR2MTZNMTggNHYxNiIvPjxwYXRoIGQ9Ik02IDdoMTJNOSA3djEzTTE1IDd2MTMiLz48L3N2Zz4="); }
.zicon--cpu { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iNiIgeT0iNiIgd2lkdGg9IjEyIiBoZWlnaHQ9IjEyIiByeD0iMiIvPjxyZWN0IHg9IjEwIiB5PSIxMCIgd2lkdGg9IjQiIGhlaWdodD0iNCIgcng9IjEiLz48cGF0aCBkPSJNOSAydjRNMTUgMnY0TTkgMTh2NE0xNSAxOHY0TTIgOWg0TTIgMTVoNE0xOCA5aDRNMTggMTVoNCIvPjwvc3ZnPg=="); }
.zicon--home { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0ibTMgMTAgOS03IDkgNyIvPjxwYXRoIGQ9Ik01IDl2MTFoMTRWOSIvPjxwYXRoIGQ9Ik0xMCAyMHYtNmg0djYiLz48L3N2Zz4="); }
.zicon--plus { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDV2MTRNNSAxMmgxNCIvPjwvc3ZnPg=="); }
.zicon--user { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSI4IiByPSIzLjUiLz48cGF0aCBkPSJNNC41IDIwYy44LTMuNiAzLjMtNS41IDcuNS01LjVzNi43IDEuOSA3LjUgNS41Ii8+PC9zdmc+"); }
.zicon--bell { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTE4IDEwYTYgNiAwIDAgMC0xMiAwYzAgNy0zIDctMyA5aDE4YzAtMi0zLTItMy05WiIvPjxwYXRoIGQ9Ik0xMCAyMmg0Ii8+PC9zdmc+"); }
.zicon--refresh { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIwIDExYTggOCAwIDAgMC0xNC41LTQuNkwzIDkiLz48cGF0aCBkPSJNMyA0djVoNSIvPjxwYXRoIGQ9Ik00IDEzYTggOCAwIDAgMCAxNC41IDQuNkwyMSAxNSIvPjxwYXRoIGQ9Ik0yMSAyMHYtNWgtNSIvPjwvc3ZnPg=="); }
.zicon--wifi { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTMgOWExMyAxMyAwIDAgMSAxOCAwIi8+PHBhdGggZD0iTTYgMTNhOSA5IDAgMCAxIDEyIDAiLz48cGF0aCBkPSJNOSAxN2E0LjUgNC41IDAgMCAxIDYgMCIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMjEiIHI9Ii44IiBmaWxsPSJjdXJyZW50Q29sb3IiIHN0cm9rZT0ibm9uZSIvPjwvc3ZnPg=="); }
.zicon--battery { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iMyIgeT0iNyIgd2lkdGg9IjE3IiBoZWlnaHQ9IjEwIiByeD0iMiIvPjxwYXRoIGQ9Ik0yMSAxMHY0Ii8+PHBhdGggZD0iTTYgMTBoOHY0SDZ6IiBmaWxsPSJjdXJyZW50Q29sb3IiIHN0cm9rZT0ibm9uZSIvPjwvc3ZnPg=="); }
.zicon--chevron-left { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0ibTE1IDE4LTYtNiA2LTYiLz48L3N2Zz4="); }
.zicon--chevron-right { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0ibTkgMTggNi02LTYtNiIvPjwvc3ZnPg=="); }
.zicon--more { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iNSIgY3k9IjEyIiByPSIxIiBmaWxsPSJjdXJyZW50Q29sb3IiIHN0cm9rZT0ibm9uZSIvPjxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjEiIGZpbGw9ImN1cnJlbnRDb2xvciIgc3Ryb2tlPSJub25lIi8+PGNpcmNsZSBjeD0iMTkiIGN5PSIxMiIgcj0iMSIgZmlsbD0iY3VycmVudENvbG9yIiBzdHJva2U9Im5vbmUiLz48L3N2Zz4="); }
.zicon--power { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDN2OCIvPjxwYXRoIGQ9Ik03IDUuNWE4IDggMCAxIDAgMTAgMCIvPjwvc3ZnPg=="); }
.zicon--clock { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOC41Ii8+PHBhdGggZD0iTTEyIDd2NWwzLjUgMiIvPjwvc3ZnPg=="); }
.zicon--radio { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMiIvPjxwYXRoIGQ9Ik01IDVhMTAgMTAgMCAwIDAgMCAxNE0xOSA1YTEwIDEwIDAgMCAxIDAgMTRNOCA4YTUuNSA1LjUgMCAwIDAgMCA4TTE2IDhhNS41IDUuNSAwIDAgMSAwIDgiLz48L3N2Zz4="); }
.zicon--alert { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEwLjQgNC4yIDMgMThhMiAyIDAgMCAwIDEuOCAzaDE0LjRBMiAyIDAgMCAwIDIxIDE4TDEzLjYgNC4yYTEuOCAxLjggMCAwIDAtMy4yIDBaIi8+PHBhdGggZD0iTTEyIDl2NC41TTEyIDE3aC4wMSIvPjwvc3ZnPg=="); }
.zicon--info { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOSIvPjxwYXRoIGQ9Ik0xMiAxMXY1TTEyIDhoLjAxIi8+PC9zdmc+"); }
.zicon--shield { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEyIDMgMTkgNnY1YzAgNC41LTIuOCA3LjgtNyAxMC00LjItMi4yLTctNS41LTctMTBWNmw3LTNaIi8+PHBhdGggZD0ibTkgMTIgMiAyIDQtNCIvPjwvc3ZnPg=="); }
.zicon--lock { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iNSIgeT0iMTAiIHdpZHRoPSIxNCIgaGVpZ2h0PSIxMCIgcng9IjIiLz48cGF0aCBkPSJNOCAxMFY3YTQgNCAwIDAgMSA4IDB2M00xMiAxNHYyIi8+PC9zdmc+"); }
.zicon--eye { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTMgMTJzMy4yLTUgOS01IDkgNSA5IDUtMy4yIDUtOSA1LTktNS05LTVaIi8+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMi41Ii8+PC9zdmc+"); }
.zicon--eye-off { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0ibTQgNCAxNiAxNiIvPjxwYXRoIGQ9Ik0xMC42IDcuMkExMS41IDExLjUgMCAwIDEgMTIgN2M1LjggMCA5IDUgOSA1YTE0LjggMTQuOCAwIDAgMS0zLjIgMy40TTYuMyA2LjNDNC4yIDggMyAxMCAzIDEyYzAgMCAzLjIgNSA5IDUgMS4yIDAgMi4zLS4yIDMuMi0uNiIvPjxwYXRoIGQ9Ik05LjkgOS45YTMgMyAwIDAgMCA0LjIgNC4yIi8+PC9zdmc+"); }
.zicon--check { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0ibTUgMTIgNC4yIDQuMkwxOSA2LjUiLz48L3N2Zz4="); }
.zicon--check-circle { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iOSIvPjxwYXRoIGQ9Im04IDEyIDIuNyAyLjdMMTYuNSA5Ii8+PC9zdmc+"); }
.zicon--x { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0ibTYgNiAxMiAxMk0xOCA2IDYgMTgiLz48L3N2Zz4="); }
.zicon--settings { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMyIvPjxwYXRoIGQ9Ik0xOS40IDE1YTEuNyAxLjcgMCAwIDAgLjMgMS45bC4xLjEtMi4yIDIuMi0uMS0uMWExLjcgMS43IDAgMCAwLTEuOS0uMyAxLjcgMS43IDAgMCAwLTEgMS42di4yaC0zLjJ2LS4yYTEuNyAxLjcgMCAwIDAtMS0xLjYgMS43IDEuNyAwIDAgMC0xLjkuM2wtLjEuMS0yLjItMi4yLjEtLjFhMS43IDEuNyAwIDAgMCAuMy0xLjkgMS43IDEuNyAwIDAgMC0xLjYtMUg1di0zLjJoLjJhMS43IDEuNyAwIDAgMCAxLjYtMSAxLjcgMS43IDAgMCAwLS4zLTEuOWwtLjEtLjEgMi4yLTIuMi4xLjFhMS43IDEuNyAwIDAgMCAxLjkuMyAxLjcgMS43IDAgMCAwIDEtMS42VjMuNGgzLjJ2LjJhMS43IDEuNyAwIDAgMCAxIDEuNiAxLjcgMS43IDAgMCAwIDEuOS0uM2wuMS0uMSAyLjIgMi4yLS4xLjFhMS43IDEuNyAwIDAgMC0uMyAxLjkgMS43IDEuNyAwIDAgMCAxLjYgMWguMlYxM2gtLjJhMS43IDEuNyAwIDAgMC0xLjYgMloiLz48L3N2Zz4="); }
.zicon--edit { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0ibTQgMTYuNS0uOCA0LjMgNC4zLS44TDE5IDguNSAxNS41IDUgNCAxNi41WiIvPjxwYXRoIGQ9Im0xMy44IDYuNyAzLjUgMy41Ii8+PC9zdmc+"); }
.zicon--trash { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTQgN2gxNk05IDdWNGg2djNNNi41IDdsLjggMTNoOS40bC44LTEzTTEwIDExdjVNMTQgMTF2NSIvPjwvc3ZnPg=="); }
.zicon--copy { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iOCIgeT0iOCIgd2lkdGg9IjExIiBoZWlnaHQ9IjEyIiByeD0iMiIvPjxwYXRoIGQ9Ik0xNiA4VjZhMiAyIDAgMCAwLTItMkg2YTIgMiAwIDAgMC0yIDJ2MTBhMiAyIDAgMCAwIDIgMmgyIi8+PC9zdmc+"); }
.zicon--logout { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTEwIDVINXYxNGg1Ii8+PHBhdGggZD0ibTE0IDggNCA0LTQgNE05IDEyaDkiLz48L3N2Zz4="); }
.zicon--calendar { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iNCIgeT0iNSIgd2lkdGg9IjE2IiBoZWlnaHQ9IjE1IiByeD0iMiIvPjxwYXRoIGQ9Ik04IDN2NE0xNiAzdjRNNCAxMGgxNk04IDE0aC4wMU0xMiAxNGguMDFNMTYgMTRoLjAxIi8+PC9zdmc+"); }
.zicon--qrcode { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTQgNGg2djZINHpNMTQgNGg2djZoLTZ6TTQgMTRoNnY2SDR6TTE0IDE0aDJNMTggMTRoMnYzTTE0IDE4aDNNMTkgMTloMSIvPjwvc3ZnPg=="); }
.zicon--scan { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTQgOFY1YTEgMSAwIDAgMSAxLTFoM00xNiA0aDNhMSAxIDAgMCAxIDEgMXYzTTIwIDE2djNhMSAxIDAgMCAxLTEgMWgtM004IDIwSDVhMSAxIDAgMCAxLTEtMXYtM003IDEyaDEwIi8+PC9zdmc+"); }
.zicon--keyboard { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iMyIgeT0iNiIgd2lkdGg9IjE4IiBoZWlnaHQ9IjEyIiByeD0iMiIvPjxwYXRoIGQ9Ik03IDEwaC4wMU0xMCAxMGguMDFNMTMgMTBoLjAxTTE2IDEwaC4wMU03IDE0aDZNMTYgMTRoMSIvPjwvc3ZnPg=="); }
.zicon--users { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PGNpcmNsZSBjeD0iOSIgY3k9IjkiIHI9IjMiLz48cGF0aCBkPSJNMy41IDIwYy41LTMuMiAyLjQtNSA1LjUtNXM1IDEuOCA1LjUgNSIvPjxwYXRoIGQ9Ik0xNiA3YTMgMyAwIDAgMSAwIDUuOE0xNyAxNWMyIDAgMy40IDEuMiA0IDMuNSIvPjwvc3ZnPg=="); }
.zicon--sparkles { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0ibTEyIDMgMS4xIDQuOUwxOCA5bC00LjkgMS4xTDEyIDE1bC0xLjEtNC45TDYgOWw0LjktMS4xTDEyIDNaTTE5IDE1bC41IDIuNUwyMiAxOGwtMi41LjVMMTkgMjFsLS41LTIuNUwxNiAxOGwyLjUtLjVMMTkgMTVaTTUgMTVsLjUgMi41TDggMThsLTIuNS41TDUgMjFsLS41LTIuNUwyIDE4bDIuNS0uNUw1IDE1WiIvPjwvc3ZnPg=="); }
.zicon--phone { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3QgeD0iNyIgeT0iMyIgd2lkdGg9IjEwIiBoZWlnaHQ9IjE4IiByeD0iMiIvPjxwYXRoIGQ9Ik0xMSAxOGgyIi8+PC9zdmc+"); }
.zicon--rotate { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0iTTIwIDExYTggOCAwIDEgMCAxLjIgNC4yIi8+PHBhdGggZD0iTTIwIDR2N2gtNyIvPjwvc3ZnPg=="); }
.zicon--check-double { -webkit-mask-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJibGFjayIgc3Ryb2tlLXdpZHRoPSIyLjYiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHBhdGggZD0ibTMgMTIgNCA0IDctOE0xMCAxNmwzIDMgOC05Ii8+PC9zdmc+"); }
</style>
