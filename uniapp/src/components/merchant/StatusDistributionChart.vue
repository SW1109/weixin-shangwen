<script setup lang="ts">
import { computed } from 'vue'
import type { StatusDistributionStat } from '@/types/models'

const props = defineProps<{
  items: StatusDistributionStat[]
}>()

const colors = ['#AC27ED', '#8B5CF6', '#28D7FF', '#22C55E', '#94A3B8']

const total = computed(() =>
  props.items.reduce((sum, item) => sum + Number(item.value || 0), 0),
)

const rows = computed(() =>
  props.items.map((item, index) => ({
    ...item,
    color: colors[index % colors.length],
    width: item.ratio ? Math.max(4, item.ratio) : 0,
  })),
)

const visibleSegments = computed(() =>
  rows.value.filter((item) => Number(item.value || 0) > 0),
)
</script>

<template>
  <view class="status-chart">
    <view class="status-total">
      <text class="total-number">{{ total }}</text>
      <text class="total-label">总订单状态样本</text>
    </view>

    <view class="segment-track">
      <view
        v-for="item in visibleSegments"
        :key="item.status"
        class="segment"
        :style="{ width: `${item.width}%`, background: item.color }"
      ></view>
      <view v-if="!visibleSegments.length" class="segment empty"></view>
    </view>

    <view class="legend-list">
      <view v-for="item in rows" :key="item.status" class="legend-item">
        <view class="legend-left">
          <text class="legend-dot" :style="{ background: item.color }"></text>
          <text class="legend-label">{{ item.label }}</text>
        </view>
        <view class="legend-value">
          <text>{{ item.value }}单</text>
          <text class="legend-ratio">{{ item.ratio }}%</text>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.status-chart {
  width: 100%;
}

.status-total {
  display: flex;
  align-items: baseline;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.total-number {
  color: #111827;
  font-size: 48rpx;
  font-weight: 900;
}

.total-label {
  color: #7d8791;
  font-size: 23rpx;
}

.segment-track {
  height: 28rpx;
  display: flex;
  overflow: hidden;
  border-radius: 999rpx;
  background: rgba(172, 39, 237, 0.08);
}

.segment {
  height: 100%;
  min-width: 8rpx;
}

.segment.empty {
  width: 100%;
  background: rgba(172, 39, 237, 0.08);
}

.legend-list {
  margin-top: 24rpx;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.legend-item {
  padding: 18rpx;
  border: 1rpx solid rgba(172, 39, 237, 0.08);
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.66);
}

.legend-left,
.legend-value {
  display: flex;
  align-items: center;
}

.legend-left {
  margin-bottom: 10rpx;
  gap: 10rpx;
}

.legend-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
}

.legend-label {
  color: #25313b;
  font-size: 24rpx;
  font-weight: 800;
}

.legend-value {
  justify-content: space-between;
  color: #5c6670;
  font-size: 22rpx;
}

.legend-ratio {
  color: #AC27ED;
  font-weight: 900;
}
</style>
