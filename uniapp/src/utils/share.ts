import type { Dish } from '@/types/models'
import { API_BASE_URL } from '@/config/env'

const STORE_NAME = '汤汤点餐'

function trimSlash(value: string) {
  return value.replace(/\/+$/, '')
}

function getRuntimeOrigin() {
  let origin = ''

  // #ifdef H5
  if (typeof window !== 'undefined') {
    origin = window.location.origin
  }
  // #endif

  return origin
}

export function buildDishSharePath(dishId: number) {
  return `/pages/customer/dish/index?id=${dishId}&source=share`
}

export function buildDishShareTitle(dish: Dish) {
  return `${dish.name} | ${STORE_NAME}`
}

export function buildDishShareDescription(dish: Dish) {
  const text = dish.description?.trim() || `推荐你看看 ${dish.name}`
  return text.length > 72 ? `${text.slice(0, 72)}...` : text
}

export function buildDishH5ShareUrl(dishId: number) {
  const sharePath = `/share/dishes/${dishId}`

  if (/^https?:\/\//i.test(API_BASE_URL)) {
    return `${trimSlash(API_BASE_URL)}${sharePath}`
  }

  const origin = getRuntimeOrigin()
  return `${origin}${trimSlash(API_BASE_URL)}${sharePath}`
}

export function buildDishWechatShare(dish: Dish) {
  return {
    title: buildDishShareTitle(dish),
    path: buildDishSharePath(dish.id),
    imageUrl: dish.image,
  }
}

export async function shareDishToH5(dish: Dish) {
  const url = buildDishH5ShareUrl(dish.id)
  const title = buildDishShareTitle(dish)
  const text = buildDishShareDescription(dish)

  // #ifdef H5
  if (typeof navigator !== 'undefined' && navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url,
      })
      return
    } catch (error) {
      // 用户取消系统分享时，降级为复制链接，保证分享链路可用。
    }
  }
  // #endif

  uni.setClipboardData({
    data: url,
    success: () => {
      uni.showToast({
        title: '商品链接已复制',
        icon: 'none',
      })
    },
  })
}
