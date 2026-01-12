// 云函数：login - 用户登录
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const { nickName, avatarUrl } = event

  try {
    // 查询用户是否存在
    const userRes = await db.collection('users')
      .where({
        _openid: wxContext.OPENID
      })
      .get()

    let userInfo = null

    if (userRes.data.length > 0) {
      // 用户已存在，更新信息
      await db.collection('users')
        .doc(userRes.data[0]._id)
        .update({
          data: {
            nickName,
            avatarUrl,
            updateTime: new Date()
          }
        })
      
      userInfo = {
        ...userRes.data[0],
        nickName,
        avatarUrl
      }
    } else {
      // 新用户，创建记录
      const addRes = await db.collection('users').add({
        data: {
          nickName,
          avatarUrl,
          phoneNumber: '',
          createTime: new Date(),
          updateTime: new Date()
        }
      })

      userInfo = {
        _id: addRes._id,
        _openid: wxContext.OPENID,
        nickName,
        avatarUrl
      }
    }

    return {
      code: 0,
      message: '登录成功',
      data: {
        openid: wxContext.OPENID,
        userInfo
      }
    }
  } catch (err) {
    console.error('登录失败', err)
    return {
      code: -1,
      message: '登录失败：' + err.message
    }
  }
}
