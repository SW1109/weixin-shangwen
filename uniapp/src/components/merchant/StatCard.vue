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
  padding: 24rpx;
  color: #ffffff;
}

.stat-card.brand {
  background: linear-gradient(135deg, #bc0bf6, #8a0fd8);
}

.stat-card.warm {
  background: linear-gradient(135deg, #d946ef, #a21caf);
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
</style>
