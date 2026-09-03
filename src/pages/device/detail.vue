<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow, onHide } from '@dcloudio/uni-app'
import { getDeviceById, getEventLogs, sendCommandSync } from '@/api/mock/ziot-mock'
import type { Device, ControlItem, DeviceEventLog } from '@/types'
import { getPanel } from '@/data/product-panels'
import { bindToast, useToast, Toast } from '@/composables/useToast'
import { useDeviceEvents, requireAuth } from '@/composables/useDeviceEvents'
import NavBar from '@/components/NavBar.vue'
import ZIcon from '@/components/ZIcon.vue'
import ZModal from '@/components/ZModal.vue'

const toastRef = ref<InstanceType<typeof Toast> | null>(null)
const { show: showToast } = useToast()

const deviceId = ref('')
const device = ref<Device | null>(null)
const loadingIds = ref<Record<string, boolean>>({})
const activeTab = ref<'control' | 'logs'>('control')
const logs = ref<DeviceEventLog[]>([])
const confirmItem = ref<ControlItem | null>(null)

const panel = computed(() => getPanel(device.value?.product_id || ''))

/** 安全读取当前控件的 shadow 值 */
function getReported(control: ControlItem): any {
  return control.prop ? (device.value?.shadow_reported?.[control.prop] ?? undefined) : undefined
}
const isOnline = computed(() => device.value?.online_status === 'online')
const displayName = computed(() => device.value?.alias?.trim() || device.value?.name || '设备')

function goSettings() {
  uni.navigateTo({ url: `/pages/device/settings?id=${deviceId.value}` })
}

function refresh() {
  if (!deviceId.value) return
  device.value = getDeviceById(deviceId.value) || device.value
  logs.value = getEventLogs(deviceId.value)
}

onLoad((options) => {
  deviceId.value = options?.id || ''
})
onShow(() => {
  if (!requireAuth()) return
  refresh()
})

// SSE 增量 + 轮询兜底 4s
const { sseConnected, onEvent } = useDeviceEvents(deviceId.value)
onEvent((e) => {
  if (e.type === 'device.shadow.updated' || e.type === 'device.status.changed') refresh()
})
let pollTimer: ReturnType<typeof setInterval> | null = null
onShow(() => {
  pollTimer = setInterval(refresh, 4000)
})
onHide(() => {
  if (pollTimer) clearInterval(pollTimer)
})

/** 控制三步曲：loading → commands:sync(几十ms) → SSE/shadow 回读确认 */
async function handleControl(control: ControlItem, newValue: any) {
  if (!isOnline.value) {
    showToast('设备离线，无法控制', 'error')
    return
  }
  try {
    loadingIds.value = { ...loadingIds.value, [control.id]: true }
    const res = await sendCommandSync(deviceId.value, { prop: control.prop, service: control.service, value: newValue })
    if (res.status === 'success') {
      showToast('指令已发送，等待设备确认...', 'info')
    }
    setTimeout(() => {
      loadingIds.value = { ...loadingIds.value, [control.id]: false }
      refresh()
    }, 750)
  } catch (err) {
    loadingIds.value = { ...loadingIds.value, [control.id]: false }
    showToast((err as Error)?.message || '指令投递失败', 'error')
  }
}

function confirmAction() {
  const item = confirmItem.value
  confirmItem.value = null
  if (item) handleControl(item, true)
}

function onActionClick(control: ControlItem) {
  if (!isOnline.value) {
    showToast('设备离线，无法执行服务指令', 'error')
    return
  }
  if (control.confirm) {
    confirmItem.value = control
  } else {
    handleControl(control, true)
  }
}

function formatUpdateTime(iso?: string | null) {
  if (!iso) return '刚刚更新'
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return '刚刚更新'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前更新`
  const d = new Date(iso)
  return `${d.getMonth() + 1}月${d.getDate()}日 更新`
}

/** 主属性展示值 */
function statValue(prop: string): string {
  if (!device.value) return '--'
  if (prop === 'online_status') return isOnline.value ? '正常在线' : '离线'
  const v = device.value.shadow_reported?.[prop]
  if (v === undefined || v === null) return '--'
  if (prop === 'power' || prop === 'switch_main') return v ? '已开启' : '已关闭'
  if (prop === 'status') return v === 'opening' ? '正在开启' : v === 'closing' ? '正在关闭' : '已停止'
  if (prop === 'mode') {
    const modes: Record<string, string> = { reading: '阅读', movie: '观影', night: '夜灯', party: '炫彩', cool: '制冷', heat: '制热', dry: '除湿', fan: '送风' }
    return modes[v] || String(v)
  }
  if (typeof v === 'number' && !Number.isInteger(v)) return v.toFixed(1)
  return String(v)
}
</script>

<template>
  <view v-if="device" class="detail">
    <NavBar :title="displayName" show-back>
      <template #right>
        <view class="detail__nav-more" @tap="goSettings">
          <ZIcon name="more" :size="36" color="#0f172a" />
        </view>
      </template>
    </NavBar>

    <view class="detail__body">
      <!-- 离线警告 -->
      <view v-if="!isOnline" class="detail__offline-tip">
        <ZIcon name="alert" :size="30" color="#64748b" />
        <text>设备当前处于离线状态，展示历史缓存数据，控制功能暂已停用。</text>
      </view>

      <!-- 状态头卡 -->
      <view class="detail__hero" :class="{ 'detail__hero--offline': !isOnline }">
        <view class="detail__hero-top">
          <view class="detail__hero-status">
            <view class="detail__hero-dot" :class="{ 'detail__hero-dot--on': isOnline }" />
            <text>{{ isOnline ? '实时在线 · SSE 已连接' : '设备离线' }}</text>
          </view>
          <view class="detail__hero-time">
            <ZIcon name="clock" :size="24" :color="isOnline ? 'rgba(255,255,255,0.8)' : '#94a3b8'" />
            <text>{{ formatUpdateTime(device.shadow_updated_at) }}</text>
          </view>
        </view>

        <view class="detail__stats">
          <view v-for="stat in panel.mainStats" :key="stat.prop" class="detail__stat">
            <text class="detail__stat-label">{{ stat.label }}</text>
            <view class="detail__stat-value-row">
              <text class="detail__stat-value">{{ statValue(stat.prop) }}</text>
              <text v-if="stat.unit && statValue(stat.prop) !== '--'" class="detail__stat-unit">{{ stat.unit }}</text>
            </view>
          </view>
        </view>

        <view class="detail__hero-bottom">
          <text>型号: {{ panel.productName }}</text>
          <text>ID: {{ device.device_id }}</text>
        </view>
      </view>

      <!-- Tab 切换 -->
      <view class="detail__tabs">
        <view class="detail__tab" :class="{ 'detail__tab--active': activeTab === 'control' }" @tap="activeTab = 'control'">
          <text>控制面板</text>
        </view>
        <view class="detail__tab" :class="{ 'detail__tab--active': activeTab === 'logs' }" @tap="activeTab = 'logs'">
          <text>上报日志与记录 ({{ logs.length }})</text>
        </view>
      </view>

      <!-- 控制面板（模板驱动） -->
      <view v-if="activeTab === 'control'" class="detail__controls" :class="{ 'detail__controls--off': !isOnline }">
        <view v-for="control in panel.controls" :key="control.id">
          <!-- ① switch -->
          <view v-if="control.type === 'switch'" class="zi-card ctrl">
            <view class="ctrl__text">
              <text class="ctrl__label">{{ control.label }}</text>
              <text class="ctrl__desc">
                当前状态：{{ getReported(control) ? '已开启' : '已关闭' }}
              </text>
            </view>
            <view
              class="switch"
              :class="{ 'switch--on': !!getReported(control) }"
              @tap="handleControl(control, !getReported(control))"
            >
              <view v-if="loadingIds[control.id]" class="zi-spin switch__spin" />
              <view v-else class="switch__knob" />
            </view>
          </view>

          <!-- ② slider -->
          <view v-else-if="control.type === 'slider'" class="zi-card ctrl ctrl--block">
            <view class="ctrl__row">
              <text class="ctrl__label">{{ control.label }}</text>
              <view class="ctrl__value-wrap">
                <view v-if="loadingIds[control.id]" class="zi-spin zi-spin--brand" />
                <text class="ctrl__value">
                  {{ getReported(control) ?? control.min }} {{ control.unit || '' }}
                </text>
              </view>
            </view>
            <view class="ctrl__slider-row">
              <text class="ctrl__slider-minmax">{{ control.min }}</text>
              <slider
                class="ctrl__slider"
                :min="control.min ?? 0"
                :max="control.max ?? 100"
                :step="control.step ?? 1"
                :value="Number(getReported(control) ?? control.min ?? 0)"
                active-color="#2F6BFF"
                background-color="#e2e8f0"
                :block-size="24"
                :disabled="!isOnline || loadingIds[control.id]"
                @change="(e: any) => handleControl(control, e.detail.value)"
              />
              <text class="ctrl__slider-minmax">{{ control.max }}</text>
            </view>
          </view>

          <!-- ③ enum -->
          <view v-else-if="control.type === 'enum'" class="zi-card ctrl ctrl--block">
            <view class="ctrl__row">
              <text class="ctrl__label">{{ control.label }}</text>
              <view v-if="loadingIds[control.id]" class="zi-spin zi-spin--brand" />
            </view>
            <view class="ctrl__options">
              <view
                v-for="opt in control.options"
                :key="String(opt.value)"
                class="ctrl__option"
                :class="{ 'ctrl__option--active': getReported(control) === opt.value }"
                @tap="handleControl(control, opt.value)"
              >
                <text>{{ opt.label }}</text>
              </view>
            </view>
          </view>

          <!-- ④ action -->
          <view v-else-if="control.type === 'action'" class="zi-card ctrl">
            <view class="ctrl__text">
              <text class="ctrl__label">{{ control.label }}</text>
              <text class="ctrl__desc">下发物模型服务调用指令</text>
            </view>
            <view class="ctrl__action-btn" @tap="onActionClick(control)">
              <view v-if="loadingIds[control.id]" class="zi-spin zi-spin--brand ctrl__action-spin" />
              <ZIcon v-else name="rotate" :size="26" color="#475569" />
              <text>执行</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 日志 Tab -->
      <view v-else class="zi-card detail__logs">
        <view class="detail__logs-head">
          <text class="detail__logs-title">实时上报与控制时间线</text>
          <text class="detail__logs-sub">基于本地 SSE 缓存记录</text>
        </view>
        <view v-if="logs.length === 0" class="detail__logs-empty">
          <text>暂无该设备的历史上报记录，在控制面板操作将在此记录</text>
        </view>
        <view v-for="log in logs" v-else :key="log.id" class="detail__log-item">
          <view class="detail__log-dot" />
          <view class="detail__log-content">
            <view class="detail__log-row">
              <text class="detail__log-title">{{ log.title }}</text>
              <text class="detail__log-time">{{ log.time }}</text>
            </view>
            <text class="detail__log-detail">{{ log.detail }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 服务确认弹窗 -->
    <ZModal :visible="!!confirmItem" :title="confirmItem?.label" @close="confirmItem = null">
      <view class="action-confirm">
        <view class="action-confirm__icon">
          <ZIcon name="shield" :size="40" color="#2F6BFF" />
        </view>
        <text class="action-confirm__text">{{ confirmItem?.confirm || '确认执行该服务指令吗？' }}</text>
        <view class="action-confirm__btns">
          <button class="action-confirm__btn zi-btn-ghost" @tap="confirmItem = null">取消</button>
          <button
            class="action-confirm__btn zi-btn-primary"
            @tap="confirmAction()"
          >
            确认下发
          </button>
        </view>
      </view>
    </ZModal>

    <Toast :ref="(el: any) => { toastRef = el; bindToast(el) }" />
  </view>
</template>

<style scoped lang="scss">
.detail {
  min-height: 100vh;
  padding-bottom: calc(env(safe-area-inset-bottom, 0) + 60rpx);

  &__nav-more {
    padding: 8rpx;
  }

  &__body {
    padding: 32rpx;
    display: flex;
    flex-direction: column;
    gap: 24rpx;
  }

  &__offline-tip {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 24rpx;
    border-radius: $radius-card;
    background: rgba(226, 232, 240, 0.7);
    border: 1rpx solid $border-2;

    text {
      font-size: 22rpx;
      color: $text-2;
      line-height: 1.6;
    }
  }

  &__hero {
    padding: 40rpx;
    border-radius: 44rpx;
    background: linear-gradient(135deg, #2563eb 0%, #2f6bff 55%, #4f46e5 100%);
    color: #fff;
    box-shadow: 0 16rpx 40rpx rgba(47, 107, 255, 0.2);

    &--offline {
      background: $offline;
      color: $text-2;
      box-shadow: none;
    }
  }

  &__hero-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 22rpx;
    opacity: 0.9;
    margin-bottom: 24rpx;
  }

  &__hero-status {
    display: flex;
    align-items: center;
    gap: 10rpx;
    font-weight: 500;
  }

  &__hero-dot {
    width: 14rpx;
    height: 14rpx;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.5);

    &--on {
      background: #6ee7b7;
      animation: dot-pulse 1.6s ease-in-out infinite;
    }
  }

  &__hero-time {
    display: flex;
    align-items: center;
    gap: 6rpx;
    font-size: 20rpx;
    opacity: 0.8;
  }

  &__stats {
    display: flex;
    gap: 56rpx;
    flex-wrap: wrap;
    padding: 16rpx 0;
  }

  &__stat-label {
    font-size: 20rpx;
    font-weight: 500;
    opacity: 0.8;
    letter-spacing: 2rpx;
  }

  &__stat-value-row {
    display: flex;
    align-items: baseline;
    gap: 6rpx;
    margin-top: 8rpx;
  }

  &__stat-value {
    font-size: 60rpx;
    font-weight: 700;
    font-family: monospace;
    line-height: 1.1;
  }

  &__stat-unit {
    font-size: 24rpx;
    opacity: 0.8;
  }

  &__hero-bottom {
    display: flex;
    justify-content: space-between;
    margin-top: 24rpx;
    padding-top: 24rpx;
    border-top: 1rpx solid rgba(255, 255, 255, 0.15);
    font-size: 20rpx;
    opacity: 0.8;
  }

  &__tabs {
    display: flex;
    gap: 48rpx;
    border-bottom: 1rpx solid $border-2;
    padding: 0 8rpx;
  }

  &__tab {
    position: relative;
    padding-bottom: 20rpx;
    font-size: 26rpx;
    font-weight: 600;
    color: $text-3;

    &--active {
      color: $brand;

      &::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 6rpx;
        border-radius: 6rpx;
        background: $brand;
      }
    }
  }

  &__controls {
    display: flex;
    flex-direction: column;
    gap: 20rpx;

    &--off {
      opacity: 0.6;
      pointer-events: none;
    }
  }

  /* 日志 */
  &__logs {
    padding: 32rpx;
  }

  &__logs-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 20rpx;
    border-bottom: 1rpx solid $border-1;
  }

  &__logs-title {
    font-size: 24rpx;
    font-weight: 600;
    color: $text-1;
  }

  &__logs-sub {
    font-size: 20rpx;
    color: $text-3;
  }

  &__logs-empty {
    padding: 64rpx 0;
    text-align: center;
    font-size: 22rpx;
    color: $text-3;
  }

  &__log-item {
    display: flex;
    align-items: flex-start;
    gap: 20rpx;
    padding: 20rpx 0;
    border-bottom: 1rpx solid #f8fafc;

    &:last-child {
      border-bottom: none;
    }
  }

  &__log-dot {
    width: 14rpx;
    height: 14rpx;
    border-radius: 50%;
    background: $brand;
    margin-top: 12rpx;
    flex-shrink: 0;
  }

  &__log-content {
    flex: 1;
    min-width: 0;
  }

  &__log-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
  }

  &__log-title {
    font-size: 24rpx;
    font-weight: 600;
    color: $text-1;
  }

  &__log-time {
    font-size: 18rpx;
    color: $text-3;
    flex-shrink: 0;
  }

  &__log-detail {
    margin-top: 6rpx;
    font-size: 20rpx;
    color: $text-2;
    font-family: monospace;
    word-break: break-all;
    line-height: 1.6;
  }
}

/* 控制卡片 */
.ctrl {
  padding: 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;

  &--block {
    flex-direction: column;
    align-items: stretch;
    gap: 20rpx;
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
    min-width: 0;
  }

  &__label {
    font-size: 28rpx;
    font-weight: 600;
    color: $text-1;
  }

  &__desc {
    font-size: 22rpx;
    color: $text-3;
  }

  &__value-wrap {
    display: flex;
    align-items: center;
    gap: 14rpx;
  }

  &__value {
    font-size: 30rpx;
    font-weight: 700;
    color: $brand;
    font-family: monospace;
  }

  &__slider-row {
    display: flex;
    align-items: center;
    gap: 16rpx;
  }

  &__slider {
    flex: 1;
    margin: 0;
  }

  &__slider-minmax {
    font-size: 20rpx;
    color: $text-3;
    font-family: monospace;
  }

  &__options {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14rpx;

    @media (max-width: 400px) {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  &__option {
    padding: 16rpx 8rpx;
    border-radius: $radius-btn;
    background: $bg-page;
    border: 1rpx solid $border-1;
    text-align: center;
    font-size: 22rpx;
    font-weight: 500;
    color: $text-2;
    transition: all 0.15s;

    &--active {
      background: $brand;
      border-color: $brand;
      color: #fff;
      box-shadow: 0 6rpx 16rpx rgba(47, 107, 255, 0.25);
    }
  }

  &__action-btn {
    display: flex;
    align-items: center;
    gap: 10rpx;
    padding: 16rpx 32rpx;
    border-radius: $radius-btn;
    background: $bg-hover;
    font-size: 24rpx;
    font-weight: 600;
    color: $text-2;

    &:active {
      background: $border-2;
    }
  }

  &__action-spin {
    width: 26rpx;
    height: 26rpx;
  }
}

/* iOS 风格开关 */
.switch {
  position: relative;
  width: 96rpx;
  height: 56rpx;
  border-radius: 28rpx;
  background: $border-2;
  display: flex;
  align-items: center;
  transition: background 0.2s;
  flex-shrink: 0;

  &--on {
    background: $brand;
  }

  &__knob {
    width: 48rpx;
    height: 48rpx;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 4rpx 8rpx rgba(15, 23, 42, 0.15);
    margin: 0 4rpx;
    transition: transform 0.2s;

    .switch--on & {
      transform: translateX(40rpx);
    }
  }

  &__spin {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 28rpx;
    height: 28rpx;
  }
}

/* 服务确认弹窗 */
.action-confirm {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  &__icon {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: $brand-50;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20rpx;
  }

  &__text {
    font-size: 24rpx;
    color: $text-2;
    line-height: 1.7;
  }

  &__btns {
    display: flex;
    gap: 20rpx;
    margin-top: 36rpx;
    width: 100%;
  }

  &__btn {
    flex: 1;
    height: 84rpx;
    font-size: 26rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

@keyframes dot-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}
</style>
