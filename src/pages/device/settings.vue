<script setup lang="ts">
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { getDeviceById, patchDeviceAlias, unbindDevice } from '@/api/mock/ziot-mock'
import type { Device } from '@/types'
import { useToast } from '@/composables/useToast'
import { requireAuth } from '@/composables/useDeviceEvents'
import NavBar from '@/components/NavBar.vue'
import ZIcon from '@/components/ZIcon.vue'
import ZModal from '@/components/ZModal.vue'

const { show: showToast } = useToast()

const deviceId = ref('')
const device = ref<Device | null>(null)

const showAliasModal = ref(false)
const aliasInput = ref('')
const aliasLoading = ref(false)
const showUnbindModal = ref(false)
const unbindLoading = ref(false)
const copied = ref(false)

const isOnline = computed(() => device.value?.online_status === 'online')

function refresh() {
  if (!deviceId.value) return
  device.value = getDeviceById(deviceId.value) || device.value
}

onLoad((options) => {
  deviceId.value = options?.id || ''
})
onShow(() => {
  if (!requireAuth()) return
  refresh()
})

function openAlias() {
  aliasInput.value = device.value?.alias || ''
  showAliasModal.value = true
}

async function saveAlias() {
  if (!deviceId.value) return
  try {
    aliasLoading.value = true
    await patchDeviceAlias(deviceId.value, aliasInput.value)
    showToast('别名修改成功', 'success')
    showAliasModal.value = false
    refresh()
  } catch (err) {
    showToast((err as Error)?.message || '别名修改失败', 'error')
  } finally {
    aliasLoading.value = false
  }
}

async function confirmUnbind() {
  if (!deviceId.value) return
  try {
    unbindLoading.value = true
    await unbindDevice(deviceId.value)
    showToast('设备已成功解除绑定', 'success')
    showUnbindModal.value = false
    setTimeout(() => uni.reLaunch({ url: '/pages/home/index' }), 500)
  } catch (err) {
    showToast((err as Error)?.message || '解绑失败', 'error')
  } finally {
    unbindLoading.value = false
  }
}

function copyDeviceId() {
  if (!deviceId.value) return
  uni.setClipboardData({
    data: deviceId.value,
    showToast: false,
    success: () => {
      copied.value = true
      showToast('设备标识 (ID) 已复制到剪贴板', 'success')
      setTimeout(() => (copied.value = false), 2000)
    },
  })
}
</script>

<template>
  <view v-if="device" class="ds">
    <NavBar title="设备设置" show-back />

    <view class="ds__body">
      <!-- 名称与别名 -->
      <view class="zi-card ds__group">
        <view class="ds__row ds__row--tap" @tap="openAlias">
          <view class="ds__col">
            <text class="ds__row-label">设备别名 (仅自己可见)</text>
            <text class="ds__row-strong">{{ device.alias || '未设置 (使用默认名称)' }}</text>
          </view>
          <view class="ds__edit">
            <text>修改</text>
            <ZIcon name="chevron-right" :size="28" color="#2F6BFF" />
          </view>
        </view>
        <view class="ds__divider" />
        <view class="ds__row">
          <view class="ds__col">
            <text class="ds__row-label">原厂设备名称 (只读)</text>
            <text class="ds__row-value ds__row-value--strong">{{ device.name }}</text>
          </view>
        </view>
      </view>

      <!-- 硬件元信息 -->
      <view class="zi-card ds__group">
        <view class="ds__row">
          <view class="ds__col ds__col--grow">
            <text class="ds__row-label">设备唯一标识 (Device ID)</text>
            <text class="ds__row-mono">{{ device.device_id }}</text>
          </view>
          <view class="ds__copy" @tap="copyDeviceId">
            <ZIcon :name="copied ? 'check' : 'copy'" :size="30" :color="copied ? '#00B578' : '#94a3b8'" />
          </view>
        </view>
        <view class="ds__divider" />
        <view class="ds__row ds__row--simple">
          <text class="ds__row-label">产品型号 (Product Key)</text>
          <text class="ds__row-mono">{{ device.product_id }}</text>
        </view>
        <view class="ds__divider" />
        <view class="ds__row ds__row--simple">
          <text class="ds__row-label">连接状态</text>
          <view class="ds__status">
            <view class="ds__status-dot" :class="{ 'ds__status-dot--on': isOnline }" />
            <text class="ds__row-value">{{ isOnline ? '实时在线' : '离线中' }}</text>
          </view>
        </view>
        <view class="ds__divider" />
        <view class="ds__row ds__row--simple">
          <text class="ds__row-label">固件版本</text>
          <text class="ds__row-mono">{{ device.firmware_version || '—' }}</text>
        </view>
        <view class="ds__divider" />
        <view class="ds__row ds__row--simple">
          <text class="ds__row-label">绑定时间</text>
          <text class="ds__row-value">{{ device.bound_at }}</text>
        </view>
      </view>

      <!-- 家庭共享提示 -->
      <view class="ds__share-tip">
        <view class="ds__share-head">
          <ZIcon name="qrcode" :size="26" color="#475569" />
          <text>家人共享使用提示</text>
        </view>
        <text class="ds__share-text">
          若需让家人共同控制该设备，直接让家人使用其 APP 扫描机身或包装上的二维码即可绑定，无需迁移账号。
        </text>
      </view>

      <!-- 解绑 -->
      <button class="ds__unbind" @tap="showUnbindModal = true">
        <ZIcon name="trash" :size="30" color="#FA5151" />
        <text>解除设备绑定</text>
      </button>
    </view>

    <!-- 改别名弹窗 -->
    <ZModal :visible="showAliasModal" title="修改设备别名" @close="showAliasModal = false">
      <text class="ds__alias-hint">
        原厂设备名：{{ device.name }}。别名仅在当前登录账号下展示，支持留空以恢复默认设备名。
      </text>
      <view class="ds__alias-box">
        <input
          v-model="aliasInput"
          :maxlength="128"
          :placeholder="device.name"
          placeholder-class="ds__alias-placeholder"
          class="ds__alias-input"
        />
        <text class="ds__alias-count">{{ aliasInput.length }}/128</text>
      </view>
      <view class="ds__modal-btns">
        <button class="ds__modal-btn zi-btn-ghost" :disabled="aliasLoading" @tap="showAliasModal = false">取消</button>
        <button class="ds__modal-btn zi-btn-primary" :disabled="aliasLoading" @tap="saveAlias">
          <view v-if="aliasLoading" class="zi-spin" />
          <text>{{ aliasLoading ? '' : '保存' }}</text>
        </button>
      </view>
    </ZModal>

    <!-- 解绑确认 -->
    <ZModal :visible="showUnbindModal" @close="showUnbindModal = false">
      <view class="ds__unbind-dialog">
        <view class="ds__unbind-icon">
          <ZIcon name="alert" :size="52" color="#FA5151" :stroke-width="3.6" />
        </view>
        <text class="ds__unbind-title">确认解除绑定？</text>
        <text class="ds__unbind-desc">
          您即将解除设备「{{ device.alias?.trim() || device.name }}」的关联。解绑后您将无法在当前账号控制该设备，此操作不会影响其他已绑定该设备的家庭成员。
        </text>
        <view class="ds__modal-btns">
          <button class="ds__modal-btn zi-btn-ghost" :disabled="unbindLoading" @tap="showUnbindModal = false">
            我再想想
          </button>
          <button class="ds__modal-btn ds__modal-btn--danger" :disabled="unbindLoading" @tap="confirmUnbind">
            <view v-if="unbindLoading" class="zi-spin" />
            <text>确认解绑</text>
          </button>
        </view>
      </view>
    </ZModal>

  </view>
</template>

<style scoped lang="scss">
.ds {
  min-height: 100vh;

  &__body {
    padding: 32rpx;
    display: flex;
    flex-direction: column;
    gap: 24rpx;
  }

  &__group {
    overflow: hidden;
  }

  &__row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 24rpx;
    padding: 30rpx 32rpx;

    &--tap:active {
      background: $bg-hover;
    }

    &--simple {
      padding: 26rpx 32rpx;
    }
  }

  &__col {
    display: flex;
    flex-direction: column;
    gap: 6rpx;
    min-width: 0;

    &--grow {
      flex: 1;
      min-width: 0;
    }
  }

  &__row-label {
    font-size: 22rpx;
    color: $text-3;
  }

  &__row-value {
    font-size: 26rpx;
    color: $text-2;

    &--strong {
      font-weight: 600;
      color: $text-1;
    }
  }

  &__row-strong {
    font-size: 28rpx;
    font-weight: 600;
    color: $text-1;
  }

  &__row-mono {
    font-size: 24rpx;
    font-family: monospace;
    font-weight: 600;
    color: $text-2;
    word-break: break-all;
    text-align: right;
  }

  &__edit {
    display: flex;
    align-items: center;
    gap: 4rpx;
    font-size: 22rpx;
    color: $brand;
    font-weight: 500;
    flex-shrink: 0;
  }

  &__copy {
    padding: 12rpx;
    flex-shrink: 0;
  }

  &__status {
    display: flex;
    align-items: center;
    gap: 10rpx;
  }

  &__status-dot {
    width: 14rpx;
    height: 14rpx;
    border-radius: 50%;
    background: $offline;

    &--on {
      background: $online;
    }
  }

  &__divider {
    height: 1rpx;
    background: $border-1;
    margin-left: 32rpx;
  }

  &__share-tip {
    padding: 30rpx;
    border-radius: $radius-card;
    background: rgba(241, 245, 249, 0.7);
    border: 1rpx solid rgba(226, 232, 240, 0.6);
  }

  &__share-head {
    display: flex;
    align-items: center;
    gap: 10rpx;
    font-size: 24rpx;
    font-weight: 600;
    color: $text-1;
    margin-bottom: 12rpx;
  }

  &__share-text {
    font-size: 22rpx;
    color: $text-2;
    line-height: 1.7;
  }

  &__unbind {
    margin-top: 16rpx;
    height: 104rpx;
    background: #fff;
    border: 1rpx solid rgba(250, 81, 81, 0.25);
    border-radius: $radius-card;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    font-size: 28rpx;
    font-weight: 600;
    color: $danger;

    &::after {
      border: none;
    }
  }

  /* 弹窗内部 */
  &__alias-hint {
    display: block;
    font-size: 22rpx;
    color: $text-2;
    line-height: 1.7;
    margin-bottom: 24rpx;
  }

  &__alias-box {
    position: relative;
  }

  &__alias-input {
    width: 100%;
    height: 88rpx;
    padding: 0 120rpx 0 28rpx;
    border-radius: $radius-btn;
    border: 1rpx solid $border-2;
    font-size: 28rpx;
    color: $text-1;
    box-sizing: border-box;
  }

  &__alias-placeholder {
    color: $text-3;
  }

  &__alias-count {
    position: absolute;
    right: 24rpx;
    top: 50%;
    transform: translateY(-50%);
    font-size: 20rpx;
    color: $text-3;
  }

  &__modal-btns {
    display: flex;
    gap: 20rpx;
    margin-top: 32rpx;
  }

  &__modal-btn {
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

  &__unbind-dialog {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  &__unbind-icon {
    width: 96rpx;
    height: 96rpx;
    border-radius: 50%;
    background: rgba(250, 81, 81, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20rpx;
  }

  &__unbind-title {
    font-size: 32rpx;
    font-weight: 600;
    color: $text-1;
  }

  &__unbind-desc {
    margin-top: 16rpx;
    font-size: 22rpx;
    color: $text-2;
    line-height: 1.8;
  }
}
.ds {
  background: $bg-page;
}

.ds__group {
  box-shadow: $shadow-card;
}

.ds__row--tap,
.ds__copy,
.ds__edit {
  transition: background 0.16s ease, transform 0.16s ease;
}

.ds__row--tap:active,
.ds__copy:active,
.ds__edit:active {
  background: $brand-50;
  transform: scale(0.98);
}

.ds__share-tip {
  border: 1rpx solid rgba(47, 107, 255, 0.1);
}

.ds__alias-input:focus {
  border-color: $brand;
  box-shadow: 0 0 0 6rpx rgba(47, 107, 255, 0.1);
}
</style>
