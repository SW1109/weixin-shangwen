import { request } from '@/utils/request'
import type { MerchantSession, UserSession } from '@/types/models'

export function loginByWeChat(payload: {
  code: string
  nickName: string
  avatarUrl: string
}) {
  return request<UserSession>({
    url: '/auth/wechat-login',
    method: 'POST',
    data: payload,
  })
}

export function merchantLogin(payload: { username: string; password: string }) {
  return request<MerchantSession>({
    url: '/auth/merchant-login',
    method: 'POST',
    data: payload,
  })
}

export function updateUserProfile(payload: {
  nickName: string
  avatarUrl: string
  phoneNumber?: string
}) {
  return request<UserSession>({
    url: '/auth/profile',
    method: 'PUT',
    data: payload,
    auth: 'user',
  })
}

export function getCurrentUser() {
  return request<UserSession>({
    url: '/auth/me',
    auth: 'user',
  })
}

export function getCurrentMerchant() {
  return request<MerchantSession>({
    url: '/auth/merchant/me',
    auth: 'merchant',
  })
}
