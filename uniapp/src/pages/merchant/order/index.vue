<script setup lang="ts">
import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { shallowRef } from 'vue'
import EmptyState from '@/components/common/EmptyState.vue'
import OrderCard from '@/components/order/OrderCard.vue'
import { merchantOrderTabs } from '@/utils/order'
import { getMerchantOrders, updateMerchantOrderStatus } from '@/api/merchant'
import { useMerchantGuard } from '@/composables/useMerchantGuard'
import { useVisiblePolling } from '@/composables/useVisiblePolling'
import type { Order } from '@/types/models'

const merchantGuard = useMerchantGuard()
const currentStatus = shallowRef('')
const loading = shallowRef(false)
const orders = shallowRef<Order[]>([])
const lastOrdersSignature = shallowRef('')
const hasOrdersSnapshot = shallowRef(false)

interface LoadOrdersOptions {
  silent?: boolean
  notifyOnChange?: boolean
}

function buildOrdersSignature(list: Order[]) {
  return list
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
}

async function loadOrders(options: LoadOrdersOptions = {}) {
  if (!merchantGuard.ensure()) {
    return
  }

  if (!options.silent) {
    loading.value = true
  }

  try {
    const nextOrders = await getMerchantOrders(currentStatus.value || undefined)
    const nextSignature = buildOrdersSignature(nextOrders)
    const hasChanged =
      hasOrdersSnapshot.value &&
      nextSignature !== lastOrdersSignature.value

    orders.value = nextOrders
    lastOrdersSignature.value = nextSignature
    hasOrdersSnapshot.value = true

    if (options.notifyOnChange && hasChanged) {
      uni.showToast({
        title: '订单有更新',
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

function openDetail(id: number) {
  uni.navigateTo({
    url: `/pages/merchant/order-detail/index?id=${id}`,
  })
}

function setStatus(status: string) {
  currentStatus.value = status
  lastOrdersSignature.value = ''
  hasOrdersSnapshot.value = false
  void loadOrders()
}

async function advanceOrder(payload: { id: number; status: number }) {
  await updateMerchantOrderStatus(payload.id, payload.status)
  await loadOrders()
}

onLoad((query) => {
  if (query?.status) {
    currentStatus.value = String(query.status)
  }
  void loadOrders()
})

onPullDownRefresh(async () => {
  await loadOrders()
  uni.stopPullDownRefresh()
})

useVisiblePolling(
  () => loadOrders({ silent: true, notifyOnChange: true }),
  { interval: 8000 },
)
</script>

<template>
  <view class="merchant-order-page">
    <view class="tabs">
      <view
        v-for="tab in merchantOrderTabs"
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
      title="当前筛选下没有订单"
      description="新订单进来后会自动刷新到此列表"
    />
    <scroll-view v-else class="order-list" scroll-y>
      <OrderCard
        v-for="order in orders"
        :key="order.id"
        :order="order"
        role="merchant"
        @detail="openDetail"
        @advance="advanceOrder"
      />
    </scroll-view>
  </view>
</template>

<style scoped lang="scss">
.merchant-order-page {
  height: 100vh;
  padding-top: 112rpx;
  background:
    linear-gradient(135deg, rgba(172, 39, 237, 0.09) 0%, rgba(172, 39, 237, 0) 36%),
    linear-gradient(180deg, #fbf8ff 0%, #f5f5f5 48%);
}

/* #ifdef H5 */
.merchant-order-page {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
/* #endif */

.tabs {
  position: fixed;
  top: 0;
  right: 0;
  left: 0;
  display: flex;
  gap: 8rpx;
  padding: 14rpx 16rpx;
  border-bottom: 1rpx solid rgba(172, 39, 237, 0.08);
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 12rpx 30rpx rgba(54, 20, 82, 0.08);
  z-index: 100;
}

/* #ifdef H5 */
.tabs {
  top: var(--window-top);
}
/* #endif */

.tab-item {
  flex: 1;
  position: relative;
  padding: 18rpx 0;
  border-radius: 999rpx;
  text-align: center;
  font-size: 28rpx;
  color: #666666;
}

.tab-item.active {
  background: linear-gradient(135deg, #AC27ED 0%, #C95BFF 100%);
  color: #ffffff;
  font-weight: 700;
  box-shadow: 0 8rpx 18rpx rgba(172, 39, 237, 0.22);
}

.tab-item.active::after {
  display: none;
}

.order-list {
  width: 100%;
  height: calc(100vh - 112rpx);
  padding: 20rpx;
  box-sizing: border-box;
}

/* #ifdef H5 */
.order-list {
  height: calc(100% - 112rpx);
}
/* #endif */

.loading-text {
  padding: 60rpx 0;
  text-align: center;
  color: #999999;
  font-size: 28rpx;
}
</style>
