// 云函数：updateOrderStatus - 更新订单状态
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { orderId, status } = event

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

    // 验证状态转换的合法性
    const validTransitions = {
      1: [2, 5], // 待支付 -> 待配送/已取消
      2: [3, 5], // 待配送 -> 配送中/已取消
      3: [4],    // 配送中 -> 已完成
      4: [],     // 已完成 -> 无
      5: []      // 已取消 -> 无
    }

    if (!validTransitions[order.status] || !validTransitions[order.status].includes(status)) {
      return {
        code: -1,
        message: '无效的状态转换'
      }
    }

    // 更新订单状态
    const updateData = {
      status,
      updateTime: new Date()
    }

    // 如果是完成订单，记录完成时间
    if (status === 4) {
      updateData.completeTime = new Date()
    }

    await db.collection('orders')
      .doc(orderId)
      .update({
        data: updateData
      })

    return {
      code: 0,
      message: '状态更新成功'
    }
  } catch (err) {
    console.error('更新订单状态失败', err)
    return {
      code: -1,
      message: '更新失败：' + err.message
    }
  }
}
