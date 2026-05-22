import { API_BASE_URL } from '@/config/env'
import { STORAGE_KEYS, readStorage } from '@/utils/storage'
import type { ApiEnvelope } from '@/types/models'

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
type AuthMode = 'none' | 'user' | 'merchant' | 'auto'

interface RequestOptions {
  url: string
  method?: RequestMethod
  data?: any
  auth?: AuthMode
}

function getToken(auth: AuthMode) {
  if (auth === 'none') {
    return ''
  }

  if (auth === 'merchant') {
    return readStorage(STORAGE_KEYS.merchantToken, '')
  }

  if (auth === 'user') {
    return readStorage(STORAGE_KEYS.userToken, '')
  }

  return (
    readStorage(STORAGE_KEYS.userToken, '') ||
    readStorage(STORAGE_KEYS.merchantToken, '')
  )
}

function normalizeRequestData(value: any): any {
  if (Array.isArray(value)) {
    return value.map((item) => normalizeRequestData(item))
  }

  if (
    value &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.prototype
  ) {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, item]) => item !== undefined)
        .map(([key, item]) => [key, normalizeRequestData(item)]),
    )
  }

  return value
}

export function request<T>({
  url,
  method = 'GET',
  data,
  auth = 'none',
}: RequestOptions): Promise<T> {
  const token = getToken(auth)
  const normalizedData = normalizeRequestData(data)
  const requestData =
    method === 'GET' ? normalizedData : normalizedData ?? {}
  const hasBody = method !== 'GET'
  const header = {
    ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  return new Promise((resolve, reject) => {
    uni.request({
      url: `${API_BASE_URL}${url}`,
      method,
      data: requestData as any,
      timeout: 15000,
      header,
      success: (response) => {
        const statusCode = response.statusCode || 500
        const payload = response.data as ApiEnvelope<T> | T

        if (
          typeof payload === 'string' &&
          /^<(?:!doctype\s+html|html)\b/i.test(payload.trim())
        ) {
          reject(new Error('接口地址配置异常，请检查 VITE_API_BASE_URL 或 H5 反向代理'))
          return
        }

        if (statusCode >= 400) {
          const message =
            (payload as ApiEnvelope<T>)?.message || '服务端请求失败'
          reject(new Error(message))
          return
        }

        if (
          typeof payload === 'object' &&
          payload !== null &&
          'code' in payload &&
          'data' in payload
        ) {
          const normalized = payload as ApiEnvelope<T>
          if (normalized.code !== 0) {
            reject(new Error(normalized.message || '请求失败'))
            return
          }

          resolve(normalized.data)
          return
        }

        resolve(payload as T)
      },
      fail: (error) => {
        reject(new Error(error.errMsg || '网络请求失败'))
      },
    })
  })
}
