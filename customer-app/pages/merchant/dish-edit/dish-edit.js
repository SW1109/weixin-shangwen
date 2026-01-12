// pages/dish-edit/dish-edit.js
const api = require('../../../utils/merchant-api')
const util = require('../../../utils/util')

Page({
  data: {
    dishId: '',
    isEdit: false,
    categories: [],
    formData: {
      name: '',
      categoryId: '',
      categoryName: '',
      image: '',
      price: '',
      originalPrice: '',
      description: '',
      stock: '',
      status: 1,
      isRecommend: false,
      tags: [],
      sort: 0
    },
    categoryIndex: 0,
    tagInput: ''
  },

  onLoad(options) {
    if (!util.checkMerchantLogin()) return

    if (options.id) {
      this.setData({ 
        dishId: options.id,
        isEdit: true 
      })
      this.loadDishDetail(options.id)
    }
    
    this.loadCategories()
  },

  // 加载分类列表
  async loadCategories() {
    try {
      const categories = await api.getCategories()
      this.setData({ categories })
    } catch (err) {
      console.error('加载分类失败', err)
    }
  },

  // 加载菜品详情
  async loadDishDetail(dishId) {
    try {
      util.showLoading('加载中...')
      const dish = await api.getDishDetail(dishId)
      
      // 找到分类索引
      const categoryIndex = this.data.categories.findIndex(c => c._id === dish.categoryId)
      
      this.setData({ 
        formData: {
          ...dish,
          tags: dish.tags || [],
          stock: dish.stock.toString(),
          price: dish.price.toString(),
          originalPrice: dish.originalPrice ? dish.originalPrice.toString() : ''
        },
        categoryIndex: categoryIndex >= 0 ? categoryIndex : 0
      })
      util.hideLoading()
    } catch (err) {
      util.hideLoading()
      console.error('加载菜品详情失败', err)
      util.showToast('加载失败')
    }
  },

  // 输入框变化
  onInputChange(e) {
    const field = e.currentTarget.dataset.field
    this.setData({
      [`formData.${field}`]: e.detail.value
    })
  },

  // 选择分类
  onCategoryChange(e) {
    const index = e.detail.value
    const category = this.data.categories[index]
    this.setData({
      categoryIndex: index,
      'formData.categoryId': category._id,
      'formData.categoryName': category.name
    })
  },

  // 切换推荐
  onRecommendChange(e) {
    this.setData({
      'formData.isRecommend': e.detail.value
    })
  },

  // 切换状态
  onStatusChange(e) {
    this.setData({
      'formData.status': e.detail.value ? 1 : 0
    })
  },

  // 上传图片
  async onUploadImage() {
    try {
      const fileID = await util.uploadImage()
      this.setData({
        'formData.image': fileID
      })
      util.showToast('上传成功', 'success')
    } catch (err) {
      console.error('上传图片失败', err)
      util.showToast('上传失败')
    }
  },

  // 标签输入
  onTagInput(e) {
    this.setData({ tagInput: e.detail.value })
  },

  // 添加标签
  onAddTag() {
    const tag = this.data.tagInput.trim()
    if (!tag) {
      util.showToast('请输入标签')
      return
    }
    
    const tags = this.data.formData.tags
    if (tags.includes(tag)) {
      util.showToast('标签已存在')
      return
    }
    
    tags.push(tag)
    this.setData({
      'formData.tags': tags,
      tagInput: ''
    })
  },

  // 删除标签
  onRemoveTag(e) {
    const index = e.currentTarget.dataset.index
    const tags = this.data.formData.tags
    tags.splice(index, 1)
    this.setData({
      'formData.tags': tags
    })
  },

  // 表单验证
  validateForm() {
    const { name, categoryId, image, price, stock } = this.data.formData
    
    if (!name.trim()) {
      util.showToast('请输入菜品名称')
      return false
    }
    
    if (!categoryId) {
      util.showToast('请选择分类')
      return false
    }
    
    if (!image) {
      util.showToast('请上传菜品图片')
      return false
    }
    
    if (!price || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      util.showToast('请输入正确的价格')
      return false
    }
    
    if (!stock || isNaN(parseInt(stock))) {
      util.showToast('请输入正确的库存')
      return false
    }
    
    return true
  },

  // 保存菜品
  async onSubmit() {
    if (!this.validateForm()) return

    const formData = { ...this.data.formData }
    formData.price = parseFloat(formData.price)
    formData.originalPrice = formData.originalPrice ? parseFloat(formData.originalPrice) : formData.price
    formData.stock = parseInt(formData.stock)
    formData.sort = parseInt(formData.sort) || 0
    
    try {
      util.showLoading('保存中...')
      
      if (this.data.isEdit) {
        // 编辑菜品
        await api.manageDish('update', {
          _id: this.data.dishId,
          ...formData
        })
      } else {
        // 添加菜品
        await api.manageDish('add', formData)
      }
      
      util.hideLoading()
      util.showToast('保存成功', 'success')
      
      setTimeout(() => {
        wx.navigateBack()
      }, 1500)
    } catch (err) {
      util.hideLoading()
      console.error('保存失败', err)
      util.showToast('保存失败')
    }
  }
})
