<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'
import type { Dish } from '@/types/models'
import { formatPrice } from '@/utils/format'

const props = defineProps<{
  dish: Dish
  quantity: number
}>()

const emit = defineEmits<{
  (event: 'detail', value: number): void
  (event: 'add', value: Dish): void
  (event: 'remove', value: number): void
  (event: 'preview', value: Dish): void
  (event: 'share', value: Dish): void
}>()

const soldOut = computed(
  () => props.dish.stock !== -1 && props.dish.stock <= 0,
)
const imageLoaded = shallowRef(false)
const imageFailed = shallowRef(false)
const dishImage = computed(() => props.dish.image || '/static/logo.png')

watch(
  () => props.dish.image,
  () => {
    imageLoaded.value = false
    imageFailed.value = false
  },
)

function onImageLoad() {
  imageLoaded.value = true
  imageFailed.value = false
}

function onImageError() {
  imageLoaded.value = true
  imageFailed.value = true
}
</script>

<template>
  <view class="dish-card">
    <button
      class="share-button"
      open-type="share"
      :data-dish-id="dish.id"
      @click.stop="emit('share', dish)"
    >
      <view class="share-icon">
        <view class="share-line share-line-up"></view>
        <view class="share-line share-line-down"></view>
        <view class="share-dot share-dot-left"></view>
        <view class="share-dot share-dot-top"></view>
        <view class="share-dot share-dot-bottom"></view>
      </view>
    </button>

    <view class="dish-image-wrap" @click.stop="emit('preview', dish)">
      <view v-if="!imageLoaded && !imageFailed" class="image-skeleton">
        <text class="image-skeleton-text">加载中</text>
      </view>
      <image
        class="dish-image"
        :class="{ loaded: imageLoaded }"
        :src="dishImage"
        mode="aspectFill"
        lazy-load
        show-menu-by-longpress
        @load="onImageLoad"
        @error="onImageError"
      />
      <view v-if="imageFailed" class="image-fallback">暂无图片</view>
      <view class="image-preview-badge">放大</view>
    </view>
    <view class="dish-body" @click="emit('detail', dish.id)">
      <view class="dish-name">{{ dish.name }}</view>
      <view class="dish-description">{{ dish.description }}</view>
      <view class="dish-tags">
        <text v-if="dish.isRecommend" class="dish-tag hot">推荐</text>
        <text v-for="tag in dish.tags" :key="tag" class="dish-tag">{{ tag }}</text>
      </view>
      <view class="dish-footer">
        <view class="dish-price">
          <text class="price-symbol">¥</text>
          {{ formatPrice(dish.price) }}
        </view>
        <view class="dish-actions" @click.stop>
          <view v-if="soldOut" class="dish-empty">已售罄</view>
          <template v-else>
            <view v-if="quantity" class="quantity-control">
              <button class="stepper-button muted" @click="emit('remove', dish.id)">-</button>
              <view class="stepper-count">{{ quantity }}</view>
              <button class="stepper-button" @click="emit('add', dish)">+</button>
            </view>
            <button v-else class="add-button" @click="emit('add', dish)">加购</button>
          </template>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.dish-card {
  position: relative;
  display: flex;
  margin-bottom: 20rpx;
  padding: 22rpx;
  overflow: hidden;
  border: 2rpx solid rgba(172, 39, 237, 0.08);
  background:
    linear-gradient(135deg, rgba(172, 39, 237, 0.045), rgba(139, 92, 246, 0.018)),
    rgba(255, 255, 255, 0.94);
  border-radius: 20rpx;
  box-shadow: 0 10rpx 24rpx rgba(17, 24, 39, 0.07);
  transform: translateZ(0);
  animation: dishCardIn 420ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
  transition:
    transform 180ms ease-out,
    border-color 180ms ease-out,
    box-shadow 180ms ease-out;
}

.dish-card::before {
  position: absolute;
  top: 0;
  right: 24rpx;
  left: 24rpx;
  height: 2rpx;
  background: linear-gradient(90deg, transparent, rgba(172, 39, 237, 0.3), transparent);
  content: '';
}

.dish-card:active {
  transform: translateY(-4rpx) scale(0.995);
  border-color: rgba(172, 39, 237, 0.18);
  box-shadow: 0 18rpx 38rpx rgba(54, 20, 82, 0.12);
}

.dish-card:nth-child(2) {
  animation-delay: 34ms;
}

.dish-card:nth-child(3) {
  animation-delay: 68ms;
}

.dish-card:nth-child(4) {
  animation-delay: 102ms;
}

.dish-card:nth-child(5) {
  animation-delay: 136ms;
}

.dish-image-wrap {
  position: relative;
  width: 204rpx;
  height: 164rpx;
  margin-right: 20rpx;
  overflow: hidden;
  border-radius: 20rpx;
  background:
    linear-gradient(135deg, rgba(172, 39, 237, 0.08), rgba(255, 255, 255, 0.7)),
    #f5f5f5;
  flex-shrink: 0;
  box-shadow: 0 8rpx 18rpx rgba(17, 24, 39, 0.08);
  transition: transform 220ms ease-out;
}

.dish-card:active .dish-image-wrap {
  transform: scale(1.025);
}

.dish-image {
  width: 100%;
  height: 100%;
  display: block;
  opacity: 0;
  transition: opacity 220ms ease-out;
}

.dish-image.loaded {
  opacity: 1;
}

.image-skeleton {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    linear-gradient(110deg, rgba(255, 255, 255, 0.28) 8%, rgba(172, 39, 237, 0.12) 18%, rgba(255, 255, 255, 0.28) 33%),
    #F4ECF8;
  background-size: 300% 100%;
  animation: imageShimmer 1100ms ease-in-out infinite;
}

.image-skeleton-text,
.image-fallback {
  color: rgba(122, 31, 168, 0.72);
  font-size: 22rpx;
  font-weight: 700;
}

.image-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F4ECF8;
}

.image-preview-badge {
  position: absolute;
  right: 10rpx;
  bottom: 10rpx;
  padding: 4rpx 10rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.58);
  border-radius: 999rpx;
  background: rgba(17, 24, 39, 0.46);
  color: #ffffff;
  font-size: 20rpx;
  line-height: 1.2;
}

.dish-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-width: 0;
}

.dish-name {
  overflow: hidden;
  padding-right: 74rpx;
  box-sizing: border-box;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 32rpx;
  font-weight: 800;
  color: #111827;
}

.dish-description {
  overflow: hidden;
  margin-top: 8rpx;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 24rpx;
  color: #5c6670;
}

.dish-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-top: 8rpx;
}

.dish-tag {
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  border: 1rpx solid #E8DDED;
  background: #f7faf8;
  color: #6c7580;
  font-size: 21rpx;
  transition:
    border-color 160ms ease-out,
    background-color 160ms ease-out,
    color 160ms ease-out;
}

.dish-tag.hot {
  border-color: rgba(172, 39, 237, 0.2);
  background: #F4ECF8;
  color: #7A1FA8;
}

.dish-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12rpx;
  margin-top: 8rpx;
}

.dish-price {
  flex-shrink: 0;
  font-size: 36rpx;
  font-weight: 800;
  color: #AC27ED;
}

.price-symbol {
  font-size: 24rpx;
}

.dish-actions {
  display: flex;
  align-items: center;
  gap: 10rpx;
  flex-shrink: 0;
}

.quantity-control {
  display: flex;
  align-items: center;
}

.stepper-button {
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
  transition:
    transform 160ms ease-out,
    box-shadow 160ms ease-out,
    background-color 160ms ease-out;
}

.stepper-button::after {
  border: none;
}

.stepper-button.muted {
  border: 1rpx solid rgba(172, 39, 237, 0.22);
  background: #ffffff;
  color: #AC27ED;
  box-shadow: none;
}

.stepper-count {
  min-width: 40rpx;
  margin: 0 16rpx;
  text-align: center;
  font-size: 28rpx;
  font-weight: 700;
}

.add-button {
  margin: 0;
  min-width: 104rpx;
  padding: 0 20rpx;
  height: 58rpx;
  border: none;
  border-radius: 999rpx;
  background: #AC27ED;
  color: #ffffff;
  line-height: 58rpx;
  font-size: 24rpx;
  font-weight: 700;
  box-shadow: 0 10rpx 22rpx rgba(172, 39, 237, 0.22);
  transition:
    transform 160ms ease-out,
    box-shadow 160ms ease-out;
}

.share-button {
  position: absolute;
  top: 14rpx;
  right: 14rpx;
  width: 50rpx;
  height: 50rpx;
  margin: 0;
  padding: 0;
  border: 1rpx solid rgba(172, 39, 237, 0.16);
  border-radius: 50%;
  background:
    radial-gradient(circle at 32% 24%, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.74)),
    rgba(255, 255, 255, 0.86);
  color: #AC27ED;
  line-height: 1;
  z-index: 4;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 8rpx 16rpx rgba(54, 20, 82, 0.12),
    inset 0 0 0 1rpx rgba(255, 255, 255, 0.72);
  transition:
    transform 160ms ease-out,
    border-color 160ms ease-out,
    background-color 160ms ease-out;
}

.share-button:active {
  transform: translateY(-2rpx) scale(0.94);
  border-color: rgba(172, 39, 237, 0.28);
  background:
    radial-gradient(circle at 32% 24%, rgba(255, 255, 255, 1), rgba(244, 236, 248, 0.9)),
    #F4ECF8;
}

.share-icon {
  position: relative;
  width: 28rpx;
  height: 28rpx;
}

.share-dot {
  position: absolute;
  width: 8rpx;
  height: 8rpx;
  border-radius: 50%;
  background: #AC27ED;
  box-shadow: 0 0 10rpx rgba(172, 39, 237, 0.24);
}

.share-dot-left {
  left: 2rpx;
  top: 10rpx;
}

.share-dot-top {
  right: 2rpx;
  top: 2rpx;
}

.share-dot-bottom {
  right: 2rpx;
  bottom: 2rpx;
}

.share-line {
  position: absolute;
  left: 8rpx;
  top: 13rpx;
  width: 17rpx;
  height: 2rpx;
  border-radius: 999rpx;
  background: rgba(172, 39, 237, 0.72);
  transform-origin: left center;
}

.share-line-up {
  transform: rotate(-28deg);
}

.share-line-down {
  transform: rotate(28deg);
}

.add-button:active,
.stepper-button:active {
  transform: scale(0.94);
  box-shadow: 0 6rpx 14rpx rgba(172, 39, 237, 0.2);
}

.add-button::after,
.share-button::after {
  border: none;
}

.dish-empty {
  font-size: 22rpx;
  color: #5c6670;
}

@keyframes dishCardIn {
  from {
    opacity: 0;
    transform: translateY(22rpx) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes imageShimmer {
  from {
    background-position: 120% 0;
  }

  to {
    background-position: -120% 0;
  }
}

/* #ifdef H5 */
@media (prefers-reduced-motion: reduce) {
  .dish-card,
  .dish-image,
  .dish-image-wrap,
  .image-skeleton,
  .add-button,
  .share-button,
  .stepper-button {
    animation: none;
    transition: none;
  }
}
/* #endif */
</style>
