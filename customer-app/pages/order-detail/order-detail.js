// pages/order-detail/order-detail.js
const api = require('../../utils/api')
const util = require('../../utils/util')

Page({
  data: {
    order: null,
    loading: true
  },

  onLoad(options) {
    const { id, pay } = options
    if (id) {
      this.loadOrderDetail(id, pay === 'true')
    } else {
      util.showToast('参数错误')
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    }
  },

  // 加载订单详情
  async loadOrderDetail(orderId, autoPay = false) {
    this.setData({ loading: true })
    try {
      const order = await api.getOrderDetail(orderId)
      this.setData({ 
        order,
        loading: false 
      })

      // 如果需要自动唤起支付
      if (autoPay && order.status === 1) {
        this.onPay()
      }
    } catch (err) {
      console.error('加载订单详情失败', err)
      util.showToast('加载详情失败')
      this.setData({ loading: false })
    }
  },

  // 支付订单
  onPay() {
    if (!this.data.order) return

    wx.showModal({
      title: '确认支付',
      content: `确认支付 ¥${this.data.order.totalAmount} 吗？`,
      confirmText: '确认支付',
      confirmColor: '#bc0bf6',
      success: async (res) => {
        if (res.confirm) {
          this.doPay()
        }
      }
    })
  },

  // 执行支付
  async doPay() {
    try {
      util.showLoading('支付中...')
      await api.payOrder(this.data.order._id)
      util.hideLoading()
      
      wx.showToast({
        title: '支付成功',
        icon: 'success'
      })
      
      // 刷新订单详情
      this.loadOrderDetail(this.data.order._id)
    } catch (err) {
      util.hideLoading()
      console.error('支付失败', err)
      util.showToast('支付失败：' + err.message)
    }
  },

  // 取消订单
  async onCancel() {
    if (!this.data.order) return
    
    const confirm = await util.showModal('确定要取消订单吗？')
    if (!confirm) return
    
    try {
      util.showLoading('取消中...')
      await api.cancelOrder(this.data.order._id)
      util.hideLoading()
      
      wx.showToast({
        title: '已取消',
        icon: 'success'
      })
      
      // 刷新订单详情
      this.loadOrderDetail(this.data.order._id)
    } catch (err) {
      util.hideLoading()
      console.error('取消订单失败', err)
      util.showToast('取消失败：' + err.message)
    }
  },

  // 联系商家
  onContact() {
    wx.makePhoneCall({
      phoneNumber: '10086' // 这里可以换成实际商家电话
    })
  },

  // 获取状态文本
  getStatusText(status) {
    return util.getOrderStatusText(status)
  },

  // 获取状态样式类
  getStatusClass(status) {
    return util.getOrderStatusColor(status)
  }
})
