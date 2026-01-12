// pages/order-list/order-list.js
const api = require('../../../utils/merchant-api')
const util = require('../../../utils/util')
const app = getApp()

Page({
  data: {
    tabs: [
      { label: '全部', value: null },
      { label: '待支付', value: 1 },
      { label: '待配送', value: 2 },
      { label: '配送中', value: 3 },
      { label: '已完成', value: 4 }
    ],
    activeTab: null,
    orders: [],
    loading: false,
    orderWatcher: null
  },

  onLoad(options) {
    if (!util.checkLogin()) return

    // 从参数获取状态
    const status = options.status ? parseInt(options.status) : null
    this.setData({ activeTab: status })

    this.loadOrders()
    this.startWatch()
  },

  onUnload() {
    this.stopWatch()
  },

  // 切换标签
  onTabChange(e) {
    const status = e.currentTarget.dataset.value
    this.setData({ activeTab: status })
    this.loadOrders()
  },

  // 加载订单列表
  async loadOrders() {
    this.setData({ loading: true })

    try {
      const orders = await api.getOrders(this.data.activeTab)

      // 格式化时间
      orders.forEach(order => {
        order.createTime = util.formatTime(new Date(order.createTime))
      })

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

  // 开始监听新订单
  startWatch() {
    if (this.data.orderWatcher) return

    const watcher = api.watchOrders((snapshot) => {
      // 有新订单或状态变化
      console.log('订单变化', snapshot.docChanges)

      // 播放提示音
      if (snapshot.docChanges.length > 0) {
        wx.showToast({
          title: '订单有更新',
          icon: 'none'
        })
        // 刷新列表
        this.loadOrders()
      }
    })

    this.setData({ orderWatcher: watcher })
  },

  // 停止监听
  stopWatch() {
    if (this.data.orderWatcher) {
      this.data.orderWatcher.close()
      this.setData({ orderWatcher: null })
    }
  },

  // 查看订单详情
  onOrderDetail(e) {
    const orderId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/merchant/order-detail/order-detail?id=${orderId}`
    })
  },

  // 快捷操作：接单
  async onAcceptOrder(e) {
    const orderId = e.currentTarget.dataset.id

    try {
      util.showLoading('处理中...')
      await api.updateOrderStatus(orderId, 2)
      util.hideLoading()
      util.showToast('接单成功', 'success')
      this.loadOrders()
    } catch (err) {
      util.hideLoading()
      console.error('接单失败', err)
      util.showToast('操作失败')
    }
  },

  // 快捷操作：配送
  async onStartDelivery(e) {
    const orderId = e.currentTarget.dataset.id

    try {
      util.showLoading('处理中...')
      await api.updateOrderStatus(orderId, 3)
      util.hideLoading()
      util.showToast('已开始配送', 'success')
      this.loadOrders()
    } catch (err) {
      util.hideLoading()
      console.error('操作失败', err)
      util.showToast('操作失败')
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadOrders().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})
