// 云函数：getMerchantOrders - 商家获取订单列表
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { status, limit = 100 } = event

  try {
    // 构建查询条件
    let query = db.collection('orders')

    if (status !== null && status !== undefined) {
      query = query.where({ status })
    }

    // 查询订单
    const res = await query
      .orderBy('createTime', 'desc')
      .limit(limit)
      .get()

    return {
      code: 0,
      message: '获取成功',
      data: res.data
    }
  } catch (err) {
    console.error('获取订单列表失败', err)
    return {
      code: -1,
      message: '获取订单列表失败：' + err.message
    }
  }
}
