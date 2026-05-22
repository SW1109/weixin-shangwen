<script setup lang="ts">
import { computed } from 'vue'
import { getOrderStatusColor, getOrderStatusText } from '@/utils/order'
import type { OrderStatus } from '@/types/models'

const props = defineProps<{
  status: OrderStatus
}>()

const label = computed(() => getOrderStatusText(props.status))
const color = computed(() => getOrderStatusColor(props.status))
</script>

<template>
  <view class="status-badge" :style="{ color, borderColor: color }">
    {{ label }}
  </view>
</template>

<style scoped lang="scss">
.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 120rpx;
  min-height: 44rpx;
  padding: 10rpx 20rpx;
  border: 2rpx solid;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 8rpx 20rpx rgba(54, 20, 82, 0.06);
  animation: badgeIn 280ms ease-out both;
  transition:
    transform 160ms ease-out,
    background-color 160ms ease-out;
}

.status-badge:active {
  transform: scale(0.96);
}

@keyframes badgeIn {
  from {
    opacity: 0;
    transform: translateY(8rpx) scale(0.96);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* #ifdef H5 */
@media (prefers-reduced-motion: reduce) {
  .status-badge {
    animation: none;
    transition: none;
  }
}
/* #endif */
</style>
