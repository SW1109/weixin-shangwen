// 云函数：createOrder - 创建订单
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

// 生成订单号
function generateOrderNo() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  const second = String(now.getSeconds()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${year}${month}${day}${hour}${minute}${second}${random}`
}

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { dishes, totalAmount, address, remark } = event

  try {
    // 获取用户信息
    const userRes = await db.collection('users')
      .where({
        _openid: wxContext.OPENID
      })
      .get()

    console.log('查询用户信息结果:', userRes)

    let userInfo = {}
    if (userRes.data.length > 0) {
      userInfo = userRes.data[0]
    } else {
      // 如果用户不存在，尝试自动注册（创建一个基础用户记录）
      const addRes = await db.collection('users').add({
        data: {
          nickName: '微信用户',
          avatarUrl: '',
          phoneNumber: address.phone || '', // 尝试使用收货地址的电话
          _openid: wxContext.OPENID, // 确保显式写入 _openid
          createTime: new Date(),
          updateTime: new Date()
        }
      })
      userInfo = {
        nickName: '微信用户',
        avatarUrl: '/images/avatar-default.png', // 设置默认头像路径
        phoneNumber: address.phone || ''
      }
    }

    // 兜底检查：如果 userInfo 中的字段为空，赋予默认值
    if (!userInfo.nickName) userInfo.nickName = '微信用户'
    if (!userInfo.avatarUrl) userInfo.avatarUrl = '/images/avatar-default.png'

    // 检查库存并计算实际金额
    let actualAmount = 0
    for (const dish of dishes) {
      const dishRes = await db.collection('dishes')
        .doc(dish.dishId)
        .get()

      if (!dishRes.data) {
        return {
          code: -1,
          message: `菜品 ${dish.name} 不存在`
        }
      }

      const dishData = dishRes.data

      // 检查库存
      if (dishData.stock !== -1 && dishData.stock < dish.quantity) {
        return {
          code: -1,
          message: `菜品 ${dish.name} 库存不足`
        }
      }

      // 检查状态
      if (dishData.status !== 1) {
        return {
          code: -1,
          message: `菜品 ${dish.name} 已下架`
        }
      }

      actualAmount += dishData.price * dish.quantity
    }

    // 验证金额
    if (Math.abs(actualAmount - totalAmount) > 0.01) {
      return {
        code: -1,
        message: '订单金额异常，请重新下单'
      }
    }

    // 生成订单号
    const orderNo = generateOrderNo()

    // 创建订单
    const orderRes = await db.collection('orders').add({
      data: {
        orderNo,
        _openid: wxContext.OPENID, // 显式添加 _openid
        userInfo: {
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          phoneNumber: address.phone
        },
        dishes,
        totalAmount,
        address,
        remark: remark || '',
        status: 1, // 待支付
        payStatus: 0, // 未支付
        createTime: new Date(),
        updateTime: new Date()
      }
    })

    // 扣减库存
    for (const dish of dishes) {
      const dishRes = await db.collection('dishes')
        .doc(dish.dishId)
        .get()

      if (dishRes.data.stock !== -1) {
        await db.collection('dishes')
          .doc(dish.dishId)
          .update({
            data: {
              stock: _.inc(-dish.quantity),
              sales: _.inc(dish.quantity),
              updateTime: new Date()
            }
          })
      } else {
        // 无限库存，只增加销量
        await db.collection('dishes')
          .doc(dish.dishId)
          .update({
            data: {
              sales: _.inc(dish.quantity),
              updateTime: new Date()
            }
          })
      }
    }

    return {
      code: 0,
      message: '下单成功',
      data: {
        orderId: orderRes._id,
        orderNo
      }
    }
  } catch (err) {
    console.error('创建订单失败', err)
    return {
      code: -1,
      message: '创建订单失败：' + err.message
    }
  }
}
