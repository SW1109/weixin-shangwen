// 云函数：manageDish - 管理菜品
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { action, dishData } = event

  try {
    switch (action) {
      case 'add':
        // 添加菜品
        const addRes = await db.collection('dishes').add({
          data: {
            ...dishData,
            sales: 0,
            createTime: new Date(),
            updateTime: new Date()
          }
        })
        return {
          code: 0,
          message: '添加成功',
          data: { _id: addRes._id }
        }

      case 'update':
        // 更新菜品
        const { _id, ...updateData } = dishData
        await db.collection('dishes')
          .doc(_id)
          .update({
            data: {
              ...updateData,
              updateTime: new Date()
            }
          })
        return {
          code: 0,
          message: '更新成功'
        }

      case 'delete':
        // 删除菜品
        await db.collection('dishes')
          .doc(dishData._id)
          .remove()
        return {
          code: 0,
          message: '删除成功'
        }

      default:
        return {
          code: -1,
          message: '无效的操作'
        }
    }
  } catch (err) {
    console.error('管理菜品失败', err)
    return {
      code: -1,
      message: '操作失败：' + err.message
    }
  }
}
