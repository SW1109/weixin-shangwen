<script setup lang="ts">
import type { Category } from '@/types/models'

defineProps<{
  categories: Category[]
  activeId?: number | null
}>()

const emit = defineEmits<{
  (event: 'select', value?: number): void
}>()
</script>

<template>
  <scroll-view class="category-sidebar" scroll-y>
    <view
      class="category-item"
      :class="{ active: !activeId }"
      @click="emit('select', undefined)"
    >
      全部
    </view>
    <view
      v-for="category in categories"
      :key="category.id"
      class="category-item"
      :class="{ active: category.id === activeId }"
      @click="emit('select', category.id)"
    >
      {{ category.name }}
    </view>
  </scroll-view>
</template>

<style scoped lang="scss">
.category-sidebar {
  width: 188rpx;
  height: 100%;
  padding: 0;
  border-right: 1rpx solid #E8DDED;
  background: #F3EEF7;
  box-shadow: none;
}

.category-item {
  position: relative;
  margin: 10rpx 12rpx;
  padding: 28rpx 14rpx;
  border: 1rpx solid transparent;
  border-radius: 16rpx;
  font-size: 27rpx;
  color: #5c6670;
  text-align: center;
  background: transparent;
  word-break: break-word;
}

.category-item.active {
  background: #ffffff;
  border-color: rgba(172, 39, 237, 0.22);
  color: #111827;
  font-weight: 700;
  box-shadow: 0 8rpx 20rpx rgba(17, 24, 39, 0.07);
}

.category-item.active::before {
  content: '';
  position: absolute;
  left: -12rpx;
  top: 50%;
  transform: translateY(-50%);
  width: 8rpx;
  height: 42rpx;
  border-radius: 999rpx;
  background: #AC27ED;
}
</style>
