<script setup lang="ts">
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { shallowRef } from 'vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { getStatistics } from '@/api/merchant'
import { useMerchantGuard } from '@/composables/useMerchantGuard'
import { formatPrice } from '@/utils/format'
import type { StatisticsSummary } from '@/types/models'

const merchantGuard = useMerchantGuard()
const range = shallowRef('today')
const statistics = shallowRef<StatisticsSummary | null>(null)
const loading = shallowRef(false)

async function loadStatistics() {
  if (!merchantGuard.ensure()) {
    return
  }

  loading.value = true
  try {
    statistics.value = await getStatistics({
      range: range.value,
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

onLoad(() => {
  void loadStatistics()
})

onPullDownRefresh(async () => {
  await loadStatistics()
  uni.stopPullDownRefresh()
})

function setRange(nextRange: string) {
  range.value = nextRange
  void loadStatistics()
}
</script>

<template>
  <view class="statistics-page">
    <view class="date-range">
      <view
        class="range-item"
        :class="{ active: range === 'today' }"
        @click="setRange('today')"
      >
        今日
      </view>
      <view
        class="range-item"
        :class="{ active: range === 'week' }"
        @click="setRange('week')"
      >
        近7天
      </view>
      <view
        class="range-item"
        :class="{ active: range === 'month' }"
        @click="setRange('month')"
      >
        近30天
      </view>
    </view>

    <view v-if="loading" class="loading-overlay">加载中...</view>
    <template v-else-if="statistics">
      <view class="stat-grid">
        <view class="stats-card">
          <view class="stats-value">¥{{ formatPrice(statistics.totalSales) }}</view>
          <view class="stats-label">总销售额</view>
        </view>
        <view class="stats-card">
          <view class="stats-value">{{ statistics.totalOrders }}</view>
          <view class="stats-label">订单数量</view>
        </view>
        <view class="stats-card">
          <view class="stats-value">{{ statistics.totalDishes }}</view>
          <view class="stats-label">售出菜品</view>
        </view>
        <view class="stats-card">
          <view class="stats-value">¥{{ formatPrice(statistics.avgOrderAmount) }}</view>
          <view class="stats-label">平均客单价</view>
        </view>
      </view>

      <view class="section-card">
        <view class="section-title">热销菜品排行</view>
        <view v-if="statistics.topDishes.length" class="dish-ranking">
          <view v-for="(item, index) in statistics.topDishes" :key="item.dishId" class="ranking-item">
            <view class="rank-number" :class="`rank-${index + 1}`">{{ index + 1 }}</view>
            <view class="dish-info">
              <text class="dish-name">{{ item.name }}</text>
              <text class="dish-sales">销量: {{ item.quantity }}</text>
            </view>
            <view class="dish-amount">
              <text class="amount-value">¥{{ formatPrice(item.amount) }}</text>
              <text class="amount-label">总额</text>
            </view>
          </view>
        </view>
        <EmptyState v-else title="该时段暂无销售数据" />
      </view>

      <view class="section-card">
        <view class="section-title">销售趋势</view>
        <view class="trend-placeholder">
          <text class="trend-icon">📈</text>
          <text class="trend-text">图表功能开发中...</text>
          <text class="trend-desc">可使用第三方图表库如 ECharts for 微信小程序</text>
        </view>
      </view>
    </template>
  </view>
</template>

<style scoped lang="scss">
.statistics-page {
  min-height: 100vh;
  padding: 20rpx;
  background:
    radial-gradient(circle at 16% 0%, rgba(188, 11, 246, 0.1), transparent 38%),
    linear-gradient(180deg, #fbf8ff 0%, #f5f5f5 52%);
}

.date-range {
  display: flex;
  margin-bottom: 20rpx;
  padding: 10rpx;
  border: 2rpx solid rgba(188, 11, 246, 0.08);
  border-radius: 24rpx;
  background: #ffffff;
  box-shadow: 0 12rpx 30rpx rgba(54, 20, 82, 0.06);
}

.range-item {
  flex: 1;
  padding: 20rpx 0;
  border-radius: 12rpx;
  text-align: center;
  font-size: 28rpx;
  color: #666666;
}

.range-item.active {
  background: linear-gradient(135deg, #AC27ED 0%, #C95BFF 100%);
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 8rpx 18rpx rgba(188, 11, 246, 0.22);
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20rpx;
  margin-bottom: 20rpx;
}

.stats-card,
.section-card {
  border: 2rpx solid rgba(188, 11, 246, 0.08);
  border-radius: 24rpx;
  background: #ffffff;
  box-shadow: 0 14rpx 32rpx rgba(54, 20, 82, 0.08);
}

.stats-card {
  padding: 40rpx 30rpx;
  text-align: center;
  background:
    radial-gradient(circle at 100% 0%, rgba(40, 215, 255, 0.12), transparent 42%),
    #ffffff;
}

.stats-value {
  margin-bottom: 12rpx;
  color: #bc0bf6;
  font-size: 44rpx;
  font-weight: 700;
}

.stats-label {
  color: #999999;
  font-size: 26rpx;
}

.section-card {
  margin-bottom: 20rpx;
  padding: 30rpx;
}

.section-title {
  margin-bottom: 24rpx;
  color: #333333;
  font-size: 32rpx;
  font-weight: 700;
}

.dish-ranking {
  display: flex;
  flex-direction: column;
}

.ranking-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.ranking-item:last-child {
  border-bottom: none;
}

.rank-number {
  width: 58rpx;
  height: 58rpx;
  margin-right: 20rpx;
  border-radius: 50%;
  background: #f0f0f0;
  color: #999999;
  line-height: 58rpx;
  text-align: center;
  font-size: 24rpx;
  font-weight: 700;
}

.rank-1 {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #ffffff;
}

.rank-2 {
  background: linear-gradient(135deg, #c0c0c0, #e8e8e8);
  color: #ffffff;
}

.rank-3 {
  background: linear-gradient(135deg, #cd7f32, #daa520);
  color: #ffffff;
}

.dish-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.dish-name {
  margin-bottom: 8rpx;
  color: #333333;
  font-size: 28rpx;
}

.dish-sales,
.amount-label,
.trend-desc {
  color: #999999;
  font-size: 24rpx;
}

.dish-amount {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.amount-value {
  margin-bottom: 4rpx;
  color: #bc0bf6;
  font-size: 32rpx;
  font-weight: 700;
}

.trend-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 84rpx 20rpx;
  border-radius: 22rpx;
  background: linear-gradient(135deg, #fbf8ff, #f3fbff);
}

.trend-icon {
  margin-bottom: 20rpx;
  font-size: 112rpx;
}

.trend-text {
  margin-bottom: 12rpx;
  color: #666666;
  font-size: 28rpx;
}

.loading-overlay {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  color: #999999;
  font-size: 28rpx;
  z-index: 1000;
}
</style>
