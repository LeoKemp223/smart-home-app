<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { AGREEMENT, PRIVACY, type LegalDoc } from '@/data/legal'
import NavBar from '@/components/NavBar.vue'

const doc = ref<LegalDoc>(AGREEMENT)

onLoad((options) => {
  doc.value = options?.type === 'privacy' ? PRIVACY : AGREEMENT
})
</script>

<template>
  <view class="legal">
    <NavBar :title="doc.title" show-back />

    <view class="legal__body">
      <text class="legal__updated">更新日期：{{ doc.updated }}</text>
      <view v-for="(s, i) in doc.sections" :key="i" class="legal__section">
        <text class="legal__h">{{ s.heading }}</text>
        <text v-for="(p, j) in s.paragraphs" :key="j" class="legal__p">{{ p }}</text>
      </view>
      <text class="legal__end">— 完 —</text>
    </view>
  </view>
</template>

<style scoped lang="scss">
.legal {
  min-height: 100vh;
  background: $bg-page;

  &__body {
    padding: 32rpx 40rpx calc(env(safe-area-inset-bottom, 0) + 64rpx);
  }

  &__updated {
    display: block;
    font-size: 20rpx;
    color: $text-3;
    margin-bottom: 28rpx;
  }

  &__section {
    margin-bottom: 36rpx;
    display: flex;
    flex-direction: column;
    gap: 14rpx;
  }

  &__h {
    font-size: 28rpx;
    font-weight: 700;
    color: $text-1;
  }

  &__p {
    font-size: 24rpx;
    color: $text-2;
    line-height: 1.8;
    text-align: justify;
  }

  &__end {
    display: block;
    text-align: center;
    font-size: 20rpx;
    color: $text-3;
  }
}
</style>
