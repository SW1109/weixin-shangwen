// pages/order-confirm/order-confirm.js
const api = require('../../utils/api')
const util = require('../../utils/util')
const app = getApp()

Page({
  data: {
    cart: [],
    totalPrice: 0,
    address: null,
    remark: '',
    submitting: false
  },

  onLoad(options) {
    this.loadCart()
    this.loadDefaultAddress()
  },

  onShow() {
    // 从地址选择页返回时重新加载地址
    this.loadDefaultAddress()
  },

  // 加载购物车
  loadCart() {
    const cart = app.getCart()
    const totalPrice = cart.reduce((total, item) => {
      return total + (item.price * item.quantity)
    }, 0).toFixed(2)
    
    this.setData({ 
      cart,
      totalPrice 
    })

    if (cart.length === 0) {
      wx.showModal({
        title: '提示',
        content: '购物车是空的，请先添加菜品',
        showCancel: false,
        success: () => {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }
      })
    }
  },

  // 加载默认地址
  async loadDefaultAddress() {
    try {
      const address = await api.getDefaultAddress()
      this.setData({ address })
    } catch (err) {
      console.error('加载地址失败', err)
    }
  },

  // 选择地址
  onSelectAddress() {
    wx.navigateTo({
      url: '/pages/address-list/address-list?from=order'
    })
  },

  // 输入备注
  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    })
  },

  // 提交订单
  async onSubmit() {
    if (this.data.submitting) return

    // 检查购物车
    if (this.data.cart.length === 0) {
      util.showToast('购物车是空的')
      return
    }

    // 检查地址
    if (!this.data.address) {
      wx.showModal({
        title: '提示',
        content: '请先添加收货地址',
        confirmText: '去添加',
        success: (res) => {
          if (res.confirm) {
            wx.navigateTo({
              url: '/pages/address-edit/address-edit'
            })
          }
        }
      })
      return
    }

    this.setData({ submitting: true })
    wx.showLoading({ title: '提交中...' })

    try {
      // 准备订单数据
      const orderData = {
        dishes: this.data.cart.map(item => ({
          dishId: item._id,
          name: item.name,
          image: item.image,
          price: item.price,
          quantity: item.quantity
        })),
        totalAmount: parseFloat(this.data.totalPrice),
        address: {
          name: this.data.address.name,
          phone: this.data.address.phone,
          province: this.data.address.province,
          city: this.data.address.city,
          district: this.data.address.district,
          detail: this.data.address.detail,
          fullAddress: `${this.data.address.province}${this.data.address.city}${this.data.address.district}${this.data.address.detail}`
        },
        remark: this.data.remark
      }

      console.log('提交订单数据:', orderData)

      // 调用云函数创建订单
      const result = await api.createOrder(orderData)
      
      wx.hideLoading()

      console.log('订单创建结果:', result)

      // 清空购物车
      app.clearCart()

      // 提示成功
      wx.showToast({
        title: '下单成功',
        icon: 'success',
        duration: 2000
      })

      // 跳转到订单详情页并唤起支付
      setTimeout(() => {
        wx.redirectTo({
          url: `/pages/order-detail/order-detail?id=${result.orderId}&pay=true`
        })
      }, 1500)

    } catch (err) {
      wx.hideLoading()
      console.error('提交订单失败', err)
      wx.showModal({
        title: '下单失败',
        content: err.message || '提交订单失败，请重试',
        showCancel: false
      })
    } finally {
      this.setData({ submitting: false })
    }
  },

  // 返回购物车
  onGoBack() {
    wx.navigateBack()
  }
})
