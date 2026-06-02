const trimSlash = (value: string) => value.replace(/\/+$/, '')

const fallbackApiBaseUrl = import.meta.env.DEV
  ? '/api'
  : 'https://www.guangnian.xin:8088/api'

export const API_BASE_URL = trimSlash(
  import.meta.env.VITE_API_BASE_URL || fallbackApiBaseUrl,
)

export const ENABLE_MOCK_WECHAT_LOGIN =
  import.meta.env.VITE_MOCK_WECHAT_LOGIN === 'true'
