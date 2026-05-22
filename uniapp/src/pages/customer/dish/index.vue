<script setup lang="ts">
import { onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { storeToRefs } from 'pinia'
import { shallowRef } from 'vue'
import { getDishDetail } from '@/api/customer'
import { useCartStore } from '@/stores/cart'
import { formatPrice } from '@/utils/format'
import { previewImages } from '@/utils/image-preview'
import { setDishSeoMeta } from '@/utils/seo'
import {
  buildDishSharePath,
  buildDishWechatShare,
  shareDishToH5,
} from '@/utils/share'
import type { Dish } from '@/types/models'

const cartStore = useCartStore()
const { totalCount } = storeToRefs(cartStore)
const dish = shallowRef<Dish | null>(null)
const loading = shallowRef(false)
const quantity = shallowRef(1)
const imageLoaded = shallowRef(false)
const imageFailed = shallowRef(false)

async function loadDish(id: number) {
  loading.value = true
  imageLoaded.value = false
  imageFailed.value = false
  try {
    const nextDish = await getDishDetail(id)
    dish.value = nextDish
    setDishSeoMeta(nextDish)
    uni.setNavigationBarTitle({
      title: nextDish.name || '菜品详情',
    })
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

function appendDishToCart() {
  if (!dish.value) {
    return false
  }

  if (dish.value.stock !== -1 && dish.value.stock <= 0) {
    uni.showToast({
      title: '商品已售罄',
      icon: 'none',
    })
    return false
  }

  for (let index = 0; index < quantity.value; index += 1) {
    cartStore.addDish(dish.value)
  }

  return true
}

function addToCart() {
  if (!appendDishToCart()) {
    return
  }

  quantity.value = 1
  uni.showToast({
    title: '添加成功',
    icon: 'success',
  })
}

function buyNow() {
  if (!appendDishToCart()) {
    return
  }

  quantity.value = 1
  uni.navigateTo({
    url: '/pages/customer/order-confirm/index',
  })
}

function goToCart() {
  uni.navigateTo({
    url: '/pages/customer/cart/index',
  })
}

function onShareDish() {
  if (!dish.value) {
    return
  }

  // #ifdef H5
  void shareDishToH5(dish.value)
  // #endif
}

function onImageLoad() {
  imageLoaded.value = true
  imageFailed.value = false
}

function onImageError() {
  imageLoaded.value = true
  imageFailed.value = true
}

function previewDishImage() {
  if (!dish.value) {
    return
  }

  previewImages(dish.value.image, [dish.value.image])
}

onShareAppMessage(() => {
  if (!dish.value) {
    return {
      title: '汤汤点餐 | 在线点餐',
      path: '/pages/customer/home/index',
    }
  }

  return buildDishWechatShare(dish.value)
})

onShareTimeline(() => {
  if (!dish.value) {
    return {
      title: '汤汤点餐 | 在线点餐',
      query: '',
    }
  }

  return {
    title: `${dish.value.name} | 汤汤点餐`,
    query: buildDishSharePath(dish.value.id).split('?')[1],
    imageUrl: dish.value.image,
  }
})
</script>

<template>
  <view class="dish-detail-page">
    <view v-if="loading" class="loading-text">正在加载菜品...</view>

    <template v-else-if="dish">
      <view class="dish-image" @click="previewDishImage">
        <button class="detail-share-button" open-type="share" @click.stop="onShareDish">
          <view class="detail-share-icon">
            <view class="detail-share-line detail-share-line-up"></view>
            <view class="detail-share-line detail-share-line-down"></view>
            <view class="detail-share-dot detail-share-dot-left"></view>
            <view class="detail-share-dot detail-share-dot-top"></view>
            <view class="detail-share-dot detail-share-dot-bottom"></view>
          </view>
          <text class="detail-share-text">分享</text>
        </button>

        <view v-if="!imageLoaded && !imageFailed" class="detail-image-skeleton">
          <text class="detail-image-skeleton-text">图片加载中</text>
        </view>
        <image
          :class="{ loaded: imageLoaded }"
          :src="dish.image || '/static/logo.png'"
          mode="aspectFill"
          lazy-load
          show-menu-by-longpress
          @load="onImageLoad"
          @error="onImageError"
        />
        <view v-if="imageFailed" class="detail-image-fallback">图片加载失败</view>
        <view class="detail-image-tip">点击查看大图</view>
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
      {{ dish.stock !== -1 && dish.stock <= 0 ? '已售罄' : '加购' }}
    </button>

    <button
      class="btn-buy-now"
      :disabled="dish.stock !== -1 && dish.stock <= 0"
      @click="buyNow"
    >
      立即购买
    </button>
  </view>
</template>

<style scoped lang="scss">
.dish-detail-page {
  min-height: 100vh;
  padding-bottom: 148rpx;
  background: linear-gradient(180deg, #FCFAFD 0%, #F8F5FA 48%, #F3EEF7 100%);
}

/* #ifdef H5 */
.dish-detail-page {
  min-height: 100%;
  padding-bottom: calc(148rpx + var(--window-bottom));
}
/* #endif */

.dish-image {
  position: relative;
  width: 100%;
  height: 520rpx;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(172, 39, 237, 0.08), rgba(255, 255, 255, 0.72)),
    #ffffff;
}

.dish-image image {
  width: 100%;
  height: 100%;
  display: block;
  opacity: 0;
  transition: opacity 240ms ease-out;
}

.dish-image image.loaded {
  opacity: 1;
}

.detail-image-skeleton {
  position: absolute;
  inset: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(110deg, rgba(255, 255, 255, 0.34) 8%, rgba(172, 39, 237, 0.13) 18%, rgba(255, 255, 255, 0.34) 33%),
    #F4ECF8;
  background-size: 300% 100%;
  animation: detailImageShimmer 1100ms ease-in-out infinite;
}

.detail-image-skeleton-text,
.detail-image-fallback {
  color: rgba(122, 31, 168, 0.74);
  font-size: 26rpx;
  font-weight: 800;
}

.detail-image-fallback {
  position: absolute;
  inset: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F4ECF8;
}

.detail-image-tip {
  position: absolute;
  right: 24rpx;
  bottom: 24rpx;
  padding: 10rpx 18rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.58);
  border-radius: 999rpx;
  background: rgba(17, 24, 39, 0.48);
  color: #ffffff;
  font-size: 24rpx;
  line-height: 1.2;
  box-shadow: 0 8rpx 18rpx rgba(17, 24, 39, 0.16);
}

.detail-share-button {
  position: absolute;
  top: 24rpx;
  right: 24rpx;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  width: 148rpx;
  height: 64rpx;
  margin: 0;
  padding: 0 18rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.54);
  border-radius: 999rpx;
  background:
    linear-gradient(135deg, rgba(172, 39, 237, 0.92), rgba(201, 91, 255, 0.88)),
    rgba(172, 39, 237, 0.88);
  color: #ffffff;
  line-height: 1;
  box-shadow:
    0 12rpx 28rpx rgba(54, 20, 82, 0.26),
    inset 0 0 0 1rpx rgba(255, 255, 255, 0.18);
}

.detail-share-button:active {
  transform: scale(0.96);
}

.detail-share-icon {
  position: relative;
  width: 30rpx;
  height: 30rpx;
  flex-shrink: 0;
}

.detail-share-dot {
  position: absolute;
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 0 10rpx rgba(255, 255, 255, 0.4);
}

.detail-share-dot-left {
  left: 1rpx;
  top: 11rpx;
}

.detail-share-dot-top {
  right: 1rpx;
  top: 3rpx;
}

.detail-share-dot-bottom {
  right: 1rpx;
  bottom: 3rpx;
}

.detail-share-line {
  position: absolute;
  left: 8rpx;
  top: 14rpx;
  width: 20rpx;
  height: 3rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.82);
  transform-origin: left center;
}

.detail-share-line-up {
  transform: rotate(-25deg);
}

.detail-share-line-down {
  transform: rotate(25deg);
}

.detail-share-text {
  color: #ffffff;
  font-size: 25rpx;
  font-weight: 800;
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

/* #ifdef H5 */
.bottom-bar {
  bottom: var(--window-bottom);
}
/* #endif */

.cart-wrapper {
  position: relative;
  margin-right: 16rpx;
}

.cart-icon {
  display: flex;
  width: 64rpx;
  height: 64rpx;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(172, 39, 237, 0.2);
  border-radius: 22rpx;
  background: #F4ECF8;
  color: #AC27ED;
  font-size: 36rpx;
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
  margin-right: 16rpx;
  overflow: hidden;
  border: 1rpx solid #E8DDED;
  border-radius: 18rpx;
  background: #ffffff;
}

.btn-minus,
.btn-plus {
  width: 52rpx;
  height: 58rpx;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  color: #AC27ED;
  line-height: 58rpx;
  font-size: 32rpx;
}

.btn-minus.disabled {
  color: #b8c0b9;
}

.quantity-input {
  width: 62rpx;
  height: 58rpx;
  border-right: 1rpx solid #E8DDED;
  border-left: 1rpx solid #E8DDED;
  color: #111827;
  text-align: center;
  font-size: 28rpx;
}

.btn-add-cart {
  flex: 1;
  min-width: 132rpx;
  height: 78rpx;
  margin: 0;
  margin-right: 16rpx;
  border: none;
  border-radius: 18rpx;
  background: #AC27ED;
  color: #ffffff;
  line-height: 78rpx;
  font-size: 27rpx;
  font-weight: 700;
  box-shadow: 0 8rpx 18rpx rgba(172, 39, 237, 0.22);
}

.btn-buy-now {
  flex: 1.15;
  min-width: 156rpx;
  height: 78rpx;
  margin: 0;
  border: none;
  border-radius: 18rpx;
  background: linear-gradient(135deg, #AC27ED 0%, #C95BFF 100%);
  color: #ffffff;
  line-height: 78rpx;
  font-size: 27rpx;
  font-weight: 700;
  box-shadow: 0 10rpx 24rpx rgba(172, 39, 237, 0.24);
}

.btn-add-cart[disabled],
.btn-buy-now[disabled] {
  background: #dfe5df;
  color: #5c6670;
  box-shadow: none;
}

.btn-minus::after,
.btn-plus::after,
.btn-add-cart::after,
.btn-buy-now::after,
.detail-share-button::after {
  border: none;
}

.loading-text {
  padding: 40rpx 0;
  text-align: center;
  color: #5c6670;
}

@keyframes detailImageShimmer {
  from {
    background-position: 120% 0;
  }

  to {
    background-position: -120% 0;
  }
}

/* #ifdef H5 */
@media (prefers-reduced-motion: reduce) {
  .dish-image image,
  .detail-image-skeleton {
    animation: none;
    transition: none;
  }
}
/* #endif */
</style>
