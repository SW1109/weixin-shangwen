// 云函数：payOrder - 订单支付（模拟）
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { orderId } = event

  try {
    // 查询订单
    const orderRes = await db.collection('orders')
      .doc(orderId)
      .get()

    if (!orderRes.data) {
      return {
        code: -1,
        message: '订单不存在'
      }
    }

    const order = orderRes.data

    // 验证订单归属
    if (order._openid !== wxContext.OPENID) {
      return {
        code: -1,
        message: '无权操作此订单'
      }
    }

    // 验证订单状态
    if (order.status !== 1) {
      return {
        code: -1,
        message: '订单状态异常'
      }
    }

    if (order.payStatus === 1) {
      return {
        code: -1,
        message: '订单已支付'
      }
    }

    // 更新订单状态
    await db.collection('orders')
      .doc(orderId)
      .update({
        data: {
          status: 2, // 待配送
          payStatus: 1, // 已支付
          payTime: new Date(),
          updateTime: new Date()
        }
      })

    return {
      code: 0,
      message: '支付成功'
    }
  } catch (err) {
    console.error('支付失败', err)
    return {
      code: -1,
      message: '支付失败：' + err.message
    }
  }
}
