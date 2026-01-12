// 云函数：getStatistics - 获取统计数据
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { startDate, endDate } = event

  try {
    // 构建时间范围查询条件
    const start = startDate ? new Date(startDate) : new Date(new Date().setHours(0, 0, 0, 0))
    const end = endDate ? new Date(endDate) : new Date(new Date().setHours(23, 59, 59, 999))

    // 获取时间范围内的订单
    // 突破默认 100 条限制
    const countResult = await db.collection('orders')
      .where({
        createTime: _.gte(start).and(_.lte(end)),
        status: _.neq(5)
      })
      .count()
    
    const total = countResult.total
    const batchTimes = Math.ceil(total / 100)
    const tasks = []
    
    for (let i = 0; i < batchTimes; i++) {
      const promise = db.collection('orders')
        .where({
          createTime: _.gte(start).and(_.lte(end)),
          status: _.neq(5)
        })
        .skip(i * 100)
        .limit(100)
        .get()
      tasks.push(promise)
    }
    
    let orders = []
    if (tasks.length > 0) {
      const results = await Promise.all(tasks)
      orders = results.reduce((acc, cur) => {
        return acc.concat(cur.data)
      }, [])
    }

    // 计算总销售额
    const totalSales = orders.reduce((sum, order) => {
      return sum + (order.payStatus === 1 ? order.totalAmount : 0)
    }, 0)

    // 计算总订单数
    const totalOrders = orders.length

    // 计算已支付订单数
    const paidOrders = orders.filter(order => order.payStatus === 1).length

    // 统计菜品销量
    const dishSales = {}
    orders.forEach(order => {
      if (order.payStatus === 1) {
        order.dishes.forEach(dish => {
          if (dishSales[dish.dishId]) {
            dishSales[dish.dishId].quantity += dish.quantity
            dishSales[dish.dishId].amount += dish.price * dish.quantity
          } else {
            dishSales[dish.dishId] = {
              dishId: dish.dishId,
              name: dish.name,
              quantity: dish.quantity,
              amount: dish.price * dish.quantity
            }
          }
        })
      }
    })

    // 获取销量前10的菜品
    const topDishes = Object.values(dishSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)

    // 按状态统计订单
    const ordersByStatus = {
      1: 0, // 待支付
      2: 0, // 待配送
      3: 0, // 配送中
      4: 0  // 已完成
    }
    orders.forEach(order => {
      if (ordersByStatus[order.status] !== undefined) {
        ordersByStatus[order.status]++
      }
    })

    return {
      code: 0,
      data: {
        totalSales: parseFloat(totalSales.toFixed(2)),
        totalOrders,
        paidOrders,
        ordersByStatus,
        topDishes,
        startDate: start,
        endDate: end
      }
    }
  } catch (err) {
    console.error('获取统计数据失败', err)
    return {
      code: -1,
      message: '获取统计数据失败：' + err.message
    }
  }
}
