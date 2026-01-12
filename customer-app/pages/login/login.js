// pages/login/login.js
const api = require('../../utils/api')
const util = require('../../utils/util')
const app = getApp()

Page({
  data: {},

  // 获取用户信息并登录
  async onGetUserProfile(e) {
    try {
      // 获取用户信息
      const { userInfo } = await wx.getUserProfile({
        desc: '用于完善用户资料'
      })

      util.showLoading('登录中...')

      // 调用登录云函数
      const loginRes = await api.login(userInfo)
      
      // 保存用户信息
      app.setUserInfo(loginRes.userInfo)
      
      util.hideLoading()
      
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      })

      // 返回上一页或跳转到首页
      setTimeout(() => {
        const pages = getCurrentPages()
        if (pages.length > 1) {
          wx.navigateBack()
        } else {
          wx.switchTab({
            url: '/pages/index/index'
          })
        }
      }, 1500)
    } catch (err) {
      util.hideLoading()
      console.error('登录失败', err)
      util.showToast('登录失败，请重试')
    }
  }
})
