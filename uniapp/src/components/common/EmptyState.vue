<script setup lang="ts">
defineProps<{
  title: string
  description?: string
  actionText?: string
}>()

const emit = defineEmits<{
  (event: 'action'): void
}>()
</script>

<template>
  <view class="empty-state">
    <view class="empty-title">{{ title }}</view>
    <view v-if="description" class="empty-description">{{ description }}</view>
    <button v-if="actionText" class="empty-button" @click="emit('action')">
      {{ actionText }}
    </button>
  </view>
</template>

<style scoped lang="scss">
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16rpx;
  padding: 100rpx 32rpx;
  text-align: center;
  animation: emptyIn 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.empty-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #25313b;
}

.empty-description {
  font-size: 24rpx;
  color: #5c6670;
}

.empty-button {
  min-width: 220rpx;
  height: 76rpx;
  margin: 8rpx 0 0;
  border-radius: 18rpx;
  background: #AC27ED;
  color: #ffffff;
  line-height: 76rpx;
  font-size: 28rpx;
  font-weight: 700;
  box-shadow: 0 8rpx 18rpx rgba(172, 39, 237, 0.22);
  transition:
    transform 160ms ease-out,
    box-shadow 160ms ease-out;
}

.empty-button:active {
  transform: scale(0.96);
  box-shadow: 0 6rpx 14rpx rgba(172, 39, 237, 0.2);
}

.empty-button::after {
  border: none;
}

@keyframes emptyIn {
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
  .empty-state,
  .empty-button {
    animation: none;
    transition: none;
  }
}
/* #endif */
</style>
