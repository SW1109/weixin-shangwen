<script setup lang="ts">
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { computed, shallowRef } from 'vue'
import AnalyticsMetricCard from '@/components/merchant/AnalyticsMetricCard.vue'
import AnalyticsProgressList from '@/components/merchant/AnalyticsProgressList.vue'
import AnalyticsTrendChart from '@/components/merchant/AnalyticsTrendChart.vue'
import StatusDistributionChart from '@/components/merchant/StatusDistributionChart.vue'
import { getStatistics } from '@/api/merchant'
import { useMerchantGuard } from '@/composables/useMerchantGuard'
import { formatPrice } from '@/utils/format'
import type { StatisticsSummary } from '@/types/models'

type StatisticsRange = 'today' | 'week' | 'month'

interface ProgressItem {
  key: string | number
  name: string
  value: number
  valueText: string
  meta?: string
}

const merchantGuard = useMerchantGuard()
const range = shallowRef<StatisticsRange>('today')
const statistics = shallowRef<StatisticsSummary | null>(null)
const loading = shallowRef(false)

const rangeOptions: Array<{
  label: string
  value: StatisticsRange
  hint: string
}> = [
  { label: '今日', value: 'today', hint: '小时级趋势' },
  { label: '本周', value: 'week', hint: '自然周走势' },
  { label: '本月', value: 'month', hint: '自然月经营' },
]

const activeRange = computed(
  () => rangeOptions.find((item) => item.value === range.value) || rangeOptions[0],
)

const salesTrend = computed(() => statistics.value?.salesTrend || [])
const statusDistribution = computed(() => statistics.value?.statusDistribution || [])

const metricCards = computed(() => {
  const current = statistics.value
  return [
    {
      title: '总销售额',
      value: `¥${formatPrice(current?.totalSales || 0)}`,
      description: `${current?.paidOrders || 0} 笔已支付订单`,
      marker: 'GMV',
      tone: 'primary' as const,
    },
    {
      title: '订单数量',
      value: `${current?.totalOrders || 0}`,
      description: `取消 ${current?.canceledOrders || 0} 单`,
      marker: 'ORDER',
      tone: 'cyan' as const,
    },
    {
      title: '平均客单价',
      value: `¥${formatPrice(current?.avgOrderAmount || 0)}`,
      description: `支付转化 ${formatRate(current?.payRate)}`,
      marker: 'AOV',
      tone: 'amber' as const,
    },
    {
      title: '售出菜品',
      value: `${current?.totalDishes || 0}`,
      description: `单均 ${formatNumber(current?.avgDishesPerOrder)} 份`,
      marker: 'DISH',
      tone: 'slate' as const,
    },
  ]
})

const insightCards = computed(() => {
  const current = statistics.value
  return [
    {
      label: '销售高峰',
      value: current?.peakSalesLabel || '暂无高峰',
      desc: '按当前时段趋势自动识别',
    },
    {
      label: '履约完成率',
      value: formatRate(current?.completionRate),
      desc: `完成 ${current?.completedOrders || 0} 单`,
    },
    {
      label: '复购客户',
      value: `${current?.repeatCustomers || 0}`,
      desc: `覆盖 ${current?.uniqueCustomers || 0} 位客户`,
    },
    {
      label: '取消率',
      value: formatRate(current?.cancelRate),
      desc: '取消订单占全部订单比例',
    },
  ]
})

const categoryItems = computed<ProgressItem[]>(() =>
  (statistics.value?.categorySales || []).map((item) => ({
    key: item.categoryId || item.name,
    name: item.name,
    value: item.amount,
    valueText: `¥${formatPrice(item.amount)}`,
    meta: `售出 ${item.quantity} 份`,
  })),
)

const topDishItems = computed<ProgressItem[]>(() =>
  (statistics.value?.topDishes || []).map((item) => ({
    key: item.dishId,
    name: item.name,
    value: item.quantity,
    valueText: `${item.quantity} 份`,
    meta: `销售额 ¥${formatPrice(item.amount)}`,
  })),
)

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

function setRange(nextRange: StatisticsRange) {
  if (range.value === nextRange) {
    return
  }

  range.value = nextRange
  void loadStatistics()
}

function formatRate(value?: number) {
  return `${Number(value || 0).toFixed(1)}%`
}

function formatNumber(value?: number) {
  return Number(value || 0).toFixed(1)
}

onLoad(() => {
  void loadStatistics()
})

onPullDownRefresh(async () => {
  await loadStatistics()
  uni.stopPullDownRefresh()
})
</script>

<template>
  <view class="statistics-page">
    <view class="page-orb orb-one"></view>
    <view class="page-orb orb-two"></view>

    <view class="hero-card">
      <view class="hero-kicker">DATA COMMAND CENTER</view>
      <view class="hero-title">经营数据驾驶舱</view>
      <view class="hero-desc">
        聚合销售、订单、菜品、客户与履约指标，快速判断当前门店经营状态。
      </view>
      <view class="hero-meta">
        <view class="meta-pill">实时接口</view>
        <view class="meta-pill">跨端可视化</view>
        <view class="meta-pill">{{ activeRange.hint }}</view>
      </view>
    </view>

    <view class="range-panel">
      <view
        v-for="item in rangeOptions"
        :key="item.value"
        class="range-item"
        :class="{ active: range === item.value }"
        @click="setRange(item.value)"
      >
        <text class="range-label">{{ item.label }}</text>
        <text class="range-hint">{{ item.hint }}</text>
      </view>
    </view>

    <view v-if="loading" class="loading-panel">
      <view class="loading-core"></view>
      <text>数据分析中...</text>
    </view>

    <template v-else-if="statistics">
      <view class="metric-grid">
        <AnalyticsMetricCard
          v-for="item in metricCards"
          :key="item.title"
          :title="item.title"
          :value="item.value"
          :description="item.description"
          :marker="item.marker"
          :tone="item.tone"
        />
      </view>

      <view class="section-card trend-card">
        <view class="section-head">
          <view>
            <view class="section-kicker">SALES TREND</view>
            <view class="section-title">销售趋势</view>
          </view>
          <view class="section-chip">{{ activeRange.label }}</view>
        </view>
        <AnalyticsTrendChart :points="salesTrend" />
      </view>

      <view class="bento-grid">
        <view class="section-card status-card">
          <view class="section-head compact">
            <view>
              <view class="section-kicker">ORDER FLOW</view>
              <view class="section-title">订单状态分布</view>
            </view>
          </view>
          <StatusDistributionChart :items="statusDistribution" />
        </view>

        <view class="section-card insight-card">
          <view class="section-head compact">
            <view>
              <view class="section-kicker">INSIGHTS</view>
              <view class="section-title">经营洞察</view>
            </view>
          </view>
          <view class="insight-grid">
            <view v-for="item in insightCards" :key="item.label" class="insight-item">
              <text class="insight-label">{{ item.label }}</text>
              <text class="insight-value">{{ item.value }}</text>
              <text class="insight-desc">{{ item.desc }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="section-card">
        <view class="section-head">
          <view>
            <view class="section-kicker">CATEGORY MIX</view>
            <view class="section-title">分类销售贡献</view>
          </view>
          <view class="section-chip">按销售额</view>
        </view>
        <AnalyticsProgressList :items="categoryItems" empty-text="当前时段暂无分类销售数据" />
      </view>

      <view class="section-card">
        <view class="section-head">
          <view>
            <view class="section-kicker">TOP DISHES</view>
            <view class="section-title">热销菜品排行</view>
          </view>
          <view class="section-chip">按销量</view>
        </view>
        <AnalyticsProgressList :items="topDishItems" empty-text="当前时段暂无热销菜品" />
      </view>
    </template>
  </view>
</template>

<style scoped lang="scss">
.statistics-page {
  position: relative;
  min-height: 100vh;
  padding: 24rpx;
  overflow: hidden;
  background:
    radial-gradient(circle at 0% 0%, rgba(172, 39, 237, 0.12), transparent 34%),
    radial-gradient(circle at 100% 12%, rgba(40, 215, 255, 0.14), transparent 30%),
    linear-gradient(180deg, #FCFAFD 0%, #F7F2FA 48%, #F1ECF6 100%);
}

/* #ifdef H5 */
.statistics-page {
  min-height: 100%;
}
/* #endif */

.page-orb {
  position: absolute;
  border-radius: 50%;
  opacity: 0.75;
  filter: blur(2rpx);
  pointer-events: none;
}

.orb-one {
  top: 110rpx;
  right: -90rpx;
  width: 240rpx;
  height: 240rpx;
  background: rgba(172, 39, 237, 0.12);
}

.orb-two {
  top: 560rpx;
  left: -120rpx;
  width: 260rpx;
  height: 260rpx;
  background: rgba(40, 215, 255, 0.12);
}

.hero-card,
.range-panel,
.section-card,
.loading-panel {
  position: relative;
  border: 1rpx solid rgba(172, 39, 237, 0.1);
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.68)),
    rgba(255, 255, 255, 0.82);
  box-shadow:
    0 20rpx 48rpx rgba(54, 20, 82, 0.08),
    inset 0 0 0 1rpx rgba(255, 255, 255, 0.72);
  /* #ifdef H5 */
  backdrop-filter: blur(18rpx);
  /* #endif */
}

.hero-card {
  overflow: hidden;
  padding: 36rpx;
  border-radius: 34rpx;
  animation: panelIn 460ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.hero-card::after {
  position: absolute;
  top: -90rpx;
  right: -70rpx;
  width: 240rpx;
  height: 240rpx;
  border-radius: 50%;
  background:
    radial-gradient(circle, rgba(215, 138, 255, 0.35), rgba(172, 39, 237, 0));
  content: '';
}

.hero-kicker,
.section-kicker {
  color: #7A1FA8;
  font-size: 20rpx;
  font-weight: 900;
  letter-spacing: 2rpx;
}

.hero-title {
  position: relative;
  margin-top: 12rpx;
  color: #111827;
  font-size: 48rpx;
  font-weight: 900;
  letter-spacing: -1rpx;
}

.hero-desc {
  position: relative;
  max-width: 620rpx;
  margin-top: 16rpx;
  color: #5c6670;
  font-size: 26rpx;
  line-height: 1.6;
}

.hero-meta {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 14rpx;
  margin-top: 28rpx;
}

.meta-pill,
.section-chip {
  padding: 8rpx 16rpx;
  border: 1rpx solid rgba(172, 39, 237, 0.12);
  border-radius: 999rpx;
  background: #F4ECF8;
  color: #7A1FA8;
  font-size: 22rpx;
  font-weight: 800;
}

.range-panel {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12rpx;
  margin: 22rpx 0;
  padding: 12rpx;
  border-radius: 28rpx;
  animation: panelIn 460ms 40ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.range-item {
  min-height: 98rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 22rpx;
  color: #5c6670;
  transition:
    transform 160ms ease-out,
    background-color 160ms ease-out,
    color 160ms ease-out;
}

.range-item.active {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0)),
    linear-gradient(135deg, #AC27ED, #C95BFF);
  color: #ffffff;
  box-shadow: 0 14rpx 28rpx rgba(172, 39, 237, 0.24);
}

.range-item:active {
  transform: scale(0.97);
}

.range-label {
  font-size: 28rpx;
  font-weight: 900;
}

.range-hint {
  margin-top: 7rpx;
  font-size: 20rpx;
  opacity: 0.78;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 18rpx;
  margin-bottom: 22rpx;
}

.section-card {
  overflow: hidden;
  margin-bottom: 22rpx;
  padding: 28rpx;
  border-radius: 30rpx;
  animation: panelIn 460ms 80ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.trend-card {
  padding-bottom: 22rpx;
}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18rpx;
  margin-bottom: 28rpx;
}

.section-head.compact {
  margin-bottom: 22rpx;
}

.section-title {
  margin-top: 8rpx;
  color: #111827;
  font-size: 34rpx;
  font-weight: 900;
}

.bento-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 22rpx;
}

.insight-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.insight-item {
  min-height: 142rpx;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 20rpx;
  border: 1rpx solid rgba(172, 39, 237, 0.08);
  border-radius: 22rpx;
  background: rgba(255, 255, 255, 0.64);
}

.insight-label {
  color: #7d8791;
  font-size: 22rpx;
}

.insight-value {
  margin-top: 10rpx;
  color: #111827;
  font-size: 32rpx;
  font-weight: 900;
}

.insight-desc {
  margin-top: 8rpx;
  color: #7A1FA8;
  font-size: 21rpx;
  line-height: 1.35;
}

.loading-panel {
  min-height: 420rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22rpx;
  border-radius: 30rpx;
  color: #7A1FA8;
  font-size: 28rpx;
  font-weight: 800;
}

.loading-core {
  width: 76rpx;
  height: 76rpx;
  border: 8rpx solid rgba(172, 39, 237, 0.12);
  border-top-color: #AC27ED;
  border-radius: 50%;
  animation: loadingSpin 900ms linear infinite;
}

@keyframes panelIn {
  from {
    opacity: 0;
    transform: translateY(22rpx) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes loadingSpin {
  to {
    transform: rotate(360deg);
  }
}

/* #ifdef H5 */
@media (min-width: 900px) {
  .statistics-page {
    padding: 32rpx;
  }

  .bento-grid {
    grid-template-columns: 1.1fr 0.9fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  .hero-card,
  .range-panel,
  .section-card,
  .loading-core,
  .range-item {
    animation: none;
    transition: none;
  }
}
/* #endif */
</style>
