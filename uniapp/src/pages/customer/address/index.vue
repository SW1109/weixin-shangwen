<script setup lang="ts">
import { onLoad, onShow } from '@dcloudio/uni-app'
import { shallowRef } from 'vue'
import AddressCard from '@/components/customer/AddressCard.vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { deleteAddress, getAddresses, setDefaultAddress } from '@/api/customer'
import { useAuthGuard } from '@/composables/useAuthGuard'
import type { Address } from '@/types/models'

const authGuard = useAuthGuard()
const addresses = shallowRef<Address[]>([])
const selectMode = shallowRef(false)
const loading = shallowRef(false)

async function loadAddresses() {
  if (!authGuard.ensure()) {
    return
  }

  loading.value = true
  try {
    addresses.value = await getAddresses()
  } finally {
    loading.value = false
  }
}

function onAddAddress() {
  uni.navigateTo({
    url: '/pages/customer/address-edit/index',
  })
}

function onEditAddress(id: number) {
  uni.navigateTo({
    url: `/pages/customer/address-edit/index?id=${id}`,
  })
}

async function onDeleteAddress(id: number) {
  uni.showModal({
    title: '提示',
    content: '确定要删除该地址吗？',
    confirmColor: '#AC27ED',
    success: (res) => {
      if (!res.confirm) {
        return
      }

      void deleteAddress(id).then(loadAddresses)
    },
  })
}

async function onSetDefault(id: number) {
  await setDefaultAddress(id)
  await loadAddresses()
}

function onChooseAddress(id: number) {
  if (!selectMode.value) {
    return
  }

  uni.setStorageSync('sw_checkout_address', id)
  void setDefaultAddress(id).finally(() => {
    uni.navigateBack()
  })
}

onLoad((query) => {
  selectMode.value = query?.select === '1'
})

onShow(() => {
  void loadAddresses()
})
</script>

<template>
  <view class="address-page">
    <view v-if="loading" class="loading-state">加载中...</view>
    <EmptyState
      v-else-if="!addresses.length"
      title="还没有收货地址"
      description="点击下方按钮添加地址"
    />

    <view v-else class="address-list">
      <view
        v-for="address in addresses"
        :key="address.id"
        class="address-wrap"
        :class="{ default: address.isDefault }"
      >
        <AddressCard
          :address="address"
          editable
          :selected="selectMode && address.isDefault"
          @click="onChooseAddress"
          @edit="onEditAddress"
        />
        <view class="address-actions">
          <button v-if="!address.isDefault" class="action-button muted" @click="onSetDefault(address.id)">
            设为默认
          </button>
          <button class="action-button muted" @click="onEditAddress(address.id)">
            编辑
          </button>
          <button class="action-button danger" @click="onDeleteAddress(address.id)">
            删除
          </button>
        </view>
      </view>
    </view>

    <view class="add-btn-wrapper">
      <button class="add-button" @click="onAddAddress">+ 添加新地址</button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.address-page {
  min-height: 100vh;
  padding-bottom: 160rpx;
  background: linear-gradient(180deg, #FCFAFD 0%, #F8F5FA 48%, #F3EEF7 100%);
}

.address-list {
  display: flex;
  flex-direction: column;
  padding: 20rpx;
}

.address-wrap {
  margin-bottom: 20rpx;
}

.address-wrap.default :deep(.address-card) {
  border-color: #AC27ED;
}

.address-actions {
  display: flex;
  gap: 20rpx;
  padding: 20rpx 30rpx 30rpx;
  border-top: 1rpx solid #E8DDED;
  border-radius: 0 0 20rpx 20rpx;
  background: #ffffff;
}

.action-button {
  flex: 1;
  height: 72rpx;
  margin: 0;
  padding: 0;
  border: 1rpx solid #E8DDED;
  border-radius: 18rpx;
  background: #ffffff;
  line-height: 72rpx;
  font-size: 26rpx;
  font-weight: 700;
}

.action-button::after {
  border: none;
}

.action-button.muted {
  background: #ffffff;
  color: #25313b;
}

.action-button.danger {
  background: #ffffff;
  color: #d73f35;
}

.add-btn-wrapper {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 20rpx 24rpx calc(20rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -12rpx 30rpx rgba(17, 24, 39, 0.1);
}

.add-button {
  width: 100%;
  height: 90rpx;
  margin: 0;
  border: none;
  border-radius: 18rpx;
  background: #AC27ED;
  color: #ffffff;
  line-height: 90rpx;
  font-size: 32rpx;
  font-weight: 700;
  box-shadow: 0 8rpx 18rpx rgba(172, 39, 237, 0.22);
}

.add-button::after {
  border: none;
}

.loading-state {
  padding: 100rpx 0;
  text-align: center;
  color: #5c6670;
  font-size: 28rpx;
}
</style>
