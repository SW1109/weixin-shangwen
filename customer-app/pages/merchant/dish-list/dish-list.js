// pages/dish-list/dish-list.js
const api = require('../../../utils/merchant-api')
const util = require('../../../utils/util')

Page({
  data: {
    categories: [],
    selectedCategory: null,
    dishes: [],
    loading: false
  },

  onLoad() {
    if (!util.checkMerchantLogin()) return

    this.loadCategories()
    this.loadDishes()
  },

  onShow() {
    if (util.checkMerchantLogin()) {
      this.loadDishes()
    }
  },

  // 加载分类
  async loadCategories() {
    try {
      const categories = await api.getCategories()
      this.setData({ categories })
    } catch (err) {
      console.error('加载分类失败', err)
    }
  },

  // 加载菜品列表
  async loadDishes() {
    this.setData({ loading: true })

    try {
      const dishes = await api.getDishes(this.data.selectedCategory)
      this.setData({
        dishes,
        loading: false
      })
    } catch (err) {
      console.error('加载菜品失败', err)
      util.showToast('加载失败')
      this.setData({ loading: false })
    }
  },

  // 选择分类
  onSelectCategory(e) {
    const categoryId = e.currentTarget.dataset.id
    this.setData({ selectedCategory: categoryId })
    this.loadDishes()
  },

  // 添加菜品
  onAddDish() {
    wx.navigateTo({
      url: '/pages/merchant/dish-edit/dish-edit'
    })
  },

  // 编辑菜品
  onEditDish(e) {
    const dishId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/merchant/dish-edit/dish-edit?id=${dishId}`
    })
  },

  // 切换上下架状态
  async onToggleStatus(e) {
    const dishId = e.currentTarget.dataset.id
    const currentStatus = e.currentTarget.dataset.status
    const newStatus = currentStatus === 1 ? 0 : 1
    const statusText = newStatus === 1 ? '上架' : '下架'

    try {
      util.showLoading('处理中...')
      await api.manageDish('update', {
        _id: dishId,
        status: newStatus
      })
      util.hideLoading()
      util.showToast(`${statusText}成功`, 'success')
      this.loadDishes()
    } catch (err) {
      util.hideLoading()
      console.error('更新状态失败', err)
      util.showToast('操作失败')
    }
  },

  // 删除菜品
  async onDeleteDish(e) {
    const dishId = e.currentTarget.dataset.id
    const dishName = e.currentTarget.dataset.name

    const confirm = await util.showModal(`确定要删除"${dishName}"吗？`)
    if (!confirm) return

    try {
      util.showLoading('删除中...')
      await api.deleteDish(dishId)
      util.hideLoading()
      util.showToast('删除成功', 'success')
      this.loadDishes()
    } catch (err) {
      util.hideLoading()
      console.error('删除失败', err)
      util.showToast('删除失败')
    }
  },

  // 管理分类
  onManageCategory() {
    wx.navigateTo({
      url: '/pages/merchant/category-manage/category-manage'
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    Promise.all([
      this.loadCategories(),
      this.loadDishes()
    ]).then(() => {
      wx.stopPullDownRefresh()
    })
  }
})
