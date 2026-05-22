<script setup lang="ts">
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { computed, shallowRef } from 'vue'
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

const analysisPreview = computed(() => {
  const stats = dashboard.value?.todayStats
  const totalOrders = stats?.totalOrders || 0
  const paidOrders = stats?.paidOrders || 0
  const payRate =
    stats?.payRate ?? (totalOrders ? (paidOrders / totalOrders) * 100 : 0)
  const topDish = stats?.topDishes?.[0]

  return [
    {
      label: '支付转化',
      value: `${Number(payRate || 0).toFixed(1)}%`,
      desc: `${paidOrders} / ${totalOrders} 单`,
    },
    {
      label: '客单价',
      value: `¥${formatPrice(stats?.avgOrderAmount || 0)}`,
      desc: '按已支付订单',
    },
    {
      label: '销售高峰',
      value: stats?.peakSalesLabel || '暂无',
      desc: '今日趋势识别',
    },
    {
      label: '热销单品',
      value: topDish?.name || '暂无',
      desc: topDish ? `销量 ${topDish.quantity} 份` : '等待订单数据',
    },
  ]
})

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

      <view class="analysis-card" @click="openStatisticsPage">
        <view class="analysis-header">
          <view>
            <view class="analysis-kicker">BUSINESS RADAR</view>
            <view class="analysis-title">经营分析</view>
            <view class="analysis-desc">查看今日、本周、本月销售趋势与菜品结构</view>
          </view>
          <view class="analysis-action">进入分析 ›</view>
        </view>
        <view class="analysis-grid">
          <view v-for="item in analysisPreview" :key="item.label" class="analysis-item">
            <view class="analysis-label">{{ item.label }}</view>
            <view class="analysis-value">{{ item.value }}</view>
            <view class="analysis-item-desc">{{ item.desc }}</view>
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
  position: relative;
  min-height: 100vh;
  padding: 20rpx;
  background: linear-gradient(180deg, #FCFAFD 0%, #F8F5FA 52%, #F3EEF7 100%);
}

/* #ifdef H5 */
.dashboard-page {
  min-height: 100%;
}
/* #endif */

.stats-card,
.analysis-card,
.order-status-card,
.function-card,
.top-dishes-card,
.recent-orders-card {
  position: relative;
  overflow: hidden;
  margin-bottom: 20rpx;
  padding: 30rpx;
  border: 2rpx solid rgba(172, 39, 237, 0.08);
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 10rpx 24rpx rgba(17, 24, 39, 0.07);
  /* #ifdef H5 */
  backdrop-filter: blur(18rpx);
  /* #endif */
  animation: dashboardCardIn 460ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
  transition:
    transform 180ms ease-out,
    border-color 180ms ease-out,
    box-shadow 180ms ease-out;
}

.stats-card::before,
.analysis-card::before,
.order-status-card::before,
.function-card::before,
.top-dishes-card::before,
.recent-orders-card::before {
  position: absolute;
  top: 0;
  right: 32rpx;
  left: 32rpx;
  height: 2rpx;
  background: linear-gradient(90deg, transparent, rgba(172, 39, 237, 0.3), transparent);
  content: '';
}

.stats-card:active,
.analysis-card:active,
.order-status-card:active,
.function-card:active,
.top-dishes-card:active,
.recent-orders-card:active {
  transform: translateY(-4rpx) scale(0.995);
  border-color: rgba(172, 39, 237, 0.18);
  box-shadow: 0 22rpx 46rpx rgba(54, 20, 82, 0.12);
}

.order-status-card {
  animation-delay: 80ms;
}

.analysis-card {
  overflow: hidden;
  background:
    radial-gradient(circle at 88% 6%, rgba(40, 215, 255, 0.16), transparent 34%),
    linear-gradient(135deg, rgba(172, 39, 237, 0.08), rgba(255, 255, 255, 0.94) 48%),
    rgba(255, 255, 255, 0.92);
  animation-delay: 40ms;
}

.analysis-card::after {
  position: absolute;
  right: -76rpx;
  bottom: -84rpx;
  width: 220rpx;
  height: 220rpx;
  border-radius: 50%;
  background: rgba(172, 39, 237, 0.09);
  content: '';
}

.function-card {
  animation-delay: 120ms;
}

.top-dishes-card,
.recent-orders-card {
  animation-delay: 160ms;
}

.stats-card {
  background: linear-gradient(135deg, rgba(244, 236, 248, 0.76) 0%, rgba(255, 255, 255, 0.94) 52%);
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

.analysis-header {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
  margin-bottom: 24rpx;
}

.analysis-kicker {
  color: #7A1FA8;
  font-size: 20rpx;
  font-weight: 900;
  letter-spacing: 2rpx;
}

.analysis-title {
  margin-top: 8rpx;
  color: #111827;
  font-size: 34rpx;
  font-weight: 900;
}

.analysis-desc {
  margin-top: 8rpx;
  color: #5c6670;
  font-size: 23rpx;
  line-height: 1.4;
}

.analysis-action {
  flex-shrink: 0;
  padding: 10rpx 16rpx;
  border: 1rpx solid rgba(172, 39, 237, 0.14);
  border-radius: 999rpx;
  background: #F4ECF8;
  color: #7A1FA8;
  font-size: 23rpx;
  font-weight: 800;
}

.analysis-grid {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 14rpx;
}

.analysis-item {
  min-height: 132rpx;
  padding: 20rpx;
  border: 1rpx solid rgba(172, 39, 237, 0.08);
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.68);
  box-shadow: inset 0 0 0 1rpx rgba(255, 255, 255, 0.55);
}

.analysis-label {
  color: #7d8791;
  font-size: 22rpx;
}

.analysis-value {
  overflow: hidden;
  margin-top: 8rpx;
  color: #111827;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 31rpx;
  font-weight: 900;
}

.analysis-item-desc {
  margin-top: 8rpx;
  color: #7A1FA8;
  font-size: 21rpx;
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
  background: rgba(255, 255, 255, 0.72);
  transition:
    transform 160ms ease-out,
    box-shadow 160ms ease-out,
    background-color 160ms ease-out;
}

.status-item:active {
  transform: translateY(-4rpx) scale(0.98);
  box-shadow: 0 14rpx 26rpx rgba(54, 20, 82, 0.09);
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
  background: rgba(255, 255, 255, 0.74);
  box-shadow: inset 0 0 0 1rpx #E8DDED;
  transition:
    transform 160ms ease-out,
    box-shadow 160ms ease-out,
    background-color 160ms ease-out;
}

.function-item:active {
  transform: translateY(-4rpx) scale(0.98);
  box-shadow:
    inset 0 0 0 1rpx rgba(172, 39, 237, 0.18),
    0 14rpx 26rpx rgba(54, 20, 82, 0.09);
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
  border: 1rpx solid rgba(172, 39, 237, 0.08);
  border-radius: 18rpx;
  background: rgba(255, 255, 255, 0.74);
  transition:
    transform 160ms ease-out,
    box-shadow 160ms ease-out,
    border-color 160ms ease-out;
}

.order-item:active {
  transform: translateX(4rpx) scale(0.99);
  border-color: rgba(172, 39, 237, 0.2);
  box-shadow: 0 12rpx 24rpx rgba(54, 20, 82, 0.08);
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
  animation: loadingPulse 1200ms ease-in-out infinite;
}

@keyframes dashboardCardIn {
  from {
    opacity: 0;
    transform: translateY(22rpx) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes loadingPulse {
  0%,
  100% {
    opacity: 0.56;
  }

  50% {
    opacity: 1;
  }
}

/* #ifdef H5 */
@media (prefers-reduced-motion: reduce) {
  .stats-card,
  .analysis-card,
  .order-status-card,
  .function-card,
  .top-dishes-card,
  .recent-orders-card,
  .status-item,
  .function-item,
  .order-item,
  .loading-text {
    animation: none;
    transition: none;
  }
}
/* #endif */
</style>
