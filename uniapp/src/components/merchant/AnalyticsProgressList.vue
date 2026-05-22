<script setup lang="ts">
import { computed } from 'vue'

interface AnalyticsProgressItem {
  key: string | number
  name: string
  value: number
  valueText: string
  meta?: string
}

const props = withDefaults(
  defineProps<{
    items: AnalyticsProgressItem[]
    emptyText?: string
  }>(),
  {
    emptyText: '暂无排行数据',
  },
)

const maxValue = computed(() =>
  Math.max(...props.items.map((item) => Number(item.value || 0)), 0),
)

const rows = computed(() =>
  props.items.map((item, index) => {
    const rawPercent = maxValue.value
      ? (Number(item.value || 0) / maxValue.value) * 100
      : 0
    return {
      ...item,
      rank: index + 1,
      percent: rawPercent ? Math.max(6, Math.round(rawPercent)) : 0,
    }
  }),
)
</script>

<template>
  <view class="progress-list">
    <view v-if="rows.length" class="progress-rows">
      <view v-for="item in rows" :key="item.key" class="progress-row">
        <view class="row-head">
          <view class="row-left">
            <text class="rank" :class="`rank-${item.rank}`">{{ item.rank }}</text>
            <view class="name-wrap">
              <text class="name">{{ item.name }}</text>
              <text v-if="item.meta" class="meta">{{ item.meta }}</text>
            </view>
          </view>
          <text class="value">{{ item.valueText }}</text>
        </view>
        <view class="progress-track">
          <view
            class="progress-fill"
            :style="{ width: `${item.percent}%` }"
          ></view>
        </view>
      </view>
    </view>
    <view v-else class="empty-text">{{ emptyText }}</view>
  </view>
</template>

<style scoped lang="scss">
.progress-list {
  width: 100%;
}

.progress-row {
  padding: 22rpx 0;
  border-bottom: 1rpx solid rgba(232, 221, 237, 0.78);
}

.progress-row:last-child {
  border-bottom: none;
}

.row-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18rpx;
  margin-bottom: 16rpx;
}

.row-left {
  min-width: 0;
  flex: 1;
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.rank {
  width: 44rpx;
  height: 44rpx;
  flex-shrink: 0;
  border-radius: 16rpx;
  background: #F4ECF8;
  color: #7A1FA8;
  line-height: 44rpx;
  text-align: center;
  font-size: 22rpx;
  font-weight: 900;
}

.rank-1 {
  background: linear-gradient(135deg, #AC27ED, #D78AFF);
  color: #ffffff;
}

.rank-2 {
  background: linear-gradient(135deg, #8B5CF6, #C4B5FD);
  color: #ffffff;
}

.rank-3 {
  background: linear-gradient(135deg, #28D7FF, #8EEBFF);
  color: #ffffff;
}

.name-wrap {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 6rpx;
}

.name {
  overflow: hidden;
  color: #25313b;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 27rpx;
  font-weight: 800;
}

.meta {
  color: #7d8791;
  font-size: 22rpx;
}

.value {
  flex-shrink: 0;
  color: #AC27ED;
  font-size: 27rpx;
  font-weight: 900;
}

.progress-track {
  height: 14rpx;
  overflow: hidden;
  border-radius: 999rpx;
  background: rgba(172, 39, 237, 0.08);
}

.progress-fill {
  height: 100%;
  border-radius: 999rpx;
  background: linear-gradient(90deg, #AC27ED, #D78AFF 56%, #28D7FF);
  box-shadow: 0 8rpx 18rpx rgba(172, 39, 237, 0.18);
  transition: width 260ms ease-out;
}

.empty-text {
  padding: 42rpx 20rpx;
  color: #7d8791;
  text-align: center;
  font-size: 24rpx;
}

/* #ifdef H5 */
@media (prefers-reduced-motion: reduce) {
  .progress-fill {
    transition: none;
  }
}
/* #endif */
</style>
