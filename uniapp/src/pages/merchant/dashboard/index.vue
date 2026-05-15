<script setup lang="ts">
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { shallowRef } from 'vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { getDashboard } from '@/api/merchant'
import { useMerchantGuard } from '@/composables/useMerchantGuard'
import { useVisiblePolling } from '@/composables/useVisiblePolling'
import { formatDateTime, formatPrice } from '@/utils/format'
import { getOrderStatusText } from '@/utils/order'
import type { DashboardData } from '@/types/models'

const merchantGuard = useMerchantGuard()
const dashboard = shallowRef<DashboardData | null>(null)
const loading = shallowRef(false)
const lastDashboardSignature = shallowRef('')
const hasDashboardSnapshot = shallowRef(false)

interface LoadDashboardOptions {
  silent?: boolean
  notifyOnChange?: boolean
}

function buildDashboardSignature(data: DashboardData) {
  const recentOrdersSignature = data.recentOrders
    .map((order) =>
      [
        order.id,
        order.status,
        order.payStatus,
        order.updateTime,
        order.totalAmount,
      ].join(':'),
    )
    .join('|')

  return [
    data.todayStats.totalSales,
    data.todayStats.totalOrders,
    data.todayStats.totalDishes,
    data.orderStats.unpaid,
    data.orderStats.toDeliver,
    data.orderStats.delivering,
    recentOrdersSignature,
  ].join('|')
}

async function loadDashboard(options: LoadDashboardOptions = {}) {
  if (!merchantGuard.ensure()) {
    return
  }

  if (!options.silent) {
    loading.value = true
  }

  try {
    const nextDashboard = await getDashboard()
    const nextSignature = buildDashboardSignature(nextDashboard)
    const hasChanged =
      hasDashboardSnapshot.value &&
      nextSignature !== lastDashboardSignature.value

    dashboard.value = nextDashboard
    lastDashboardSignature.value = nextSignature
    hasDashboardSnapshot.value = true

    if (options.notifyOnChange && hasChanged) {
      uni.showToast({
        title: '订单数据有更新',
        icon: 'none',
      })
    }
  } catch (error) {
    if (!options.silent) {
      uni.showToast({
        title: (error as Error).message || '加载失败',
        icon: 'none',
      })
    }
  } finally {
    if (!options.silent) {
      loading.value = false
    }
  }
}

function openOrderDetail(id: number) {
  uni.navigateTo({
    url: `/pages/merchant/order-detail/index?id=${id}`,
  })
}

function openOrderList(status = '') {
  uni.navigateTo({
    url: `/pages/merchant/order/index${status ? `?status=${status}` : ''}`,
  })
}

function openDishPage() {
  uni.navigateTo({
    url: '/pages/merchant/dish/index',
  })
}

function openStatisticsPage() {
  uni.navigateTo({
    url: '/pages/merchant/statistics/index',
  })
}

function openCategoryPage() {
  uni.navigateTo({
    url: '/pages/merchant/category/index',
  })
}

onLoad(() => {
  void loadDashboard()
})

onPullDownRefresh(async () => {
  await loadDashboard()
  uni.stopPullDownRefresh()
})

useVisiblePolling(
  () => loadDashboard({ silent: true, notifyOnChange: true }),
  { interval: 10000 },
)
</script>

<template>
  <view class="dashboard-page">
    <view v-if="loading" class="loading-text">加载中...</view>

    <template v-else-if="dashboard">
      <view class="stats-card">
        <view class="card-title">今日概览</view>
        <view class="stats-grid">
          <view class="stats-item">
            <view class="stats-value">¥{{ formatPrice(dashboard.todayStats.totalSales) }}</view>
            <view class="stats-label">销售额</view>
          </view>
          <view class="stats-item">
            <view class="stats-value">{{ dashboard.todayStats.totalOrders }}</view>
            <view class="stats-label">订单数</view>
          </view>
          <view class="stats-item">
            <view class="stats-value">{{ dashboard.todayStats.totalDishes }}</view>
            <view class="stats-label">菜品数</view>
          </view>
        </view>
      </view>

      <view class="order-status-card">
        <view class="card-title">订单状态</view>
        <view class="status-list">
          <view class="status-item" @click="openOrderList('1')">
            <view class="status-icon">¥</view>
            <view class="status-count">{{ dashboard.orderStats.unpaid }}</view>
            <view class="status-label">待支付</view>
          </view>
          <view class="status-item" @click="openOrderList('2')">
            <view class="status-icon">配</view>
            <view class="status-count">{{ dashboard.orderStats.toDeliver }}</view>
            <view class="status-label">待配送</view>
          </view>
          <view class="status-item" @click="openOrderList('3')">
            <view class="status-icon">行</view>
            <view class="status-count">{{ dashboard.orderStats.delivering }}</view>
            <view class="status-label">配送中</view>
          </view>
          <view class="status-item" @click="openOrderList()">
            <view class="status-icon">全</view>
            <view class="status-count">{{ dashboard.recentOrders.length }}</view>
            <view class="status-label">全部订单</view>
          </view>
        </view>
      </view>

      <view class="function-card">
        <view class="card-title">常用功能</view>
        <view class="function-list">
          <view class="function-item" @click="openDishPage">
            <view class="function-icon">菜</view>
            <view class="function-label">菜品管理</view>
          </view>
          <view class="function-item" @click="openStatisticsPage">
            <view class="function-icon">数</view>
            <view class="function-label">数据统计</view>
          </view>
          <view class="function-item" @click="openCategoryPage">
            <view class="function-icon">类</view>
            <view class="function-label">分类管理</view>
          </view>
        </view>
      </view>

      <view v-if="dashboard.todayStats.topDishes.length" class="top-dishes-card">
        <view class="card-title">
          <text>热销菜品</text>
          <text class="more" @click="openDishPage">管理菜品 ›</text>
        </view>
        <view class="dish-list">
          <view v-for="item in dashboard.todayStats.topDishes" :key="item.dishId" class="dish-item">
            <view class="dish-info">
              <view class="dish-name">{{ item.name }}</view>
              <view class="dish-sales">销量: {{ item.quantity }}</view>
            </view>
            <view class="dish-price">¥{{ formatPrice(item.amount) }}</view>
          </view>
        </view>
      </view>

      <view class="recent-orders-card">
        <view class="card-title">
          <text>最近订单</text>
          <text class="more" @click="openOrderList()">查看全部 ›</text>
        </view>
        <view v-if="dashboard.recentOrders.length" class="order-list">
          <view
            v-for="order in dashboard.recentOrders"
            :key="order.id"
            class="order-item"
            @click="openOrderDetail(order.id)"
          >
            <view class="order-header">
              <text class="order-no">{{ order.orderNo }}</text>
              <text class="order-status"> {{ getOrderStatusText(order.status) }} </text>
            </view>
            <view class="order-info">
              <text class="order-amount">¥{{ formatPrice(order.totalAmount) }}</text>
              <text class="order-time">{{ formatDateTime(order.createTime) }}</text>
            </view>
          </view>
        </view>
        <EmptyState v-else title="暂无订单" />
      </view>
    </template>
  </view>
</template>

<style scoped lang="scss">
.dashboard-page {
  min-height: 100vh;
  padding: 20rpx;
  background: linear-gradient(180deg, #FCFAFD 0%, #F8F5FA 52%, #F3EEF7 100%);
}

.stats-card,
.order-status-card,
.function-card,
.top-dishes-card,
.recent-orders-card {
  margin-bottom: 20rpx;
  padding: 30rpx;
  border: 2rpx solid #E8DDED;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 10rpx 24rpx rgba(17, 24, 39, 0.07);
}

.stats-card {
  background: linear-gradient(135deg, #fff5ef 0%, #ffffff 48%);
}

.card-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
  color: #111827;
  font-size: 32rpx;
  font-weight: 700;
}

.more {
  color: #AC27ED;
  font-size: 28rpx;
  font-weight: 400;
}

.stats-grid {
  display: flex;
  justify-content: space-around;
}

.status-list {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
}

.stats-item,
.status-item,
.function-item {
  text-align: center;
}

.stats-value {
  margin-bottom: 10rpx;
  color: #AC27ED;
  font-size: 40rpx;
  font-weight: 700;
}

.stats-label,
.status-label,
.dish-sales,
.order-time {
  color: #5c6670;
  font-size: 24rpx;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 18rpx 8rpx;
  border-radius: 20rpx;
  background: #f7faf8;
}

.status-icon {
  width: 82rpx;
  height: 82rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
  border-radius: 26rpx;
  background: #AC27ED;
  color: #ffffff;
  font-size: 34rpx;
  font-weight: 800;
  box-shadow: 0 10rpx 24rpx rgba(172, 39, 237, 0.2);
}

.status-count {
  margin-bottom: 8rpx;
  color: #111827;
  font-size: 36rpx;
  font-weight: 700;
}

.function-list {
  display: flex;
  flex-wrap: wrap;
  gap: 18rpx;
}

.function-item {
  width: calc((100% - 36rpx) / 3);
  min-height: 180rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-bottom: 0;
  border-radius: 22rpx;
  background: #f7faf8;
  box-shadow: inset 0 0 0 1rpx #E8DDED;
}

.function-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 102rpx;
  height: 102rpx;
  margin: 0 auto 14rpx;
  border-radius: 30rpx;
  background: #F4ECF8;
  color: #AC27ED;
  font-size: 40rpx;
  font-weight: 800;
}

.function-label {
  color: #25313b;
  font-size: 26rpx;
}

.dish-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #E8DDED;
}

.dish-item:last-child {
  border-bottom: none;
}

.dish-info {
  flex: 1;
}

.dish-name {
  margin-bottom: 8rpx;
  color: #25313b;
  font-size: 28rpx;
}

.dish-price,
.order-amount {
  color: #AC27ED;
  font-weight: 700;
}

.dish-price {
  font-size: 32rpx;
}

.order-item {
  margin-bottom: 16rpx;
  padding: 24rpx;
  border-radius: 12rpx;
  background: #f7faf8;
}

.order-item:last-child {
  margin-bottom: 0;
}

.order-header,
.order-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.order-header {
  margin-bottom: 12rpx;
}

.order-no {
  color: #25313b;
  font-size: 28rpx;
  font-weight: 700;
}

.order-status {
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  background: #F4ECF8;
  color: #7A1FA8;
  font-size: 24rpx;
}

.order-amount {
  font-size: 32rpx;
}

.loading-text {
  padding: 60rpx 0;
  text-align: center;
  color: #5c6670;
  font-size: 28rpx;
}
</style>
