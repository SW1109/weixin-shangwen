<script setup lang="ts">
import { reactive, shallowRef } from 'vue'
import { merchantLogin } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const loading = shallowRef(false)
const form = reactive({
  username: 'admin',
  password: '123456',
})

async function onSubmit() {
  if (!form.username || !form.password) {
    uni.showToast({
      title: '请输入账号和密码',
      icon: 'none',
    })
    return
  }

  loading.value = true
  try {
    const session = await merchantLogin(form)
    authStore.setMerchantSession(session)
    uni.showToast({
      title: '登录成功',
      icon: 'success',
    })
    setTimeout(() => {
      uni.redirectTo({
        url: '/pages/merchant/dashboard/index',
      })
    }, 400)
  } catch (error) {
    uni.showToast({
      title: (error as Error).message || '登录失败',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}

function onUsernameInput(event: any) {
  form.username = event.detail.value
}

function onPasswordInput(event: any) {
  form.password = event.detail.value
}
</script>

<template>
  <view class="merchant-login-page">
    <view class="login-box">
      <view class="logo">
        <text class="logo-icon">🍽️</text>
        <text class="logo-text">商家管理端</text>
      </view>

      <view class="form">
        <view class="form-item">
          <view class="label">用户名</view>
          <input class="input" :value="form.username" placeholder="请输入用户名" @input="onUsernameInput" />
        </view>
        <view class="form-item">
          <view class="label">密码</view>
          <input class="input" type="password" :value="form.password" placeholder="请输入密码" @input="onPasswordInput" />
        </view>
        <button class="btn-login" :loading="loading" :disabled="loading" @click="onSubmit">
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </view>

      <view class="tips">
        <text class="tip-text">默认账号：admin</text>
        <text class="tip-text">默认密码：123456</text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.merchant-login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40rpx;
  background: linear-gradient(135deg, #667eea 0%, #bc0bf6 100%);
}

.login-box {
  width: 100%;
  max-width: 600rpx;
  padding: 80rpx 60rpx;
  border-radius: 40rpx;
  background: #ffffff;
  box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.1);
}

.logo {
  margin-bottom: 80rpx;
  text-align: center;
}

.logo-icon {
  display: block;
  margin-bottom: 20rpx;
  font-size: 120rpx;
}

.logo-text {
  color: #333333;
  font-size: 48rpx;
  font-weight: 700;
}

.form {
  margin-bottom: 40rpx;
}

.form-item {
  margin-bottom: 40rpx;
}

.label {
  margin-bottom: 16rpx;
  color: #666666;
  font-size: 28rpx;
}

.input {
  width: 100%;
  height: 88rpx;
  padding: 0 30rpx;
  border-radius: 16rpx;
  background: #f5f5f5;
  font-size: 28rpx;
}

.btn-login {
  width: 100%;
  height: 88rpx;
  margin: 60rpx 0 0;
  border: none;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #667eea 0%, #bc0bf6 100%);
  color: #ffffff;
  line-height: 88rpx;
  font-size: 32rpx;
  font-weight: 700;
}

.btn-login[disabled] {
  opacity: 0.6;
}

.btn-login::after {
  border: none;
}

.tips {
  padding-top: 40rpx;
  border-top: 1rpx solid #eeeeee;
  text-align: center;
}

.tip-text {
  display: block;
  color: #999999;
  font-size: 24rpx;
  line-height: 40rpx;
}
</style>
