// 云函数：getOrderDetail - 获取订单详情
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { orderId } = event

  if (!orderId) {
    return {
      code: -1,
      message: '参数错误：缺少 orderId'
    }
  }

  try {
    const res = await db.collection('orders')
      .doc(orderId)
      .get()

    if (!res.data) {
      return {
        code: -1,
        message: '订单不存在'
      }
    }

    const order = res.data

    // 权限校验：只能查询自己的订单
    // 如果是商家调用（通常没有 userInfo 只有 openid），或者通过云函数调用，可能需要放宽限制
    // 这里简单判断：如果 openid 匹配，或者 event 中包含 isAdmin 标记（商家端调用时传入）
    if (order._openid !== wxContext.OPENID && !event.isAdmin) {
      return {
        code: -1,
        message: '无权查看此订单'
      }
    }

    return {
      code: 0,
      data: order
    }
  } catch (err) {
    console.error('获取订单详情失败', err)
    return {
      code: -1,
      message: '获取订单详情失败：' + err.message
    }
  }
}
