// pages/category-manage/category-manage.js
const api = require('../../../utils/merchant-api')
const util = require('../../../utils/util')

Page({
  data: {
    categories: [],
    showAddDialog: false,
    editingCategory: null,
    formData: {
      name: '',
      sort: '',
      status: 1
    }
  },

  onLoad() {
    if (!util.checkMerchantLogin()) return
    this.loadCategories()
  },

  onShow() {
    if (util.checkMerchantLogin()) {
      this.loadCategories()
    }
  },

  // 加载分类列表
  async loadCategories() {
    try {
      const categories = await api.getCategories()
      this.setData({ categories })
    } catch (err) {
      console.error('加载分类失败', err)
      util.showToast('加载失败')
    }
  },

  // 显示添加对话框
  onShowAdd() {
    this.setData({
      showAddDialog: true,
      editingCategory: null,
      formData: {
        name: '',
        sort: '',
        status: 1
      }
    })
  },

  // 显示编辑对话框
  onShowEdit(e) {
    const category = e.currentTarget.dataset.item
    this.setData({
      showAddDialog: true,
      editingCategory: category,
      formData: {
        name: category.name,
        sort: category.sort.toString(),
        status: category.status
      }
    })
  },

  // 隐藏对话框
  onHideDialog() {
    this.setData({ showAddDialog: false })
  },

  // 输入变化
  onInputChange(e) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [`formData.${field}`]: e.detail.value
    })
  },

  // 状态切换
  onStatusChange(e) {
    this.setData({
      'formData.status': e.detail.value ? 1 : 0
    })
  },

  // 保存分类
  async onSave() {
    const { name, sort, status } = this.data.formData
    
    if (!name.trim()) {
      util.showToast('请输入分类名称')
      return
    }

    const categoryData = {
      name: name.trim(),
      sort: parseInt(sort) || 0,
      status
    }

    try {
      util.showLoading('保存中...')
      
      if (this.data.editingCategory) {
        // 编辑分类
        await api.updateCategory(this.data.editingCategory._id, categoryData)
      } else {
        // 添加分类
        await api.addCategory(categoryData)
      }
      
      util.hideLoading()
      util.showToast('保存成功', 'success')
      this.onHideDialog()
      this.loadCategories()
    } catch (err) {
      util.hideLoading()
      console.error('保存失败', err)
      util.showToast('保存失败')
    }
  },

  // 删除分类
  async onDelete(e) {
    const category = e.currentTarget.dataset.item
    
    const confirm = await util.showModal(`确定要删除"${category.name}"分类吗？`)
    if (!confirm) return

    try {
      util.showLoading('删除中...')
      await api.deleteCategory(category._id)
      util.hideLoading()
      util.showToast('删除成功', 'success')
      this.loadCategories()
    } catch (err) {
      util.hideLoading()
      console.error('删除失败', err)
      util.showToast('删除失败')
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadCategories().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})
