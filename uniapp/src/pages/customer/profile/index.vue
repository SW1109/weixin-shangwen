<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { onShow } from '@dcloudio/uni-app'
import { shallowRef } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { getOrders } from '@/api/customer'
import type { Order } from '@/types/models'

const authStore = useAuthStore()
const { userInfo, isUserLoggedIn, isMerchantLoggedIn, merchantInfo } =
  storeToRefs(authStore)

const orderStats = shallowRef({
  unpaid: 0,
  toDeliver: 0,
  delivering: 0,
})

async function loadOrderStats() {
  if (!isUserLoggedIn.value) {
    orderStats.value = {
      unpaid: 0,
      toDeliver: 0,
      delivering: 0,
    }
    return
  }

  const orders = await getOrders()
  const nextStats = {
    unpaid: orders.filter((order: Order) => order.status === 1).length,
    toDeliver: orders.filter((order: Order) => order.status === 2).length,
    delivering: orders.filter((order: Order) => order.status === 3).length,
  }
  orderStats.value = nextStats
}

function openOrder(status = '') {
  if (!isUserLoggedIn.value) {
    openLoginPage()
    return
  }

  uni.setStorageSync('sw_order_filter', status)
  uni.switchTab({
    url: '/pages/customer/order/index',
  })
}

function openAddress() {
  if (!isUserLoggedIn.value) {
    uni.navigateTo({
      url: '/pages/customer/login/index',
    })
    return
  }

  uni.navigateTo({
    url: '/pages/customer/address/index',
  })
}

function openMerchantEntry() {
  uni.navigateTo({
    url: isMerchantLoggedIn.value
      ? '/pages/merchant/dashboard/index'
      : '/pages/merchant/login/index',
  })
}

function logout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    confirmColor: '#AC27ED',
    success: (res) => {
      if (!res.confirm) {
        return
      }

      authStore.logoutUser()
      orderStats.value = {
        unpaid: 0,
        toDeliver: 0,
        delivering: 0,
      }
      uni.showToast({
        title: '已退出登录',
        icon: 'success',
      })
    },
  })
}

function openLoginPage() {
  uni.navigateTo({
    url: '/pages/customer/login/index',
  })
}

function openProfileEdit() {
  uni.navigateTo({
    url: '/pages/customer/profile-edit/index',
  })
}

function showAbout() {
  uni.showModal({
    title: '关于我们',
    content: '美食点餐小程序\n版本：1.0.0\n\n提供便捷的在线点餐服务',
    showCancel: false,
  })
}

function onContact() {
  uni.showModal({
    title: '联系客服',
    content: '请拨打客服电话：10086',
    confirmText: '拨打',
    confirmColor: '#AC27ED',
    success: (res) => {
      if (res.confirm) {
        uni.makePhoneCall({
          phoneNumber: '10086',
        })
      }
    },
  })
}

onShow(() => {
  void loadOrderStats()
})
</script>

<template>
  <view class="profile-page">
    <view class="user-card">
      <view v-if="isUserLoggedIn" class="user-info" @click="openProfileEdit">
        <image class="avatar" :src="userInfo?.avatarUrl || '/static/logo.png'" mode="aspectFill" />
        <view class="user-detail">
          <text class="nickname">{{ userInfo?.nickName }}</text>
          <text class="phone">{{ userInfo?.phoneNumber || '未绑定手机号' }}</text>
          <text class="edit-tip">点击编辑资料 ›</text>
        </view>
      </view>
      <view v-else class="user-info" @click="openLoginPage">
        <image class="avatar" src="/static/logo.png" mode="aspectFill" />
        <view class="user-detail">
          <text class="nickname">点击登录</text>
        </view>
      </view>
    </view>

    <view class="order-stats">
      <view class="stats-title">我的订单</view>
      <view class="stats-list">
      <view class="stats-item" @click="openOrder('1')">
        <view class="stats-icon">
          <text class="icon">💰</text>
          <view v-if="orderStats.unpaid" class="badge">{{ orderStats.unpaid }}</view>
        </view>
        <view class="stats-label">待支付</view>
      </view>
      <view class="stats-item" @click="openOrder('2')">
        <view class="stats-icon">
          <text class="icon">📦</text>
          <view v-if="orderStats.toDeliver" class="badge">{{ orderStats.toDeliver }}</view>
        </view>
        <view class="stats-label">待配送</view>
      </view>
      <view class="stats-item" @click="openOrder('3')">
        <view class="stats-icon">
          <text class="icon">🚚</text>
          <view v-if="orderStats.delivering" class="badge">{{ orderStats.delivering }}</view>
        </view>
        <view class="stats-label">配送中</view>
      </view>
      <view class="stats-item" @click="openOrder('4')">
        <view class="stats-icon">
          <text class="icon">✅</text>
        </view>
        <view class="stats-label">已完成</view>
      </view>
      </view>
    </view>

    <view class="menu-list">
      <view class="menu-item" @click="openAddress">
        <view class="menu-left">
          <text class="menu-icon">📍</text>
          <text class="menu-label">收货地址</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="onContact">
        <view class="menu-left">
          <text class="menu-icon">🎧</text>
          <text class="menu-label">联系客服</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="showAbout">
        <view class="menu-left">
          <text class="menu-icon">ℹ️</text>
          <text class="menu-label">关于我们</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
      <view class="menu-item" @click="openMerchantEntry">
        <view class="menu-left">
          <text class="menu-icon">🏪</text>
          <text class="menu-label">商家管理</text>
        </view>
        <text class="menu-arrow">›</text>
      </view>
    </view>

    <view v-if="isUserLoggedIn" class="logout-btn">
      <button class="btn-logout" @click="logout">退出登录</button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.profile-page {
  min-height: 100vh;
  padding-bottom: 40rpx;
  background: linear-gradient(180deg, #FCFAFD 0%, #F8F5FA 48%, #F3EEF7 100%);
}

.user-card {
  margin-bottom: 20rpx;
  padding: 60rpx 30rpx 40rpx;
  background: linear-gradient(135deg, #AC27ED 0%, #C95BFF 100%);
  box-shadow: 0 18rpx 42rpx rgba(172, 39, 237, 0.18);
}

.user-info {
  display: flex;
  align-items: center;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  margin-right: 30rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  border: 4rpx solid rgba(255, 255, 255, 0.3);
}

.user-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10rpx;
}

.nickname {
  font-size: 36rpx;
  font-weight: 700;
  color: #ffffff;
}

.phone {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
}

.edit-tip {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.65);
}

.order-stats,
.menu-list {
  margin: 20rpx;
  border: 2rpx solid #E8DDED;
  border-radius: 20rpx;
  background: #ffffff;
  box-shadow: 0 10rpx 24rpx rgba(17, 24, 39, 0.07);
}

.order-stats {
  padding: 30rpx;
}

.stats-title {
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #E8DDED;
  font-size: 32rpx;
  font-weight: 700;
  color: #111827;
}

.stats-list {
  display: flex;
  justify-content: space-around;
}

.stats-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15rpx;
}

.stats-icon {
  position: relative;
  width: 94rpx;
  height: 94rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 28rpx;
  background: #F4ECF8;
}

.icon {
  font-size: 48rpx;
}

.badge {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  min-width: 36rpx;
  height: 36rpx;
  padding: 0 8rpx;
  border-radius: 18rpx;
  background: #d73f35;
  color: #ffffff;
  line-height: 36rpx;
  text-align: center;
  font-size: 20rpx;
}

.stats-label {
  font-size: 26rpx;
  color: #5c6670;
}

.menu-list {
  overflow: hidden;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #E8DDED;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 20rpx;
}

.menu-icon {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20rpx;
  background: #f7faf8;
  font-size: 36rpx;
}

.menu-label {
  font-size: 28rpx;
  color: #25313b;
}

.menu-arrow {
  color: #9aa5a0;
  font-size: 40rpx;
}

.logout-btn {
  margin: 60rpx 20rpx 20rpx;
}

.btn-logout {
  width: 100%;
  height: 90rpx;
  border: 1rpx solid rgba(172, 39, 237, 0.24);
  border-radius: 18rpx;
  background: #ffffff;
  color: #AC27ED;
  line-height: 90rpx;
  font-size: 32rpx;
  font-weight: 700;
}

.btn-logout::after {
  border: none;
}
</style>
