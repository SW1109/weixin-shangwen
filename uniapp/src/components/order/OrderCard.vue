<script setup lang="ts">
import { computed } from 'vue'
import StatusBadge from '@/components/common/StatusBadge.vue'
import { formatAddress, formatDateTime, formatPrice } from '@/utils/format'
import { getMerchantNextAction } from '@/utils/order'
import type { Order } from '@/types/models'

const props = defineProps<{
  order: Order
  role: 'customer' | 'merchant'
}>()

const emit = defineEmits<{
  (event: 'detail', value: number): void
  (event: 'pay', value: number): void
  (event: 'cancel', value: number): void
  (event: 'advance', payload: { id: number; status: number }): void
}>()

const nextMerchantAction = computed(() => getMerchantNextAction(props.order.status))
</script>

<template>
  <view class="order-card" @click="emit('detail', order.id)">
    <view class="order-header">
      <view class="order-number">订单号：{{ order.orderNo }}</view>
      <StatusBadge :status="order.status" />
    </view>

    <view v-if="role === 'merchant'" class="customer-info">
      <text class="customer-name">{{ order.userInfo.nickName }}</text>
      <text class="customer-phone">{{ order.userInfo.phoneNumber }}</text>
    </view>

    <view class="order-items">
      <view
        v-for="dish in order.dishes"
        :key="`${order.id}-${dish.dishId}`"
        class="order-item"
      >
        <image class="dish-image" :src="dish.image" mode="aspectFill" />
        <view class="dish-info">
          <text class="order-item-name">{{ dish.name }}</text>
          <text class="order-item-price">¥{{ formatPrice(dish.price) }} x {{ dish.quantity }}</text>
        </view>
      </view>
    </view>

    <view v-if="role === 'merchant'" class="address">
      <text class="address-icon">📍</text>
      <text class="address-text">{{ formatAddress(order.address) }}</text>
    </view>

    <view class="order-footer">
      <view v-if="role === 'customer'" class="order-total">
        共{{ order.dishes.length }}件商品 合计：
        <text class="amount">¥{{ formatPrice(order.totalAmount) }}</text>
      </view>
      <template v-else>
        <view class="order-time">{{ formatDateTime(order.createTime) }}</view>
        <view class="order-total">
          合计：
          <text class="amount">¥{{ formatPrice(order.totalAmount) }}</text>
        </view>
      </template>
      <view class="order-actions">
        <button
          v-if="role === 'customer' && order.status === 1"
          class="ghost-button"
          @click.stop="emit('cancel', order.id)"
        >
          取消订单
        </button>
        <button
          v-if="role === 'customer' && order.status === 1"
          class="brand-button"
          @click.stop="emit('pay', order.id)"
        >
          去支付
        </button>
        <button
          v-if="role === 'merchant' && nextMerchantAction"
          class="brand-button"
          @click.stop="
            emit('advance', {
              id: order.id,
              status: nextMerchantAction.nextStatus,
            })
          "
        >
          {{ nextMerchantAction.label }}
        </button>
        <view v-if="role === 'merchant' && order.status === 1" class="action-tip">
          等待客户支付
        </view>
        <view v-if="role === 'merchant' && order.status === 4" class="action-tip">
          已完成
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.order-card {
  position: relative;
  overflow: hidden;
  padding: 26rpx;
  margin-bottom: 20rpx;
  border: 2rpx solid rgba(172, 39, 237, 0.08);
  background:
    linear-gradient(135deg, rgba(172, 39, 237, 0.04), rgba(139, 92, 246, 0.025)),
    rgba(255, 255, 255, 0.94);
  border-radius: 24rpx;
  box-shadow: 0 14rpx 32rpx rgba(54, 20, 82, 0.08);
  transform: translateZ(0);
  animation: orderCardIn 440ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
  transition:
    transform 180ms ease-out,
    border-color 180ms ease-out,
    box-shadow 180ms ease-out;
}

.order-card::before {
  position: absolute;
  top: 0;
  right: 28rpx;
  left: 28rpx;
  height: 2rpx;
  background: linear-gradient(90deg, transparent, rgba(172, 39, 237, 0.34), transparent);
  content: '';
}

.order-card:active {
  transform: translateY(-4rpx) scale(0.995);
  border-color: rgba(172, 39, 237, 0.18);
  box-shadow: 0 22rpx 46rpx rgba(54, 20, 82, 0.13);
}

.order-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #f5f5f5;
}

.order-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 16rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f5f5f5;
}

.order-number {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 26rpx;
  color: #666666;
}

.order-time {
  flex: 1;
  font-size: 24rpx;
  color: #999999;
}

.customer-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20rpx;
  margin-top: 20rpx;
  padding: 18rpx 22rpx;
  border-radius: 18rpx;
  background: linear-gradient(135deg, #faf5ff, #f2fbff);
}

.customer-name {
  font-size: 28rpx;
  font-weight: 700;
  color: #333333;
}

.customer-phone {
  font-size: 26rpx;
  color: #666666;
}

.order-items {
  display: flex;
  flex-direction: column;
  margin-top: 20rpx;
  margin-bottom: 20rpx;
}

.order-item {
  display: flex;
  margin-bottom: 16rpx;
}

.dish-image {
  width: 124rpx;
  height: 124rpx;
  margin-right: 20rpx;
  border-radius: 18rpx;
  background: #f5f5f5;
  flex-shrink: 0;
  box-shadow: 0 8rpx 18rpx rgba(17, 24, 39, 0.08);
  transition: transform 180ms ease-out;
}

.order-card:active .dish-image {
  transform: scale(1.025);
}

.dish-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.order-item-name {
  font-size: 28rpx;
  color: #333333;
}

.order-item-price {
  font-size: 24rpx;
  color: #999999;
}

.address {
  display: flex;
  align-items: flex-start;
  margin-bottom: 20rpx;
  padding: 20rpx;
  border: 1rpx solid rgba(172, 39, 237, 0.1);
  border-radius: 18rpx;
  background: linear-gradient(135deg, rgba(244, 236, 248, 0.72), rgba(243, 251, 255, 0.76));
}

.address-icon {
  margin-right: 12rpx;
  font-size: 32rpx;
}

.address-text {
  flex: 1;
  font-size: 26rpx;
  line-height: 1.6;
  color: #666666;
}

.order-footer {
  margin-top: 0;
}

.order-total {
  flex: 1;
  min-width: 260rpx;
  font-size: 28rpx;
  color: #666666;
}

.amount {
  font-size: 32rpx;
  font-weight: 700;
  color: #AC27ED;
}

.order-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  justify-content: flex-end;
}

.ghost-button,
.brand-button {
  min-width: 152rpx;
  height: 66rpx;
  margin: 0;
  line-height: 66rpx;
  border-radius: 999rpx;
  font-size: 26rpx;
  font-weight: 700;
}

.ghost-button::after,
.brand-button::after {
  border: none;
}

.ghost-button {
  background: #ffffff;
  color: #6d6178;
  border: 1rpx solid rgba(172, 39, 237, 0.18);
}

.brand-button {
  background: linear-gradient(135deg, #AC27ED 0%, #C95BFF 100%);
  color: #ffffff;
  box-shadow: 0 10rpx 22rpx rgba(172, 39, 237, 0.24);
}

.ghost-button:active,
.brand-button:active {
  transform: scale(0.96);
}

.action-tip {
  display: flex;
  align-items: center;
  min-height: 66rpx;
  font-size: 26rpx;
  color: #999999;
}

@keyframes orderCardIn {
  from {
    opacity: 0;
    transform: translateY(22rpx) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* #ifdef H5 */
@media (prefers-reduced-motion: reduce) {
  .order-card,
  .dish-image,
  .ghost-button,
  .brand-button {
    animation: none;
    transition: none;
  }
}
/* #endif */
</style>
