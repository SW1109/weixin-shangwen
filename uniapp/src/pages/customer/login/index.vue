<script setup lang="ts">
import { shallowRef } from 'vue'
import { loginByWeChat } from '@/api/auth'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'
import { ENABLE_MOCK_WECHAT_LOGIN } from '@/config/env'

const authStore = useAuthStore()
const cartStore = useCartStore()

const nickName = shallowRef('')
const avatarUrl = shallowRef('/static/logo.png')
const loading = shallowRef(false)

function selectAvatar() {
  uni.chooseImage({
    count: 1,
    success: (result) => {
      avatarUrl.value = result.tempFilePaths[0]
    },
  })
}

async function getLoginCode() {
  try {
    const loginResult = await uni.login()
    if (!loginResult.code) {
      throw new Error('未获取到微信登录 code')
    }
    return loginResult.code
  } catch (error) {
    if (ENABLE_MOCK_WECHAT_LOGIN) {
      return `mock-${Date.now()}`
    }
    throw error
  }
}

async function onSubmit() {
  if (!nickName.value.trim()) {
    uni.showToast({
      title: '请输入昵称',
      icon: 'none',
    })
    return
  }

  loading.value = true
  try {
    const code = await getLoginCode()
    const session = await loginByWeChat({
      code,
      nickName: nickName.value.trim(),
      avatarUrl: avatarUrl.value,
    })

    authStore.setUserSession(session)
    await cartStore.pullRemote()

    uni.showToast({
      title: '登录成功',
      icon: 'success',
    })

    setTimeout(() => {
      uni.switchTab({
        url: '/pages/customer/profile/index',
      })
    }, 500)
  } catch (error) {
    uni.showToast({
      title: (error as Error).message || '登录失败',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}

function onNicknameInput(event: any) {
  nickName.value = event.detail.value
}
</script>

<template>
  <view class="login-page">
    <view class="login-box">
      <image class="logo" :src="avatarUrl" mode="aspectFit" @click="selectAvatar" />
      <text class="title">美食点餐</text>
      <text class="subtitle">欢迎使用在线点餐服务</text>

      <input
        class="nickname-input"
        :value="nickName"
        type="nickname"
        placeholder="请输入微信昵称"
        @input="onNicknameInput"
      />

      <button class="btn-login" :loading="loading" @click="onSubmit">
        微信授权登录
      </button>

      <view class="tips">
        <text>登录即表示同意</text>
        <text class="link">《用户协议》</text>
        <text>和</text>
        <text class="link">《隐私政策》</text>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 40rpx;
  background: linear-gradient(135deg, #bc0bf6 0%, #d65eff 100%);
}

.login-box {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80rpx 60rpx;
  border-radius: 24rpx;
  background: #ffffff;
}

.logo {
  width: 160rpx;
  height: 160rpx;
  margin-bottom: 40rpx;
}

.title {
  margin-bottom: 16rpx;
  color: #333333;
  font-size: 48rpx;
  font-weight: 700;
}

.subtitle {
  margin-bottom: 50rpx;
  color: #999999;
  font-size: 28rpx;
}

.nickname-input {
  width: 100%;
  height: 88rpx;
  padding: 0 24rpx;
  margin-bottom: 30rpx;
  border-radius: 44rpx;
  background: #f5f5f5;
  text-align: center;
  font-size: 28rpx;
}

.btn-login {
  width: 100%;
  height: 88rpx;
  margin: 0;
  border: none;
  border-radius: 44rpx;
  background: #bc0bf6;
  color: #ffffff;
  line-height: 88rpx;
  font-size: 32rpx;
}

.btn-login::after {
  border: none;
}

.tips {
  margin-top: 40rpx;
  color: #999999;
  font-size: 24rpx;
  text-align: center;
}

.link {
  color: #bc0bf6;
}
</style>
