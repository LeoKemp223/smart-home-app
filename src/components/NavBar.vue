<script setup lang="ts">
import ZIcon from './ZIcon.vue'
import { statusBarStyle } from '@/utils/status-bar'

const sbStyle = statusBarStyle()

withDefaults(
  defineProps<{
    title?: string
    showBack?: boolean
    transparent?: boolean
  }>(),
  { title: '', showBack: false, transparent: false }
)

const emit = defineEmits<{ back: [] }>()

function handleBack() {
  emit('back')
  const pages = getCurrentPages()
  if (pages.length > 1) {
    uni.navigateBack()
  }
}
</script>

<template>
  <view class="navbar" :class="{ 'navbar--transparent': transparent }" :style="sbStyle">
    <view class="navbar__main">
      <view class="navbar__side">
        <view v-if="showBack" class="navbar__back" @tap="handleBack">
          <ZIcon name="chevron-left" :size="44" :stroke-width="4" color="#0f172a" />
        </view>
      </view>
      <text class="navbar__title zi-ellipsis">{{ title }}</text>
      <view class="navbar__side navbar__side--right">
        <slot name="right" />
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.navbar {
  position: sticky;
  top: 0;
  z-index: 40;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-bottom: 1rpx solid $border-1;
  padding-top: var(--status-bar-height, 44px);

  &--transparent {
    background: transparent;
    border-bottom: none;
    backdrop-filter: none;
  }

  &__main {
    min-height: 92rpx;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 24rpx;
  }

  &__side {
    width: 120rpx;
    display: flex;
    align-items: center;

    &--right {
      justify-content: flex-end;
    }
  }

  &__back {
    padding: 8rpx;
    margin-left: -8rpx;
    border-radius: 50%;

    &:active {
      background: rgba(15, 23, 42, 0.06);
    }
  }

  &__title {
    flex: 1;
    text-align: center;
    font-size: 32rpx;
    font-weight: 700;
    letter-spacing: 0.5rpx;
    color: $text-1;
  }
}
</style>
