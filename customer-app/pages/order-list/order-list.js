// pages/order-list/order-list.js
const api = require('../../utils/api')
const util = require('../../utils/util')

const app = getApp()

Page({
  data: {
    tabs: [
      { status: null, name: '全部' },
      { status: 1, name: '待支付' },
      { status: 2, name: '待配送' },
      { status: 3, name: '配送中' },
      { status: 4, name: '已完成' }
    ],
    currentTab: null,
    orders: [],
    loading: false
  },

  onLoad(options) {
    const status = options.status ? parseInt(options.status) : null
    this.setData({ currentTab: status })
    this.loadOrders()
  },

  onShow() {
    // 检查是否有全局参数传递（来自 switchTab）
    if (app.globalData.orderListStatus !== undefined) {
      let status = app.globalData.orderListStatus
      if (status !== null) {
        status = parseInt(status)
      }
      delete app.globalData.orderListStatus // 消费后清除
      this.setData({ currentTab: status })
    }
    this.loadOrders()
  },

  // 加载订单
  async loadOrders() {
    this.setData({ loading: true })
    try {
      const orders = await api.getOrders(this.data.currentTab)
      this.setData({ 
        orders,
        loading: false 
      })
    } catch (err) {
      console.error('加载订单失败', err)
      util.showToast('加载订单失败')
      this.setData({ loading: false })
    }
  },

  // 切换标签
  onTabChange(e) {
    const status = e.currentTarget.dataset.status
    this.setData({ currentTab: status })
    this.loadOrders()
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadOrders().then(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 加载更多
  onLoadMore() {
    // 分页加载逻辑
  },

  // 查看订单详情
  onOrderDetail(e) {
    const orderId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?id=${orderId}`
    })
  },

  // 支付订单
  async onPay(e) {
    const orderId = e.currentTarget.dataset.id
    
    try {
      util.showLoading('支付中...')
      await api.payOrder(orderId)
      util.hideLoading()
      
      wx.showToast({
        title: '支付成功',
        icon: 'success'
      })
      
      this.loadOrders()
    } catch (err) {
      util.hideLoading()
      console.error('支付失败', err)
      util.showToast('支付失败：' + err.message)
    }
  },

  // 取消订单
  async onCancel(e) {
    const orderId = e.currentTarget.dataset.id
    
    const confirm = await util.showModal('确定要取消订单吗？')
    if (!confirm) return
    
    try {
      util.showLoading('取消中...')
      await api.cancelOrder(orderId)
      util.hideLoading()
      
      wx.showToast({
        title: '已取消订单',
        icon: 'success'
      })
      
      this.loadOrders()
    } catch (err) {
      util.hideLoading()
      console.error('取消订单失败', err)
      util.showToast('取消失败：' + err.message)
    }
  },

  // 去点餐
  onGoShopping() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  // 获取状态文本
  getStatusText(status) {
    return util.getOrderStatusText(status)
  },

  // 获取状态样式类
  getStatusClass(status) {
    return util.getOrderStatusColor(status)
  },

  // 阻止事件冒泡
  stopPropagation() {}
})
