import { useAuthStore } from '@/stores/auth'

export function useMerchantGuard() {
  const authStore = useAuthStore()

  function ensure() {
    if (authStore.isMerchantLoggedIn) {
      return true
    }

    uni.showToast({
      title: '请先登录商家账号',
      icon: 'none',
    })
    uni.reLaunch({
      url: '/pages/merchant/login/index',
    })
    return false
  }

  return {
    ensure,
  }
}
