// pages/home/home.js
const api = require('../../../utils/merchant-api')
const util = require('../../../utils/util')
const app = getApp()

Page({
  data: {
    todayStats: {
      salesAmount: 0,
      orderCount: 0,
      dishCount: 0
    },
    orderStats: {
      unpaid: 0,
      toDeliver: 0,
      delivering: 0
    },
    topDishes: [],
    recentOrders: [],
    loading: false
  },

  onLoad() {
    if (!app.isMerchantLogin()) {
      wx.redirectTo({
        url: '/pages/merchant/login/login'
      })
      return
    }
    this.loadData()
  },

  onShow() {
    if (app.isMerchantLogin()) {
      this.loadData()
    }
  },

  // 加载所有数据
  async loadData() {
    this.setData({ loading: true })
    
    try {
      await Promise.all([
        this.loadTodayStats(),
        this.loadOrderStats(),
        this.loadRecentOrders()
      ])
    } catch (err) {
      console.error('加载数据失败', err)
      util.showToast('加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  // 加载今日统计
  async loadTodayStats() {
    try {
      const now = new Date()
      // 获取今天的开始时间（00:00:00）和结束时间（23:59:59）
      const startDate = new Date(now.setHours(0, 0, 0, 0)).toISOString()
      const endDate = new Date(now.setHours(23, 59, 59, 999)).toISOString()
      
      const stats = await api.getStatistics(startDate, endDate)
      
      this.setData({
        todayStats: {
          salesAmount: stats.totalSales || 0,
          orderCount: stats.totalOrders || 0,
          dishCount: stats.paidOrders || 0 // 使用已支付订单数作为参考，或者根据需求调整
        },
        topDishes: stats.topDishes || []
      })
    } catch (err) {
      console.error('加载今日统计失败', err)
    }
  },

  // 加载订单统计
  async loadOrderStats() {
    try {
      const orders = await api.getOrders()
      const stats = {
        unpaid: orders.filter(o => o.status === 1).length,
        toDeliver: orders.filter(o => o.status === 2).length,
        delivering: orders.filter(o => o.status === 3).length
      }
      this.setData({ orderStats: stats })
    } catch (err) {
      console.error('加载订单统计失败', err)
    }
  },

  // 加载最近订单
  async loadRecentOrders() {
    try {
      const orders = await api.getOrders()
      this.setData({ 
        recentOrders: orders.slice(0, 5) 
      })
    } catch (err) {
      console.error('加载最近订单失败', err)
    }
  },

  // 查看订单
  onViewOrders(e) {
    const status = e.currentTarget.dataset.status
    wx.navigateTo({
      url: `/pages/merchant/order-list/order-list?status=${status || ''}`
    })
  },

  // 查看订单详情
  onOrderDetail(e) {
    const orderId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/merchant/order-detail/order-detail?id=${orderId}`
    })
  },

  // 查看菜品管理
  onManageDishes() {
    wx.navigateTo({
      url: '/pages/merchant/dish-list/dish-list'
    })
  },

  // 查看数据统计
  onStatistics() {
    wx.navigateTo({
      url: '/pages/merchant/statistics/statistics'
    })
  },

  // 查看分类管理
  onManageCategory() {
    wx.navigateTo({
      url: '/pages/merchant/category-manage/category-manage'
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadData().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})
