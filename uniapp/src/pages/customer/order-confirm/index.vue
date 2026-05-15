<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onShow } from '@dcloudio/uni-app'
import { computed, shallowRef } from 'vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { getAddresses, createOrder } from '@/api/customer'
import { useAuthGuard } from '@/composables/useAuthGuard'
import { useCartStore } from '@/stores/cart'
import { formatPrice } from '@/utils/format'
import type { Address } from '@/types/models'

const authGuard = useAuthGuard()
const cartStore = useCartStore()
const { items, totalPrice } = storeToRefs(cartStore)

const addresses = shallowRef<Address[]>([])
const selectedAddressId = shallowRef<number | null>(null)
const remark = shallowRef('')
const submitting = shallowRef(false)

const selectedAddress = computed(
  () => addresses.value.find((item) => item.id === selectedAddressId.value) || null,
)

async function loadAddresses() {
  if (!authGuard.ensure()) {
    return
  }

  addresses.value = await getAddresses()
  const selectedFromCache = Number(uni.getStorageSync('sw_checkout_address') || 0)
  const defaultAddress =
    addresses.value.find((item) => item.id === selectedFromCache) ||
    addresses.value.find((item) => item.isDefault) ||
    addresses.value[0]
  selectedAddressId.value = defaultAddress?.id || null
  uni.removeStorageSync('sw_checkout_address')
}

async function submitOrder() {
  if (!selectedAddressId.value) {
    uni.showToast({
      title: '请选择收货地址',
      icon: 'none',
    })
    return
  }

  if (!items.value.length) {
    uni.showToast({
      title: '购物车为空',
      icon: 'none',
    })
    return
  }

  submitting.value = true
  try {
    const result = await createOrder({
      addressId: selectedAddressId.value,
      remark: remark.value.trim(),
      dishes: items.value.map((item) => ({
        dishId: item.dishId,
        quantity: item.quantity,
      })),
    })

    cartStore.clear()
    uni.showToast({
      title: '下单成功',
      icon: 'success',
    })
    setTimeout(() => {
      uni.redirectTo({
        url: `/pages/customer/order-detail/index?id=${result.orderId}`,
      })
    }, 500)
  } catch (error) {
    uni.showToast({
      title: (error as Error).message || '下单失败',
      icon: 'none',
    })
  } finally {
    submitting.value = false
  }
}

function onRemarkInput(event: any) {
  remark.value = event.detail.value
}

function goShopping() {
  uni.switchTab({
    url: '/pages/customer/home/index',
  })
}

function openAddressPage() {
  uni.navigateTo({
    url: '/pages/customer/address/index?select=1',
  })
}

onShow(() => {
  void loadAddresses()
})
</script>

<template>
  <view class="confirm-page">
    <EmptyState
      v-if="!items.length"
      title="购物车为空"
      description="请先选择菜品再提交订单"
      action-text="去点餐"
      @action="goShopping"
    />

    <template v-else>
      <view class="address-section" @click="openAddressPage">
        <view v-if="selectedAddress" class="address-info">
          <view class="address-header">
            <text class="name">{{ selectedAddress.name }}</text>
            <text class="phone">{{ selectedAddress.phone }}</text>
          </view>
          <view class="address-detail">
            <text class="icon">📍</text>
            <text class="text">
              {{ selectedAddress.province }} {{ selectedAddress.city }} {{ selectedAddress.district }} {{ selectedAddress.detail }}
            </text>
          </view>
        </view>
        <view v-else class="address-empty">
          <text class="icon">📍</text>
          <text class="text">请选择收货地址</text>
          <text class="arrow">›</text>
        </view>
      </view>

      <view class="dishes-section">
        <view class="section-title">菜品清单</view>
        <view v-for="item in items" :key="item.dishId" class="dish-item">
          <image class="dish-image" :src="item.image" mode="aspectFill" />
          <view class="dish-info">
            <view class="dish-name">{{ item.name }}</view>
            <view class="dish-bottom">
              <view class="price">¥{{ formatPrice(item.price) }}</view>
              <view class="quantity">x{{ item.quantity }}</view>
            </view>
          </view>
        </view>
      </view>

      <view class="remark-section">
        <view class="section-title">订单备注</view>
        <textarea
          class="remark-input"
          :value="remark"
          maxlength="200"
          placeholder="如有特殊要求请在此填写（选填）"
          @input="onRemarkInput"
        />
      </view>

      <view class="amount-section">
        <view class="amount-item">
          <text class="label">菜品总额</text>
          <text class="value">¥{{ formatPrice(totalPrice) }}</text>
        </view>
        <view class="amount-item">
          <text class="label">配送费</text>
          <text class="value">¥0.00</text>
        </view>
        <view class="amount-divider"></view>
        <view class="amount-item total">
          <text class="label">实付金额</text>
          <text class="value">¥{{ formatPrice(totalPrice) }}</text>
        </view>
      </view>

      <view class="bottom-spacer"></view>

      <view class="bottom-bar">
        <view class="total-info">
          <text class="label">合计：</text>
          <text class="price">¥{{ formatPrice(totalPrice) }}</text>
        </view>
        <button
          class="submit-button"
          :loading="submitting"
          :disabled="submitting || !items.length"
          @click="submitOrder"
        >
          提交订单
        </button>
      </view>
    </template>
  </view>
</template>

<style scoped lang="scss">
.confirm-page {
  min-height: 100vh;
  padding-bottom: 150rpx;
  background: linear-gradient(180deg, #FCFAFD 0%, #F8F5FA 48%, #F3EEF7 100%);
}

.address-section,
.dishes-section,
.remark-section,
.amount-section {
  margin-bottom: 20rpx;
  padding: 30rpx;
  border: 2rpx solid #E8DDED;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10rpx 24rpx rgba(17, 24, 39, 0.06);
}

.address-info {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.address-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.address-header .name {
  color: #111827;
  font-size: 32rpx;
  font-weight: 700;
}

.address-header .phone {
  color: #5c6670;
  font-size: 28rpx;
}

.address-detail,
.address-empty {
  display: flex;
  align-items: flex-start;
  gap: 10rpx;
}

.address-empty {
  align-items: center;
  padding: 20rpx 0;
}

.address-detail .icon,
.address-empty .icon {
  font-size: 40rpx;
}

.address-empty .icon {
  margin-right: 10rpx;
  font-size: 40rpx;
}

.address-detail .text,
.address-empty .text {
  flex: 1;
  font-size: 28rpx;
  line-height: 1.5;
  color: #5c6670;
}

.address-empty .text {
  color: #6c7580;
}

.arrow {
  color: #b8c0b9;
  font-size: 48rpx;
}

.section-title {
  margin-bottom: 20rpx;
  color: #111827;
  font-size: 32rpx;
  font-weight: 700;
}

.dish-item {
  display: flex;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #E8DDED;
}

.dish-item:last-child {
  border-bottom: none;
}

.dish-image {
  width: 120rpx;
  height: 120rpx;
  margin-right: 20rpx;
  border-radius: 8rpx;
  background: #f1f4f2;
  flex-shrink: 0;
}

.dish-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.dish-name {
  color: #111827;
  font-size: 28rpx;
}

.dish-bottom,
.amount-item,
.bottom-bar,
.total-info {
  display: flex;
  align-items: center;
}

.dish-bottom,
.amount-item {
  justify-content: space-between;
}

.dish-bottom .price {
  color: #AC27ED;
  font-size: 32rpx;
  font-weight: 700;
}

.dish-bottom .quantity {
  color: #5c6670;
  font-size: 28rpx;
}

.remark-input {
  width: 100%;
  min-height: 150rpx;
  padding: 20rpx;
  border: 1rpx solid #E8DDED;
  border-radius: 16rpx;
  background: #f7faf8;
  color: #111827;
  font-size: 28rpx;
  line-height: 1.6;
}

.amount-item {
  padding: 15rpx 0;
  font-size: 28rpx;
}

.amount-item .label {
  color: #5c6670;
}

.amount-item .value {
  color: #25313b;
}

.amount-item.total {
  padding-top: 20rpx;
}

.amount-item.total .label {
  color: #111827;
  font-size: 32rpx;
  font-weight: 700;
}

.amount-item.total .value {
  color: #AC27ED;
  font-size: 36rpx;
  font-weight: 700;
}

.amount-divider {
  height: 1rpx;
  margin: 10rpx 0;
  background: #E8DDED;
}

.bottom-spacer {
  height: 150rpx;
}

.bottom-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  min-height: 112rpx;
  padding: 18rpx 30rpx calc(18rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #E8DDED;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -12rpx 30rpx rgba(17, 24, 39, 0.1);
  z-index: 100;
}

.total-info {
  flex: 1;
  align-items: baseline;
}

.total-info .label {
  color: #5c6670;
  font-size: 28rpx;
}

.total-info .price {
  margin-left: 10rpx;
  color: #AC27ED;
  font-size: 40rpx;
  font-weight: 700;
}

.submit-button {
  width: 252rpx;
  height: 84rpx;
  margin: 0;
  border: none;
  border-radius: 18rpx;
  background: #AC27ED;
  color: #ffffff;
  line-height: 84rpx;
  font-size: 32rpx;
  font-weight: 700;
  box-shadow: 0 8rpx 18rpx rgba(172, 39, 237, 0.22);
}

.submit-button[disabled] {
  background: #dfe5df;
  color: #5c6670;
  box-shadow: none;
}

.submit-button::after {
  border: none;
}
</style>
