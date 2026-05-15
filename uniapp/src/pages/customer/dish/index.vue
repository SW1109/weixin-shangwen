<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import { shallowRef } from 'vue'
import { getDishDetail } from '@/api/customer'
import { useCartStore } from '@/stores/cart'
import { formatPrice } from '@/utils/format'
import type { Dish } from '@/types/models'

const cartStore = useCartStore()
const { totalCount } = storeToRefs(cartStore)
const dish = shallowRef<Dish | null>(null)
const loading = shallowRef(false)
const quantity = shallowRef(1)

async function loadDish(id: number) {
  loading.value = true
  try {
    dish.value = await getDishDetail(id)
  } catch (error) {
    uni.showToast({
      title: (error as Error).message || '加载失败',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}

onLoad((query) => {
  if (query?.id) {
    void loadDish(Number(query.id))
  }
})

function increaseQuantity() {
  if (!dish.value) {
    return
  }

  if (dish.value.stock !== -1 && quantity.value >= dish.value.stock) {
    uni.showToast({
      title: '库存不足',
      icon: 'none',
    })
    return
  }

  quantity.value += 1
}

function decreaseQuantity() {
  if (quantity.value > 1) {
    quantity.value -= 1
  }
}

function addToCart() {
  if (!dish.value) {
    return
  }

  if (dish.value.stock !== -1 && dish.value.stock <= 0) {
    uni.showToast({
      title: '商品已售罄',
      icon: 'none',
    })
    return
  }

  for (let index = 0; index < quantity.value; index += 1) {
    cartStore.addDish(dish.value)
  }

  quantity.value = 1
  uni.showToast({
    title: '添加成功',
    icon: 'success',
  })
}

function goToCart() {
  uni.navigateTo({
    url: '/pages/customer/cart/index',
  })
}
</script>

<template>
  <view class="dish-detail-page">
    <view v-if="loading" class="loading-text">正在加载菜品...</view>

    <template v-else-if="dish">
      <view class="dish-image">
        <image :src="dish.image" mode="widthFix" />
      </view>

      <view class="dish-info">
        <view class="dish-header">
          <view class="dish-name">{{ dish.name }}</view>
          <view class="dish-tags">
            <text v-if="dish.isRecommend" class="tag">推荐</text>
            <text v-for="tag in dish.tags" :key="tag" class="tag">{{ tag }}</text>
          </view>
        </view>
        <view class="dish-desc">{{ dish.description }}</view>
        <view class="dish-price-stock">
          <view class="price">
            <text class="currency">¥</text>
            <text class="amount">{{ formatPrice(dish.price) }}</text>
          </view>
          <view class="stock">库存: {{ dish.stock === -1 ? '无限' : dish.stock }}</view>
        </view>
      </view>

      <view class="detail-section">
        <view class="section-title">菜品详情</view>
        <view class="detail-content">
          <view class="detail-item">
            <text class="label">分类:</text>
            <text class="value">{{ dish.categoryName }}</text>
          </view>
          <view class="detail-item">
            <text class="label">描述:</text>
            <text class="value">{{ dish.description }}</text>
          </view>
        </view>
      </view>

      <view class="stats-section">
        <view class="stat-item">
          <text class="stat-value">{{ dish.sales || 0 }}</text>
          <text class="stat-label">月销量</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value">5.0</text>
          <text class="stat-label">评分</text>
        </view>
        <view class="stat-divider"></view>
        <view class="stat-item">
          <text class="stat-value">0</text>
          <text class="stat-label">评价</text>
        </view>
      </view>

      <view class="bottom-spacer"></view>
    </template>
  </view>

  <view v-if="dish" class="bottom-bar">
    <view class="cart-wrapper" @click="goToCart">
      <text class="cart-icon">🛒</text>
      <text v-if="totalCount" class="cart-count">{{ totalCount }}</text>
    </view>

    <view class="quantity-control">
      <button class="btn-minus" :class="{ disabled: quantity <= 1 }" @click="decreaseQuantity">-</button>
      <input class="quantity-input" type="number" :value="String(quantity)" disabled />
      <button class="btn-plus" @click="increaseQuantity">+</button>
    </view>

    <button
      class="btn-add-cart"
      :disabled="dish.stock !== -1 && dish.stock <= 0"
      @click="addToCart"
    >
      {{ dish.stock !== -1 && dish.stock <= 0 ? '已售罄' : '加入购物车' }}
    </button>
  </view>
</template>

<style scoped lang="scss">
.dish-detail-page {
  min-height: 100vh;
  padding-bottom: 148rpx;
  background: linear-gradient(180deg, #FCFAFD 0%, #F8F5FA 48%, #F3EEF7 100%);
}

.dish-image {
  width: 100%;
  background: #ffffff;
}

.dish-image image {
  width: 100%;
  display: block;
}

.dish-info,
.detail-section,
.stats-section {
  margin-bottom: 20rpx;
  padding: 30rpx;
  border: 2rpx solid #E8DDED;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10rpx 24rpx rgba(17, 24, 39, 0.06);
}

.dish-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20rpx;
}

.dish-name {
  flex: 1;
  font-size: 36rpx;
  font-weight: 700;
  color: #111827;
}

.dish-tags {
  display: flex;
  gap: 10rpx;
  flex-wrap: wrap;
}

.tag {
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  border: 1rpx solid rgba(172, 39, 237, 0.18);
  background: #F4ECF8;
  color: #7A1FA8;
  font-size: 21rpx;
}

.dish-desc {
  margin-bottom: 20rpx;
  color: #5c6670;
  font-size: 28rpx;
  line-height: 1.6;
}

.dish-price-stock {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.price {
  display: flex;
  align-items: baseline;
}

.currency {
  color: #AC27ED;
  font-size: 28rpx;
  font-weight: 700;
}

.amount {
  color: #AC27ED;
  font-size: 48rpx;
  font-weight: 700;
}

.stock {
  color: #5c6670;
  font-size: 24rpx;
}

.section-title {
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #E8DDED;
  color: #111827;
  font-size: 32rpx;
  font-weight: 700;
}

.detail-content {
  font-size: 28rpx;
}

.detail-item {
  display: flex;
  margin-bottom: 20rpx;
  line-height: 1.6;
}

.label {
  width: 120rpx;
  color: #5c6670;
  flex-shrink: 0;
}

.value {
  flex: 1;
  color: #25313b;
}

.stats-section {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
}

.stat-value {
  color: #AC27ED;
  font-size: 32rpx;
  font-weight: 700;
}

.stat-label {
  color: #5c6670;
  font-size: 24rpx;
}

.stat-divider {
  width: 1rpx;
  height: 60rpx;
  background: #E8DDED;
}

.bottom-spacer {
  height: 148rpx;
}

.bottom-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  min-height: 112rpx;
  display: flex;
  align-items: center;
  padding: 18rpx 24rpx calc(18rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #E8DDED;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -12rpx 30rpx rgba(17, 24, 39, 0.1);
}

.cart-wrapper {
  position: relative;
  margin-right: 30rpx;
}

.cart-icon {
  display: flex;
  width: 72rpx;
  height: 72rpx;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(172, 39, 237, 0.2);
  border-radius: 22rpx;
  background: #F4ECF8;
  color: #AC27ED;
  font-size: 42rpx;
}

.cart-count {
  position: absolute;
  top: -10rpx;
  right: -10rpx;
  min-width: 32rpx;
  padding: 4rpx 8rpx;
  border-radius: 20rpx;
  background: #d73f35;
  color: #ffffff;
  text-align: center;
  font-size: 20rpx;
}

.quantity-control {
  display: flex;
  align-items: center;
  margin-right: 20rpx;
  overflow: hidden;
  border: 1rpx solid #E8DDED;
  border-radius: 18rpx;
  background: #ffffff;
}

.btn-minus,
.btn-plus {
  width: 60rpx;
  height: 60rpx;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  color: #AC27ED;
  line-height: 60rpx;
  font-size: 32rpx;
}

.btn-minus.disabled {
  color: #b8c0b9;
}

.quantity-input {
  width: 80rpx;
  height: 60rpx;
  border-right: 1rpx solid #E8DDED;
  border-left: 1rpx solid #E8DDED;
  color: #111827;
  text-align: center;
  font-size: 28rpx;
}

.btn-add-cart {
  flex: 1;
  min-width: 220rpx;
  height: 84rpx;
  margin: 0;
  border: none;
  border-radius: 18rpx;
  background: #AC27ED;
  color: #ffffff;
  line-height: 84rpx;
  font-size: 28rpx;
  font-weight: 700;
  box-shadow: 0 8rpx 18rpx rgba(172, 39, 237, 0.22);
}

.btn-add-cart[disabled] {
  background: #dfe5df;
  color: #5c6670;
  box-shadow: none;
}

.btn-minus::after,
.btn-plus::after,
.btn-add-cart::after {
  border: none;
}

.loading-text {
  padding: 40rpx 0;
  text-align: center;
  color: #5c6670;
}
</style>
