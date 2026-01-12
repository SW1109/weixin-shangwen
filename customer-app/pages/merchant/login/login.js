// pages/login/login.js
const api = require('../../../utils/merchant-api')
const util = require('../../../utils/util')
const app = getApp()

Page({
  data: {
    username: '',
    password: '',
    loading: false
  },

  // 输入用户名
  onUsernameInput(e) {
    this.setData({
      username: e.detail.value
    })
  },

  // 输入密码
  onPasswordInput(e) {
    this.setData({
      password: e.detail.value
    })
  },

  // 登录
  async onLogin() {
    const { username, password } = this.data

    // 验证
    if (!username) {
      util.showToast('请输入用户名')
      return
    }
    if (!password) {
      util.showToast('请输入密码')
      return
    }

    this.setData({ loading: true })

    try {
      const merchantInfo = await api.merchantLogin(username, password)

      // 保存商家信息
      app.setMerchantInfo(merchantInfo)

      util.showToast('登录成功', 'success')

      // 跳转到首页
      setTimeout(() => {
        wx.redirectTo({
          url: '/pages/merchant/home/home'
        })
      }, 1000)
    } catch (err) {
      console.error('登录失败', err)
      util.showToast(err.message || '登录失败')
    } finally {
      this.setData({ loading: false })
    }
  }
})
