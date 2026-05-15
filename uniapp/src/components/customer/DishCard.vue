<script setup lang="ts">
import { computed } from 'vue'
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
}>()

const soldOut = computed(
  () => props.dish.stock !== -1 && props.dish.stock <= 0,
)
</script>

<template>
  <view class="dish-card">
    <image class="dish-image" :src="dish.image" mode="aspectFill" @click="emit('detail', dish.id)" />
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
  border: 2rpx solid #E8DDED;
  background: #ffffff;
  border-radius: 20rpx;
  box-shadow: 0 10rpx 24rpx rgba(17, 24, 39, 0.07);
}

.dish-image {
  width: 188rpx;
  height: 188rpx;
  margin-right: 20rpx;
  border-radius: 20rpx;
  background: #f5f5f5;
  flex-shrink: 0;
  box-shadow: 0 8rpx 18rpx rgba(17, 24, 39, 0.08);
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
}

.add-button::after {
  border: none;
}

.dish-empty {
  font-size: 22rpx;
  color: #5c6670;
}
</style>
