<script setup lang="ts">
import { computed } from 'vue'
import { formatPrice } from '@/utils/format'

const props = defineProps<{
  count: number
  total: number
}>()

const emit = defineEmits<{
  (event: 'open'): void
}>()

const hasItems = computed(() => props.count > 0)
const displayTotal = computed(() =>
  hasItems.value ? `¥${formatPrice(props.total)}` : '购物车空着',
)
const hintText = computed(() =>
  hasItems.value ? `共${props.count}件菜品` : '选好菜品后再结算',
)
</script>

<template>
  <view class="cart-bar" :class="{ empty: !hasItems }" @click="emit('open')">
    <view class="cart-surface">
      <view class="cart-icon">
        <text class="cart-symbol">🛒</text>
        <view v-if="count" class="cart-badge">{{ count }}</view>
      </view>
      <view class="cart-info">
        <view class="cart-total">{{ displayTotal }}</view>
        <view class="cart-count">{{ hintText }}</view>
      </view>
      <view class="cart-action" :class="{ disabled: !hasItems }">
        {{ hasItems ? '去结算' : '先点菜' }}
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.cart-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  bottom: calc(var(--window-bottom) + 12rpx);
  left: 0;
  padding: 14rpx 20rpx calc(14rpx + env(safe-area-inset-bottom));
  background: linear-gradient(180deg, rgba(248, 245, 250, 0), rgba(248, 245, 250, 0.96) 38%, #F8F5FA 100%);
  z-index: 100;
}

.cart-surface {
  display: flex;
  align-items: center;
  gap: 16rpx;
  min-height: 108rpx;
  padding: 16rpx 18rpx;
  border: 1rpx solid rgba(31, 41, 51, 0.1);
  border-radius: 24rpx;
  background: #ffffff;
  box-shadow: 0 -8rpx 28rpx rgba(17, 24, 39, 0.11);
}

.cart-icon {
  position: relative;
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(172, 39, 237, 0.2);
  border-radius: 22rpx;
  background: #F4ECF8;
  color: #AC27ED;
  flex-shrink: 0;
}

.cart-symbol {
  font-size: 42rpx;
}

.cart-badge {
  position: absolute;
  top: -12rpx;
  right: -12rpx;
  min-width: 36rpx;
  height: 36rpx;
  padding: 0 8rpx;
  border: 3rpx solid #ffffff;
  border-radius: 18rpx;
  background: #d73f35;
  color: #ffffff;
  line-height: 36rpx;
  text-align: center;
  font-size: 20rpx;
}

.cart-info {
  flex: 1;
  min-width: 0;
}

.cart-total {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #111827;
  font-size: 34rpx;
  font-weight: 800;
}

.cart-count {
  margin-top: 4rpx;
  color: #5c6670;
  font-size: 24rpx;
}

.cart-action {
  min-width: 160rpx;
  height: 72rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18rpx;
  background: #AC27ED;
  color: #ffffff;
  text-align: center;
  font-size: 28rpx;
  font-weight: 700;
  flex-shrink: 0;
  box-shadow: 0 8rpx 18rpx rgba(172, 39, 237, 0.22);
}

.cart-action.disabled {
  border: 1rpx solid #E8DDED;
  background: #F3EEF7;
  color: #5c6670;
  box-shadow: none;
}

.cart-bar.empty .cart-icon {
  border-color: #E8DDED;
  background: #f6f8f6;
  color: #5c6670;
}
</style>
