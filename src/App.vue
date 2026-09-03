<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { startSSE } from '@/api/sse'

onLaunch(() => {
  // 已登录则启动 SSE 心跳模拟；登录守卫由各页面 onShow 检查
  if (uni.getStorageSync('ziot_auth_v1')) startSSE()
})
</script>

<style>
/* 全局基础样式 */
page {
  background-color: #f8fafc;
  color: #0f172a;
  font-size: 28rpx;
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    'Helvetica Neue',
    'PingFang SC',
    'Microsoft YaHei',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

view,
text,
button,
input {
  box-sizing: border-box;
}

button {
  line-height: 1.2;
}

/* 通用工具类（对齐参考设计的视觉语言） */
.zi-card {
  background: #ffffff;
  border-radius: 28rpx;
  border: 1rpx solid #f1f5f9;
  box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.045);
}

.zi-btn-primary {
  background: #2f6bff;
  color: #ffffff;
  border-radius: 20rpx;
  font-weight: 600;
  box-shadow: 0 8rpx 20rpx rgba(47, 107, 255, 0.25);
}
.zi-btn-primary::after {
  border: none;
}
.zi-btn-primary[disabled] {
  background: #2f6bff !important;
  color: #ffffff !important;
  opacity: 0.5;
}

.zi-btn-primary:active {
  transform: translateY(1rpx) scale(0.99);
  box-shadow: 0 4rpx 12rpx rgba(47, 107, 255, 0.2);
}

.zi-btn-ghost {
  background: #f1f5f9;
  color: #475569;
  border-radius: 20rpx;
  font-weight: 500;
}
.zi-btn-ghost::after {
  border: none;
}

.zi-btn-ghost:active {
  background: #e2e8f0;
}

.zi-page-title {
  display: block;
  font-size: 24rpx;
  font-weight: 600;
  color: #475569;
  letter-spacing: 1rpx;
}

/* 加载旋转 */
.zi-spin {
  width: 28rpx;
  height: 28rpx;
  border: 4rpx solid rgba(255, 255, 255, 0.35);
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: zi-rotate 0.7s linear infinite;
  display: inline-block;
}
.zi-spin--brand {
  border-color: rgba(47, 107, 255, 0.25);
  border-top-color: #2f6bff;
}
@keyframes zi-rotate {
  to {
    transform: rotate(360deg);
  }
}

/* 单行省略 */
.zi-ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
