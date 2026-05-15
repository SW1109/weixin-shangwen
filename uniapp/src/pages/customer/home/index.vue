<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onLoad, onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { shallowRef } from 'vue'
import CategorySidebar from '@/components/customer/CategorySidebar.vue'
import DishCard from '@/components/customer/DishCard.vue'
import CartBar from '@/components/customer/CartBar.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { useCatalogStore } from '@/stores/catalog'
import { useCartStore } from '@/stores/cart'
import { useAuthStore } from '@/stores/auth'
import type { Dish } from '@/types/models'

const catalogStore = useCatalogStore()
const cartStore = useCartStore()
const authStore = useAuthStore()

const { categories, dishes } = storeToRefs(catalogStore)
const { totalCount, totalPrice } = storeToRefs(cartStore)

const keyword = shallowRef('')
const selectedCategoryId = shallowRef<number | undefined>()
const loading = shallowRef(false)

async function loadData(force = false) {
  loading.value = true
  try {
    await catalogStore.loadCategories(force)
    await catalogStore.loadDishes({
      categoryId: selectedCategoryId.value,
      keyword: keyword.value.trim() || undefined,
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

function onSelectCategory(categoryId?: number) {
  selectedCategoryId.value = categoryId
  void loadData()
}

function onSearchConfirm() {
  selectedCategoryId.value = undefined
  void loadData()
}

function onKeywordInput(event: any) {
  keyword.value = event.detail.value
}

function onOpenCart() {
  if (!totalCount.value) {
    uni.showToast({
      title: '购物车为空',
      icon: 'none',
    })
    return
  }

  uni.navigateTo({
    url: '/pages/customer/cart/index',
  })
}

function onShowDetail(id: number) {
  uni.navigateTo({
    url: `/pages/customer/dish/index?id=${id}`,
  })
}

function onAddDish(dish: Dish) {
  if (dish.stock !== -1 && dish.stock <= 0) {
    uni.showToast({
      title: '该菜品已售罄',
      icon: 'none',
    })
    return
  }

  cartStore.addDish(dish)
  uni.showToast({
    title: '已加入购物车',
    icon: 'success',
  })
}

function onLoadMore() {
  // 当前接口一次性返回列表，保留滚动触底入口以对齐原生页面结构。
}

onLoad(() => {
  void loadData()
})

onShow(() => {
  if (authStore.isUserLoggedIn) {
    void cartStore.pullRemote()
  }
})

onPullDownRefresh(async () => {
  await loadData(true)
  uni.stopPullDownRefresh()
})
</script>

<template>
  <view class="home-page">
    <view class="search-bar">
      <view class="search-input-wrap">
        <text class="search-icon">⌕</text>
        <input
          class="search-input"
          :value="keyword"
          placeholder="搜索菜品"
          confirm-type="search"
          @input="onKeywordInput"
          @confirm="onSearchConfirm"
        />
      </view>
    </view>

    <view class="content-row">
      <CategorySidebar
        :categories="categories"
        :active-id="selectedCategoryId"
        @select="onSelectCategory"
      />

      <scroll-view class="dish-list" scroll-y @scrolltolower="onLoadMore">
        <view v-if="loading" class="loading-text">正在加载菜品...</view>
        <EmptyState
          v-else-if="!dishes.length"
          title="暂无菜品"
          description="请切换分类或调整搜索条件"
        />
        <DishCard
          v-for="dish in dishes"
          :key="dish.id"
          :dish="dish"
          :quantity="cartStore.getDishQuantity(dish.id)"
          @detail="onShowDetail"
          @add="onAddDish"
          @remove="cartStore.decreaseDish"
        />
      </scroll-view>
    </view>

    <CartBar
      :count="totalCount"
      :total="totalPrice"
      @open="onOpenCart"
    />
  </view>
</template>

<style scoped lang="scss">
.home-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(180deg, #FCFAFD 0%, #F8F5FA 100%);
}

.search-bar {
  flex-shrink: 0;
  padding: 22rpx 22rpx 18rpx;
  border-bottom: 1rpx solid #E8DDED;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 8rpx 22rpx rgba(17, 24, 39, 0.06);
}

.search-input-wrap {
  display: flex;
  align-items: center;
  min-height: 76rpx;
  padding: 0 26rpx;
  border: 2rpx solid rgba(31, 41, 51, 0.08);
  border-radius: 999rpx;
  background: #f7faf8;
}

.search-icon {
  margin-right: 12rpx;
  color: #AC27ED;
  font-size: 34rpx;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  min-width: 0;
  color: #111827;
  font-size: 28rpx;
}

.content-row {
  flex: 1;
  display: flex;
  overflow: hidden;
  min-height: 0;
  padding-bottom: 164rpx;
}

.dish-list {
  flex: 1;
  height: 100%;
  min-width: 0;
  padding: 20rpx 20rpx 24rpx 16rpx;
  background: transparent;
}

.loading-text {
  padding: 40rpx 0;
  text-align: center;
  color: #5c6670;
  font-size: 28rpx;
}
</style>
