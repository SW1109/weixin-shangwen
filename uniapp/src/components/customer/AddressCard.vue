<script setup lang="ts">
import { computed } from 'vue'
import type { Address } from '@/types/models'

const props = defineProps<{
  address: Address
  selected?: boolean
  editable?: boolean
}>()

const emit = defineEmits<{
  (event: 'click', value: number): void
  (event: 'edit', value: number): void
}>()

const fullAddress = computed(
  () =>
    `${props.address.province}${props.address.city}${props.address.district}${props.address.detail}`,
)
</script>

<template>
  <view class="address-card" :class="{ selected }" @click="emit('click', address.id)">
    <view v-if="address.isDefault" class="default-tag">默认</view>
    <view class="address-header">
      <view class="address-name">{{ address.name }}</view>
      <view class="address-phone">{{ address.phone }}</view>
    </view>
    <view class="address-detail">
      <text class="address-icon">📍</text>
      <text class="address-text">{{ fullAddress }}</text>
    </view>
    <button
      v-if="editable"
      class="address-edit"
      @click.stop="emit('edit', address.id)"
    >
      编辑
    </button>
  </view>
</template>

<style scoped lang="scss">
.address-card {
  position: relative;
  padding: 30rpx;
  border: 2rpx solid #E8DDED;
  border-radius: 20rpx;
  background: #ffffff;
  box-shadow: 0 10rpx 24rpx rgba(17, 24, 39, 0.06);
}

.address-card.selected {
  border-color: #AC27ED;
  box-shadow: 0 0 0 2rpx rgba(172, 39, 237, 0.12);
}

.default-tag {
  position: absolute;
  top: 0;
  right: 0;
  padding: 6rpx 16rpx;
  border-radius: 0 22rpx 0 22rpx;
  background: #AC27ED;
  color: #ffffff;
  font-size: 20rpx;
}

.address-header {
  display: flex;
  align-items: center;
  gap: 20rpx;
  flex-wrap: wrap;
  margin-bottom: 20rpx;
}

.address-name {
  font-size: 32rpx;
  font-weight: 700;
  color: #111827;
}

.address-phone {
  font-size: 28rpx;
  color: #5c6670;
}

.address-detail {
  display: flex;
  align-items: flex-start;
  gap: 10rpx;
  padding-right: 120rpx;
}

.address-icon {
  font-size: 40rpx;
  line-height: 1.5;
  flex-shrink: 0;
}

.address-text {
  flex: 1;
  font-size: 28rpx;
  line-height: 1.6;
  color: #5c6670;
}

.address-edit {
  position: absolute;
  top: 20rpx;
  right: 20rpx;
  margin: 0;
  padding: 0 22rpx;
  height: 60rpx;
  line-height: 60rpx;
  border-radius: 999rpx;
  border: 1rpx solid rgba(172, 39, 237, 0.18);
  background: #ffffff;
  color: #AC27ED;
  font-size: 24rpx;
  font-weight: 700;
}

.address-edit::after {
  border: none;
}
</style>
