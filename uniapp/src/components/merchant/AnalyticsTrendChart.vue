<script setup lang="ts">
import { computed } from 'vue'
import { formatPrice } from '@/utils/format'
import type { SalesTrendPoint } from '@/types/models'

const props = defineProps<{
  points: SalesTrendPoint[]
}>()

const maxSales = computed(() =>
  Math.max(...props.points.map((item) => Number(item.sales || 0)), 0),
)

const totalOrders = computed(() =>
  props.points.reduce((sum, item) => sum + Number(item.orders || 0), 0),
)

const totalSales = computed(() =>
  props.points.reduce((sum, item) => sum + Number(item.sales || 0), 0),
)

const chartBars = computed(() =>
  props.points.map((item) => {
    const sales = Number(item.sales || 0)
    const height = maxSales.value ? Math.max(12, Math.round((sales / maxSales.value) * 188)) : 10
    return {
      ...item,
      height,
      salesLabel: `¥${formatCompactAmount(sales)}`,
    }
  }),
)

const hasData = computed(() => totalSales.value > 0 || totalOrders.value > 0)

function formatCompactAmount(value: number) {
  if (value >= 10000) {
    return `${formatPrice(value / 10000)}万`
  }

  if (value >= 1000) {
    return `${Math.round(value / 100) / 10}k`
  }

  return formatPrice(value)
}
</script>

<template>
  <view class="trend-chart">
    <view class="chart-summary">
      <view class="summary-item">
        <text class="summary-label">趋势销售额</text>
        <text class="summary-value">¥{{ formatPrice(totalSales) }}</text>
      </view>
      <view class="summary-divider"></view>
      <view class="summary-item">
        <text class="summary-label">趋势订单数</text>
        <text class="summary-value">{{ totalOrders }}</text>
      </view>
    </view>

    <scroll-view scroll-x class="trend-scroll" :show-scrollbar="false">
      <view class="trend-bars" :class="{ compact: chartBars.length <= 8 }">
        <view v-for="(item, index) in chartBars" :key="`${item.label}-${index}`" class="trend-column">
          <view class="bar-value">{{ item.salesLabel }}</view>
          <view class="bar-stage">
            <view class="bar-track">
              <view
                class="bar-fill"
                :style="{ height: `${item.height}rpx` }"
              ></view>
            </view>
          </view>
          <view class="bar-label">{{ item.label }}</view>
          <view class="bar-orders">{{ item.orders }}单</view>
        </view>
      </view>
    </scroll-view>

    <view v-if="!hasData" class="empty-tip">当前时段暂无趋势数据</view>
  </view>
</template>

<style scoped lang="scss">
.trend-chart {
  position: relative;
}

.chart-summary {
  display: flex;
  align-items: center;
  margin-bottom: 26rpx;
  padding: 20rpx;
  border: 1rpx solid rgba(172, 39, 237, 0.08);
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.62);
}

.summary-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.summary-label {
  color: #7d8791;
  font-size: 22rpx;
}

.summary-value {
  color: #111827;
  font-size: 30rpx;
  font-weight: 900;
}

.summary-divider {
  width: 1rpx;
  height: 54rpx;
  margin: 0 20rpx;
  background: #E8DDED;
}

.trend-scroll {
  width: 100%;
  white-space: nowrap;
}

.trend-bars {
  min-width: 960rpx;
  height: 330rpx;
  display: flex;
  align-items: flex-end;
  gap: 14rpx;
  padding: 8rpx 4rpx 0;
}

.trend-bars.compact {
  min-width: 100%;
}

.trend-column {
  min-width: 76rpx;
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.bar-value {
  min-height: 28rpx;
  margin-bottom: 8rpx;
  color: #7A1FA8;
  font-size: 20rpx;
  font-weight: 800;
}

.bar-stage {
  height: 198rpx;
  display: flex;
  align-items: flex-end;
}

.bar-track {
  position: relative;
  width: 38rpx;
  height: 198rpx;
  display: flex;
  align-items: flex-end;
  overflow: hidden;
  border-radius: 999rpx;
  background: rgba(172, 39, 237, 0.08);
}

.bar-fill {
  width: 100%;
  border-radius: 999rpx;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.46), rgba(255, 255, 255, 0)),
    linear-gradient(180deg, #D78AFF 0%, #AC27ED 100%);
  box-shadow: 0 12rpx 24rpx rgba(172, 39, 237, 0.22);
  transition: height 260ms ease-out;
}

.bar-label {
  margin-top: 12rpx;
  color: #25313b;
  font-size: 21rpx;
  font-weight: 700;
}

.bar-orders {
  margin-top: 4rpx;
  color: #7d8791;
  font-size: 20rpx;
}

.empty-tip {
  margin-top: 20rpx;
  padding: 18rpx;
  border-radius: 18rpx;
  background: rgba(244, 236, 248, 0.76);
  color: #7A1FA8;
  text-align: center;
  font-size: 24rpx;
}

/* #ifdef H5 */
@media (prefers-reduced-motion: reduce) {
  .bar-fill {
    transition: none;
  }
}
/* #endif */
</style>
