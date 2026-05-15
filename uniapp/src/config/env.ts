const trimSlash = (value: string) => value.replace(/\/+$/, '')

export const API_BASE_URL = trimSlash(
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000/api',
)

export const ENABLE_MOCK_WECHAT_LOGIN =
  import.meta.env.VITE_MOCK_WECHAT_LOGIN === 'true'
