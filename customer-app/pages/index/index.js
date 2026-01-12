// pages/index/index.js
const api = require('../../utils/api')
const util = require('../../utils/util')
const app = getApp()

Page({
  data: {
    categories: [],
    dishes: [],
    selectedCategory: null,
    keyword: '',
    loading: false,
    cartCount: 0,
    cartTotal: 0
  },

  onLoad() {
    this.loadCategories()
    this.loadDishes()
  },

  onShow() {
    this.updateCartInfo()
  },

  // 加载分类
  async loadCategories() {
    try {
      const categories = await api.getCategories()
      this.setData({ categories })
    } catch (err) {
      console.error('加载分类失败', err)
      util.showToast('加载分类失败')
    }
  },

  // 加载菜品
  async loadDishes() {
    this.setData({ loading: true })
    try {
      const dishes = await api.getDishes(this.data.selectedCategory, this.data.keyword)
      this.setData({ 
        dishes,
        loading: false 
      })
    } catch (err) {
      console.error('加载菜品失败', err)
      util.showToast('加载菜品失败')
      this.setData({ loading: false })
    }
  },

  // 选择分类
  onSelectCategory(e) {
    const categoryId = e.currentTarget.dataset.id
    this.setData({ 
      selectedCategory: categoryId,
      keyword: ''
    })
    this.loadDishes()
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ keyword: e.detail.value })
  },

  // 搜索
  onSearch() {
    this.setData({ selectedCategory: null })
    this.loadDishes()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadCategories()
    this.loadDishes().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 加载更多
  onLoadMore() {
    // 分页加载逻辑
  },

  // 查看菜品详情
  onDishDetail(e) {
    const dishId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/dish-detail/dish-detail?id=${dishId}`
    })
  },

  // 添加到购物车
  onAddToCart(e) {
    const dish = e.currentTarget.dataset.item
    
    // 检查库存
    if (dish.stock !== -1 && dish.stock <= 0) {
      util.showToast('该菜品已售罄')
      return
    }

    app.addToCart(dish)
    this.updateCartInfo()
    
    wx.showToast({
      title: '已加入购物车',
      icon: 'success'
    })
  },

  // 从购物车移除
  onRemoveFromCart(e) {
    const dishId = e.currentTarget.dataset.id
    app.removeFromCart(dishId)
    this.updateCartInfo()
  },

  // 更新购物车信息
  updateCartInfo() {
    const cart = app.getCart()
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0)
    const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)
    
    this.setData({ 
      cartCount, 
      cartTotal 
    })
  },

  // 获取购物车中某菜品的数量
  getCartQuantity(dishId) {
    const cart = app.getCart()
    const item = cart.find(item => item._id === dishId)
    return item ? item.quantity : 0
  },

  // 前往购物车
  onGoToCart() {
    if (this.data.cartCount === 0) {
      util.showToast('购物车是空的')
      return
    }
    wx.navigateTo({
      url: '/pages/cart/cart'
    })
  },

  // 阻止事件冒泡
  stopPropagation() {}
})
