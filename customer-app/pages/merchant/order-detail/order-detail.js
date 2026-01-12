// pages/order-detail/order-detail.js
const api = require('../../../utils/merchant-api')
const util = require('../../../utils/util')

Page({
  data: {
    orderId: '',
    order: null,
    loading: false,
    orderWatcher: null
  },

  onLoad(options) {
    if (!util.checkMerchantLogin()) return

    this.setData({ orderId: options.id })
    this.loadOrderDetail()
    this.startWatch()
  },

  onUnload() {
    this.stopWatch()
  },

  // 加载订单详情
  async loadOrderDetail() {
    this.setData({ loading: true })
    
    try {
      const order = await api.getOrderDetail(this.data.orderId)
      
      // 格式化时间
      order.createTime = util.formatTime(new Date(order.createTime))
      if (order.payTime) {
        order.payTime = util.formatTime(new Date(order.payTime))
      }
      if (order.completeTime) {
        order.completeTime = util.formatTime(new Date(order.completeTime))
      }
      
      this.setData({ 
        order,
        loading: false 
      })
    } catch (err) {
      console.error('加载订单详情失败', err)
      util.showToast('加载失败')
      this.setData({ loading: false })
    }
  },

  // 监听订单状态变化
  startWatch() {
    if (this.data.orderWatcher) return

    const db = wx.cloud.database()
    const watcher = db.collection('orders')
      .doc(this.data.orderId)
      .watch({
        onChange: (snapshot) => {
          console.log('订单状态变化', snapshot)
          if (snapshot.docs.length > 0) {
            this.loadOrderDetail()
          }
        },
        onError: (err) => {
          console.error('监听失败', err)
        }
      })

    this.setData({ orderWatcher: watcher })
  },

  stopWatch() {
    if (this.data.orderWatcher) {
      this.data.orderWatcher.close()
      this.setData({ orderWatcher: null })
    }
  },

  // 更新订单状态
  async updateStatus(newStatus) {
    const statusText = {
      2: '接单',
      3: '开始配送',
      4: '完成订单'
    }
    
    const confirm = await util.showModal(`确定${statusText[newStatus]}吗？`)
    if (!confirm) return

    try {
      util.showLoading('处理中...')
      await api.updateOrderStatus(this.data.orderId, newStatus)
      util.hideLoading()
      util.showToast('操作成功', 'success')
      this.loadOrderDetail()
    } catch (err) {
      util.hideLoading()
      console.error('更新状态失败', err)
      util.showToast('操作失败')
    }
  },

  // 接单
  onAccept() {
    this.updateStatus(2)
  },

  // 开始配送
  onStartDelivery() {
    this.updateStatus(3)
  },

  // 完成订单
  onComplete() {
    this.updateStatus(4)
  },

  // 拨打电话
  onCallPhone() {
    wx.makePhoneCall({
      phoneNumber: this.data.order.userInfo.phoneNumber
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadOrderDetail().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})
