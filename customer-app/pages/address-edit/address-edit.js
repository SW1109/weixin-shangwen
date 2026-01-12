// pages/address-edit/address-edit.js
const api = require('../../utils/api')
const util = require('../../utils/util')

Page({
  data: {
    addressId: '',
    formData: {
      name: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      detail: '',
      isDefault: false
    },
    // 省市区数据（简化版，实际项目可以使用完整的省市区数据）
    provinces: ['广东省', '北京市', '上海市', '浙江省', '江苏省', '四川省'],
    cities: {
      '广东省': ['广州市', '深圳市', '东莞市', '佛山市', '珠海市'],
      '北京市': ['北京市'],
      '上海市': ['上海市'],
      '浙江省': ['杭州市', '宁波市', '温州市'],
      '江苏省': ['南京市', '苏州市', '无锡市'],
      '四川省': ['成都市', '绵阳市', '乐山市']
    },
    districts: {
      '深圳市': ['南山区', '福田区', '罗湖区', '宝安区', '龙岗区'],
      '广州市': ['天河区', '海珠区', '越秀区', '番禺区'],
      '北京市': ['朝阳区', '海淀区', '东城区', '西城区'],
      '上海市': ['浦东新区', '黄浦区', '徐汇区', '静安区'],
      '杭州市': ['西湖区', '上城区', '下城区', '拱墅区'],
      '南京市': ['玄武区', '秦淮区', '建邺区', '鼓楼区'],
      '成都市': ['武侯区', '锦江区', '青羊区', '金牛区']
    },
    provinceIndex: 0,
    cityIndex: 0,
    districtIndex: 0
  },

  onLoad(options) {
    if (options.id) {
      this.setData({ addressId: options.id })
      this.loadAddress(options.id)
    }
  },

  // 加载地址详情
  async loadAddress(addressId) {
    wx.showLoading({ title: '加载中...' })
    
    try {
      const addresses = await api.getAddresses()
      const address = addresses.find(item => item._id === addressId)
      
      if (address) {
        // 设置省市区索引
        const provinceIndex = this.data.provinces.indexOf(address.province)
        const cityIndex = this.data.cities[address.province]?.indexOf(address.city) || 0
        const districtIndex = this.data.districts[address.city]?.indexOf(address.district) || 0
        
        this.setData({ 
          formData: address,
          provinceIndex,
          cityIndex,
          districtIndex
        })
      }
    } catch (err) {
      console.error('加载地址失败', err)
      util.showToast('加载地址失败')
    } finally {
      wx.hideLoading()
    }
  },

  // 输入姓名
  onNameInput(e) {
    this.setData({
      'formData.name': e.detail.value
    })
  },

  // 输入手机号
  onPhoneInput(e) {
    this.setData({
      'formData.phone': e.detail.value
    })
  },

  // 选择省份
  onProvinceChange(e) {
    const index = parseInt(e.detail.value)
    const province = this.data.provinces[index]
    
    this.setData({
      provinceIndex: index,
      cityIndex: 0,
      districtIndex: 0,
      'formData.province': province,
      'formData.city': this.data.cities[province][0],
      'formData.district': this.data.districts[this.data.cities[province][0]]?.[0] || ''
    })
  },

  // 选择城市
  onCityChange(e) {
    const index = parseInt(e.detail.value)
    const province = this.data.formData.province
    const city = this.data.cities[province][index]
    
    this.setData({
      cityIndex: index,
      districtIndex: 0,
      'formData.city': city,
      'formData.district': this.data.districts[city]?.[0] || ''
    })
  },

  // 选择区域
  onDistrictChange(e) {
    const index = parseInt(e.detail.value)
    const city = this.data.formData.city
    const district = this.data.districts[city][index]
    
    this.setData({
      districtIndex: index,
      'formData.district': district
    })
  },

  // 输入详细地址
  onDetailInput(e) {
    this.setData({
      'formData.detail': e.detail.value
    })
  },

  // 切换默认地址
  onDefaultChange(e) {
    this.setData({
      'formData.isDefault': e.detail.value
    })
  },

  // 保存地址
  async onSave() {
    const { name, phone, province, city, district, detail } = this.data.formData

    // 验证表单
    if (!name) {
      util.showToast('请输入收货人姓名')
      return
    }

    if (!phone) {
      util.showToast('请输入手机号')
      return
    }

    if (!/^1[3-9]\d{9}$/.test(phone)) {
      util.showToast('手机号格式不正确')
      return
    }

    if (!province || !city || !district) {
      util.showToast('请选择省市区')
      return
    }

    if (!detail) {
      util.showToast('请输入详细地址')
      return
    }

    wx.showLoading({ title: '保存中...' })

    try {
      if (this.data.addressId) {
        // 更新地址
        await api.updateAddress(this.data.addressId, this.data.formData)
      } else {
        // 新增地址
        await api.addAddress(this.data.formData)
      }

      wx.hideLoading()
      util.showToast('保存成功', 'success')

      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (err) {
      wx.hideLoading()
      console.error('保存地址失败', err)
      util.showToast('保存失败')
    }
  }
})
