export const STORAGE_KEYS = {
  userToken: 'sw_user_token',
  userInfo: 'sw_user_info',
  merchantToken: 'sw_merchant_token',
  merchantInfo: 'sw_merchant_info',
  cart: 'sw_cart',
}

export function readStorage<T>(key: string, fallback: T): T {
  try {
    const value = uni.getStorageSync(key)
    return value === '' || value === undefined || value === null
      ? fallback
      : (value as T)
  } catch (error) {
    return fallback
  }
}

export function writeStorage<T>(key: string, value: T) {
  uni.setStorageSync(key, value)
}

export function removeStorage(key: string) {
  uni.removeStorageSync(key)
}
