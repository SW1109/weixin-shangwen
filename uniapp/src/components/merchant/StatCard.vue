<script setup lang="ts">
defineProps<{
  title: string
  value: string
  description?: string
  accent?: 'brand' | 'warm'
}>()
</script>

<template>
  <view class="stat-card panel" :class="accent || 'brand'">
    <view class="stat-title">{{ title }}</view>
    <view class="stat-value">{{ value }}</view>
    <view v-if="description" class="stat-description">{{ description }}</view>
  </view>
</template>

<style scoped lang="scss">
.stat-card {
  position: relative;
  overflow: hidden;
  padding: 24rpx;
  color: #ffffff;
  transform: translateZ(0);
  animation: statCardIn 460ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
  transition:
    transform 180ms ease-out,
    box-shadow 180ms ease-out;
}

.stat-card::after {
  position: absolute;
  top: -60rpx;
  right: -70rpx;
  width: 180rpx;
  height: 180rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  content: '';
}

.stat-card:active {
  transform: translateY(-4rpx) scale(0.99);
  box-shadow: 0 22rpx 44rpx rgba(54, 20, 82, 0.18);
}

.stat-card.brand {
  background: linear-gradient(135deg, #AC27ED, #7A1FA8);
}

.stat-card.warm {
  background: linear-gradient(135deg, #C95BFF, #8B5CF6);
}

.stat-title {
  font-size: 24rpx;
  opacity: 0.85;
}

.stat-value {
  margin-top: 18rpx;
  font-size: 42rpx;
  font-weight: 800;
}

.stat-description {
  margin-top: 12rpx;
  font-size: 22rpx;
  opacity: 0.92;
}

@keyframes statCardIn {
  from {
    opacity: 0;
    transform: translateY(20rpx) scale(0.98);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* #ifdef H5 */
@media (prefers-reduced-motion: reduce) {
  .stat-card {
    animation: none;
    transition: none;
  }
}
/* #endif */
</style>
