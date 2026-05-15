<script setup lang="ts">
import { reactive, shallowRef } from 'vue'
import { storeToRefs } from 'pinia'
import { updateUserProfile } from '@/api/auth'
import { uploadImage } from '@/api/upload'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const { userInfo } = storeToRefs(authStore)

const saving = shallowRef(false)
const form = reactive({
  nickName: userInfo.value?.nickName || '',
  avatarUrl: userInfo.value?.avatarUrl || '/static/logo.png',
  phoneNumber: userInfo.value?.phoneNumber || '',
})

function selectAvatar() {
  uni.chooseImage({
    count: 1,
    success: async (result) => {
      try {
        form.avatarUrl = await uploadImage(result.tempFilePaths[0], 'user')
        uni.showToast({
          title: '上传成功',
          icon: 'success',
        })
      } catch (error) {
        uni.showToast({
          title: (error as Error).message || '上传失败',
          icon: 'none',
        })
      }
    },
  })
}

async function onSubmit() {
  if (!form.nickName.trim()) {
    uni.showToast({
      title: '请输入昵称',
      icon: 'none',
    })
    return
  }

  if (form.phoneNumber && !/^1[3-9]\d{9}$/.test(form.phoneNumber)) {
    uni.showToast({
      title: '请输入正确的手机号',
      icon: 'none',
    })
    return
  }

  saving.value = true
  try {
    const session = await updateUserProfile(form)
    authStore.setUserSession(session)
    uni.showToast({
      title: '更新成功',
      icon: 'success',
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 400)
  } finally {
    saving.value = false
  }
}

function setField(key: 'nickName' | 'phoneNumber', value: string) {
  form[key] = value
}
</script>

<template>
  <view class="profile-edit-page">
    <view class="avatar-section">
      <button class="avatar-wrapper" @click="selectAvatar">
        <image class="avatar" :src="form.avatarUrl" mode="aspectFill" />
        <view class="edit-icon">📷</view>
      </button>
      <text class="avatar-tip">点击修改头像</text>
    </view>

    <view class="form-section">
      <view class="form-item">
        <text class="label">昵称</text>
        <input class="input" type="nickname" :value="form.nickName" placeholder="请输入昵称" @input="setField('nickName', ($event as any).detail.value)" />
      </view>
      <view class="form-item">
        <text class="label">手机号</text>
        <input class="input" type="number" :value="form.phoneNumber" placeholder="请输入手机号" @input="setField('phoneNumber', ($event as any).detail.value)" />
      </view>
    </view>

    <button class="save-button" :loading="saving" @click="onSubmit">保存修改</button>
  </view>
</template>

<style scoped lang="scss">
.profile-edit-page {
  min-height: 100vh;
  padding: 40rpx;
  background:
    radial-gradient(circle at 16% 0%, rgba(188, 11, 246, 0.1), transparent 38%),
    linear-gradient(180deg, #fbf8ff 0%, #f5f5f5 48%);
}

.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 60rpx;
}

.avatar-wrapper {
  position: relative;
  width: 160rpx;
  height: 160rpx;
  margin: 0 0 20rpx;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: none;
  box-shadow: 0 14rpx 32rpx rgba(54, 20, 82, 0.12);
}

.avatar-wrapper::after {
  border: none;
}

.avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #ffffff;
}

.edit-icon {
  position: absolute;
  right: 0;
  bottom: 0;
  width: 58rpx;
  height: 58rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #AC27ED 0%, #C95BFF 100%);
  color: #ffffff;
  line-height: 58rpx;
  text-align: center;
  font-size: 28rpx;
}

.avatar-tip {
  color: #999999;
  font-size: 28rpx;
}

.form-section {
  margin-bottom: 60rpx;
  padding: 0 30rpx;
  border: 2rpx solid rgba(188, 11, 246, 0.08);
  border-radius: 24rpx;
  background: #ffffff;
  box-shadow: 0 14rpx 32rpx rgba(54, 20, 82, 0.08);
}

.form-item {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.form-item:last-child {
  border-bottom: none;
}

.label {
  width: 120rpx;
  color: #333333;
  font-size: 30rpx;
}

.input {
  flex: 1;
  color: #333333;
  text-align: right;
  font-size: 30rpx;
}

.save-button {
  width: 100%;
  height: 88rpx;
  border: none;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #AC27ED 0%, #C95BFF 100%);
  color: #ffffff;
  line-height: 88rpx;
  font-size: 32rpx;
  font-weight: 700;
  box-shadow: 0 12rpx 28rpx rgba(188, 11, 246, 0.24);
}

.save-button::after {
  border: none;
}
</style>
