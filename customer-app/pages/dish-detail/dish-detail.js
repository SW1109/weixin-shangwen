// pages/dish-detail/dish-detail.js
const app = getApp()
const db = wx.cloud.database()

Page({
  data: {
    dishId: '',
    dish: {},
    quantity: 1,
    cartCount: 0
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ dishId: options.id })
      this.loadDishDetail()
    }
    this.loadCartCount()
  },

  onShow() {
    this.loadCartCount()
  },

  // 加载菜品详情
  async loadDishDetail() {
    wx.showLoading({ title: '加载中...' })
    
    try {
      // 使用 where 查询代替 doc，这样可以避免权限问题
      const res = await db.collection('dishes')
        .where({
          _id: this.data.dishId
        })
        .get()
      
      console.log('菜品详情查询结果:', res)
      
      if (res.data && res.data.length > 0) {
        const dish = res.data[0]
        
        // 获取分类名称
        if (dish.categoryId) {
          try {
            const categoryRes = await db.collection('categories')
              .where({
                _id: dish.categoryId
              })
              .get()
            
            if (categoryRes.data && categoryRes.data.length > 0) {
              dish.categoryName = categoryRes.data[0].name || '未分类'
            } else {
              dish.categoryName = '未分类'
            }
          } catch (err) {
            console.error('获取分类失败', err)
            dish.categoryName = '未分类'
          }
        }
        
        console.log('最终菜品数据:', dish)
        this.setData({ dish })
      } else {
        wx.showToast({
          title: '菜品不存在',
          icon: 'none'
        })
        setTimeout(() => {
          wx.navigateBack()
        }, 1500)
      }
    } catch (err) {
      console.error('加载菜品详情失败', err)
      wx.showToast({
        title: '加载失败: ' + (err.message || '未知错误'),
        icon: 'none',
        duration: 3000
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 加载购物车数量
  async loadCartCount() {
    try {
      const cartRes = await db.collection('carts')
        .where({
          _openid: app.globalData.openid || '{openid}'
        })
        .get()
      
      const count = cartRes.data.reduce((sum, item) => sum + item.quantity, 0)
      this.setData({ cartCount: count })
    } catch (err) {
      console.error('加载购物车数量失败', err)
    }
  },

  // 减少数量
  decreaseQuantity() {
    if (this.data.quantity > 1) {
      this.setData({
        quantity: this.data.quantity - 1
      })
    }
  },

  // 增加数量
  increaseQuantity() {
    if (this.data.quantity < this.data.dish.stock) {
      this.setData({
        quantity: this.data.quantity + 1
      })
    } else {
      wx.showToast({
        title: '库存不足',
        icon: 'none'
      })
    }
  },

  // 加入购物车
  async addToCart() {
    if (!this.data.dish.stock || this.data.dish.stock <= 0) {
      wx.showToast({
        title: '商品已售罄',
        icon: 'none'
      })
      return
    }

    wx.showLoading({ title: '添加中...' })

    try {
      // 检查购物车中是否已有该商品
      const cartRes = await db.collection('carts')
        .where({
          _openid: app.globalData.openid || '{openid}',
          dishId: this.data.dishId
        })
        .get()

      if (cartRes.data.length > 0) {
        // 已存在，更新数量
        const cartItem = cartRes.data[0]
        const newQuantity = cartItem.quantity + this.data.quantity
        
        if (newQuantity > this.data.dish.stock) {
          wx.showToast({
            title: '超过库存数量',
            icon: 'none'
          })
          return
        }

        await db.collection('carts')
          .where({
            _id: cartItem._id
          })
          .update({
            data: {
              quantity: newQuantity,
              updateTime: db.serverDate()
            }
          })
      } else {
        // 不存在，新增
        await db.collection('carts').add({
          data: {
            dishId: this.data.dishId,
            dishName: this.data.dish.name,
            dishImage: this.data.dish.image,
            price: this.data.dish.price,
            quantity: this.data.quantity,
            selected: true,
            createTime: db.serverDate(),
            updateTime: db.serverDate()
          }
        })
      }

      wx.showToast({
        title: '添加成功',
        icon: 'success'
      })

      // 重置数量
      this.setData({ quantity: 1 })
      this.loadCartCount()

    } catch (err) {
      console.error('添加购物车失败', err)
      wx.showToast({
        title: '添加失败',
        icon: 'none'
      })
    } finally {
      wx.hideLoading()
    }
  },

  // 跳转到购物车
  goToCart() {
    wx.switchTab({
      url: '/pages/cart/cart'
    })
  }
})
