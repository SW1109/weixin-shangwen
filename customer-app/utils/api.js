/**
 * API 封装
 */

const db = wx.cloud.database()
const _ = db.command

/**
 * 调用云函数
 */
const callFunction = (name, data = {}) => {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name,
      data,
      success: res => {
        if (res.result.code === 0) {
          resolve(res.result.data)
        } else {
          reject(new Error(res.result.message || '请求失败'))
        }
      },
      fail: err => {
        reject(err)
      }
    })
  })
}

/**
 * 用户登录
 */
const login = (userInfo) => {
  return callFunction('login', userInfo)
}

/**
 * 获取菜品分类
 */
const getCategories = () => {
  return db.collection('categories')
    .where({
      status: 1
    })
    .orderBy('sort', 'asc')
    .get()
    .then(res => res.data)
}

/**
 * 获取菜品列表
 */
const getDishes = (categoryId = null, keyword = null) => {
  let query = db.collection('dishes').where({
    status: 1
  })

  if (categoryId) {
    query = query.where({
      categoryId
    })
  }

  if (keyword) {
    query = query.where({
      name: db.RegExp({
        regexp: keyword,
        options: 'i'
      })
    })
  }

  return query
    .orderBy('sort', 'asc')
    .orderBy('sales', 'desc')
    .get()
    .then(res => res.data)
}

/**
 * 获取菜品详情
 */
const getDishDetail = (dishId) => {
  return db.collection('dishes')
    .where({
      _id: dishId
    })
    .get()
    .then(res => {
      if (res.data && res.data.length > 0) {
        return res.data[0]
      }
      throw new Error('菜品不存在')
    })
}

/**
 * 创建订单
 */
const createOrder = (orderData) => {
  return callFunction('createOrder', orderData)
}

/**
 * 支付订单
 */
const payOrder = (orderId) => {
  return callFunction('payOrder', { orderId })
}

/**
 * 获取订单列表
 */
const getOrders = (status = null) => {
  // 构建查询条件，必须包含 _openid 以确保只查询当前用户的订单
  let whereCondition = {
    _openid: '{openid}'  // 微信小程序会自动替换为当前用户的 openid
  }

  if (status !== null && status !== undefined) {
    whereCondition.status = status
  }

  return db.collection('orders')
    .where(whereCondition)
    .orderBy('createTime', 'desc')
    .get()
    .then(res => {
      console.log('订单列表查询结果:', res)
      return res.data
    })
    .catch(err => {
      console.error('获取订单列表失败:', err)
      throw err
    })
}

/**
 * 获取订单详情
 */
const getOrderDetail = (orderId) => {
  return callFunction('getOrderDetail', { orderId })
}

/**
 * 取消订单
 */
const cancelOrder = (orderId) => {
  // 使用云函数来更新订单状态，避免权限问题
  return callFunction('updateOrderStatus', { 
    orderId, 
    status: 5 
  })
}

/**
 * 监听订单状态变化
 */
const watchOrder = (orderId, onChange) => {
  return db.collection('orders')
    .where({
      _id: orderId
    })
    .watch({
      onChange: snapshot => {
        if (snapshot.docs.length > 0) {
          onChange(snapshot.docs[0])
        }
      },
      onError: err => {
        console.error('订单监听失败', err)
      }
    })
}

/**
 * 获取收货地址列表
 */
const getAddresses = () => {
  return db.collection('addresses')
    .where({
      _openid: '{openid}'
    })
    .orderBy('isDefault', 'desc')
    .orderBy('createTime', 'desc')
    .get()
    .then(res => res.data)
    .catch(err => {
      console.error('获取地址列表失败:', err)
      throw err
    })
}

/**
 * 获取默认地址
 */
const getDefaultAddress = () => {
  return db.collection('addresses')
    .where({
      _openid: '{openid}',
      isDefault: true
    })
    .get()
    .then(res => res.data.length > 0 ? res.data[0] : null)
    .catch(err => {
      console.error('获取默认地址失败:', err)
      throw err
    })
}

/**
 * 添加收货地址
 */
const addAddress = (addressData) => {
  return db.collection('addresses')
    .add({
      data: {
        ...addressData,
        createTime: new Date(),
        updateTime: new Date()
      }
    })
}

/**
 * 更新收货地址
 */
const updateAddress = (addressId, addressData) => {
  return db.collection('addresses')
    .where({
      _openid: '{openid}',
      _id: addressId
    })
    .update({
      data: {
        ...addressData,
        updateTime: new Date()
      }
    })
}

/**
 * 删除收货地址
 */
const deleteAddress = (addressId) => {
  return db.collection('addresses')
    .where({
      _openid: '{openid}',
      _id: addressId
    })
    .remove()
}

/**
 * 设置默认地址
 */
const setDefaultAddress = (addressId) => {
  return new Promise((resolve, reject) => {
    // 先取消所有默认地址
    db.collection('addresses')
      .where({
        _openid: '{openid}',
        isDefault: true
      })
      .update({
        data: {
          isDefault: false
        }
      })
      .then(() => {
        // 设置新的默认地址
        return db.collection('addresses')
          .where({
            _openid: '{openid}',
            _id: addressId
          })
          .update({
            data: {
              isDefault: true
            }
          })
      })
      .then(resolve)
      .catch(reject)
  })
}

/**
 * 获取购物车
 */
const getCart = () => {
  return db.collection('carts')
    .where({
      _openid: '{openid}'
    })
    .get()
    .then(res => {
      if (res.data.length > 0) {
        return res.data[0]
      }
      return { dishes: [] }
    })
}

/**
 * 保存购物车
 */
const saveCart = (dishes) => {
  return db.collection('carts')
    .where({
      _openid: '{openid}'
    })
    .get()
    .then(res => {
      if (res.data.length > 0) {
        // 更新
        return db.collection('carts')
          .where({
            _openid: '{openid}',
            _id: res.data[0]._id
          })
          .update({
            data: {
              dishes,
              updateTime: new Date()
            }
          })
      } else {
        // 添加
        return db.collection('carts')
          .add({
            data: {
              dishes,
              updateTime: new Date()
            }
          })
      }
    })
}

module.exports = {
  callFunction,
  login,
  getCategories,
  getDishes,
  getDishDetail,
  createOrder,
  payOrder,
  getOrders,
  getOrderDetail,
  cancelOrder,
  watchOrder,
  getAddresses,
  getDefaultAddress,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getCart,
  saveCart
}
