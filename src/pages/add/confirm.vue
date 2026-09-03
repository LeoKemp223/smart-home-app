<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { previewBinding, confirmBinding } from '@/api/mock/ziot-mock'
import type { DeviceCategory } from '@/types'
import { useToast } from '@/composables/useToast'
import NavBar from '@/components/NavBar.vue'
import ZIcon from '@/components/ZIcon.vue'

const { show: showToast } = useToast()

const code = ref('')
const loading = ref(false)
const preview = ref<{ name: string; product_name: string; product_id: string; category: DeviceCategory; masked_code: string } | null>(null)

const CATEGORY_ICON: Record<string, string> = {
  sensor: 'thermometer',
  light: 'lightbulb',
  socket: 'plug',
  ac: 'wind',
  curtain: 'curtain',
  other: 'cpu',
}

onLoad((options) => {
  code.value = decodeURIComponent(options?.code || '')
  loadPreview()
})

async function loadPreview() {
  try {
    preview.value = await previewBinding(code.value)
  } catch (err) {
    showToast((err as Error)?.message || '无法获取设备信息', 'error')
    setTimeout(() => uni.navigateBack(), 600)
  }
}

async function handleConfirmBind() {
  try {
    loading.value = true
    const device = await confirmBinding(code.value)
    showToast('设备绑定成功！', 'success')
    setTimeout(() => {
      uni.redirectTo({ url: `/pages/device/detail?id=${device.device_id}` })
    }, 500)
  } catch (err) {
    showToast((err as Error)?.message || '绑定失败，请稍后重试', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="confirm">
    <NavBar title="确认绑定" show-back />

    <view class="confirm__body">
      <!-- 设备信息卡 -->
      <view class="zi-card confirm__card">
        <view class="confirm__icon">
          <ZIcon :name="CATEGORY_ICON[preview?.category || 'other']" :size="76" color="#2F6BFF" :stroke-width="3.4" />
        </view>
        <text class="confirm__name">{{ preview?.name || '未知设备' }}</text>
        <text class="confirm__product">
          产品型号：{{ preview?.product_name || '—' }} ({{ preview?.product_id || '—' }})
        </text>
        <view class="confirm__code-chip">
          <ZIcon name="qrcode" :size="26" color="#94a3b8" />
          <text>绑定码：{{ preview?.masked_code || '••••••••' }}</text>
        </view>
      </view>

      <!-- 家庭共享说明 -->
      <view class="confirm__share">
        <view class="confirm__share-icon">
          <ZIcon name="users" :size="32" color="#00B578" />
        </view>
        <view class="confirm__share-text">
          <text class="confirm__share-title">支持全家共享共管</text>
          <text class="confirm__share-desc">
            ZIOT 平台支持「一码多绑」。完成绑定后，家人使用其账号扫描同一张二维码，即可共同控制这台设备。
          </text>
        </view>
      </view>

      <!-- 确认按钮 -->
      <button class="confirm__submit zi-btn-primary" :disabled="loading || !preview" @tap="handleConfirmBind">
        <view v-if="loading" class="zi-spin" />
        <ZIcon v-else name="check-circle" :size="32" color="#ffffff" />
        <text>{{ loading ? '正在下发证书与建立连接...' : '确认绑定并进入控制' }}</text>
      </button>
    </view>

  </view>
</template>

<style scoped lang="scss">
.confirm {
  min-height: 100vh;

  &__body {
    padding: 48rpx 32rpx;
    display: flex;
    flex-direction: column;
    gap: 36rpx;
  }

  &__card {
    padding: 56rpx 40rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  &__icon {
    width: 160rpx;
    height: 160rpx;
    border-radius: 36rpx;
    background: $brand-50;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 28rpx;
  }

  &__name {
    font-size: 40rpx;
    font-weight: 700;
    color: $text-1;
  }

  &__product {
    margin-top: 12rpx;
    font-size: 22rpx;
    color: $text-2;
  }

  &__code-chip {
    margin-top: 28rpx;
    display: flex;
    align-items: center;
    gap: 10rpx;
    padding: 10rpx 28rpx;
    border-radius: $radius-tag;
    background: $bg-hover;
    font-size: 22rpx;
    font-family: monospace;
    color: $text-2;
  }

  &__share {
    display: flex;
    align-items: flex-start;
    gap: 22rpx;
    padding: 32rpx;
    border-radius: $radius-card;
    background: rgba(0, 181, 120, 0.05);
    border: 1rpx solid rgba(0, 181, 120, 0.15);
  }

  &__share-icon {
    width: 64rpx;
    height: 64rpx;
    border-radius: 50%;
    background: rgba(0, 181, 120, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  &__share-text {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  &__share-title {
    font-size: 26rpx;
    font-weight: 600;
    color: #065f46;
  }

  &__share-desc {
    font-size: 20rpx;
    color: #047857;
    line-height: 1.7;
  }

  &__submit {
    margin-top: 24rpx;
    height: 104rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14rpx;
    font-size: 28rpx;
    border-radius: 32rpx;
    box-shadow: 0 16rpx 32rpx rgba(47, 107, 255, 0.3);
  }
}
.confirm {
  background:
    radial-gradient(circle at 100% 0, rgba(47, 107, 255, 0.1), transparent 28%),
    $bg-page;
}

.confirm__card {
  border-color: rgba(219, 230, 255, 0.9);
  box-shadow: 0 18rpx 40rpx rgba(15, 23, 42, 0.06);
}

.confirm__code-chip {
  letter-spacing: 1rpx;
}

.confirm__share {
  border: 1rpx solid rgba(47, 107, 255, 0.1);
}

.confirm__submit {
  transition: transform 0.16s ease, box-shadow 0.16s ease;
}
</style>
