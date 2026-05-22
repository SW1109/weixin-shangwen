<script setup lang="ts">
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { shallowRef } from 'vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { getMerchantCategories, getMerchantDishes, deleteDish, toggleDishStatus } from '@/api/merchant'
import { useMerchantGuard } from '@/composables/useMerchantGuard'
import { formatPrice } from '@/utils/format'
import type { Category, Dish } from '@/types/models'

const merchantGuard = useMerchantGuard()
const categories = shallowRef<Category[]>([])
const selectedCategoryId = shallowRef<number | undefined>()
const dishes = shallowRef<Dish[]>([])
const loading = shallowRef(false)
const dishImageLoaded = shallowRef<Record<number, boolean>>({})
const dishImageFailed = shallowRef<Record<number, boolean>>({})

async function loadCategories() {
  categories.value = await getMerchantCategories()
}

async function loadDishes() {
  loading.value = true
  try {
    dishes.value = await getMerchantDishes(selectedCategoryId.value)
    dishImageLoaded.value = {}
    dishImageFailed.value = {}
  } finally {
    loading.value = false
  }
}

async function initialize() {
  if (!merchantGuard.ensure()) {
    return
  }

  await loadCategories()
  await loadDishes()
}

async function onDelete(id: number) {
  await deleteDish(id)
  await loadDishes()
}

async function onToggleStatus(item: Dish) {
  await toggleDishStatus(item.id, item.status === 1 ? 0 : 1)
  await loadDishes()
}

function openCategoryPage() {
  uni.navigateTo({
    url: '/pages/merchant/category/index',
  })
}

function openCreateDishPage() {
  uni.navigateTo({
    url: '/pages/merchant/dish-edit/index',
  })
}

function openEditDishPage(id: number) {
  uni.navigateTo({
    url: `/pages/merchant/dish-edit/index?id=${id}`,
  })
}

function getDishImage(item: Dish) {
  return item.image || '/static/logo.png'
}

function onDishImageLoad(id: number) {
  dishImageLoaded.value = {
    ...dishImageLoaded.value,
    [id]: true,
  }
  dishImageFailed.value = {
    ...dishImageFailed.value,
    [id]: false,
  }
}

function onDishImageError(id: number) {
  dishImageLoaded.value = {
    ...dishImageLoaded.value,
    [id]: true,
  }
  dishImageFailed.value = {
    ...dishImageFailed.value,
    [id]: true,
  }
}

onLoad(() => {
  void initialize()
})

onPullDownRefresh(async () => {
  await initialize()
  uni.stopPullDownRefresh()
})
</script>

<template>
  <view class="merchant-dish-page">
    <view class="top-bar">
      <button class="btn-add" @click="openCreateDishPage">+ 添加菜品</button>
      <button class="btn-category" @click="openCategoryPage">分类管理</button>
    </view>

    <view class="categories">
      <scroll-view class="category-scroll" scroll-x>
        <view class="category-list">
          <view
            class="category-tag"
            :class="{ active: !selectedCategoryId }"
            @click="
              selectedCategoryId = undefined;
              loadDishes()
            "
          >
            全部
          </view>
          <view
            v-for="category in categories"
            :key="category.id"
            class="category-tag"
            :class="{ active: category.id === selectedCategoryId }"
            @click="
              selectedCategoryId = category.id;
              loadDishes()
            "
          >
            {{ category.name }}
          </view>
        </view>
      </scroll-view>
    </view>

    <view v-if="loading" class="loading-text">加载中...</view>
    <EmptyState
      v-else-if="!dishes.length"
      title="暂无菜品"
      description="暂无菜品，点击右上角添加吧"
    />
    <view v-else class="dish-list">
      <view v-for="dish in dishes" :key="dish.id" class="dish-card">
        <view class="dish-image-wrap" @click="openEditDishPage(dish.id)">
          <view
            v-if="!dishImageLoaded[dish.id] && !dishImageFailed[dish.id]"
            class="image-skeleton"
          >
            <text class="image-skeleton-text">加载中</text>
          </view>
          <image
            class="dish-image"
            :class="{ loaded: dishImageLoaded[dish.id] && !dishImageFailed[dish.id] }"
            :src="getDishImage(dish)"
            mode="aspectFill"
            lazy-load
            show-menu-by-longpress
            @load="onDishImageLoad(dish.id)"
            @error="onDishImageError(dish.id)"
          />
          <view v-if="dishImageFailed[dish.id]" class="image-fallback">暂无图片</view>
        </view>
        <view class="dish-content" @click="openEditDishPage(dish.id)">
          <view class="dish-header">
            <text class="dish-name">{{ dish.name }}</text>
            <view class="dish-status" :class="{ offline: dish.status !== 1 }">
              {{ dish.status === 1 ? '已上架' : '已下架' }}
            </view>
          </view>
          <view class="dish-desc">{{ dish.description }}</view>
          <view class="dish-footer">
            <view class="dish-price">
              <text class="price-symbol">¥</text>
              <text class="price-value">{{ formatPrice(dish.price) }}</text>
            </view>
            <view class="dish-info">
              <text class="info-item">库存: {{ dish.stock === -1 ? '无限' : dish.stock }}</text>
              <text class="info-item">销量: {{ dish.sales || 0 }}</text>
            </view>
          </view>
        </view>

        <view class="dish-actions">
          <button class="action-btn btn-toggle" @click="onToggleStatus(dish)">
            {{ dish.status === 1 ? '下架' : '上架' }}
          </button>
          <button class="action-btn btn-delete" @click="onDelete(dish.id)">删除</button>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.merchant-dish-page {
  min-height: 100vh;
  padding-top: 236rpx;
  background:
    linear-gradient(135deg, rgba(172, 39, 237, 0.09) 0%, rgba(172, 39, 237, 0) 36%),
    linear-gradient(180deg, #fbf8ff 0%, #f5f5f5 48%);
}

/* #ifdef H5 */
.merchant-dish-page {
  min-height: 100%;
}
/* #endif */

.top-bar {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  display: flex;
  gap: 20rpx;
  padding: 20rpx 30rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 12rpx 30rpx rgba(54, 20, 82, 0.08);
  z-index: 100;
}

/* #ifdef H5 */
.top-bar {
  top: var(--window-top);
}
/* #endif */

.btn-add,
.btn-category {
  flex: 1;
  height: 78rpx;
  margin: 0;
  border: none;
  border-radius: 999rpx;
  line-height: 78rpx;
  font-size: 28rpx;
  font-weight: 700;
}

.btn-add {
  background: linear-gradient(135deg, #AC27ED 0%, #C95BFF 100%);
  color: #ffffff;
  box-shadow: 0 10rpx 24rpx rgba(172, 39, 237, 0.24);
}

.btn-category {
  border: 1rpx solid rgba(172, 39, 237, 0.16);
  background: #ffffff;
  color: #6d6178;
}

.btn-add::after,
.btn-category::after {
  border: none;
}

.categories {
  position: fixed;
  top: 118rpx;
  right: 0;
  left: 0;
  border-bottom: 1rpx solid #e5e5e5;
  background: rgba(255, 255, 255, 0.96);
  z-index: 99;
}

/* #ifdef H5 */
.categories {
  top: calc(var(--window-top) + 118rpx);
}
/* #endif */

.category-scroll {
  width: 100%;
  white-space: nowrap;
}

.category-list {
  display: inline-flex;
  gap: 20rpx;
  padding: 20rpx 30rpx;
}

.category-tag {
  display: inline-block;
  padding: 14rpx 34rpx;
  border-radius: 999rpx;
  border: 1rpx solid rgba(172, 39, 237, 0.12);
  background: #ffffff;
  color: #6d6178;
  font-size: 26rpx;
  white-space: nowrap;
}

.category-tag.active {
  background: linear-gradient(135deg, #AC27ED 0%, #C95BFF 100%);
  color: #ffffff;
  box-shadow: 0 8rpx 18rpx rgba(172, 39, 237, 0.22);
}

.dish-list {
  padding: 20rpx;
}

.dish-card {
  margin-bottom: 20rpx;
  overflow: hidden;
  border: 2rpx solid rgba(172, 39, 237, 0.08);
  border-radius: 24rpx;
  background: #ffffff;
  box-shadow: 0 14rpx 32rpx rgba(54, 20, 82, 0.08);
}

.dish-image-wrap {
  position: relative;
  width: 100%;
  height: 360rpx;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(172, 39, 237, 0.08), rgba(255, 255, 255, 0.72)),
    #F4ECF8;
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
    linear-gradient(110deg, rgba(255, 255, 255, 0.34) 8%, rgba(172, 39, 237, 0.13) 18%, rgba(255, 255, 255, 0.34) 33%),
    #F4ECF8;
  background-size: 300% 100%;
  animation: imageShimmer 1100ms ease-in-out infinite;
}

.image-skeleton-text,
.image-fallback {
  color: rgba(122, 31, 168, 0.72);
  font-size: 24rpx;
  font-weight: 800;
}

.image-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F4ECF8;
}

.dish-content {
  padding: 30rpx;
}

.dish-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.dish-name {
  flex: 1;
  color: #333333;
  font-size: 32rpx;
  font-weight: 700;
}

.dish-status {
  padding: 6rpx 14rpx;
  border-radius: 999rpx;
  background: #f6ffed;
  color: #52c41a;
  font-size: 24rpx;
}

.dish-status.offline {
  background: #fff0f0;
  color: #f5222d;
}

.dish-desc {
  display: -webkit-box;
  overflow: hidden;
  margin-bottom: 20rpx;
  color: #999999;
  font-size: 26rpx;
  text-overflow: ellipsis;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.dish-footer {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}

.dish-price {
  display: flex;
  align-items: baseline;
}

.price-symbol {
  color: #AC27ED;
  font-size: 24rpx;
}

.price-value {
  color: #AC27ED;
  font-size: 40rpx;
  font-weight: 700;
}

.dish-info {
  display: flex;
  gap: 20rpx;
}

.info-item {
  color: #999999;
  font-size: 24rpx;
}

.dish-actions {
  display: flex;
  gap: 18rpx;
  padding: 18rpx 24rpx 24rpx;
  border-top: 1rpx solid #f0f0f0;
}

.action-btn {
  flex: 1;
  height: 76rpx;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 999rpx;
  background: #ffffff;
  line-height: 76rpx;
  font-size: 28rpx;
  font-weight: 700;
}

.action-btn::after {
  border: none;
}

.btn-toggle {
  border: 1rpx solid rgba(172, 39, 237, 0.16);
  color: #AC27ED;
}

.btn-delete {
  background: #fff1f4;
  color: #f5222d;
}

.loading-text {
  padding: 60rpx 0;
  text-align: center;
  color: #999999;
  font-size: 28rpx;
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
  .dish-image,
  .image-skeleton {
    animation: none;
    transition: none;
  }
}
/* #endif */
</style>
