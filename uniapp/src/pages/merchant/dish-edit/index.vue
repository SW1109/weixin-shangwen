<script setup lang="ts">
import { onLoad } from '@dcloudio/uni-app'
import { computed, reactive, shallowRef } from 'vue'
import { getMerchantCategories, getMerchantDishes, saveDish } from '@/api/merchant'
import { uploadImage } from '@/api/upload'
import { useMerchantGuard } from '@/composables/useMerchantGuard'
import type { Category, DishPayload } from '@/types/models'

const merchantGuard = useMerchantGuard()
const categories = shallowRef<Category[]>([])
const editingId = shallowRef<number | null>(null)
const saving = shallowRef(false)
const uploading = shallowRef(false)
const tagsInput = shallowRef('')
const categoryIndex = shallowRef(0)

const form = reactive<DishPayload & { sort: number }>({
  categoryId: 0,
  name: '',
  image: '',
  price: 0,
  originalPrice: null,
  description: '',
  stock: 0,
  status: 1,
  isRecommend: false,
  tags: [],
  sort: 0,
})

const pageTitle = computed(() => (editingId.value ? '编辑菜品' : '新增菜品'))
const currentCategoryName = computed(
  () => categories.value.find((item) => item.id === form.categoryId)?.name || '',
)

async function loadCategories() {
  categories.value = await getMerchantCategories()
  if (!form.categoryId && categories.value.length) {
    form.categoryId = categories.value[0].id
    categoryIndex.value = 0
  }
}

async function loadDetail(id: number) {
  const dishes = await getMerchantDishes()
  const current = dishes.find((item) => item.id === id)
  if (!current) {
    return
  }

  form.id = current.id
  form.categoryId = current.categoryId
  form.name = current.name
  form.image = current.image
  form.price = current.price
  form.originalPrice = current.originalPrice || null
  form.description = current.description
  form.stock = current.stock
  form.status = current.status
  form.isRecommend = current.isRecommend
  form.tags = current.tags
  categoryIndex.value = Math.max(
    categories.value.findIndex((item) => item.id === current.categoryId),
    0,
  )
}

async function onSubmit() {
  if (!form.name.trim()) {
    uni.showToast({
      title: '请输入菜品名称',
      icon: 'none',
    })
    return
  }

  if (!form.categoryId) {
    uni.showToast({
      title: '请选择分类',
      icon: 'none',
    })
    return
  }

  if (!form.image) {
    uni.showToast({
      title: '请上传菜品图片',
      icon: 'none',
    })
    return
  }

  if (!form.price || form.price <= 0) {
    uni.showToast({
      title: '请输入正确的价格',
      icon: 'none',
    })
    return
  }

  saving.value = true
  try {
    await saveDish({
      ...form,
      id: editingId.value || undefined,
    })
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

function onCategoryChange(event: any) {
  const index = Number(event.detail.value)
  const category = categories.value[index]
  if (!category) {
    return
  }

  categoryIndex.value = index
  form.categoryId = category.id
}

function onTextField(
  key: 'name' | 'image' | 'description',
  event: any,
) {
  form[key] = event.detail.value
}

function onNumberField(
  key: 'price' | 'originalPrice' | 'stock' | 'sort',
  event: any,
) {
  const value = event.detail.value
  if (key === 'originalPrice') {
    form.originalPrice = value ? Number(value) : null
    return
  }

  form[key] = Number(value || 0)
}

function onTagsInput(event: any) {
  tagsInput.value = event.detail.value
}

function onAddTag() {
  const tag = tagsInput.value.trim()
  if (!tag) {
    uni.showToast({
      title: '请输入标签',
      icon: 'none',
    })
    return
  }

  if (form.tags.includes(tag)) {
    uni.showToast({
      title: '标签已存在',
      icon: 'none',
    })
    return
  }

  form.tags = [...form.tags, tag]
  tagsInput.value = ''
}

function onRemoveTag(index: number) {
  form.tags = form.tags.filter((_, itemIndex) => itemIndex !== index)
}

function onRecommendChange(event: any) {
  form.isRecommend = event.detail.value
}

function onStatusChange(event: any) {
  form.status = event.detail.value ? 1 : 0
}

function onUploadImage() {
  uni.chooseImage({
    count: 1,
    success: async (result) => {
      uploading.value = true
      try {
        form.image = await uploadImage(result.tempFilePaths[0], 'merchant')
        uni.showToast({
          title: '上传成功',
          icon: 'success',
        })
      } catch (error) {
        uni.showToast({
          title: (error as Error).message || '上传失败',
          icon: 'none',
        })
      } finally {
        uploading.value = false
      }
    },
  })
}

onLoad((query) => {
  if (!merchantGuard.ensure()) {
    return
  }

  void loadCategories()
  if (query?.id) {
    editingId.value = Number(query.id)
    void loadDetail(editingId.value)
  }
  uni.setNavigationBarTitle({
    title: pageTitle.value,
  })
})
</script>

<template>
  <view class="dish-edit-page">
    <view class="form">
      <view class="form-section">
        <view class="section-title">菜品图片 *</view>
        <view class="image-upload" @click="onUploadImage">
          <image v-if="form.image" class="uploaded-image" :src="form.image" mode="aspectFill" />
          <view v-else class="upload-placeholder">
            <text class="upload-icon">+</text>
            <text class="upload-text">{{ uploading ? '上传中...' : '点击上传图片' }}</text>
          </view>
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">基本信息</view>
        <view class="form-item">
          <text class="label">菜品名称 *</text>
          <input class="input" :value="form.name" placeholder="请输入菜品名称" @input="onTextField('name', $event as any)" />
        </view>
        <view class="form-item">
          <text class="label">菜品分类 *</text>
          <picker class="picker-wrap" mode="selector" :range="categories" range-key="name" :value="categoryIndex" @change="onCategoryChange">
            <view class="picker">{{ currentCategoryName || '请选择分类' }}</view>
          </picker>
        </view>
        <view class="form-item">
          <text class="label">菜品描述</text>
          <textarea class="textarea" :value="form.description" maxlength="200" placeholder="请输入菜品描述" @input="onTextField('description', $event as any)" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">价格库存</view>
        <view class="form-item">
          <text class="label">售价 * (元)</text>
          <input class="input" type="digit" :value="String(form.price || '')" placeholder="请输入售价" @input="onNumberField('price', $event as any)" />
        </view>
        <view class="form-item">
          <text class="label">原价 (元)</text>
          <input class="input" type="digit" :value="String(form.originalPrice || '')" placeholder="选填，用于显示优惠" @input="onNumberField('originalPrice', $event as any)" />
        </view>
        <view class="form-item">
          <text class="label">库存 * (-1为无限)</text>
          <input class="input" type="number" :value="String(form.stock || '')" placeholder="请输入库存数量" @input="onNumberField('stock', $event as any)" />
        </view>
        <view class="form-item">
          <text class="label">排序 (数字越小越靠前)</text>
          <input class="input" type="number" :value="String(form.sort || '')" placeholder="默认为0" @input="onNumberField('sort', $event as any)" />
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">菜品标签</view>
        <view class="tags-container">
          <view v-for="(tag, index) in form.tags" :key="tag" class="tag-item">
            <text>{{ tag }}</text>
            <text class="tag-remove" @click="onRemoveTag(index)">×</text>
          </view>
        </view>
        <view class="tag-input-row">
          <input class="tag-input" :value="tagsInput" placeholder="输入标签，如：辣、热销" @input="onTagsInput" />
          <button class="btn-add-tag" @click="onAddTag">添加</button>
        </view>
      </view>

      <view class="form-section">
        <view class="section-title">其他设置</view>
        <view class="form-item form-switch">
          <text class="label">推荐菜品</text>
          <switch :checked="form.isRecommend" color="#bc0bf6" @change="onRecommendChange" />
        </view>
        <view class="form-item form-switch">
          <text class="label">立即上架</text>
          <switch :checked="form.status === 1" color="#bc0bf6" @change="onStatusChange" />
        </view>
      </view>

      <view class="submit-container">
        <button class="btn-submit" :loading="saving" @click="onSubmit">
          {{ editingId ? '保存修改' : '添加菜品' }}
        </button>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.dish-edit-page {
  min-height: 100vh;
  padding: 20rpx 20rpx 156rpx;
  background:
    radial-gradient(circle at 16% 0%, rgba(188, 11, 246, 0.1), transparent 38%),
    linear-gradient(180deg, #fbf8ff 0%, #f5f5f5 48%);
}

.form {
  display: flex;
  flex-direction: column;
}

.form-section {
  margin-bottom: 20rpx;
  padding: 30rpx;
  border: 2rpx solid rgba(188, 11, 246, 0.08);
  border-radius: 24rpx;
  background: #ffffff;
  box-shadow: 0 12rpx 30rpx rgba(54, 20, 82, 0.06);
}

.section-title {
  margin-bottom: 24rpx;
  color: #333333;
  font-size: 32rpx;
  font-weight: 700;
}

.image-upload {
  width: 100%;
  height: 400rpx;
  overflow: hidden;
  border: 2rpx dashed rgba(188, 11, 246, 0.28);
  border-radius: 22rpx;
  background: linear-gradient(135deg, #fbf8ff, #f3fbff);
}

.uploaded-image {
  width: 100%;
  height: 100%;
}

.upload-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #999999;
}

.upload-icon {
  margin-bottom: 16rpx;
  font-size: 80rpx;
}

.upload-text {
  font-size: 26rpx;
}

.form-item {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.form-item:last-child {
  border-bottom: none;
}

.form-item.form-switch {
  justify-content: space-between;
}

.label {
  width: 180rpx;
  color: #333333;
  font-size: 28rpx;
}

.input,
.picker {
  flex: 1;
  color: #333333;
  text-align: right;
  font-size: 28rpx;
}

.picker-wrap {
  flex: 1;
}

.picker {
  color: #999999;
}

.textarea {
  flex: 1;
  min-height: 150rpx;
  margin-top: 20rpx;
  color: #333333;
  font-size: 28rpx;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.tag-item {
  display: inline-flex;
  align-items: center;
  padding: 10rpx 20rpx;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #f8e6ff, #effaff);
  color: #bc0bf6;
  font-size: 24rpx;
}

.tag-remove {
  margin-left: 12rpx;
  color: #999999;
  font-size: 32rpx;
}

.tag-input-row {
  display: flex;
  gap: 16rpx;
}

.tag-input {
  flex: 1;
  height: 78rpx;
  padding: 0 20rpx;
  border: 1rpx solid rgba(188, 11, 246, 0.1);
  border-radius: 18rpx;
  background: #fbf8ff;
  font-size: 26rpx;
}

.btn-add-tag {
  width: 140rpx;
  height: 78rpx;
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #AC27ED 0%, #C95BFF 100%);
  color: #ffffff;
  line-height: 78rpx;
  font-size: 26rpx;
  font-weight: 700;
}

.submit-container {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  padding: 20rpx 30rpx calc(20rpx + env(safe-area-inset-bottom));
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 -18rpx 38rpx rgba(54, 20, 82, 0.12);
}

.btn-submit {
  width: 100%;
  height: 88rpx;
  margin: 0;
  border: none;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #AC27ED 0%, #C95BFF 100%);
  color: #ffffff;
  line-height: 88rpx;
  font-size: 30rpx;
  font-weight: 700;
  box-shadow: 0 12rpx 28rpx rgba(188, 11, 246, 0.24);
}

.btn-add-tag::after,
.btn-submit::after {
  border: none;
}
</style>
