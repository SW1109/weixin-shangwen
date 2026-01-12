// pages/statistics/statistics.js
const api = require('../../../utils/merchant-api')
const util = require('../../../utils/util')

Page({
  data: {
    dateRange: 'today', // today, week, month
    startDate: '',
    endDate: '',
    stats: {
      totalSales: 0,
      totalOrders: 0,
      totalDishes: 0,
      avgOrderAmount: 0
    },
    topDishes: [],
    orders: [],
    loading: false
  },

  onLoad() {
    if (!util.checkMerchantLogin()) return
    this.setDateRange('today')
  },

  // 设置日期范围
  setDateRange(range) {
    const today = new Date()
    let startDate, endDate

    if (range === 'today') {
      startDate = util.formatDate(today)
      endDate = util.formatDate(today)
    } else if (range === 'week') {
      const weekAgo = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000)
      startDate = util.formatDate(weekAgo)
      endDate = util.formatDate(today)
    } else if (range === 'month') {
      const monthAgo = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000)
      startDate = util.formatDate(monthAgo)
      endDate = util.formatDate(today)
    }

    this.setData({ 
      dateRange: range,
      startDate,
      endDate 
    })
    this.loadStatistics()
  },

  // 切换日期范围
  onDateRangeChange(e) {
    const range = e.currentTarget.dataset.range
    this.setDateRange(range)
  },

  // 加载统计数据
  async loadStatistics() {
    this.setData({ loading: true })
    
    try {
      const stats = await api.getStatistics(this.data.startDate, this.data.endDate)
      
      // 计算平均订单金额
      const avgOrderAmount = stats.totalOrders > 0 
        ? (stats.totalSales / stats.totalOrders).toFixed(2)
        : 0

      this.setData({ 
        stats: {
          totalSales: stats.totalSales || 0,
          totalOrders: stats.totalOrders || 0,
          totalDishes: stats.totalDishes || 0,
          avgOrderAmount
        },
        topDishes: stats.topDishes || [],
        loading: false 
      })
    } catch (err) {
      console.error('加载统计数据失败', err)
      util.showToast('加载失败')
      this.setData({ loading: false })
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadStatistics().then(() => {
      wx.stopPullDownRefresh()
    })
  }
})
