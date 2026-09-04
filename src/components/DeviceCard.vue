<script setup lang="ts">
import { computed } from 'vue'
import type { Device } from '@/types'
import { getPanel } from '@/data/product-panels'
import ZIcon from './ZIcon.vue'

const props = defineProps<{ device: Device }>()
const emit = defineEmits<{ click: []; longpress: [] }>()

let pressTimer: ReturnType<typeof setTimeout> | null = null
let longTriggered = false

function onTouchStart() {
  longTriggered = false
  pressTimer = setTimeout(() => {
    longTriggered = true
    emit('longpress')
  }, 600)
}
function onTouchEnd() {
  if (pressTimer) clearTimeout(pressTimer)
}
function onTap() {
  if (longTriggered) return
  emit('click')
}

const panel = computed(() => getPanel(props.device.product_key || props.device.product_id))
const isOnline = computed(() => props.device.online_status === 'online')
const displayName = computed(() => props.device.alias?.trim() || props.device.name)
const isDisabled = computed(() => props.device.status === 'disabled')

/** 按产品面板主属性生成摘要 */
const summary = computed(() => {
  const rep = props.device.shadow_reported || {}
  switch (props.device.category) {
    case 'sensor':
      return typeof rep.temperature === 'number'
        ? `${rep.temperature.toFixed(1)}°C · ${Math.round(rep.humidity ?? 0)}%`
        : '暂无温湿上报'
    case 'light':
      return rep.power ? `已开启 · ${rep.brightness ?? 100}%` : '已关闭'
    case 'socket':
      return rep.switch_main ? `供电中 · ${rep.power_w ?? 0}W` : '已断电'
    case 'ac': {
      if (!rep.power) return '待机中'
      const modes: Record<string, string> = { cool: '制冷', heat: '制热', dry: '除湿', fan: '送风' }
      return `${modes[rep.mode] || '制冷'} · ${rep.target_temp ?? 26}°C`
    }
    case 'curtain':
      return `开合度 ${rep.position ?? 0}%`
    default:
      return isOnline.value ? '正常待机' : '未连接'
  }
})

const statusLabel = computed(() =>
  isDisabled.value ? '已禁用' : isOnline.value ? '在线' : props.device.online_status === 'offline' ? '离线' : '未上线'
)
</script>

<template>
  <view
    class="dcard"
    :class="{ 'dcard--offline': !isOnline, 'dcard--disabled': isDisabled }"
    @tap="onTap"
    @longpress="emit('longpress')"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
    @touchcancel="onTouchEnd"
  >
    <view class="dcard__top">
      <view class="dcard__icon" :class="{ 'dcard__icon--off': !isOnline }">
        <ZIcon :name="panel.icon" :size="44" :color="isOnline ? '#2F6BFF' : '#94a3b8'" />
      </view>
      <view class="dcard__status">
        <view class="dcard__dot" :class="{ 'dcard__dot--on': isOnline }" />
        <text class="dcard__status-text">{{ statusLabel }}</text>
      </view>
    </view>

    <view class="dcard__bottom">
      <text class="dcard__name zi-ellipsis">{{ displayName }}</text>
      <text class="dcard__summary zi-ellipsis">{{ summary }}</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.dcard {
  min-height: 268rpx;
  padding: 28rpx;
  border-radius: $radius-card;
  background: $bg-card;
  border: 1rpx solid $border-1;
  box-shadow: $shadow-card;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.16s ease, box-shadow 0.16s ease, border-color 0.16s ease;

  &:active {
    transform: scale(0.985);
    box-shadow: 0 3rpx 10rpx rgba(15, 23, 42, 0.06);
  }

  &--offline {
    background: rgba(248, 250, 252, 0.85);
    border-color: rgba(226, 232, 240, 0.7);
  }

  &--disabled {
    opacity: 0.6;
  }

  &__top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
  }

  &__icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 20rpx;
    background: rgba(47, 107, 255, 0.06);
    display: flex;
    align-items: center;
    justify-content: center;

    &--off {
      background: $bg-hover;
    }
  }

  &__status {
    display: flex;
    align-items: center;
    gap: 8rpx;
    padding-top: 4rpx;
  }

  &__dot {
    width: 14rpx;
    height: 14rpx;
    border-radius: 50%;
    background: $offline;

    &--on {
      background: $online;
      box-shadow: 0 0 8rpx rgba(0, 181, 120, 0.4);
    }
  }

  &__status-text {
    font-size: 22rpx;
    font-weight: 500;
    color: $text-2;
  }

  &__name {
    margin-top: 20rpx;
    font-size: 28rpx;
    font-weight: 600;
    color: $text-1;
  }

  &--offline &__name {
    color: $text-2;
  }

  &__summary {
    margin-top: 6rpx;
    font-size: 24rpx;
    color: $text-2;
  }

  &--offline &__summary {
    color: $text-3;
  }
}
</style>
