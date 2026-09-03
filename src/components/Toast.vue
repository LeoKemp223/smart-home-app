<script setup lang="ts">
/**
 * 全局 Toast（uni.showToast 在 H5 的样式与参考差异较大，自定义轻量实现）
 */
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

const toasts = ref<ToastItem[]>([])
let seq = 0

function show(message: string, type: ToastType = 'info') {
  const id = ++seq
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }, 2600)
}

defineExpose({ show })
</script>

<template>
  <view class="ztoast-wrap">
    <view
      v-for="t in toasts"
      :key="t.id"
      class="ztoast"
      :class="{
        'ztoast--success': t.type === 'success',
        'ztoast--error': t.type === 'error',
        'ztoast--info': t.type === 'info',
      }"
    >
      <ZIcon
        :name="t.type === 'success' ? 'check-circle' : t.type === 'error' ? 'alert' : 'info'"
        :size="30"
        color="#ffffff"
      />
      <text class="ztoast__msg">{{ t.message }}</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.ztoast-wrap {
  position: fixed;
  top: 176rpx;
  left: 0;
  right: 0;
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
  pointer-events: none;
  padding: 0 48rpx;
}

.ztoast {
  display: flex;
  align-items: center;
  gap: 14rpx;
  padding: 18rpx 32rpx;
  border-radius: $radius-tag;
  box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.18);
  animation: ztoast-in 0.2s ease;
  max-width: 100%;

  &__msg {
    color: #fff;
    font-size: 26rpx;
    font-weight: 500;
  }

  &--success {
    background: $online;
  }
  &--error {
    background: $danger;
  }
  &--info {
    background: #1e293b;
  }
}

@keyframes ztoast-in {
  from {
    transform: translateY(-16rpx);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}
</style>
