<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getUser, logout, changePassword } from '@/api/mock/ziot-mock'
import type { User } from '@/types'
import { useToast } from '@/composables/useToast'
import { requireAuth } from '@/composables/useDeviceEvents'
import ZModal from '@/components/ZModal.vue'
import ZIcon from '@/components/ZIcon.vue'

const { show: showToast } = useToast()

const user = ref<User | null>(null)
const showChangePwd = ref(false)
const showAbout = ref(false)

const oldPwd = ref('')
const newPwd = ref('')
const confirmPwd = ref('')
const pwdLoading = ref(false)
const pwdError = ref('')

const maskedPhone = computed(() =>
  user.value?.phone ? `${user.value.phone.slice(0, 3)}****${user.value.phone.slice(-4)}` : '---****----'
)

onShow(() => {
  if (!requireAuth()) return
  user.value = getUser()
})

function goMessages() {
  uni.navigateTo({ url: '/pages/messages/index' })
}

function clearCache() {
  try {
    uni.removeStorageSync('ziot_logs_v2')
  } catch {
    /* ignore */
  }
  showToast('本地临时缓存与图片已清空', 'success')
}

async function handleLogout() {
  uni.showModal({
    title: '退出登录',
    content: '确定要退出当前账号吗？',
    confirmColor: '#2F6BFF',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await logout()
        showToast('已安全退出登录', 'info')
      } finally {
        setTimeout(() => uni.reLaunch({ url: '/pages/login/index' }), 400)
      }
    },
  })
}

async function submitChangePwd() {
  pwdError.value = ''
  if (newPwd.value.length < 8 || newPwd.value.length > 128) {
    pwdError.value = '新密码长度须为 8-128 位'
    return
  }
  if (newPwd.value !== confirmPwd.value) {
    pwdError.value = '两次输入的新密码不一致'
    return
  }
  try {
    pwdLoading.value = true
    await changePassword(oldPwd.value, newPwd.value)
    showToast('密码修改成功，已原子更新当前登录令牌', 'success')
    showChangePwd.value = false
    oldPwd.value = ''
    newPwd.value = ''
    confirmPwd.value = ''
  } catch (err) {
    pwdError.value = (err as Error)?.message || '修改密码失败，请核对原密码'
  } finally {
    pwdLoading.value = false
  }
}
</script>

<template>
  <view class="mine">
    <!-- 个人信息头 -->
    <view class="mine__header">
      <view class="mine__avatar">
        <text>{{ user?.nickname?.[0] || '用' }}</text>
      </view>
      <view class="mine__info">
        <text class="mine__nickname">{{ user?.nickname || '智能用户' }}</text>
        <view class="mine__phone-row">
          <ZIcon name="phone" :size="26" color="#94a3b8" />
          <text class="mine__phone">{{ maskedPhone }}</text>
        </view>
        <view class="mine__tag">
          <text>ZIOT 认证账号</text>
        </view>
      </view>
    </view>

    <view class="mine__body">
      <!-- 安全与账号 -->
      <view class="zi-card mine__group">
        <view class="mine__row" @tap="showChangePwd = true">
          <view class="mine__row-icon mine__row-icon--blue">
            <ZIcon name="shield" :size="30" color="#2F6BFF" />
          </view>
          <text class="mine__row-label">修改登录密码</text>
          <ZIcon name="chevron-right" :size="30" color="#cbd5e1" />
        </view>
        <view class="mine__divider" />
        <view class="mine__row" @tap="goMessages">
          <view class="mine__row-icon mine__row-icon--amber">
            <ZIcon name="bell" :size="30" color="#FF8F1F" />
          </view>
          <text class="mine__row-label">消息通知中心</text>
          <ZIcon name="chevron-right" :size="30" color="#cbd5e1" />
        </view>
      </view>

      <!-- 应用信息 -->
      <view class="zi-card mine__group">
        <view class="mine__row" @tap="showAbout = true">
          <view class="mine__row-icon mine__row-icon--indigo">
            <ZIcon name="info" :size="30" color="#6366f1" />
          </view>
          <view class="mine__row-col">
            <text class="mine__row-label">关于 ZIOT 智能生活</text>
            <text class="mine__row-sub">版本 v0.2 · 投递语义与SSE保活</text>
          </view>
          <ZIcon name="chevron-right" :size="30" color="#cbd5e1" />
        </view>
        <view class="mine__divider" />
        <view class="mine__row" @tap="clearCache">
          <view class="mine__row-icon">
            <ZIcon name="trash" :size="30" color="#475569" />
          </view>
          <text class="mine__row-label">清理本地缓存</text>
          <text class="mine__row-value">2.4 MB</text>
        </view>
      </view>

      <!-- 退出 -->
      <button class="mine__logout" @tap="handleLogout">
        <ZIcon name="logout" :size="30" color="#FA5151" />
        <text>退出当前账号</text>
      </button>
    </view>

    <!-- 修改密码弹窗 -->
    <ZModal :visible="showChangePwd" title="修改账号密码" @close="showChangePwd = false">
      <view class="pwd">
        <view class="pwd__field">
          <text class="pwd__label">原密码</text>
          <input v-model="oldPwd" password placeholder="请输入原密码" placeholder-class="pwd__placeholder" class="pwd__input" />
        </view>
        <view class="pwd__field">
          <text class="pwd__label">新密码 (8-128位)</text>
          <input v-model="newPwd" password placeholder="请输入新密码" placeholder-class="pwd__placeholder" class="pwd__input" />
        </view>
        <view class="pwd__field">
          <text class="pwd__label">确认新密码</text>
          <input v-model="confirmPwd" password placeholder="请再次输入新密码" placeholder-class="pwd__placeholder" class="pwd__input" />
        </view>
        <text v-if="pwdError" class="pwd__error">{{ pwdError }}</text>
        <view class="modal__btns">
          <button class="modal__btn zi-btn-ghost" :disabled="pwdLoading" @tap="showChangePwd = false">取消</button>
          <button class="modal__btn zi-btn-primary" :disabled="pwdLoading" @tap="submitChangePwd">
            <view v-if="pwdLoading" class="zi-spin" />
            <text>{{ pwdLoading ? '' : '确认修改' }}</text>
          </button>
        </view>
      </view>
    </ZModal>

    <!-- 关于弹窗 -->
    <ZModal :visible="showAbout" @close="showAbout = false">
      <view class="about">
        <view class="about__logo">
          <ZIcon name="sparkles" :size="52" color="#ffffff" />
        </view>
        <text class="about__title">ZIOT 智能生活 APP</text>
        <text class="about__version">版本 v0.2 (2026-09-03 发布)</text>
        <view class="about__list">
          <text>• 协议对齐：ZIOT Console v0.2</text>
          <text>• 实时通讯：SSE 实时事件流 (20s 心跳保活)</text>
          <text>• 控制语义：Broker 毫秒级投递确认 + Shadow 回读</text>
          <text>• 绑定安全：专属扫码 & 一码多绑家庭共享</text>
        </view>
        <button class="about__btn" @tap="showAbout = false">我知道了</button>
      </view>
    </ZModal>

  </view>
</template>

<style scoped lang="scss">
.mine {
  min-height: 100vh;
  padding-bottom: calc(env(safe-area-inset-bottom, 0) + 200rpx);

  &__header {
    display: flex;
    align-items: center;
    gap: 28rpx;
    padding: calc(var(--status-bar-height, 44px) + 64rpx) 40rpx 48rpx;
    background: linear-gradient(180deg, rgba(239, 244, 255, 0.8), #ffffff);
    border-bottom: 1rpx solid $border-1;
  }

  &__avatar {
    width: 124rpx;
    height: 124rpx;
    border-radius: 50%;
    background: linear-gradient(135deg, #2f6bff, #60a5fa);
    color: #fff;
    font-size: 44rpx;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 12rpx 30rpx rgba(47, 107, 255, 0.25);
  }

  &__info {
    display: flex;
    flex-direction: column;
    gap: 8rpx;
  }

  &__nickname {
    font-size: 36rpx;
    font-weight: 700;
    color: $text-1;
  }

  &__phone-row {
    display: flex;
    align-items: center;
    gap: 8rpx;
  }

  &__phone {
    font-size: 22rpx;
    color: $text-3;
  }

  &__tag {
    align-self: flex-start;
    margin-top: 4rpx;
    padding: 4rpx 16rpx;
    border-radius: 10rpx;
    background: rgba(0, 181, 120, 0.08);
    border: 1rpx solid rgba(0, 181, 120, 0.15);
    font-size: 18rpx;
    font-weight: 600;
    color: $online;
  }

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
    gap: 24rpx;
    padding: 30rpx 32rpx;

    &:active {
      background: $bg-hover;
    }
  }

  &__row-icon {
    width: 64rpx;
    height: 64rpx;
    border-radius: 18rpx;
    background: $bg-hover;
    display: flex;
    align-items: center;
    justify-content: center;

    &--blue {
      background: $brand-50;
    }
    &--amber {
      background: rgba(255, 143, 31, 0.1);
    }
    &--indigo {
      background: rgba(99, 102, 241, 0.1);
    }
  }

  &__row-col {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4rpx;
  }

  &__row-label {
    flex: 1;
    font-size: 28rpx;
    font-weight: 500;
    color: $text-2;
  }

  &__row-sub {
    font-size: 18rpx;
    color: $text-3;
  }

  &__row-value {
    font-size: 22rpx;
    color: $text-3;
  }

  &__divider {
    height: 1rpx;
    background: $border-1;
    margin-left: 120rpx;
  }

  &__logout {
    margin-top: 16rpx;
    height: 96rpx;
    background: #fff;
    border: 1rpx solid rgba(226, 232, 240, 0.8);
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
}

.modal__btns {
  display: flex;
  gap: 20rpx;
  margin-top: 32rpx;
}

.modal__btn {
  flex: 1;
  height: 84rpx;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
}

/* 改密表单 */
.pwd {
  display: flex;
  flex-direction: column;
  gap: 24rpx;

  &__label {
    display: block;
    font-size: 22rpx;
    font-weight: 500;
    color: $text-2;
    margin-bottom: 10rpx;
  }

  &__input {
    width: 100%;
    height: 84rpx;
    padding: 0 28rpx;
    border-radius: $radius-btn;
    border: 1rpx solid $border-2;
    font-size: 28rpx;
    color: $text-1;
    box-sizing: border-box;
  }

  &__placeholder {
    color: $text-3;
  }

  &__error {
    font-size: 22rpx;
    color: $danger;
  }
}

/* 关于弹窗 */
.about {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  &__logo {
    width: 112rpx;
    height: 112rpx;
    border-radius: 32rpx;
    background: $brand;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 12rpx 28rpx rgba(47, 107, 255, 0.3);
    margin-bottom: 24rpx;
  }

  &__title {
    font-size: 32rpx;
    font-weight: 700;
    color: $text-1;
  }

  &__version {
    margin-top: 8rpx;
    font-size: 22rpx;
    color: $text-3;
  }

  &__list {
    width: 100%;
    margin: 32rpx 0;
    padding: 24rpx;
    border-radius: $radius-btn;
    background: $bg-page;
    display: flex;
    flex-direction: column;
    gap: 12rpx;
    text-align: left;

    text {
      font-size: 22rpx;
      color: $text-2;
      line-height: 1.6;
    }
  }

  &__btn {
    width: 100%;
    height: 84rpx;
    background: $text-1;
    color: #fff;
    border-radius: $radius-btn;
    font-size: 26rpx;
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;

    &::after {
      border: none;
    }
  }
}
.mine {
  background:
    radial-gradient(circle at 100% 0, rgba(47, 107, 255, 0.1), transparent 28%),
    $bg-page;
}

.mine__header {
  border-bottom: none;
  box-shadow: 0 8rpx 22rpx rgba(15, 23, 42, 0.025);
}

.mine__group {
  box-shadow: $shadow-card;
}

.mine__row {
  transition: background 0.16s ease, transform 0.16s ease;
}

.mine__row:active {
  background: $brand-50;
  transform: scale(0.995);
}

.mine__logout {
  transition: transform 0.16s ease, background 0.16s ease;
}

.mine__logout:active {
  transform: scale(0.99);
  background: rgba(250, 81, 81, 0.08);
}

.pwd__input:focus {
  border-color: $brand;
  box-shadow: 0 0 0 6rpx rgba(47, 107, 255, 0.1);
}
</style>
