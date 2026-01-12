// pages/user/user.js
const api = require('../../utils/api')
const util = require('../../utils/util')
const app = getApp()

Page({
  data: {
    userInfo: null,
    orderStats: {
      unpaid: 0,
      toDeliver: 0,
      delivering: 0
    }
  },

  onLoad() {
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
    this.loadOrderStats()
  },

  // 加载用户信息
  loadUserInfo() {
    const userInfo = app.globalData.userInfo
    this.setData({ userInfo })
  },

  // 加载订单统计
  async loadOrderStats() {
    if (!app.globalData.userInfo) return

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

  // 编辑个人信息
  onEditUser() {
    wx.navigateTo({
      url: '/pages/user-edit/user-edit'
    })
  },

  // 登录
  onLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  },

  // 查看订单列表
  onOrderList(e) {
    // 检查登录状态
    if (!util.checkLogin()) return
    
    // 获取状态并转换为数字（如果是字符串的话）
    let status = e.currentTarget.dataset.status
    if (status !== undefined && status !== null) {
      status = parseInt(status)
    }
    
    // 在跳转前设置全局参数
    app.globalData.orderListStatus = status
    
    // 使用 switchTab 跳转到 TabBar 页面
    wx.switchTab({
      url: '/pages/order-list/order-list'
    })
  },

  // 收货地址
  onAddressList() {
    if (!util.checkLogin()) return
    wx.navigateTo({
      url: '/pages/address-list/address-list'
    })
  },

  // 联系客服
  onContact() {
    wx.showModal({
      title: '联系客服',
      content: '请拨打客服电话：10086',
      confirmText: '拨打',
      success: (res) => {
        if (res.confirm) {
          wx.makePhoneCall({
            phoneNumber: '10086'
          })
        }
      }
    })
  },

  // 关于我们
  onAbout() {
    wx.showModal({
      title: '关于我们',
      content: '美食点餐小程序\n版本：1.0.0\n\n提供便捷的在线点餐服务',
      showCancel: false
    })
  },

  // 商家管理入口
  onMerchantEntrance() {
    if (app.isMerchantLogin()) {
      wx.navigateTo({
        url: '/pages/merchant/home/home'
      })
    } else {
      wx.navigateTo({
        url: '/pages/merchant/login/login'
      })
    }
  },

  // 退出登录
  async onLogout() {
    const confirm = await util.showModal('确定要退出登录吗？')
    if (!confirm) return

    app.logout()
    this.setData({ 
      userInfo: null,
      orderStats: {
        unpaid: 0,
        toDeliver: 0,
        delivering: 0
      }
    })
    
    wx.showToast({
      title: '已退出登录',
      icon: 'success'
    })
  }
})
