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
 * 商家登录
 */
const merchantLogin = (username, password) => {
  return callFunction('merchantLogin', { username, password })
}

/**
 * 获取订单列表
 */
const getOrders = (status = null) => {
  // 商家查看所有订单，使用云函数
  return callFunction('getMerchantOrders', { status, limit: 100 })
}

/**
 * 获取订单详情
 */
const getOrderDetail = (orderId) => {
  return callFunction('getOrderDetail', { 
    orderId,
    isAdmin: true // 标记为商家端调用
  })
}

/**
 * 更新订单状态
 */
const updateOrderStatus = (orderId, status) => {
  return callFunction('updateOrderStatus', { orderId, status })
}

/**
 * 监听新订单
 */
const watchOrders = (onChange) => {
  return db.collection('orders')
    .where({
      status: _.in([1, 2])
    })
    .watch({
      onChange: snapshot => {
        onChange(snapshot)
      },
      onError: err => {
        console.error('订单监听失败', err)
      }
    })
}

/**
 * 获取菜品列表
 */
const getDishes = (categoryId = null) => {
  let query = db.collection('dishes')

  if (categoryId) {
    query = query.where({ categoryId })
  }

  return query
    .orderBy('createTime', 'desc')
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
 * 添加/编辑菜品
 */
const manageDish = (action, dishData) => {
  return callFunction('manageDish', { action, dishData })
}

/**
 * 删除菜品
 */
const deleteDish = (dishId) => {
  return callFunction('manageDish', { 
    action: 'delete', 
    dishData: { _id: dishId } 
  })
}

/**
 * 获取分类列表
 */
const getCategories = () => {
  return db.collection('categories')
    .orderBy('sort', 'asc')
    .get()
    .then(res => res.data)
}

/**
 * 添加分类
 */
const addCategory = (categoryData) => {
  return db.collection('categories')
    .add({
      data: {
        ...categoryData,
        createTime: new Date(),
        updateTime: new Date()
      }
    })
}

/**
 * 更新分类
 */
const updateCategory = (categoryId, categoryData) => {
  return db.collection('categories')
    .doc(categoryId)
    .update({
      data: {
        ...categoryData,
        updateTime: new Date()
      }
    })
}

/**
 * 删除分类
 */
const deleteCategory = (categoryId) => {
  return db.collection('categories')
    .where({
      _id: categoryId
    })
    .remove()
}

/**
 * 获取统计数据
 */
const getStatistics = (startDate, endDate) => {
  return callFunction('getStatistics', { startDate, endDate })
}

module.exports = {
  callFunction,
  merchantLogin,
  getOrders,
  getOrderDetail,
  updateOrderStatus,
  watchOrders,
  getDishes,
  getDishDetail,
  manageDish,
  deleteDish,
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getStatistics
}
