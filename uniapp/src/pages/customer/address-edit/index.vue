<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { reactive, shallowRef } from 'vue'
import { getAddresses, saveAddress } from '@/api/customer'
import type { AddressPayload } from '@/types/models'

const addressId = shallowRef<number | null>(null)
const saving = shallowRef(false)
const provinceIndex = shallowRef(0)
const cityIndex = shallowRef(0)
const districtIndex = shallowRef(0)

const provinces = ['广东省', '北京市', '上海市', '浙江省', '江苏省', '四川省']
const cities: Record<string, string[]> = {
  广东省: ['广州市', '深圳市', '东莞市', '佛山市', '珠海市'],
  北京市: ['北京市'],
  上海市: ['上海市'],
  浙江省: ['杭州市', '宁波市', '温州市'],
  江苏省: ['南京市', '苏州市', '无锡市'],
  四川省: ['成都市', '绵阳市', '乐山市'],
}
const districts: Record<string, string[]> = {
  深圳市: ['南山区', '福田区', '罗湖区', '宝安区', '龙岗区'],
  广州市: ['天河区', '海珠区', '越秀区', '番禺区'],
  北京市: ['朝阳区', '海淀区', '东城区', '西城区'],
  上海市: ['浦东新区', '黄浦区', '徐汇区', '静安区'],
  杭州市: ['西湖区', '上城区', '下城区', '拱墅区'],
  南京市: ['玄武区', '秦淮区', '建邺区', '鼓楼区'],
  成都市: ['武侯区', '锦江区', '青羊区', '金牛区'],
}

const form = reactive<AddressPayload>({
  name: '',
  phone: '',
  province: '',
  city: '',
  district: '',
  detail: '',
  isDefault: false,
})

async function loadAddress(id: number) {
  const addresses = await getAddresses()
  const current = addresses.find((item) => item.id === id)
  if (!current) {
    return
  }

  form.name = current.name
  form.phone = current.phone
  form.province = current.province
  form.city = current.city
  form.district = current.district
  form.detail = current.detail
  form.isDefault = current.isDefault

  provinceIndex.value = Math.max(provinces.indexOf(current.province), 0)
  cityIndex.value = Math.max((cities[current.province] || []).indexOf(current.city), 0)
  districtIndex.value = Math.max((districts[current.city] || []).indexOf(current.district), 0)
}

async function onSubmit() {
  if (!form.name) {
    uni.showToast({
      title: '请输入收货人姓名',
      icon: 'none',
    })
    return
  }

  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    uni.showToast({
      title: '手机号格式不正确',
      icon: 'none',
    })
    return
  }

  if (!form.province || !form.city || !form.district) {
    uni.showToast({
      title: '请选择省市区',
      icon: 'none',
    })
    return
  }

  if (!form.detail) {
    uni.showToast({
      title: '请输入详细地址',
      icon: 'none',
    })
    return
  }

  saving.value = true
  try {
    await saveAddress({ ...form }, addressId.value || undefined)
    uni.showToast({
      title: '保存成功',
      icon: 'success',
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 400)
  } finally {
    saving.value = false
  }
}

function setField<K extends keyof AddressPayload>(key: K, value: AddressPayload[K]) {
  form[key] = value
}

function onProvinceChange(event: any) {
  const index = Number(event.detail.value)
  const province = provinces[index]
  const firstCity = cities[province][0]
  const firstDistrict = districts[firstCity]?.[0] || ''

  provinceIndex.value = index
  cityIndex.value = 0
  districtIndex.value = 0
  form.province = province
  form.city = firstCity
  form.district = firstDistrict
}

function onCityChange(event: any) {
  const cityList = cities[form.province] || []
  const index = Number(event.detail.value)
  const city = cityList[index]

  cityIndex.value = index
  districtIndex.value = 0
  form.city = city
  form.district = districts[city]?.[0] || ''
}

function onDistrictChange(event: any) {
  const districtList = districts[form.city] || []
  const index = Number(event.detail.value)

  districtIndex.value = index
  form.district = districtList[index] || ''
}

onLoad((query) => {
  if (query?.id) {
    addressId.value = Number(query.id)
    void loadAddress(addressId.value)
  }
})
</script>

<template>
  <view class="address-edit-page">
    <view class="form-section">
      <view class="form-item">
        <text class="label">收货人</text>
        <input class="input" :value="form.name" maxlength="20" placeholder="请输入收货人姓名" @input="setField('name', ($event as any).detail.value)" />
      </view>
      <view class="form-item">
        <text class="label">手机号</text>
        <input class="input" type="number" :value="form.phone" maxlength="11" placeholder="请输入手机号" @input="setField('phone', ($event as any).detail.value)" />
      </view>
    </view>

    <view class="form-section">
      <view class="form-item">
        <text class="label">省份</text>
        <picker class="picker-wrap" mode="selector" :range="provinces" :value="provinceIndex" @change="onProvinceChange">
          <view class="picker">
            <text class="picker-text" :class="{ placeholder: !form.province }">{{ form.province || '请选择省份' }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">城市</text>
        <picker class="picker-wrap" mode="selector" :range="cities[form.province] || []" :value="cityIndex" @change="onCityChange">
          <view class="picker">
            <text class="picker-text" :class="{ placeholder: !form.city }">{{ form.city || '请选择城市' }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">区域</text>
        <picker class="picker-wrap" mode="selector" :range="districts[form.city] || []" :value="districtIndex" @change="onDistrictChange">
          <view class="picker">
            <text class="picker-text" :class="{ placeholder: !form.district }">{{ form.district || '请选择区域' }}</text>
            <text class="picker-arrow">›</text>
          </view>
        </picker>
      </view>
    </view>

    <view class="form-section">
      <view class="form-item column">
        <text class="label">详细地址</text>
        <textarea class="textarea" :value="form.detail" maxlength="100" auto-height placeholder="请输入详细地址，如街道、门牌号等" @input="setField('detail', ($event as any).detail.value)" />
      </view>
    </view>

    <view class="form-section">
      <view class="form-item switch">
        <text class="label">设为默认地址</text>
        <switch :checked="form.isDefault" color="#AC27ED" @change="setField('isDefault', ($event as any).detail.value)" />
      </view>
    </view>

    <view class="save-btn-wrapper">
      <button class="save-btn" :loading="saving" @click="onSubmit">保存</button>
    </view>
  </view>
</template>

<style scoped lang="scss">
.address-edit-page {
  min-height: 100vh;
  padding-bottom: 120rpx;
  background: #f5f5f5;
}

/* #ifdef H5 */
.address-edit-page {
  min-height: 100%;
  padding-bottom: calc(120rpx + var(--window-bottom));
}
/* #endif */

.form-section {
  margin-bottom: 20rpx;
  background: #ffffff;
}

.form-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.form-item:last-child {
  border-bottom: none;
}

.form-item.column {
  flex-direction: column;
  align-items: flex-start;
}

.form-item.switch {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.label {
  width: 160rpx;
  color: #333333;
  font-size: 28rpx;
  flex-shrink: 0;
}

.form-item.column .label {
  width: auto;
  margin-bottom: 20rpx;
}

.input {
  flex: 1;
  color: #333333;
  font-size: 28rpx;
}

.textarea {
  width: 100%;
  min-height: 120rpx;
  color: #333333;
  font-size: 28rpx;
  line-height: 1.6;
}

.picker-wrap {
  flex: 1;
}

.picker {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.picker-text {
  color: #333333;
  font-size: 28rpx;
}

.picker-text.placeholder {
  color: #999999;
}

.picker-arrow {
  margin-left: 20rpx;
  color: #cccccc;
  font-size: 40rpx;
}

.save-btn-wrapper {
  padding: 30rpx;
}

.save-btn {
  width: 100%;
  height: 90rpx;
  border: none;
  border-radius: 45rpx;
  background: #AC27ED;
  color: #ffffff;
  line-height: 90rpx;
  font-size: 32rpx;
  font-weight: 700;
}

.save-btn::after {
  border: none;
}
</style>
