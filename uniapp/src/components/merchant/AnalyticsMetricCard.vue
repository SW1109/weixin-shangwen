<script setup lang="ts">
defineProps<{
  title: string
  value: string
  description?: string
  marker?: string
  tone?: 'primary' | 'cyan' | 'amber' | 'slate'
}>()
</script>

<template>
  <view class="metric-card" :class="tone || 'primary'">
    <view class="metric-glow"></view>
    <view class="metric-top">
      <text class="metric-title">{{ title }}</text>
      <text v-if="marker" class="metric-marker">{{ marker }}</text>
    </view>
    <view class="metric-value">{{ value }}</view>
    <view v-if="description" class="metric-description">{{ description }}</view>
  </view>
</template>

<style scoped lang="scss">
.metric-card {
  position: relative;
  overflow: hidden;
  min-height: 168rpx;
  padding: 26rpx;
  border: 1rpx solid rgba(172, 39, 237, 0.1);
  border-radius: 28rpx;
  background:
    linear-gradient(140deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.64)),
    #ffffff;
  box-shadow:
    0 18rpx 42rpx rgba(54, 20, 82, 0.08),
    inset 0 0 0 1rpx rgba(255, 255, 255, 0.72);
  transform: translateZ(0);
  animation: metricIn 460ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.metric-card::before {
  position: absolute;
  top: 0;
  right: 24rpx;
  left: 24rpx;
  height: 2rpx;
  background: linear-gradient(90deg, transparent, rgba(172, 39, 237, 0.36), transparent);
  content: '';
}

.metric-glow {
  position: absolute;
  top: -80rpx;
  right: -80rpx;
  width: 190rpx;
  height: 190rpx;
  border-radius: 50%;
  background: rgba(172, 39, 237, 0.13);
}

.metric-card.cyan .metric-glow {
  background: rgba(40, 215, 255, 0.17);
}

.metric-card.amber .metric-glow {
  background: rgba(255, 178, 55, 0.18);
}

.metric-card.slate .metric-glow {
  background: rgba(79, 70, 229, 0.13);
}

.metric-top {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18rpx;
}

.metric-title {
  color: #5c6670;
  font-size: 24rpx;
  font-weight: 700;
}

.metric-marker {
  padding: 5rpx 12rpx;
  border: 1rpx solid rgba(172, 39, 237, 0.14);
  border-radius: 999rpx;
  background: #F4ECF8;
  color: #7A1FA8;
  font-size: 20rpx;
  font-weight: 800;
}

.metric-value {
  position: relative;
  color: #111827;
  font-size: 40rpx;
  font-weight: 900;
  letter-spacing: -1rpx;
}

.metric-description {
  position: relative;
  margin-top: 12rpx;
  color: #7d8791;
  font-size: 22rpx;
  line-height: 1.35;
}

@keyframes metricIn {
  from {
    opacity: 0;
    transform: translateY(18rpx) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* #ifdef H5 */
@media (prefers-reduced-motion: reduce) {
  .metric-card {
    animation: none;
  }
}
/* #endif */
</style>
