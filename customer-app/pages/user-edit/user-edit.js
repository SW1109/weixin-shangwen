// pages/user-edit/user-edit.js
const api = require('../../utils/api')
const util = require('../../utils/util')
const app = getApp()

Page({
  data: {
    userInfo: null,
    saving: false,
    avatarUrl: '' // 临时路径或云存储ID
  },

  onLoad() {
    this.setData({
      userInfo: app.globalData.userInfo,
      avatarUrl: app.globalData.userInfo.avatarUrl
    })
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    this.setData({
      'userInfo.avatarUrl': avatarUrl, // 用于预览
      avatarUrl: avatarUrl // 用于上传
    })
  },

  onNickNameChange(e) {
    this.setData({
      'userInfo.nickName': e.detail.value
    })
  },

  onNickNameInput(e) {
    this.setData({
      'userInfo.nickName': e.detail.value
    })
  },

  onPhoneInput(e) {
    this.setData({
      'userInfo.phoneNumber': e.detail.value
    })
  },

  async onSave() {
    if (this.data.saving) return
    const { nickName, phoneNumber } = this.data.userInfo
    
    if (!nickName) {
      util.showToast('请输入昵称')
      return
    }

    if (phoneNumber && !/^1[3-9]\d{9}$/.test(phoneNumber)) {
      util.showToast('请输入正确的手机号')
      return
    }

    this.setData({ saving: true })
    util.showLoading('保存中...')

    try {
      let avatarFileID = this.data.avatarUrl
      
      // 如果是临时路径，需要上传
      // 注意：微信返回的临时路径通常以 http://tmp 或 wxfile:// 开头
      // 云存储ID以 cloud:// 开头
      if (avatarFileID && !avatarFileID.startsWith('cloud://') && !avatarFileID.startsWith('http')) {
         const cloudPath = `avatars/${Date.now()}-${Math.floor(Math.random() * 1000)}.jpg`
         avatarFileID = await util.uploadImage(avatarFileID, cloudPath)
      }

      const updateData = {
        nickName,
        avatarUrl: avatarFileID,
        phoneNumber
      }

      await api.login(updateData) // 复用login接口更新信息
      
      // 更新本地全局数据
      const newUserInfo = {
        ...app.globalData.userInfo,
        ...updateData
      }
      app.setUserInfo(newUserInfo)
      
      // 更新页面数据
      this.setData({ userInfo: newUserInfo })

      util.hideLoading()
      util.showToast('保存成功', 'success')
      
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)

    } catch (err) {
      util.hideLoading()
      console.error('保存失败', err)
      util.showToast('保存失败')
    } finally {
      this.setData({ saving: false })
    }
  }
})
