// app.js
App({
  onLaunch() {
    // 初始化云开发
    if (!wx.cloud) {
      console.error('请使用 2.2.3 或以上的基础库以使用云能力')
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        env: 'cloudbase-7g0vy2k7d6097d5b', // 请替换为您的云环境 ID
        traceUser: true,
      })
    }

    // 检查登录状态
    this.checkLoginStatus()
  },

  globalData: {
    userInfo: null,
    merchantInfo: null,
    cart: [], // 购物车数据
    selectedAddress: null, // 选中的地址
    orderWatcher: null // 商家订单监听器
  },

  // 检查登录状态
  checkLoginStatus() {
    const userInfo = wx.getStorageSync('userInfo')
    if (userInfo) {
      this.globalData.userInfo = userInfo
    }
    const merchantInfo = wx.getStorageSync('merchantInfo')
    if (merchantInfo) {
      this.globalData.merchantInfo = merchantInfo
    }
  },

  // 设置用户信息
  setUserInfo(userInfo) {
    this.globalData.userInfo = userInfo
    wx.setStorageSync('userInfo', userInfo)
  },

  // 设置商家信息
  setMerchantInfo(merchantInfo) {
    this.globalData.merchantInfo = merchantInfo
    wx.setStorageSync('merchantInfo', merchantInfo)
  },

  // 退出登录
  logout() {
    this.globalData.userInfo = null
    wx.removeStorageSync('userInfo')
  },

  // 商家退出登录
  merchantLogout() {
    this.globalData.merchantInfo = null
    wx.removeStorageSync('merchantInfo')
    
    // 停止订单监听
    if (this.globalData.orderWatcher) {
      this.globalData.orderWatcher.close()
      this.globalData.orderWatcher = null
    }
    
    wx.reLaunch({
      url: '/pages/merchant/login/login'
    })
  },

  // 检查是否商家登录
  isMerchantLogin() {
    return !!this.globalData.merchantInfo
  },

  // 检查是否用户登录
  isLogin() {
    return !!this.globalData.userInfo
  },

  // 获取购物车数据
  getCart() {
    const cart = wx.getStorageSync('cart') || []
    this.globalData.cart = cart
    return cart
  },

  // 保存购物车数据
  saveCart(cart) {
    this.globalData.cart = cart
    wx.setStorageSync('cart', cart)
  },

  // 添加到购物车
  addToCart(dish) {
    const cart = this.getCart()
    const index = cart.findIndex(item => item._id === dish._id)
    
    if (index > -1) {
      cart[index].quantity += 1
    } else {
      cart.push({
        ...dish,
        quantity: 1
      })
    }
    
    this.saveCart(cart)
    return cart
  },

  // 从购物车移除
  removeFromCart(dishId) {
    const cart = this.getCart()
    const index = cart.findIndex(item => item._id === dishId)
    
    if (index > -1) {
      if (cart[index].quantity > 1) {
        cart[index].quantity -= 1
      } else {
        cart.splice(index, 1)
      }
    }
    
    this.saveCart(cart)
    return cart
  },

  // 清空购物车
  clearCart() {
    this.globalData.cart = []
    wx.setStorageSync('cart', [])
  },

  // 获取购物车总数
  getCartCount() {
    const cart = this.getCart()
    return cart.reduce((total, item) => total + item.quantity, 0)
  },

  // 获取购物车总价
  getCartTotal() {
    const cart = this.getCart()
    return cart.reduce((total, item) => total + item.price * item.quantity, 0)
  }
})
