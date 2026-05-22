<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { computed, shallowRef } from 'vue'
import { getMerchantOrderDetail, updateMerchantOrderStatus } from '@/api/merchant'
import { useVisiblePolling } from '@/composables/useVisiblePolling'
import { formatAddress, formatDateTime, formatPrice } from '@/utils/format'
import { getMerchantNextAction } from '@/utils/order'
import type { Order } from '@/types/models'

const orderId = shallowRef<number | null>(null)
const order = shallowRef<Order | null>(null)
const loading = shallowRef(false)
const lastOrderSignature = shallowRef('')
const hasOrderSnapshot = shallowRef(false)

const nextAction = computed(() =>
  order.value ? getMerchantNextAction(order.value.status) : null,
)

const statusTitle = computed(() => {
  if (!order.value) {
    return ''
  }

  return {
    1: '等待客户支付',
    2: '待配送',
    3: '配送中',
    4: '已完成',
    5: '已取消',
  }[order.value.status]
})

const statusIcon = computed(() => {
  if (!order.value) {
    return ''
  }

  return {
    1: '💰',
    2: '📦',
    3: '🚚',
    4: '✅',
    5: '✕',
  }[order.value.status]
})

interface LoadDetailOptions {
  silent?: boolean
  notifyOnChange?: boolean
}

function buildOrderSignature(data: Order) {
  return [
    data.id,
    data.status,
    data.payStatus,
    data.updateTime,
    data.payTime || '',
    data.completeTime || '',
  ].join(':')
}

async function loadDetail(id: number, options: LoadDetailOptions = {}) {
  if (!options.silent) {
    loading.value = true
  }

  try {
    const nextOrder = await getMerchantOrderDetail(id)
    const nextSignature = buildOrderSignature(nextOrder)
    const hasChanged =
      hasOrderSnapshot.value &&
      nextSignature !== lastOrderSignature.value

    order.value = nextOrder
    lastOrderSignature.value = nextSignature
    hasOrderSnapshot.value = true

    if (options.notifyOnChange && hasChanged) {
      uni.showToast({
        title: '订单状态已更新',
        icon: 'none',
      })
    }
  } catch (error) {
    if (!options.silent) {
      uni.showToast({
        title: (error as Error).message || '获取详情失败',
        icon: 'none',
      })
    }
  } finally {
    if (!options.silent) {
      loading.value = false
    }
  }
}

async function onAdvance() {
  if (!order.value || !nextAction.value) {
    return
  }

  uni.showModal({
    title: '提示',
    content: `确定${nextAction.value.label}吗？`,
    confirmColor: '#AC27ED',
    success: (res) => {
      if (!res.confirm || !order.value || !nextAction.value) {
        return
      }

      void updateStatus(order.value.id, nextAction.value.nextStatus)
    },
  })
}

async function updateStatus(id: number, status: number) {
  await updateMerchantOrderStatus(id, status)
  await loadDetail(id)
  uni.showToast({
    title: '操作成功',
    icon: 'success',
  })
}

onLoad((query) => {
  if (query?.id) {
    orderId.value = Number(query.id)
    void loadDetail(orderId.value)
  }
})

useVisiblePolling(
  () => {
    if (!orderId.value) {
      return
    }

    return loadDetail(orderId.value, {
      silent: true,
      notifyOnChange: true,
    })
  },
  { interval: 8000 },
)

function callPhone() {
  if (!order.value?.userInfo.phoneNumber) {
    return
  }

  uni.makePhoneCall({
    phoneNumber: order.value.userInfo.phoneNumber,
  })
}
</script>

<template>
  <view class="merchant-order-detail-page">
    <view v-if="loading" class="loading-text">加载中...</view>
    <template v-else-if="order">
      <view class="content">
        <view class="status-card">
          <view class="status-icon">
            <text>{{ statusIcon }}</text>
          </view>
          <view class="status-text">
            <text class="status-title">{{ statusTitle }}</text>
            <text class="status-desc">订单号: {{ order.orderNo }}</text>
          </view>
        </view>

        <view class="info-card">
          <view class="card-title">客户信息</view>
          <view class="customer-info">
            <image class="avatar" :src="order.userInfo.avatarUrl" mode="aspectFill" />
            <view class="customer-detail">
              <text class="customer-name">{{ order.userInfo.nickName }}</text>
              <text class="customer-phone" @click="callPhone">{{ order.userInfo.phoneNumber }}</text>
            </view>
            <view class="call-btn" @click="callPhone">
              <text>📞</text>
            </view>
          </view>
        </view>

        <view class="info-card">
          <view class="card-title">配送地址</view>
          <view class="address-info">
            <view class="address-header">
              <text class="address-name">{{ order.address.name }}</text>
              <text class="address-phone">{{ order.address.phone }}</text>
            </view>
            <view class="address-detail">
              <text class="address-icon">📍</text>
              <text class="address-text">{{ formatAddress(order.address) }}</text>
            </view>
          </view>
        </view>

        <view class="info-card">
          <view class="card-title">菜品清单</view>
          <view class="dishes-list">
            <view v-for="item in order.dishes" :key="item.dishId" class="dish-item">
              <image class="dish-image" :src="item.image" mode="aspectFill" />
              <view class="dish-info">
                <text class="dish-name">{{ item.name }}</text>
                <text class="dish-quantity">x{{ item.quantity }}</text>
              </view>
              <text class="dish-price">¥{{ formatPrice(item.price) }}</text>
            </view>
          </view>
        </view>

        <view class="info-card">
          <view class="card-title">订单信息</view>
          <view class="order-info">
            <view class="info-row">
              <text class="info-label">订单编号</text>
              <text class="info-value">{{ order.orderNo }}</text>
            </view>
            <view class="info-row">
              <text class="info-label">下单时间</text>
              <text class="info-value">{{ formatDateTime(order.createTime) }}</text>
            </view>
            <view v-if="order.payTime" class="info-row">
              <text class="info-label">支付时间</text>
              <text class="info-value">{{ formatDateTime(order.payTime) }}</text>
            </view>
            <view v-if="order.completeTime" class="info-row">
              <text class="info-label">完成时间</text>
              <text class="info-value">{{ formatDateTime(order.completeTime) }}</text>
            </view>
            <view v-if="order.remark" class="info-row">
              <text class="info-label">备注</text>
              <text class="info-value remark">{{ order.remark }}</text>
            </view>
            <view class="info-row total">
              <text class="info-label">订单总额</text>
              <text class="info-value amount">¥{{ formatPrice(order.totalAmount) }}</text>
            </view>
          </view>
        </view>
      </view>

      <view class="bottom-actions">
        <view v-if="order.status === 1" class="action-tip">等待客户支付...</view>
        <view v-if="nextAction" class="action-buttons">
          <button class="btn-action btn-primary" @click="onAdvance">{{ nextAction.label }}</button>
        </view>
      </view>
    </template>
  </view>
</template>

<style scoped lang="scss">
.merchant-order-detail-page {
  min-height: 100vh;
  padding-bottom: 148rpx;
  background:
    linear-gradient(135deg, rgba(172, 39, 237, 0.09) 0%, rgba(172, 39, 237, 0) 36%),
    linear-gradient(180deg, #fbf8ff 0%, #f5f5f5 50%);
}

/* #ifdef H5 */
.merchant-order-detail-page {
  min-height: 100%;
  padding-bottom: calc(148rpx + var(--window-bottom));
}
/* #endif */

.content {
  padding: 20rpx;
}

.status-card {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  padding: 40rpx 30rpx;
  border-radius: 24rpx;
  background: linear-gradient(135deg, #AC27ED 0%, #C95BFF 100%);
  color: #ffffff;
  box-shadow: 0 4rpx 12rpx rgba(172, 39, 237, 0.2);
}

.status-icon {
  margin-right: 24rpx;
  font-size: 80rpx;
}

.status-text {
  flex: 1;
}

.status-title {
  display: block;
  margin-bottom: 12rpx;
  font-size: 36rpx;
  font-weight: 700;
}

.status-desc {
  display: block;
  opacity: 0.9;
  font-size: 24rpx;
}

.info-card {
  margin-bottom: 20rpx;
  padding: 30rpx;
  border: 2rpx solid rgba(172, 39, 237, 0.08);
  border-radius: 24rpx;
  background: #ffffff;
  box-shadow: 0 12rpx 30rpx rgba(54, 20, 82, 0.06);
}

.card-title {
  margin-bottom: 24rpx;
  padding-left: 16rpx;
  border-left: 6rpx solid #AC27ED;
  color: #333333;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 1;
}

.customer-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 100rpx;
  height: 100rpx;
  margin-right: 24rpx;
  border-radius: 50%;
  background: #f0f0f0;
}

.customer-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.customer-name {
  margin-bottom: 8rpx;
  color: #333333;
  font-size: 30rpx;
  font-weight: 700;
}

.customer-phone {
  color: #666666;
  font-size: 26rpx;
}

.call-btn {
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #f8e6ff;
  color: #AC27ED;
  font-size: 40rpx;
}

.address-info,
.order-info,
.dishes-list {
  display: flex;
  flex-direction: column;
}

.address-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.address-name {
  color: #333333;
  font-size: 28rpx;
  font-weight: 700;
}

.address-phone {
  color: #666666;
  font-size: 26rpx;
}

.address-detail {
  display: flex;
  align-items: flex-start;
  padding: 20rpx;
  border-radius: 12rpx;
  background: #f9f9f9;
}

.address-icon {
  margin-right: 12rpx;
  font-size: 32rpx;
}

.address-text {
  flex: 1;
  color: #666666;
  font-size: 26rpx;
  line-height: 1.5;
}

.dish-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.dish-item:last-child {
  border-bottom: none;
}

.dish-image {
  width: 100rpx;
  height: 100rpx;
  margin-right: 20rpx;
  border-radius: 12rpx;
  background: #f5f5f5;
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
  font-weight: 500;
}

.dish-quantity {
  color: #999999;
  font-size: 24rpx;
}

.dish-price {
  color: #333333;
  font-size: 30rpx;
  font-weight: 700;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.info-row:last-child {
  border-bottom: none;
}

.info-row.total {
  margin-top: 12rpx;
  padding-top: 24rpx;
  border-top: 2rpx solid #f0f0f0;
}

.info-label {
  color: #999999;
  font-size: 26rpx;
}

.info-value {
  color: #333333;
  text-align: right;
  font-size: 26rpx;
}

.info-value.remark {
  flex: 1;
  margin-left: 40rpx;
}

.info-value.amount {
  color: #AC27ED;
  font-size: 36rpx;
  font-weight: 700;
}

.bottom-actions {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  min-height: 112rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 18rpx 30rpx calc(18rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -18rpx 38rpx rgba(54, 20, 82, 0.12);
}

/* #ifdef H5 */
.bottom-actions {
  bottom: var(--window-bottom);
}
/* #endif */

.action-tip {
  color: #999999;
  font-size: 28rpx;
}

.action-buttons {
  display: flex;
  width: 100%;
  gap: 20rpx;
}

.btn-action {
  flex: 1;
  height: 86rpx;
  margin: 0;
  border: none;
  border-radius: 999rpx;
  line-height: 86rpx;
  font-size: 30rpx;
  font-weight: 700;
}

.btn-primary {
  background: linear-gradient(135deg, #AC27ED 0%, #C95BFF 100%);
  color: #ffffff;
  box-shadow: 0 10rpx 24rpx rgba(172, 39, 237, 0.26);
}

.btn-action::after {
  border: none;
}

.loading-text {
  padding: 100rpx 0;
  text-align: center;
  color: #999999;
  font-size: 28rpx;
}
</style>
