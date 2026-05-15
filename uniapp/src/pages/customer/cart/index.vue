<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onShow } from '@dcloudio/uni-app'
import EmptyState from '@/components/common/EmptyState.vue'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import { useAuthGuard } from '@/composables/useAuthGuard'
import { formatPrice } from '@/utils/format'

const cartStore = useCartStore()
const authStore = useAuthStore()
const authGuard = useAuthGuard()

const { items, totalPrice } = storeToRefs(cartStore)

function onGoShopping() {
  uni.switchTab({
    url: '/pages/customer/home/index',
  })
}

function onCheckout() {
  if (!authGuard.ensure()) {
    return
  }

  if (!items.value.length) {
    uni.showToast({
      title: '购物车为空',
      icon: 'none',
    })
    return
  }

  uni.navigateTo({
    url: '/pages/customer/order-confirm/index',
  })
}

function onClear() {
  uni.showModal({
    title: '提示',
    content: '确定要清空购物车吗？',
    confirmColor: '#AC27ED',
    success: (res) => {
      if (!res.confirm) {
        return
      }

      cartStore.clear()
      uni.showToast({
        title: '已清空购物车',
        icon: 'success',
      })
    },
  })
}

onShow(() => {
  if (authStore.isUserLoggedIn) {
    void cartStore.pullRemote()
  }
})
</script>

<template>
  <view class="cart-page">
    <template v-if="items.length">
      <scroll-view class="cart-list" scroll-y>
        <view v-for="item in items" :key="item.dishId" class="cart-item">
          <image class="item-image" :src="item.image" mode="aspectFill" />
          <view class="item-info">
            <view class="item-name">{{ item.name }}</view>
            <view class="item-price">
              <text class="price-symbol">¥</text>
              <text>{{ formatPrice(item.price) }}</text>
            </view>
          </view>
          <view class="item-actions">
            <view class="quantity-control">
              <button class="step-button muted" @click="cartStore.decreaseDish(item.dishId)">-</button>
              <view class="step-count">{{ item.quantity }}</view>
              <button class="step-button" @click="cartStore.addDish(item)">+</button>
            </view>
          </view>
        </view>
      </scroll-view>

      <view class="cart-footer">
        <view class="footer-info">
          <view class="total-label">总计：</view>
          <view class="checkout-price">¥{{ formatPrice(totalPrice) }}</view>
        </view>
        <view class="footer-actions">
          <button class="clear-button" @click="onClear">清空</button>
          <button class="checkout-button" @click="onCheckout">去结算</button>
        </view>
      </view>
    </template>

    <EmptyState
      v-else
      title="购物车是空的"
      action-text="去点餐"
      @action="onGoShopping"
    />
  </view>
</template>

<style scoped lang="scss">
.cart-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(180deg, #FCFAFD 0%, #F8F5FA 48%, #F3EEF7 100%);
}

.cart-list {
  flex: 1;
  padding: 20rpx;
}

.cart-item {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  padding: 22rpx;
  border: 2rpx solid #E8DDED;
  background: #ffffff;
  border-radius: 20rpx;
  box-shadow: 0 10rpx 24rpx rgba(17, 24, 39, 0.07);
}

.item-image {
  width: 120rpx;
  height: 120rpx;
  margin-right: 20rpx;
  border-radius: 12rpx;
  background: #f5f5f5;
  flex-shrink: 0;
}

.item-info {
  flex: 1;
  min-width: 0;
}

.item-name {
  margin-bottom: 12rpx;
  font-size: 30rpx;
  font-weight: 700;
  color: #111827;
}

.item-price {
  font-size: 28rpx;
  color: #AC27ED;
}

.price-symbol {
  font-size: 22rpx;
}

.item-actions {
  display: flex;
  align-items: center;
  flex-direction: column;
}

.quantity-control {
  display: flex;
  align-items: center;
}

.step-button {
  width: 60rpx;
  height: 60rpx;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: #AC27ED;
  color: #ffffff;
  line-height: 60rpx;
  font-size: 34rpx;
  box-shadow: 0 8rpx 18rpx rgba(172, 39, 237, 0.22);
}

.step-button::after {
  border: none;
}

.step-button.muted {
  border: 1rpx solid rgba(172, 39, 237, 0.22);
  background: #ffffff;
  color: #AC27ED;
  box-shadow: none;
}

.step-count {
  min-width: 40rpx;
  margin: 0 16rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: 700;
}

.cart-footer {
  flex-shrink: 0;
  padding: 20rpx 24rpx calc(20rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #E8DDED;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -12rpx 30rpx rgba(17, 24, 39, 0.1);
}

.footer-info {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  margin-bottom: 20rpx;
}

.total-label {
  font-size: 28rpx;
  color: #5c6670;
}

.checkout-price {
  margin-left: 10rpx;
  font-size: 40rpx;
  font-weight: 800;
  color: #AC27ED;
}

.footer-actions {
  display: flex;
  gap: 20rpx;
}

.clear-button,
.checkout-button {
  height: 86rpx;
  margin: 0;
  border: none;
  border-radius: 18rpx;
  line-height: 86rpx;
  font-size: 30rpx;
  font-weight: 700;
}

.clear-button {
  flex: 1;
  border: 1rpx solid #E8DDED;
  background: #ffffff;
  color: #25313b;
}

.checkout-button {
  flex: 2;
  background: #AC27ED;
  color: #ffffff;
  box-shadow: 0 8rpx 18rpx rgba(172, 39, 237, 0.22);
}

.clear-button::after,
.checkout-button::after {
  border: none;
}
</style>
