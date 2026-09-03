<script setup lang="ts">
import { ref } from 'vue'
import { login, register } from '@/api/auth'
import { useToast } from '@/composables/useToast'
import ZIcon from '@/components/ZIcon.vue'

const { show: showToast } = useToast()

const isRegister = ref(false)
const phone = ref('13800138000')
const password = ref('ziot123456')
const nickname = ref('')
const showPassword = ref(false)
const agreeTerms = ref(true)
const loading = ref(false)

async function handleSubmit() {
  if (!agreeTerms.value) {
    showToast('请先阅读并勾选用户协议与隐私政策', 'error')
    return
  }
  if (!/^1[3-9]\d{9}$/.test(phone.value)) {
    showToast('请输入正确的11位大陆手机号码', 'error')
    return
  }
  if (password.value.length < 8 || password.value.length > 128) {
    showToast('密码长度须在 8-128 位之间', 'error')
    return
  }

  try {
    loading.value = true
    if (isRegister.value) {
      await register(phone.value, password.value, nickname.value)
      showToast('注册成功，已自动登录', 'success')
    } else {
      await login(phone.value, password.value)
      showToast('登录成功', 'success')
    }
    uni.reLaunch({ url: '/pages/home/index' })
  } catch (err) {
    showToast((err as Error)?.message || '请求失败，请稍后重试', 'error')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <view class="login">
    <view class="login__brand">
      <view class="login__logo">
        <ZIcon name="shield" :size="72" color="#ffffff" :stroke-width="3.6" />
      </view>
      <text class="login__title">ZIOT 智慧生活</text>
      <text class="login__slogan">物联感知 · 秒级触达 · 极简全屋智能</text>
    </view>

    <view class="login__form zi-card">
      <!-- 模式切换 -->
      <view class="login__tabs">
        <view class="login__tab" :class="{ 'login__tab--active': !isRegister }" @tap="isRegister = false">
          <text>手机登录</text>
          <view v-if="!isRegister" class="login__tab-line" />
        </view>
        <view class="login__tab" :class="{ 'login__tab--active': isRegister }" @tap="isRegister = true">
          <text>快速注册</text>
          <view v-if="isRegister" class="login__tab-line" />
        </view>
      </view>

      <!-- 手机号 -->
      <view class="field">
        <text class="field__label">手机号码</text>
        <view class="field__box">
          <text class="field__prefix">+86</text>
          <input
            v-model="phone"
            type="number"
            :maxlength="11"
            placeholder="请输入11位大陆手机号"
            placeholder-class="field__placeholder"
            class="field__input"
          />
        </view>
      </view>

      <!-- 昵称（注册） -->
      <view v-if="isRegister" class="field">
        <text class="field__label">用户昵称 (选填)</text>
        <view class="field__box">
          <ZIcon name="user" :size="32" color="#94a3b8" />
          <input
            v-model="nickname"
            type="nickname"
            :maxlength="20"
            placeholder="如：客厅小主"
            placeholder-class="field__placeholder"
            class="field__input"
          />
        </view>
      </view>

      <!-- 密码 -->
      <view class="field">
        <text class="field__label">账户密码 (8-128位)</text>
        <view class="field__box">
          <ZIcon name="lock" :size="32" color="#94a3b8" />
          <input
            v-model="password"
            :password="!showPassword"
            placeholder="请输入登录密码"
            placeholder-class="field__placeholder"
            class="field__input"
          />
          <view class="field__eye" @tap="showPassword = !showPassword">
            <ZIcon :name="showPassword ? 'eye-off' : 'eye'" :size="32" color="#94a3b8" />
          </view>
        </view>
      </view>

      <!-- 协议 -->
      <view class="login__agree" @tap="agreeTerms = !agreeTerms">
        <view class="login__checkbox" :class="{ 'login__checkbox--on': agreeTerms }">
          <ZIcon v-if="agreeTerms" name="check" :size="22" color="#ffffff" :stroke-width="6" />
        </view>
        <text class="login__agree-text">已阅读并同意</text>
        <text class="login__agree-link">《用户服务协议》</text>
        <text class="login__agree-text">与</text>
        <text class="login__agree-link">《隐私合规政策》</text>
      </view>

      <!-- 提交 -->
      <button class="login__submit zi-btn-primary" :disabled="loading" @tap="handleSubmit">
        <view v-if="loading" class="zi-spin" />
        <text>{{ loading ? '' : isRegister ? '立即注册并登录' : '登  录' }}</text>
      </button>
    </view>

    <view class="login__footer">
      <text>ZIOT Console 开放云端协议 v0.2 · SSE 实时总线保活</text>
    </view>

  </view>
</template>

<style scoped lang="scss">
.login {
  min-height: 100vh;
  background: linear-gradient(180deg, rgba(239, 244, 255, 0.6) 0%, #ffffff 45%, #f8fafc 100%);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0 48rpx calc(env(safe-area-inset-bottom, 0) + 48rpx);

  &__brand {
    padding: 120rpx 0 64rpx;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  &__logo {
    width: 128rpx;
    height: 128rpx;
    border-radius: 36rpx;
    background: linear-gradient(135deg, #2f6bff, #60a5fa);
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 16rpx 40rpx rgba(47, 107, 255, 0.3);
    margin-bottom: 28rpx;
  }

  &__title {
    font-size: 44rpx;
    font-weight: 700;
    color: $text-1;
  }

  &__slogan {
    margin-top: 12rpx;
    font-size: 22rpx;
    color: $text-3;
  }

  &__form {
    padding: 48rpx;
  }

  &__tabs {
    display: flex;
    border-bottom: 1rpx solid $border-1;
    margin-bottom: 44rpx;
  }

  &__tab {
    flex: 1;
    position: relative;
    padding-bottom: 22rpx;
    display: flex;
    justify-content: center;
    font-size: 28rpx;
    font-weight: 600;
    color: $text-3;
    transition: color 0.2s;

    &--active {
      color: $brand;
    }
  }

  &__tab-line {
    position: absolute;
    bottom: 0;
    left: 25%;
    right: 25%;
    height: 6rpx;
    border-radius: 6rpx;
    background: $brand;
  }

  &__agree {
    display: flex;
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 6rpx;
    padding: 12rpx 0 24rpx;
  }

  &__checkbox {
    width: 32rpx;
    height: 32rpx;
    border-radius: 8rpx;
    border: 2rpx solid $border-2;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 6rpx;
    margin-top: 2rpx;

    &--on {
      background: $brand;
      border-color: $brand;
    }
  }

  &__agree-text {
    font-size: 22rpx;
    color: $text-3;
    line-height: 36rpx;
  }

  &__agree-link {
    font-size: 22rpx;
    color: $brand;
    line-height: 36rpx;
  }

  &__submit {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 14rpx;
    height: 92rpx;
    font-size: 30rpx;
    margin-top: 16rpx;
  }

  &__footer {
    padding: 40rpx 0 0;
    text-align: center;
    font-size: 20rpx;
    color: #cbd5e1;
  }
}

.field {
  margin-bottom: 30rpx;

  &__label {
    display: block;
    font-size: 22rpx;
    font-weight: 500;
    color: $text-2;
    margin-bottom: 10rpx;
  }

  &__box {
    display: flex;
    align-items: center;
    gap: 16rpx;
    padding: 0 28rpx;
    height: 92rpx;
    border-radius: $radius-btn;
    border: 1rpx solid $border-2;
    background: #fff;
    transition: border-color 0.2s;

    &:focus-within {
      border-color: $brand;
    }
  }

  &__prefix {
    font-size: 22rpx;
    font-weight: 600;
    color: $text-2;
    padding-right: 20rpx;
    border-right: 1rpx solid $border-1;
  }

  &__input {
    flex: 1;
    height: 100%;
    font-size: 28rpx;
    color: $text-1;
  }

  &__eye {
    padding: 8rpx;
  }
}
.login__brand {
  padding-bottom: 42rpx;
}

.login__form {
  border-color: rgba(219, 230, 255, 0.8);
  box-shadow: 0 20rpx 50rpx rgba(15, 23, 42, 0.06);
}

.login__tab {
  transition: color 0.16s ease;
}

.login__tab:active {
  opacity: 0.68;
}

.field__box {
  transition: border-color 0.16s ease, box-shadow 0.16s ease, background 0.16s ease;

  &:focus-within {
    background: #fff;
    box-shadow: 0 0 0 6rpx rgba(47, 107, 255, 0.1);
  }
}

.login__checkbox:active,
.field__eye:active {
  transform: scale(0.9);
}

.login__footer {
  line-height: 1.7;
}
</style>
