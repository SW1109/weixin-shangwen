/**
 * 工具函数
 */

// 格式化时间
const formatTime = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  const hour = date.getHours()
  const minute = date.getMinutes()
  const second = date.getSeconds()

  return `${[year, month, day].map(formatNumber).join('-')} ${[hour, minute, second].map(formatNumber).join(':')}`
}

const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : `0${n}`
}

// 格式化日期
const formatDate = date => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `${year}-${formatNumber(month)}-${formatNumber(day)}`
}

// 格式化价格
const formatPrice = price => {
  return parseFloat(price).toFixed(2)
}

// 显示提示
const showToast = (title, icon = 'none') => {
  wx.showToast({
    title,
    icon,
    duration: 2000
  })
}

// 显示加载
const showLoading = (title = '加载中...') => {
  wx.showLoading({
    title,
    mask: true
  })
}

// 隐藏加载
const hideLoading = () => {
  wx.hideLoading()
}

// 确认对话框
const showModal = (content, title = '提示') => {
  return new Promise((resolve, reject) => {
    wx.showModal({
      title,
      content,
      success(res) {
        if (res.confirm) {
          resolve(true)
        } else {
          resolve(false)
        }
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

// 生成订单号
const generateOrderNo = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = formatNumber(now.getMonth() + 1)
  const day = formatNumber(now.getDate())
  const hour = formatNumber(now.getHours())
  const minute = formatNumber(now.getMinutes())
  const second = formatNumber(now.getSeconds())
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${year}${month}${day}${hour}${minute}${second}${random}`
}

// 获取订单状态文本
const getOrderStatusText = status => {
  const statusMap = {
    1: '待支付',
    2: '待配送',
    3: '配送中',
    4: '已完成',
    5: '已取消'
  }
  return statusMap[status] || '未知状态'
}

// 获取订单状态颜色
const getOrderStatusColor = status => {
  const colorMap = {
    1: '#ff9800',
    2: '#2196f3',
    3: '#bc0bf6',
    4: '#4caf50',
    5: '#999999'
  }
  return colorMap[status] || '#333333'
}

// 防抖函数
const debounce = (fn, delay = 500) => {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

// 节流函数
const throttle = (fn, delay = 500) => {
  let timer = null
  return function (...args) {
    if (timer) return
    timer = setTimeout(() => {
      fn.apply(this, args)
      timer = null
    }, delay)
  }
}

// 检查是否登录
const checkLogin = () => {
  const app = getApp()
  if (!app.globalData.userInfo) {
    wx.showModal({
      title: '提示',
      content: '请先登录',
      success(res) {
        if (res.confirm) {
          wx.navigateTo({
            url: '/pages/login/login'
          })
        }
      }
    })
    return false
  }
  return true
}

// 检查是否商家登录
const checkMerchantLogin = () => {
  const app = getApp()
  if (!app.globalData.merchantInfo) {
    wx.showModal({
      title: '提示',
      content: '请先登录商家账号',
      showCancel: false,
      success(res) {
        if (res.confirm) {
          wx.reLaunch({
            url: '/pages/merchant/login/login'
          })
        }
      }
    })
    return false
  }
  return true
}

// 获取图片临时路径
const getTempFilePath = (cloudPath) => {
  return new Promise((resolve, reject) => {
    wx.cloud.getTempFileURL({
      fileList: [cloudPath],
      success: res => {
        if (res.fileList && res.fileList.length > 0) {
          resolve(res.fileList[0].tempFileURL)
        } else {
          reject(new Error('获取图片失败'))
        }
      },
      fail: err => {
        reject(err)
      }
    })
  })
}

// 上传图片到云存储
const uploadImage = (filePath, cloudPath) => {
  return new Promise((resolve, reject) => {
    wx.cloud.uploadFile({
      cloudPath,
      filePath,
      success: res => {
        resolve(res.fileID)
      },
      fail: err => {
        reject(err)
      }
    })
  })
}

// 压缩图片
const compressImage = (src) => {
  return new Promise((resolve, reject) => {
    wx.compressImage({
      src,
      quality: 80,
      success: res => {
        resolve(res.tempFilePath)
      },
      fail: err => {
        reject(err)
      }
    })
  })
}

module.exports = {
  formatTime,
  formatDate,
  formatPrice,
  showToast,
  showLoading,
  hideLoading,
  showModal,
  generateOrderNo,
  getOrderStatusText,
  getOrderStatusColor,
  debounce,
  throttle,
  checkLogin,
  checkMerchantLogin,
  getTempFilePath,
  uploadImage,
  compressImage
}
