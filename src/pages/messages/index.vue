<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getMessages, markMessageRead, markAllMessagesRead } from '@/api/mock/ziot-mock'
import type { NotificationItem } from '@/types'
import { bindToast, useToast, Toast } from '@/composables/useToast'
import NavBar from '@/components/NavBar.vue'
import ZIcon from '@/components/ZIcon.vue'

const toastRef = ref<InstanceType<typeof Toast> | null>(null)
const { show: showToast } = useToast()

const messages = ref<NotificationItem[]>([])

function load() {
  messages.value = getMessages()
}
onShow(load)

function markAll() {
  markAllMessagesRead()
  load()
  showToast('全部消息已标为已读', 'success')
}

function readOne(msg: NotificationItem) {
  if (msg.read) return
  markMessageRead(msg.id)
  load()
}
</script>

<template>
  <view class="msgs">
    <NavBar title="消息中心" show-back>
      <template #right>
        <view class="msgs__read-all" @tap="markAll">
          <ZIcon name="check-double" :size="32" color="#475569" />
        </view>
      </template>
    </NavBar>

    <view class="msgs__body">
      <view v-if="messages.length === 0" class="msgs__empty">
        <ZIcon name="bell" :size="72" color="#cbd5e1" />
        <text>暂无任何系统或设备通知</text>
      </view>

      <view
        v-for="msg in messages"
        :key="msg.id"
        class="msgs__item"
        :class="{ 'msgs__item--unread': !msg.read }"
        @tap="readOne(msg)"
      >
        <view class="msgs__icon" :class="`msgs__icon--${msg.type}`">
          <ZIcon
            :name="msg.type === 'status' ? 'radio' : msg.type === 'control' ? 'alert' : 'info'"
            :size="30"
            :color="msg.type === 'status' ? '#2F6BFF' : msg.type === 'control' ? '#FF8F1F' : '#475569'"
          />
        </view>
        <view class="msgs__content">
          <view class="msgs__head-row">
            <view class="msgs__title-wrap">
              <text class="msgs__title">{{ msg.title }}</text>
              <view v-if="!msg.read" class="msgs__dot" />
            </view>
            <text class="msgs__time">{{ msg.time }}</text>
          </view>
          <text class="msgs__text">{{ msg.content }}</text>
        </view>
      </view>

      <text class="msgs__hint">提示：当前消息基于 SSE 前台实时事件与本地会话通知</text>
    </view>

    <Toast :ref="(el: any) => { toastRef = el; bindToast(el) }" />
  </view>
</template>

<style scoped lang="scss">
.msgs {
  min-height: 100vh;

  &__read-all {
    padding: 8rpx;
  }

  &__body {
    padding: 32rpx;
    display: flex;
    flex-direction: column;
    gap: 24rpx;
  }

  &__empty {
    padding: 160rpx 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20rpx;
    font-size: 24rpx;
    color: $text-3;
  }

  &__item {
    display: flex;
    align-items: flex-start;
    gap: 24rpx;
    padding: 32rpx;
    border-radius: $radius-card;
    background: #fff;
    border: 1rpx solid $border-1;

    &--unread {
      border-color: $brand-100;
      box-shadow: 0 0 0 1rpx rgba(47, 107, 255, 0.08);
    }
  }

  &__icon {
    width: 68rpx;
    height: 68rpx;
    border-radius: 20rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &--status {
      background: $brand-50;
    }
    &--control {
      background: rgba(255, 143, 31, 0.1);
    }
    &--system {
      background: $bg-hover;
    }
  }

  &__content {
    flex: 1;
    min-width: 0;
  }

  &__head-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16rpx;
  }

  &__title-wrap {
    display: flex;
    align-items: center;
    gap: 10rpx;
    min-width: 0;
  }

  &__title {
    font-size: 26rpx;
    font-weight: 600;
    color: $text-1;
  }

  &__dot {
    width: 12rpx;
    height: 12rpx;
    border-radius: 50%;
    background: $danger;
    flex-shrink: 0;
  }

  &__time {
    font-size: 18rpx;
    color: $text-3;
    flex-shrink: 0;
  }

  &__text {
    margin-top: 10rpx;
    font-size: 24rpx;
    color: $text-2;
    line-height: 1.7;
  }

  &__hint {
    padding: 32rpx 0;
    text-align: center;
    font-size: 20rpx;
    color: $text-3;
  }
}
</style>
