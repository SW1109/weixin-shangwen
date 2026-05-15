import { API_BASE_URL } from '@/config/env'
import { STORAGE_KEYS, readStorage } from '@/utils/storage'

type UploadAuth = 'user' | 'merchant'

export function uploadImage(filePath: string, auth: UploadAuth) {
  const token =
    auth === 'merchant'
      ? readStorage(STORAGE_KEYS.merchantToken, '')
      : readStorage(STORAGE_KEYS.userToken, '')

  return new Promise<string>((resolve, reject) => {
    uni.uploadFile({
      url: `${API_BASE_URL}/upload/image`,
      filePath,
      name: 'file',
      header: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      success: (response) => {
        try {
          const payload = JSON.parse(response.data)
          if (response.statusCode >= 400 || payload.code !== 0) {
            reject(new Error(payload.message || '上传失败'))
            return
          }

          resolve(payload.data.url)
        } catch (error) {
          reject(new Error('上传结果解析失败'))
        }
      },
      fail: (error) => {
        reject(new Error(error.errMsg || '上传失败'))
      },
    })
  })
}
