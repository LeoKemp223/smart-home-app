<script setup lang="ts">
import { ref } from 'vue'
import { parseBindingCode } from '@/api/mock/ziot-mock'
import { useToast } from '@/composables/useToast'
import { requireAuth } from '@/composables/useDeviceEvents'
import NavBar from '@/components/NavBar.vue'
import ZIcon from '@/components/ZIcon.vue'

const { show: showToast } = useToast()

const activeMode = ref<'scan' | 'manual'>('scan')
const manualCode = ref('')
const isScanning = ref(false)

// 快速模拟扫码（预设测试码，与参考实现一致）
const PRESET_CODES = [
  { label: '阳台空气检测仪', code: 'BD7K-9X2M-4PLQ-8HZW' },
  { label: '玄关感应夜灯', code: 'WF3D-8R2L-9KPM-1XTY' },
  { label: '智能厨房排插', code: 'GT6P-4N8Q-2VKX-9RTY' },
]

requireAuth()

/** 统一处理扫码/输码结果：校验 → 跳确认页 */
function processAndSubmitCode(raw: string) {
  const trimmed = raw.trim()
  if (!trimmed) {
    showToast('请输入有效的绑定码', 'error')
    return
  }
  if (/^https?:\/\//i.test(trimmed) && !trimmed.includes('ziot.asia/b/')) {
    showToast('不是有效的 ZIOT 设备码', 'error')
    return
  }
  const clean = parseBindingCode(trimmed)
  if (clean.length < 8) {
    showToast('绑定码格式错误，请重新确认', 'error')
    return
  }
  uni.navigateTo({ url: `/pages/add/confirm?code=${encodeURIComponent(clean)}` })
}

/** 手动输入 4 位分组格式化 */
function onManualInput(e: any) {
  const raw = String(e.detail.value || '')
    .replace(/[^A-Za-z0-9]/g, '')
    .toUpperCase()
    .slice(0, 20)
  manualCode.value = (raw.match(/.{1,4}/g) || []).join('-')
}

function startScan() {
  // #ifdef H5
  showToast('H5 端暂不支持摄像头扫码，请使用手动输码', 'info')
  // #endif
  // #ifndef H5
  uni.scanCode({
    scanType: ['qrCode'],
    success: (res) => processAndSubmitCode(res.result),
    fail: () => showToast('已取消扫码', 'info'),
  })
  // #endif
}

function simulateScan(code: string) {
  isScanning.value = true
  setTimeout(() => {
    isScanning.value = false
    processAndSubmitCode(code)
  }, 700)
}
</script>

<template>
  <view class="add">
    <NavBar title="添加设备" show-back />

    <view class="add__body">
      <!-- 模式切换 -->
      <view class="add__modes">
        <view class="add__mode" :class="{ 'add__mode--active': activeMode === 'scan' }" @tap="activeMode = 'scan'">
          <ZIcon name="qrcode" :size="32" :color="activeMode === 'scan' ? '#2F6BFF' : '#475569'" />
          <text>扫码绑定</text>
        </view>
        <view class="add__mode" :class="{ 'add__mode--active': activeMode === 'manual' }" @tap="activeMode = 'manual'">
          <ZIcon name="keyboard" :size="32" :color="activeMode === 'manual' ? '#2F6BFF' : '#475569'" />
          <text>手动输码</text>
        </view>
      </view>

      <!-- 扫码模式 -->
      <view v-if="activeMode === 'scan'" class="add__scan">
        <!-- 取景框示意 -->
        <view class="viewfinder">
          <view class="viewfinder__corner viewfinder__corner--tl" />
          <view class="viewfinder__corner viewfinder__corner--tr" />
          <view class="viewfinder__corner viewfinder__corner--bl" />
          <view class="viewfinder__corner viewfinder__corner--br" />
          <view class="viewfinder__laser" />

          <view class="viewfinder__content">
            <ZIcon name="qrcode" :size="120" color="#64748b" :stroke-width="2.4" />
            <text class="viewfinder__tip">将取景框对准设备机身或包装上的二维码</text>
            <text class="viewfinder__sub">自动识别 ziot.asia 专属安全绑定码</text>
          </view>

          <view v-if="isScanning" class="viewfinder__loading">
            <view class="zi-spin zi-spin--brand" />
            <text>正在解析设备证书与签名...</text>
          </view>
        </view>

        <button class="add__scan-btn zi-btn-primary" @tap="startScan">
          <ZIcon name="scan" :size="32" color="#ffffff" />
          <text>开始扫码</text>
        </button>

        <!-- 模拟扫码（联调测试） -->
        <view class="zi-card add__preset">
          <view class="add__preset-head">
            <ZIcon name="sparkles" :size="26" color="#FF8F1F" />
            <text class="add__preset-title">快速模拟扫描测试设备二维码</text>
            <text class="add__preset-sub">一键扫码测试</text>
          </view>
          <view
            v-for="item in PRESET_CODES"
            :key="item.code"
            class="add__preset-item"
            @tap="simulateScan(item.code)"
          >
            <view class="add__preset-info">
              <text class="add__preset-label">{{ item.label }}</text>
              <text class="add__preset-code">{{ item.code }}</text>
            </view>
            <view class="add__preset-go">
              <text>模拟扫码</text>
              <ZIcon name="chevron-right" :size="24" color="#2F6BFF" />
            </view>
          </view>
        </view>
      </view>

      <!-- 手动输码模式 -->
      <view v-else class="zi-card add__manual">
        <text class="add__manual-label">20位绑定码 (区分大小写，自动大写与分组)</text>
        <input
          :value="manualCode"
          @input="onManualInput"
          placeholder="例如：BD7K-9X2M-4PLQ-8HZW"
          placeholder-class="add__manual-placeholder"
          class="add__manual-input"
          :maxlength="24"
        />
        <text class="add__manual-hint">支持直接粘贴标准绑定码或带有 URL 链接的内容</text>
        <button class="zi-btn-primary add__manual-btn" @tap="processAndSubmitCode(manualCode)">
          <text>下一步：确认设备信息</text>
          <ZIcon name="chevron-right" :size="28" color="#ffffff" />
        </button>
      </view>

      <!-- 绑定步骤说明 -->
      <view class="add__notice">
        <view class="add__notice-head">
          <ZIcon name="info" :size="32" color="#2F6BFF" />
          <text>绑定步骤与家庭共享说明</text>
        </view>
        <view class="add__notice-steps">
          <text>1. 找到设备机身铭牌或包装盒印刷的 ZIOT 专属二维码；</text>
          <text>2. 通过扫码或输入 20 位绑定码完成身份验证与配对；</text>
          <text>3. 家庭其他成员也可通过扫描同一张码共同控制此设备，一码多绑。</text>
        </view>
      </view>
    </view>

  </view>
</template>

<style scoped lang="scss">
.add {
  min-height: 100vh;
  padding-bottom: calc(env(safe-area-inset-bottom, 0) + 200rpx);

  &__body {
    padding: 32rpx;
    display: flex;
    flex-direction: column;
    gap: 28rpx;
  }

  &__modes {
    display: flex;
    gap: 8rpx;
    padding: 8rpx;
    background: rgba(226, 232, 240, 0.7);
    border-radius: 32rpx;
  }

  &__mode {
    flex: 1;
    height: 76rpx;
    border-radius: 26rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10rpx;
    font-size: 24rpx;
    font-weight: 600;
    color: $text-2;
    transition: all 0.2s;

    &--active {
      background: #fff;
      color: $brand;
      box-shadow: 0 2rpx 8rpx rgba(15, 23, 42, 0.06);
    }
  }

  &__scan-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    height: 92rpx;
    font-size: 28rpx;
  }

  &__preset {
    padding: 28rpx;
    display: flex;
    flex-direction: column;
    gap: 12rpx;
  }

  &__preset-head {
    display: flex;
    align-items: center;
    gap: 10rpx;
  }

  &__preset-title {
    flex: 1;
    font-size: 24rpx;
    font-weight: 600;
    color: $text-1;
  }

  &__preset-sub {
    font-size: 18rpx;
    color: $text-3;
  }

  &__preset-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20rpx;
    border-radius: $radius-btn;
    background: $bg-page;
    border: 1rpx solid $border-1;

    &:active {
      background: $brand-50;
    }
  }

  &__preset-info {
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }

  &__preset-label {
    font-size: 24rpx;
    font-weight: 500;
    color: $text-1;
  }

  &__preset-code {
    font-size: 18rpx;
    color: $text-3;
    font-family: monospace;
  }

  &__preset-go {
    display: flex;
    align-items: center;
    gap: 4rpx;
    font-size: 22rpx;
    color: $brand;
    font-weight: 500;
  }

  &__manual {
    padding: 40rpx;
    display: flex;
    flex-direction: column;
  }

  &__manual-label {
    font-size: 24rpx;
    font-weight: 600;
    color: $text-1;
    margin-bottom: 16rpx;
  }

  &__manual-input {
    width: 100%;
    height: 92rpx;
    padding: 0 28rpx;
    border-radius: $radius-btn;
    border: 1rpx solid $border-2;
    font-size: 28rpx;
    font-family: monospace;
    letter-spacing: 2rpx;
    color: $text-1;
    box-sizing: border-box;
  }

  &__manual-placeholder {
    color: $text-3;
  }

  &__manual-hint {
    margin-top: 12rpx;
    font-size: 20rpx;
    color: $text-3;
  }

  &__manual-btn {
    margin-top: 32rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10rpx;
    height: 92rpx;
    font-size: 28rpx;
  }

  &__notice {
    padding: 32rpx;
    border-radius: $radius-card;
    background: rgba(239, 244, 255, 0.6);
    border: 1rpx solid rgba(47, 107, 255, 0.12);
  }

  &__notice-head {
    display: flex;
    align-items: center;
    gap: 10rpx;
    font-size: 24rpx;
    font-weight: 600;
    color: $brand;
    margin-bottom: 16rpx;
  }

  &__notice-steps {
    display: flex;
    flex-direction: column;
    gap: 8rpx;

    text {
      font-size: 20rpx;
      color: $text-2;
      line-height: 1.7;
    }
  }
}

/* 取景框 */
.viewfinder {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  max-width: 560rpx;
  margin: 0 auto;
  background: #0f172a;
  border-radius: 48rpx;
  border: 8rpx solid #1e293b;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  &__corner {
    position: absolute;
    width: 56rpx;
    height: 56rpx;

    &--tl {
      top: 40rpx;
      left: 40rpx;
      border-top: 8rpx solid $brand;
      border-left: 8rpx solid $brand;
      border-top-left-radius: 16rpx;
    }
    &--tr {
      top: 40rpx;
      right: 40rpx;
      border-top: 8rpx solid $brand;
      border-right: 8rpx solid $brand;
      border-top-right-radius: 16rpx;
    }
    &--bl {
      bottom: 40rpx;
      left: 40rpx;
      border-bottom: 8rpx solid $brand;
      border-left: 8rpx solid $brand;
      border-bottom-left-radius: 16rpx;
    }
    &--br {
      bottom: 40rpx;
      right: 40rpx;
      border-bottom: 8rpx solid $brand;
      border-right: 8rpx solid $brand;
      border-bottom-right-radius: 16rpx;
    }
  }

  &__laser {
    position: absolute;
    left: 56rpx;
    right: 56rpx;
    top: 88rpx;
    height: 3rpx;
    background: linear-gradient(90deg, transparent, $brand, transparent);
    box-shadow: 0 0 20rpx $brand;
    animation: laser-pulse 1.6s ease-in-out infinite;
  }

  &__content {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0 48rpx;
    gap: 16rpx;
  }

  &__tip {
    font-size: 22rpx;
    font-weight: 500;
    color: #cbd5e1;
    text-align: center;
  }

  &__sub {
    font-size: 20rpx;
    color: #64748b;
  }

  &__loading {
    position: absolute;
    inset: 0;
    background: rgba(2, 6, 23, 0.82);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 20rpx;

    text {
      font-size: 22rpx;
      color: #fff;
    }
  }
}

@keyframes laser-pulse {
  0%,
  100% {
    opacity: 0.4;
    transform: translateY(0);
  }
  50% {
    opacity: 1;
    transform: translateY(320rpx);
  }
}
.add {
  background:
    radial-gradient(circle at 100% 4%, rgba(47, 107, 255, 0.1), transparent 26%),
    $bg-page;
}

.add__modes {
  padding: 8rpx;
  background: rgba(226, 232, 240, 0.72);
}

.add__mode {
  transition: background 0.16s ease, color 0.16s ease, box-shadow 0.16s ease;
}

.add__preset,
.add__manual,
.add__notice {
  box-shadow: $shadow-card;
}

.add__preset-item:active,
.add__mode:active {
  transform: scale(0.99);
}

.add__manual-input:focus {
  border-color: $brand;
  box-shadow: 0 0 0 6rpx rgba(47, 107, 255, 0.1);
}

.viewfinder {
  box-shadow: 0 18rpx 36rpx rgba(15, 23, 42, 0.12);
}
</style>
