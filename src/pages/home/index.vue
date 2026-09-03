<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow, onHide } from '@dcloudio/uni-app'
import { getDevices, patchDeviceAlias, unbindDevice } from '@/api/mock/ziot-mock'
import type { Device } from '@/types'
import { bindToast, useToast, Toast } from '@/composables/useToast'
import { useDeviceEvents, requireAuth } from '@/composables/useDeviceEvents'
import DeviceCard from '@/components/DeviceCard.vue'
import ZModal from '@/components/ZModal.vue'
import ZIcon from '@/components/ZIcon.vue'

const toastRef = ref<InstanceType<typeof Toast> | null>(null)
const { show: showToast } = useToast()

const devices = ref<Device[]>([])
const isRefreshing = ref(false)

// 长按 ActionSheet + 弹窗
const actionDevice = ref<Device | null>(null)
const showActionSheet = ref(false)
const showAliasModal = ref(false)
const showUnbindModal = ref(false)
const aliasInput = ref('')
const aliasLoading = ref(false)
const unbindLoading = ref(false)

const unreadCount = computed(() => 0) // 消息页维护，暂不做跨页未读

function loadDevices() {
  devices.value = getDevices()
}

onShow(() => {
  if (!requireAuth()) return
  loadDevices()
})

onHide(() => {})

// SSE 连接状态 + 增量刷新
const { sseConnected } = useDeviceEvents()
const { onEvent } = useDeviceEvents()
onEvent((event) => {
  if (event.type === 'device.shadow.updated' || event.type === 'device.status.changed') {
    loadDevices()
  }
})

// 轮询兜底 8s
let pollTimer: ReturnType<typeof setInterval> | null = null
onShow(() => {
  pollTimer = setInterval(loadDevices, 8000)
})
onHide(() => {
  if (pollTimer) clearInterval(pollTimer)
})

function getGreeting() {
  const h = new Date().getHours()
  if (h < 6) return '夜深了'
  if (h < 11) return '早上好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  return '晚上好'
}

const userNickname = ref('主人')
onShow(() => {
  try {
    const raw = uni.getStorageSync('ziot_user_v2')
    if (raw) {
      const user = JSON.parse(raw)
      userNickname.value = user.nickname || '主人'
    }
  } catch {
    /* ignore */
  }
})

const onlineCount = computed(() => devices.value.filter((d) => d.online_status === 'online').length)

async function handleRefresh() {
  isRefreshing.value = true
  await new Promise((r) => setTimeout(r, 450))
  loadDevices()
  isRefreshing.value = false
  showToast('设备状态已刷新', 'success')
}

function onCardClick(d: Device) {
  uni.navigateTo({ url: `/pages/device/detail?id=${d.device_id}` })
}

function onCardLongPress(d: Device) {
  actionDevice.value = d
  showActionSheet.value = true
}

function goMessages() {
  uni.navigateTo({ url: '/pages/messages/index' })
}
function goAdd() {
  uni.switchTab({ url: '/pages/add/index' })
}
function goDeviceSettings() {
  const id = actionDevice.value?.device_id
  if (id) uni.navigateTo({ url: `/pages/device/settings?id=${id}` })
}

function openAliasModal() {
  aliasInput.value = actionDevice.value?.alias || ''
  showAliasModal.value = true
}

async function saveAlias() {
  if (!actionDevice.value) return
  try {
    aliasLoading.value = true
    await patchDeviceAlias(actionDevice.value.device_id, aliasInput.value)
    showToast('别名已更新', 'success')
    showAliasModal.value = false
    loadDevices()
  } catch (err) {
    showToast((err as Error)?.message || '更新别名失败', 'error')
  } finally {
    aliasLoading.value = false
  }
}

async function confirmUnbind() {
  if (!actionDevice.value) return
  try {
    unbindLoading.value = true
    await unbindDevice(actionDevice.value.device_id)
    showToast('设备已成功解除绑定', 'success')
    showUnbindModal.value = false
    loadDevices()
  } catch (err) {
    showToast((err as Error)?.message || '解绑失败', 'error')
  } finally {
    unbindLoading.value = false
  }
}
</script>

<template>
  <view class="home">
    <!-- 顶部问候区 -->
    <view class="home__header">
      <view class="home__status-row">
        <view class="home__sse" :class="{ 'home__sse--on': sseConnected }">
          <view class="home__sse-dot" />
          <text>{{ sseConnected ? 'SSE保活' : '重连中' }}</text>
        </view>
        <view class="home__status-icons">
          <ZIcon name="wifi" :size="26" color="#94a3b8" />
          <ZIcon name="battery" :size="26" color="#94a3b8" />
        </view>
      </view>

      <view class="home__greet-row">
        <view>
          <text class="home__greet">{{ getGreeting() }}，{{ userNickname }}</text>
          <text class="home__sub">已接入 {{ devices.length }} 台设备 · {{ onlineCount }} 台在线</text>
        </view>
        <view class="home__actions">
          <view class="home__action-btn" :class="{ 'home__action-btn--spin': isRefreshing }" @tap="handleRefresh">
            <ZIcon name="refresh" :size="34" :color="isRefreshing ? '#2F6BFF' : '#475569'" />
          </view>
          <view class="home__action-btn" @tap="goMessages">
            <ZIcon name="bell" :size="36" color="#475569" />
            <view v-if="unreadCount > 0" class="home__badge" />
          </view>
        </view>
      </view>
    </view>

    <!-- 筛选占位 -->
    <scroll-view scroll-x class="home__pills" :show-scrollbar="false">
      <view class="home__pill home__pill--active">全部设备 ({{ devices.length }})</view>
      <view class="home__pill">常用设备</view>
      <view class="home__pill">客厅</view>
      <view class="home__pill">卧室</view>
    </scroll-view>

    <!-- 设备宫格 / 空态 -->
    <view v-if="devices.length === 0" class="home__empty">
      <view class="home__empty-icon">
        <ZIcon name="cpu" :size="80" color="#2F6BFF" :stroke-width="3.2" />
      </view>
      <text class="home__empty-title">暂无已绑定的智能设备</text>
      <text class="home__empty-desc">扫描设备机身上的 ZIOT 二维码，或输入 20 位绑定码，开启全屋智慧互联。</text>
      <button class="home__empty-btn zi-btn-primary" @tap="goAdd">
        + 添加第一台设备
      </button>
    </view>

    <view v-else class="home__grid">
      <DeviceCard
        v-for="d in devices"
        :key="d.device_id"
        :device="d"
        @click="onCardClick(d)"
        @longpress="onCardLongPress(d)"
      />
      <view class="home__add-tile" @tap="goAdd">
        <view class="home__add-circle">
          <ZIcon name="plus" :size="40" color="#64748b" :stroke-width="4.2" />
        </view>
        <text class="home__add-title">添加设备</text>
        <text class="home__add-desc">扫码或手动输码</text>
      </view>
    </view>

    <!-- 长按 ActionSheet -->
    <view v-if="showActionSheet && actionDevice" class="sheet" @tap="showActionSheet = false">
      <view class="sheet__mask" />
      <view class="sheet__panel" @tap.stop>
        <view class="sheet__head">
          <view>
            <text class="sheet__title">{{ actionDevice.alias?.trim() || actionDevice.name }}</text>
            <text class="sheet__sub">{{ actionDevice.product_name }} · {{ actionDevice.device_id }}</text>
          </view>
          <view class="sheet__close" @tap="showActionSheet = false">
            <ZIcon name="x" :size="34" color="#94a3b8" />
          </view>
        </view>

        <view class="sheet__item" @tap="showActionSheet = false; openAliasModal()">
          <view class="sheet__icon sheet__icon--blue">
            <ZIcon name="edit" :size="30" color="#2F6BFF" />
          </view>
          <view class="sheet__item-text">
            <text class="sheet__item-title">修改设备别名</text>
            <text class="sheet__item-desc">仅自己账号可见，不影响其他家庭成员</text>
          </view>
        </view>

        <view
          class="sheet__item"
          @tap="showActionSheet = false; goDeviceSettings()"
        >
          <view class="sheet__icon">
            <ZIcon name="settings" :size="30" color="#475569" />
          </view>
          <view class="sheet__item-text">
            <text class="sheet__item-title">设备设置与详情</text>
            <text class="sheet__item-desc">查看固件版本、设备标识及配置</text>
          </view>
        </view>

        <view class="sheet__item sheet__item--danger" @tap="showActionSheet = false; showUnbindModal = true">
          <view class="sheet__icon sheet__icon--danger">
            <ZIcon name="trash" :size="30" color="#FA5151" />
          </view>
          <view class="sheet__item-text">
            <text class="sheet__item-title sheet__item-title--danger">解除绑定设备</text>
            <text class="sheet__item-desc sheet__item-desc--danger">软删除解绑，不影响家庭其他已绑成员</text>
          </view>
        </view>

        <button class="sheet__cancel zi-btn-ghost" @tap="showActionSheet = false">取消</button>
      </view>
    </view>

    <!-- 改别名弹窗 -->
    <ZModal :visible="showAliasModal" title="修改设备别名" @close="showAliasModal = false">
      <text class="modal__hint">
        原厂设备名：{{ actionDevice?.name }}。别名仅在当前登录账号下展示，支持留空以恢复默认设备名。
      </text>
      <view class="modal__input-box">
        <input
          v-model="aliasInput"
          :maxlength="128"
          :placeholder="actionDevice?.name || '输入设备别名'"
          placeholder-class="modal__placeholder"
          class="modal__input"
        />
        <text class="modal__count">{{ aliasInput.length }}/128</text>
      </view>
      <view class="modal__btns">
        <button class="modal__btn zi-btn-ghost" :disabled="aliasLoading" @tap="showAliasModal = false">取消</button>
        <button class="modal__btn zi-btn-primary" :disabled="aliasLoading" @tap="saveAlias">
          <view v-if="aliasLoading" class="zi-spin" />
          <text>{{ aliasLoading ? '' : '保存' }}</text>
        </button>
      </view>
    </ZModal>

    <!-- 解绑确认弹窗 -->
    <ZModal :visible="showUnbindModal" @close="showUnbindModal = false">
      <view class="unbind">
        <view class="unbind__icon">
          <ZIcon name="alert" :size="52" color="#FA5151" :stroke-width="3.6" />
        </view>
        <text class="unbind__title">确认解除绑定？</text>
        <text class="unbind__desc">
          您即将解除设备「{{ actionDevice?.alias?.trim() || actionDevice?.name }}」的关联。
          解绑后您将无法在当前账号控制该设备，此操作不会影响其他已绑定该设备的家庭成员。
        </text>
        <view class="modal__btns">
          <button class="modal__btn zi-btn-ghost" :disabled="unbindLoading" @tap="showUnbindModal = false">
            我再想想
          </button>
          <button class="modal__btn modal__btn--danger" :disabled="unbindLoading" @tap="confirmUnbind">
            <view v-if="unbindLoading" class="zi-spin" />
            <ZIcon v-else name="trash" :size="28" color="#ffffff" />
            <text>确认解绑</text>
          </button>
        </view>
      </view>
    </ZModal>

    <Toast :ref="(el: any) => { toastRef = el; bindToast(el) }" />
  </view>
</template>

<style scoped lang="scss">
.home {
  min-height: 100vh;
  padding-bottom: calc(env(safe-area-inset-bottom, 0) + 200rpx);

  &__header {
    position: sticky;
    top: 0;
    z-index: 30;
    background: rgba(248, 250, 252, 0.92);
    backdrop-filter: blur(12px);
    padding: calc(var(--status-bar-height, 44px) + 16rpx) 32rpx 20rpx;
    border-bottom: 1rpx solid $border-1;
  }

  &__status-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 18rpx;
  }

  &__sse {
    display: flex;
    align-items: center;
    gap: 8rpx;
    font-size: 18rpx;
    color: $text-3;

    &--on {
      color: $online;
    }
  }

  &__sse-dot {
    width: 10rpx;
    height: 10rpx;
    border-radius: 50%;
    background: $warning;

    .home__sse--on & {
      background: $online;
    }
  }

  &__status-icons {
    display: flex;
    align-items: center;
    gap: 12rpx;
  }

  &__greet-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__greet {
    display: block;
    font-size: 40rpx;
    font-weight: 700;
    color: $text-1;
  }

  &__sub {
    display: block;
    margin-top: 6rpx;
    font-size: 22rpx;
    color: $text-2;
  }

  &__actions {
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  &__action-btn {
    position: relative;
    width: 76rpx;
    height: 76rpx;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;

    &--spin {
      animation: zi-rotate 0.8s linear infinite;
    }
  }

  &__badge {
    position: absolute;
    top: 14rpx;
    right: 14rpx;
    width: 16rpx;
    height: 16rpx;
    border-radius: 50%;
    background: $danger;
    border: 3rpx solid #fff;
  }

  &__pills {
    display: flex;
    gap: 16rpx;
    padding: 24rpx 32rpx 16rpx;
    white-space: nowrap;
  }

  &__pill {
    display: inline-block;
    padding: 12rpx 28rpx;
    border-radius: $radius-tag;
    font-size: 22rpx;
    font-weight: 500;
    background: #fff;
    color: $text-2;
    border: 1rpx solid rgba(226, 232, 240, 0.8);

    &--active {
      background: $brand;
      color: #fff;
      border-color: $brand;
      box-shadow: 0 4rpx 12rpx rgba(47, 107, 255, 0.2);
    }
  }

  &__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24rpx;
    padding: 16rpx 32rpx;
  }

  &__empty {
    padding: 128rpx 64rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  &__empty-icon {
    width: 160rpx;
    height: 160rpx;
    border-radius: 50%;
    background: $brand-50;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 32rpx;
  }

  &__empty-title {
    font-size: 30rpx;
    font-weight: 600;
    color: $text-1;
  }

  &__empty-desc {
    margin-top: 14rpx;
    font-size: 22rpx;
    color: $text-2;
    line-height: 1.7;
  }

  &__empty-btn {
    margin-top: 40rpx;
    padding: 0 56rpx;
    height: 84rpx;
    font-size: 26rpx;
    display: flex;
    align-items: center;
  }

  &__add-tile {
    min-height: 256rpx;
    padding: 28rpx;
    border-radius: $radius-card;
    border: 3rpx dashed $border-2;
    background: rgba(255, 255, 255, 0.5);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10rpx;

    &:active {
      transform: scale(0.98);
      border-color: rgba(47, 107, 255, 0.4);
    }
  }

  &__add-circle {
    width: 80rpx;
    height: 80rpx;
    border-radius: 50%;
    background: $bg-hover;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8rpx;
  }

  &__add-title {
    font-size: 24rpx;
    font-weight: 600;
    color: $text-2;
  }

  &__add-desc {
    font-size: 20rpx;
    color: $text-3;
  }
}

/* ActionSheet */
.sheet {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-end;
  justify-content: center;

  &__mask {
    position: absolute;
    inset: 0;
    background: rgba(15, 23, 42, 0.4);
  }

  &__panel {
    position: relative;
    z-index: 1;
    width: 100%;
    background: #fff;
    border-radius: 48rpx 48rpx 0 0;
    padding: 40rpx 40rpx calc(env(safe-area-inset-bottom, 0) + 40rpx);
    animation: sheet-in 0.22s ease;
  }

  &__head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding-bottom: 24rpx;
    border-bottom: 1rpx solid $border-1;
  }

  &__title {
    display: block;
    font-size: 32rpx;
    font-weight: 600;
    color: $text-1;
  }

  &__sub {
    display: block;
    margin-top: 8rpx;
    font-size: 22rpx;
    color: $text-3;
  }

  &__close {
    padding: 6rpx;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 24rpx;
    padding: 24rpx 16rpx;
    border-radius: $radius-btn;

    &:active {
      background: $bg-hover;
    }
  }

  &__icon {
    width: 64rpx;
    height: 64rpx;
    border-radius: 16rpx;
    background: $bg-hover;
    display: flex;
    align-items: center;
    justify-content: center;

    &--blue {
      background: $brand-50;
    }
    &--danger {
      background: rgba(250, 81, 81, 0.1);
    }
  }

  &__item-text {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }

  &__item-title {
    font-size: 28rpx;
    font-weight: 500;
    color: $text-1;

    &--danger {
      color: $danger;
      font-weight: 600;
    }
  }

  &__item-desc {
    font-size: 22rpx;
    color: $text-3;

    &--danger {
      color: rgba(250, 81, 81, 0.7);
    }
  }

  &__cancel {
    margin-top: 16rpx;
    height: 84rpx;
    font-size: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}

@keyframes sheet-in {
  from {
    transform: translateY(80rpx);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

/* 弹窗公共 */
.modal__hint {
  display: block;
  font-size: 22rpx;
  color: $text-2;
  line-height: 1.7;
  margin-bottom: 24rpx;
}

.modal__input-box {
  position: relative;
}

.modal__input {
  width: 100%;
  height: 88rpx;
  padding: 0 120rpx 0 28rpx;
  border-radius: $radius-btn;
  border: 1rpx solid $border-2;
  font-size: 28rpx;
  color: $text-1;
  box-sizing: border-box;
}

.modal__placeholder {
  color: $text-3;
}

.modal__count {
  position: absolute;
  right: 24rpx;
  top: 50%;
  transform: translateY(-50%);
  font-size: 20rpx;
  color: $text-3;
}

.modal__btns {
  display: flex;
  gap: 20rpx;
  margin-top: 36rpx;
}

.modal__btn {
  flex: 1;
  height: 84rpx;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;

  &--danger {
    background: $danger;
    color: #fff;
    border-radius: $radius-btn;
    font-weight: 600;
    box-shadow: 0 8rpx 20rpx rgba(250, 81, 81, 0.25);
  }
}

/* 解绑弹窗 */
.unbind {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  &__icon {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    background: rgba(250, 81, 81, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20rpx;
  }

  &__title {
    font-size: 32rpx;
    font-weight: 600;
    color: $text-1;
  }

  &__desc {
    margin-top: 16rpx;
    font-size: 22rpx;
    color: $text-2;
    line-height: 1.8;
  }
}
</style>
