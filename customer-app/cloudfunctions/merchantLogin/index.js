// 云函数：merchantLogin - 商家登录
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 简单的密码加密（实际项目应使用 bcrypt 等库）
function hashPassword(password) {
  // 这里使用简单的哈希，实际项目应该使用更安全的加密方式
  return require('crypto').createHash('md5').update(password).digest('hex')
}

exports.main = async (event, context) => {
  const { username, password } = event

  try {
    // 查询商家账号
    const merchantRes = await db.collection('merchants')
      .where({
        username,
        status: 1
      })
      .get()

    if (merchantRes.data.length === 0) {
      return {
        code: -1,
        message: '账号不存在或已被禁用'
      }
    }

    const merchant = merchantRes.data[0]

    // 验证密码
    const hashedPassword = hashPassword(password)
    if (merchant.password !== hashedPassword) {
      return {
        code: -1,
        message: '密码错误'
      }
    }

    // 返回商家信息（不包含密码）
    const { password: pwd, ...merchantInfo } = merchant

    return {
      code: 0,
      message: '登录成功',
      data: merchantInfo
    }
  } catch (err) {
    console.error('登录失败', err)
    return {
      code: -1,
      message: '登录失败：' + err.message
    }
  }
}
