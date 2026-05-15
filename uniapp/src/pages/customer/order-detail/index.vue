<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { computed, shallowRef } from 'vue'
import { cancelOrder, getOrderDetail, payOrder } from '@/api/customer'
import { formatAddress, formatDateTime, formatPrice } from '@/utils/format'
import { getOrderStatusText } from '@/utils/order'
import type { Order } from '@/types/models'

const order = shallowRef<Order | null>(null)
const loading = shallowRef(false)

const statusDesc = computed(() => {
  if (!order.value) {
    return ''
  }

  return {
    1: '请尽快支付，超时将自动取消',
    2: '商家已接单，正在准备中',
    3: '骑手正在火速配送中',
    4: '订单已完成，欢迎再次光临',
    5: '订单已取消',
  }[order.value.status]
})

async function loadDetail(id: number) {
  loading.value = true
  try {
    order.value = await getOrderDetail(id)
  } catch (error) {
    uni.showToast({
      title: (error as Error).message || '获取订单失败',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}

async function onPay() {
  if (!order.value) {
    return
  }

  uni.showModal({
    title: '确认支付',
    content: `确认支付 ¥${formatPrice(order.value.totalAmount)} 吗？`,
    confirmText: '确认支付',
    confirmColor: '#bc0bf6',
    success: (res) => {
      if (!res.confirm || !order.value) {
        return
      }

      void doPay(order.value.id)
    },
  })
}

async function doPay(id: number) {
  await payOrder(id)
  await loadDetail(id)
  uni.showToast({
    title: '支付成功',
    icon: 'success',
  })
}

onLoad((query) => {
  if (query?.id) {
    void loadDetail(Number(query.id))
  }
})

function onCancel() {
  if (!order.value) {
    return
  }

  uni.showModal({
    title: '提示',
    content: '确定要取消订单吗？',
    confirmColor: '#bc0bf6',
    success: (res) => {
      if (!res.confirm || !order.value) {
        return
      }

      void doCancel(order.value.id)
    },
  })
}

async function doCancel(id: number) {
  await cancelOrder(id)
  await loadDetail(id)
  uni.showToast({
    title: '已取消',
    icon: 'success',
  })
}

function onContact() {
  uni.makePhoneCall({
    phoneNumber: '10086',
  })
}
</script>

<template>
  <view class="order-detail-page">
    <view v-if="loading" class="loading-text">正在加载订单详情...</view>
    <template v-else-if="order">
      <view class="status-card">
        <view class="status-header">
          <text class="status-text">{{ getOrderStatusText(order.status) }}</text>
          <text class="status-desc">{{ statusDesc }}</text>
        </view>
      </view>

      <view class="section">
        <view class="section-title">配送信息</view>
        <view class="info-list">
          <view class="info-row">
            <text class="label">收货人</text>
            <text class="value">{{ order.address.name }} {{ order.address.phone }}</text>
          </view>
          <view class="info-row">
            <text class="label">收货地址</text>
            <text class="value">{{ formatAddress(order.address) }}</text>
          </view>
        </view>
      </view>

      <view class="section">
        <view class="section-title">菜品详情</view>
        <view class="dish-list">
          <view v-for="item in order.dishes" :key="item.dishId" class="dish-item">
            <image class="dish-image" :src="item.image" mode="aspectFill" />
            <view class="dish-info">
              <text class="dish-name">{{ item.name }}</text>
              <view class="dish-bottom">
                <text class="dish-price">¥{{ formatPrice(item.price) }}</text>
                <text class="dish-quantity">x{{ item.quantity }}</text>
              </view>
            </view>
          </view>
        </view>
        <view class="order-total">
          <text class="total-label">合计</text>
          <text class="total-price">¥{{ formatPrice(order.totalAmount) }}</text>
        </view>
      </view>

      <view class="section">
        <view class="section-title">订单信息</view>
        <view class="info-list">
          <view class="info-row">
            <text class="label">订单编号</text>
            <text class="value">{{ order.orderNo }}</text>
          </view>
          <view class="info-row">
            <text class="label">下单时间</text>
            <text class="value">{{ formatDateTime(order.createTime) }}</text>
          </view>
          <view v-if="order.payTime" class="info-row">
            <text class="label">支付时间</text>
            <text class="value">{{ formatDateTime(order.payTime) }}</text>
          </view>
          <view v-if="order.remark" class="info-row">
            <text class="label">备注信息</text>
            <text class="value">{{ order.remark }}</text>
          </view>
        </view>
      </view>

      <view class="bottom-spacer"></view>

      <view v-if="[1, 2, 3].includes(order.status)" class="bottom-bar">
        <button class="action-button" @click="onContact">联系商家</button>
        <button v-if="order.status === 1" class="action-button" @click="onCancel">取消订单</button>
        <button v-if="order.status === 1" class="action-button primary" @click="onPay">立即支付</button>
      </view>
    </template>
  </view>
</template>

<style scoped lang="scss">
.order-detail-page {
  min-height: 100vh;
  padding-bottom: 148rpx;
  background:
    radial-gradient(circle at 16% 0%, rgba(188, 11, 246, 0.1), transparent 38%),
    linear-gradient(180deg, #fbf8ff 0%, #f8f8f8 50%);
}

.status-card {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40rpx 30rpx;
  background: linear-gradient(135deg, #AC27ED 0%, #C95BFF 100%);
  color: #ffffff;
}

.status-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16rpx;
}

.status-text {
  color: #ffffff;
  font-size: 40rpx;
  font-weight: 700;
}

.status-desc {
  opacity: 0.9;
  font-size: 28rpx;
}

.section {
  margin: 20rpx 20rpx 0;
  padding: 30rpx;
  border: 2rpx solid rgba(188, 11, 246, 0.08);
  border-radius: 24rpx;
  background: #ffffff;
  box-shadow: 0 12rpx 30rpx rgba(54, 20, 82, 0.06);
}

.section-title {
  margin-bottom: 24rpx;
  padding-left: 16rpx;
  border-left: 6rpx solid #bc0bf6;
  color: #333333;
  font-size: 30rpx;
  font-weight: 700;
  line-height: 1;
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  font-size: 28rpx;
  line-height: 1.5;
}

.label {
  width: 140rpx;
  color: #999999;
  flex-shrink: 0;
}

.value {
  flex: 1;
  color: #333333;
  text-align: right;
}

.dish-list {
  display: flex;
  flex-direction: column;
  gap: 30rpx;
  margin-bottom: 30rpx;
}

.dish-item {
  display: flex;
  align-items: center;
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
  justify-content: space-between;
  height: 100rpx;
  padding: 4rpx 0;
}

.dish-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #333333;
  font-size: 28rpx;
  font-weight: 500;
}

.dish-bottom,
.order-total,
.bottom-bar {
  display: flex;
  align-items: center;
}

.dish-bottom,
.order-total {
  justify-content: space-between;
}

.dish-price {
  color: #333333;
  font-size: 30rpx;
  font-weight: 700;
}

.dish-quantity {
  color: #999999;
  font-size: 26rpx;
}

.order-total {
  padding-top: 24rpx;
  border-top: 1rpx solid #f0f0f0;
}

.total-label {
  color: #333333;
  font-size: 28rpx;
}

.total-price {
  color: #bc0bf6;
  font-size: 36rpx;
  font-weight: 700;
}

.bottom-spacer {
  height: 148rpx;
}

.bottom-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  min-height: 112rpx;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 20rpx;
  padding: 18rpx 30rpx calc(18rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -18rpx 38rpx rgba(54, 20, 82, 0.12);
}

.action-button {
  min-width: 148rpx;
  height: 72rpx;
  margin: 0;
  padding: 0 32rpx;
  border: 1rpx solid rgba(188, 11, 246, 0.16);
  border-radius: 999rpx;
  background: #ffffff;
  color: #6d6178;
  line-height: 72rpx;
  font-size: 27rpx;
  font-weight: 700;
}

.action-button.primary {
  border: none;
  background: linear-gradient(135deg, #AC27ED 0%, #C95BFF 100%);
  color: #ffffff;
  box-shadow: 0 10rpx 24rpx rgba(188, 11, 246, 0.26);
}

.action-button::after {
  border: none;
}

.loading-text {
  padding: 40rpx;
  text-align: center;
  color: #999999;
}
</style>
