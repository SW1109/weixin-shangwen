function mapCategoryRow(row) {
  return {
    id: row.id,
    name: row.name,
    sort: row.sort,
    icon: row.icon,
    status: row.status,
  }
}

function normalizeTags(value) {
  if (!value) {
    return []
  }

  if (Array.isArray(value)) {
    return value.map(String).filter(Boolean)
  }

  const text = String(value).trim()
  if (!text) {
    return []
  }

  try {
    const parsed = JSON.parse(text)
    if (Array.isArray(parsed)) {
      return parsed.map(String).filter(Boolean)
    }
    if (typeof parsed === 'string') {
      return splitTags(parsed)
    }
  } catch (error) {
    return splitTags(text)
  }

  return []
}

function splitTags(value) {
  return value
    .split(/[,，]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function mapDishRow(row) {
  return {
    id: row.id,
    categoryId: row.category_id,
    categoryName: row.category_name,
    name: row.name,
    image: row.image,
    price: Number(row.price),
    originalPrice: row.original_price === null ? null : Number(row.original_price),
    description: row.description || '',
    stock: row.stock,
    sales: row.sales,
    status: row.status,
    isRecommend: Boolean(row.is_recommend),
    tags: normalizeTags(row.tags),
    sort: row.sort || 0,
  }
}

function mapAddressRow(row) {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    province: row.province,
    city: row.city,
    district: row.district,
    detail: row.detail,
    isDefault: Boolean(row.is_default),
  }
}

function mapCartRow(row) {
  return {
    dishId: row.dish_id,
    name: row.name,
    image: row.image,
    price: Number(row.price),
    quantity: row.quantity,
    stock: row.stock,
  }
}

function mapOrderRow(row, items) {
  return {
    id: row.id,
    orderNo: row.order_no,
    userInfo: {
      nickName: row.user_nickname,
      avatarUrl: row.user_avatar_url,
      phoneNumber: row.user_phone_number,
    },
    dishes: items.map((item) => ({
      dishId: item.dish_id,
      name: item.dish_name,
      image: item.dish_image,
      price: Number(item.price),
      quantity: item.quantity,
    })),
    totalAmount: Number(row.total_amount),
    address: {
      name: row.address_name,
      phone: row.address_phone,
      province: row.address_province,
      city: row.address_city,
      district: row.address_district,
      detail: row.address_detail,
    },
    remark: row.remark || '',
    status: row.status,
    payStatus: row.pay_status,
    createTime: row.created_at,
    updateTime: row.updated_at,
    payTime: row.pay_time,
    completeTime: row.complete_time,
  }
}

module.exports = {
  mapCategoryRow,
  mapDishRow,
  mapAddressRow,
  mapCartRow,
  mapOrderRow,
}
