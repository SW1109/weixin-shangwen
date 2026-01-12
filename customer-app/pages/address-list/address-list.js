// pages/address-list/address-list.js
const api = require('../../utils/api')
const util = require('../../utils/util')

Page({
  data: {
    addresses: [],
    loading: false,
    from: '' // 来源页面：order（订单选择）/ user（地址管理）
  },

  onLoad(options) {
    this.setData({
      from: options.from || 'user'
    })
    this.loadAddresses()
  },

  onShow() {
    this.loadAddresses()
  },

  // 加载地址列表
  async loadAddresses() {
    this.setData({ loading: true })
    
    try {
      const addresses = await api.getAddresses()
      this.setData({ 
        addresses,
        loading: false 
      })
    } catch (err) {
      console.error('加载地址失败', err)
      util.showToast('加载地址失败')
      this.setData({ loading: false })
    }
  },

  // 选择地址
  onSelectAddress(e) {
    const addressId = e.currentTarget.dataset.id
    
    // 如果是从订单页面进来，选择后返回
    if (this.data.from === 'order') {
      const address = this.data.addresses.find(item => item._id === addressId)
      
      // 将选中的地址设为默认地址
      this.setDefaultAddress(addressId)
      
      // 返回上一页
      wx.navigateBack()
    }
  },

  // 设置默认地址
  async setDefaultAddress(addressId) {
    try {
      await api.setDefaultAddress(addressId)
      this.loadAddresses()
      
      if (this.data.from !== 'order') {
        util.showToast('设置成功', 'success')
      }
    } catch (err) {
      console.error('设置默认地址失败', err)
      util.showToast('设置失败')
    }
  },

  // 编辑地址
  onEditAddress(e) {
    const addressId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/address-edit/address-edit?id=${addressId}`
    })
  },

  // 删除地址
  async onDeleteAddress(e) {
    const addressId = e.currentTarget.dataset.id
    
    const confirm = await util.showModal('确定要删除该地址吗？')
    if (!confirm) return

    try {
      util.showLoading('删除中...')
      await api.deleteAddress(addressId)
      util.hideLoading()
      
      util.showToast('删除成功', 'success')
      this.loadAddresses()
    } catch (err) {
      util.hideLoading()
      console.error('删除地址失败', err)
      util.showToast('删除失败')
    }
  },

  // 添加新地址
  onAddAddress() {
    wx.navigateTo({
      url: '/pages/address-edit/address-edit'
    })
  }
})
