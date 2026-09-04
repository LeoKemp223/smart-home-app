<script setup lang="ts">
withDefaults(defineProps<{ size?: number }>(), { size: 176 })
</script>

<template>
  <view class="zlogo" :style="{ width: size + 'rpx', height: size + 'rpx' }" />
</template>

<style scoped>
/* ZIOT 品牌图标：轨道环 + Z（云端组网、设备互联），内联自 static/logo.svg；
   base64 background-image 与 ZIcon 的 mask 同机制，H5 / 小程序 / App 三端可用 */
.zlogo {
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain;
  background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1MTIiIGhlaWdodD0iNTEyIiB2aWV3Qm94PSIwIDAgMjQgMjQiPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMTIiIHI9IjkuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjMkY2QkZGIiBzdHJva2Utd2lkdGg9IjEuOCIvPgogIDxjaXJjbGUgY3g9IjEyIiBjeT0iMi43IiByPSIxLjciIGZpbGw9IiMyRjZCRkYiLz4KICA8Y2lyY2xlIGN4PSIyMC40IiBjeT0iMTYuMiIgcj0iMS43IiBmaWxsPSIjMkY2QkZGIi8+CiAgPHBhdGggZmlsbD0iIzJGNkJGRiIgZD0iTTkuNCA4LjRoNS4ydjEuNGwtMy4yIDMuNmgzLjJ2MS40SDkuNHYtMS40bDMuMi0zLjZIOS40WiIvPgo8L3N2Zz4K");
}
</style>