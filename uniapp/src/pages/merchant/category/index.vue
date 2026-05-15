<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'
import { reactive, shallowRef } from 'vue'
import EmptyState from '@/components/common/EmptyState.vue'
import { deleteCategory, getMerchantCategories, saveCategory } from '@/api/merchant'
import { useMerchantGuard } from '@/composables/useMerchantGuard'
import type { Category } from '@/types/models'

const merchantGuard = useMerchantGuard()
const categories = shallowRef<Category[]>([])
const editingId = shallowRef<number | null>(null)
const showDialog = shallowRef(false)
const form = reactive({
  name: '',
  sort: 1,
  status: 1,
})

async function loadCategories() {
  if (!merchantGuard.ensure()) {
    return
  }

  categories.value = await getMerchantCategories()
}

function startEdit(category: Category) {
  editingId.value = category.id
  form.name = category.name
  form.sort = category.sort
  form.status = category.status
  showDialog.value = true
}

function resetForm() {
  editingId.value = null
  form.name = ''
  form.sort = categories.value.length + 1
  form.status = 1
}

function showAddDialog() {
  resetForm()
  showDialog.value = true
}

function hideDialog() {
  showDialog.value = false
}

async function onSubmit() {
  if (!form.name.trim()) {
    uni.showToast({
      title: '请输入分类名称',
      icon: 'none',
    })
    return
  }

  await saveCategory({
    id: editingId.value || undefined,
    name: form.name.trim(),
    sort: form.sort,
    status: form.status,
  })
  resetForm()
  hideDialog()
  await loadCategories()
}

async function onDelete(id: number) {
  uni.showModal({
    title: '提示',
    content: '确定要删除该分类吗？',
    confirmColor: '#bc0bf6',
    success: (res) => {
      if (!res.confirm) {
        return
      }

      void deleteCategory(id).then(loadCategories)
    },
  })
}

function onNameInput(event: any) {
  form.name = event.detail.value
}

function onSortInput(event: any) {
  form.sort = Number(event.detail.value || 0)
}

function onStatusChange(event: any) {
  form.status = event.detail.value ? 1 : 0
}

onShow(() => {
  void loadCategories()
})
</script>

<template>
  <view class="category-page">
    <view class="header">
      <button class="btn-add" @click="showAddDialog">+ 添加分类</button>
    </view>

    <EmptyState
      v-if="!categories.length"
      title="暂无分类"
      description="先新增一个菜品分类"
    />
    <view v-else class="category-list">
      <view v-for="category in categories" :key="category.id" class="category-item">
        <view class="category-info">
          <view class="category-header">
          <view class="category-name">{{ category.name }}</view>
            <view class="category-status" :class="{ off: category.status !== 1 }">
              {{ category.status === 1 ? '启用' : '禁用' }}
            </view>
          </view>
          <text class="category-sort">排序: {{ category.sort }}</text>
        </view>
        <view class="category-actions">
          <button class="action-btn btn-edit" @click="startEdit(category)">编辑</button>
          <button class="action-btn btn-delete" @click="onDelete(category.id)">删除</button>
        </view>
      </view>
    </view>

    <view v-if="showDialog" class="dialog-mask" @click="hideDialog">
      <view class="dialog-container" @click.stop>
        <view class="dialog-title">{{ editingId ? '编辑分类' : '添加分类' }}</view>
        <view class="dialog-content">
          <view class="dialog-item">
            <text class="dialog-label">分类名称 *</text>
            <input class="dialog-input" :value="form.name" placeholder="请输入分类名称" @input="onNameInput" />
          </view>
          <view class="dialog-item">
            <text class="dialog-label">排序 (数字越小越靠前)</text>
            <input class="dialog-input" type="number" :value="String(form.sort)" placeholder="默认为0" @input="onSortInput" />
          </view>
          <view class="dialog-item dialog-switch">
            <text class="dialog-label">启用状态</text>
            <switch :checked="form.status === 1" color="#bc0bf6" @change="onStatusChange" />
          </view>
        </view>
        <view class="dialog-actions">
          <button class="dialog-btn btn-cancel" @click="hideDialog">取消</button>
          <button class="dialog-btn btn-confirm" @click="onSubmit">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped lang="scss">
.category-page {
  min-height: 100vh;
  padding: 20rpx;
  background:
    radial-gradient(circle at 16% 0%, rgba(188, 11, 246, 0.1), transparent 38%),
    linear-gradient(180deg, #fbf8ff 0%, #f5f5f5 48%);
}

.header {
  margin-bottom: 20rpx;
}

.btn-add {
  width: 100%;
  height: 86rpx;
  margin: 0;
  border: none;
  border-radius: 999rpx;
  background: linear-gradient(135deg, #AC27ED 0%, #C95BFF 100%);
  color: #ffffff;
  line-height: 86rpx;
  font-size: 30rpx;
  font-weight: 700;
  box-shadow: 0 12rpx 28rpx rgba(188, 11, 246, 0.24);
}

.btn-add::after {
  border: none;
}

.category-list {
  display: flex;
  flex-direction: column;
}

.category-item {
  margin-bottom: 20rpx;
  padding: 30rpx;
  border: 2rpx solid rgba(188, 11, 246, 0.08);
  border-radius: 24rpx;
  background: #ffffff;
  box-shadow: 0 14rpx 32rpx rgba(54, 20, 82, 0.08);
}

.category-info {
  margin-bottom: 20rpx;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.category-name {
  color: #333333;
  font-size: 32rpx;
  font-weight: 700;
}

.category-status {
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  background: #f6ffed;
  color: #52c41a;
  font-size: 24rpx;
}

.category-status.off {
  background: #fff1f0;
  color: #f5222d;
}

.category-sort {
  color: #999999;
  font-size: 26rpx;
}

.category-actions {
  display: flex;
  gap: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #f0f0f0;
}

.action-btn {
  flex: 1;
  height: 76rpx;
  margin: 0;
  border: none;
  border-radius: 999rpx;
  line-height: 76rpx;
  font-size: 28rpx;
  font-weight: 700;
}

.action-btn::after,
.dialog-btn::after {
  border: none;
}

.btn-edit {
  background: linear-gradient(135deg, #eefaff, #ffffff);
  color: #1890ff;
}

.btn-delete {
  background: linear-gradient(135deg, #fff1f4, #ffffff);
  color: #f5222d;
}

.dialog-mask {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.dialog-container {
  width: 600rpx;
  overflow: hidden;
  border: 2rpx solid rgba(188, 11, 246, 0.12);
  border-radius: 28rpx;
  background: #ffffff;
  box-shadow: 0 24rpx 70rpx rgba(26, 9, 42, 0.18);
}

.dialog-title {
  padding: 40rpx 30rpx 20rpx;
  text-align: center;
  color: #333333;
  font-size: 32rpx;
  font-weight: 700;
}

.dialog-content {
  padding: 20rpx 30rpx;
}

.dialog-item {
  margin-bottom: 30rpx;
}

.dialog-item.dialog-switch {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dialog-label {
  display: block;
  margin-bottom: 16rpx;
  color: #666666;
  font-size: 28rpx;
}

.dialog-switch .dialog-label {
  margin-bottom: 0;
}

.dialog-input {
  width: 100%;
  height: 78rpx;
  padding: 0 20rpx;
  border: 1rpx solid rgba(188, 11, 246, 0.1);
  border-radius: 18rpx;
  background: #fbf8ff;
  font-size: 28rpx;
}

.dialog-actions {
  display: flex;
  border-top: 1rpx solid #f0f0f0;
}

.dialog-btn {
  flex: 1;
  height: 90rpx;
  margin: 0;
  border: none;
  border-radius: 0;
  background: #ffffff;
  line-height: 90rpx;
  font-size: 30rpx;
}

.btn-cancel {
  border-right: 1rpx solid #f0f0f0;
  color: #666666;
}

.btn-confirm {
  color: #bc0bf6;
  font-weight: 700;
}
</style>
