<script setup lang="ts">
/**
 * 通用居中弹窗（对齐参考实现的 AliasModal/UnbindConfirmModal/确认弹窗视觉）
 */
withDefaults(defineProps<{ visible: boolean; title?: string }>(), { title: '' })
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <view v-if="visible" class="zmodal" @tap="emit('close')">
    <view class="zmodal__mask" />
    <view class="zmodal__panel" @tap.stop>
      <view class="zmodal__head">
        <text class="zmodal__title">{{ title }}</text>
        <view class="zmodal__close" @tap="emit('close')">
          <ZIcon name="x" :size="34" color="#94a3b8" />
        </view>
      </view>
      <slot />
    </view>
  </view>
</template>

<style scoped lang="scss">
.zmodal {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32rpx;

  &__mask {
    position: absolute;
    inset: 0;
    background: rgba(15, 23, 42, 0.5);
    backdrop-filter: blur(2px);
  }

  &__panel {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 600rpx;
    background: #fff;
    border-radius: 32rpx;
    padding: 36rpx;
    box-shadow: 0 25rpx 50rpx rgba(15, 23, 42, 0.2);
    animation: zmodal-in 0.18s ease;
  }

  &__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20rpx;
  }

  &__title {
    font-size: 32rpx;
    font-weight: 600;
    color: $text-1;
  }

  &__close {
    padding: 6rpx;
    border-radius: 50%;
  }
}

@keyframes zmodal-in {
  from {
    transform: scale(0.92);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
