<script setup lang="ts">
import { onLoad, onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { shallowRef } from 'vue'
import OrderCard from '@/components/order/OrderCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { customerOrderTabs } from '@/utils/order'
import { cancelOrder, getOrders, payOrder } from '@/api/customer'
import { useAuthGuard } from '@/composables/useAuthGuard'
import type { Order } from '@/types/models'

const authGuard = useAuthGuard()
const currentStatus = shallowRef('')
const loading = shallowRef(false)
const orders = shallowRef<Order[]>([])

async function loadOrders() {
  if (!authGuard.ensure()) {
    return
  }

  loading.value = true
  try {
    orders.value = await getOrders(currentStatus.value || undefined)
  } catch (error) {
    uni.showToast({
      title: (error as Error).message || '加载订单失败',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}

function onOpenDetail(id: number) {
  uni.navigateTo({
    url: `/pages/customer/order-detail/index?id=${id}`,
  })
}

async function onPay(id: number) {
  try {
    await payOrder(id)
    uni.showToast({
      title: '支付成功',
      icon: 'success',
    })
    await loadOrders()
  } catch (error) {
    uni.showToast({
      title: (error as Error).message || '支付失败',
      icon: 'none',
    })
  }
}

async function onCancel(id: number) {
  try {
    await cancelOrder(id)
    uni.showToast({
      title: '订单已取消',
      icon: 'success',
    })
    await loadOrders()
  } catch (error) {
    uni.showToast({
      title: (error as Error).message || '取消失败',
      icon: 'none',
    })
  }
}

function goShopping() {
  uni.switchTab({
    url: '/pages/customer/home/index',
  })
}

function setStatus(status: string) {
  currentStatus.value = status
  void loadOrders()
}

onLoad((query) => {
  if (query?.status) {
    currentStatus.value = String(query.status)
  }
})

onShow(() => {
  const pendingStatus = uni.getStorageSync('sw_order_filter')
  if (pendingStatus !== '') {
    currentStatus.value = String(pendingStatus || '')
    uni.removeStorageSync('sw_order_filter')
  }
  void loadOrders()
})

onPullDownRefresh(async () => {
  await loadOrders()
  uni.stopPullDownRefresh()
})
</script>

<template>
  <view class="order-page">
    <view class="tabs">
      <view
        v-for="tab in customerOrderTabs"
        :key="tab.label"
        class="tab-item"
        :class="{ active: tab.value === currentStatus }"
        @click="setStatus(tab.value)"
      >
        {{ tab.label }}
      </view>
    </view>

    <view v-if="loading" class="loading-text">加载中...</view>
    <EmptyState
      v-else-if="!orders.length"
      title="暂无订单"
      description="完成下单后会在这里看到订单状态"
      action-text="去点餐"
      @action="goShopping"
    />
    <scroll-view v-else class="order-list" scroll-y>
      <OrderCard
        v-for="order in orders"
        :key="order.id"
        :order="order"
        role="customer"
        @detail="onOpenDetail"
        @pay="onPay"
        @cancel="onCancel"
      />
    </scroll-view>
  </view>
</template>

<style scoped lang="scss">
.order-page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: linear-gradient(180deg, #FCFAFD 0%, #F8F5FA 48%, #F3EEF7 100%);
}

.tabs {
  display: flex;
  gap: 8rpx;
  flex-shrink: 0;
  padding: 14rpx 16rpx;
  border-bottom: 1rpx solid #E8DDED;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 8rpx 22rpx rgba(17, 24, 39, 0.06);
}

.tab-item {
  flex: 1;
  position: relative;
  padding: 18rpx 0;
  border: 1rpx solid transparent;
  border-radius: 999rpx;
  text-align: center;
  font-size: 28rpx;
  color: #5c6670;
}

.tab-item.active {
  border-color: rgba(172, 39, 237, 0.22);
  background: #F4ECF8;
  color: #7A1FA8;
  font-weight: 700;
  box-shadow: none;
}

.tab-item.active::after {
  display: none;
}

.loading-text {
  padding: 60rpx 0;
  text-align: center;
  color: #5c6670;
  font-size: 28rpx;
}

.order-list {
  flex: 1;
  padding: 20rpx;
}
</style>
