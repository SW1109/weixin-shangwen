// pages/cart/cart.js
const util = require('../../utils/util')
const app = getApp()

Page({
  data: {
    cart: [],
    totalPrice: 0
  },

  onLoad() {
    this.loadCart()
  },

  onShow() {
    this.loadCart()
  },

  // 加载购物车
  loadCart() {
    const cart = app.getCart()
    const totalPrice = cart.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2)
    
    this.setData({ 
      cart,
      totalPrice 
    })
  },

  // 增加数量
  onAdd(e) {
    const dishId = e.currentTarget.dataset.id
    const item = this.data.cart.find(item => item._id === dishId)
    
    if (item) {
      app.addToCart(item)
      this.loadCart()
    }
  },

  // 减少数量
  onRemove(e) {
    const dishId = e.currentTarget.dataset.id
    app.removeFromCart(dishId)
    this.loadCart()
  },

  // 清空购物车
  async onClear() {
    const confirm = await util.showModal('确定要清空购物车吗？')
    if (confirm) {
      app.clearCart()
      this.loadCart()
      util.showToast('已清空购物车', 'success')
    }
  },

  // 去结算
  onCheckout() {
    if (!util.checkLogin()) {
      return
    }

    if (this.data.cart.length === 0) {
      util.showToast('购物车是空的')
      return
    }

    wx.navigateTo({
      url: '/pages/order-confirm/order-confirm'
    })
  },

  // 返回
  onGoBack() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
