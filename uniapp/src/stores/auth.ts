import { computed, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import type {
  MerchantProfile,
  MerchantSession,
  UserProfile,
  UserSession,
} from '@/types/models'
import { removeStorage, STORAGE_KEYS, readStorage, writeStorage } from '@/utils/storage'

export const useAuthStore = defineStore('auth', () => {
  const userToken = shallowRef('')
  const userInfo = shallowRef<UserProfile | null>(null)
  const merchantToken = shallowRef('')
  const merchantInfo = shallowRef<MerchantProfile | null>(null)

  const isUserLoggedIn = computed(() => Boolean(userToken.value))
  const isMerchantLoggedIn = computed(() => Boolean(merchantToken.value))

  function hydrate() {
    userToken.value = readStorage(STORAGE_KEYS.userToken, '')
    userInfo.value = readStorage<UserProfile | null>(STORAGE_KEYS.userInfo, null)
    merchantToken.value = readStorage(STORAGE_KEYS.merchantToken, '')
    merchantInfo.value = readStorage<MerchantProfile | null>(
      STORAGE_KEYS.merchantInfo,
      null,
    )
  }

  function setUserSession(session: UserSession) {
    userToken.value = session.token
    userInfo.value = session.userInfo
    writeStorage(STORAGE_KEYS.userToken, session.token)
    writeStorage(STORAGE_KEYS.userInfo, session.userInfo)
  }

  function setMerchantSession(session: MerchantSession) {
    merchantToken.value = session.token
    merchantInfo.value = session.merchantInfo
    writeStorage(STORAGE_KEYS.merchantToken, session.token)
    writeStorage(STORAGE_KEYS.merchantInfo, session.merchantInfo)
  }

  function logoutUser() {
    userToken.value = ''
    userInfo.value = null
    removeStorage(STORAGE_KEYS.userToken)
    removeStorage(STORAGE_KEYS.userInfo)
  }

  function logoutMerchant() {
    merchantToken.value = ''
    merchantInfo.value = null
    removeStorage(STORAGE_KEYS.merchantToken)
    removeStorage(STORAGE_KEYS.merchantInfo)
  }

  return {
    userToken,
    userInfo,
    merchantToken,
    merchantInfo,
    isUserLoggedIn,
    isMerchantLoggedIn,
    hydrate,
    setUserSession,
    setMerchantSession,
    logoutUser,
    logoutMerchant,
  }
})
