import { useAuthStore } from '@/stores/auth'

export function useAuthGuard() {
  const authStore = useAuthStore()

  function ensure() {
    if (authStore.isUserLoggedIn) {
      return true
    }

    uni.showToast({
      title: '请先登录',
      icon: 'none',
    })
    uni.navigateTo({
      url: '/pages/customer/login/index',
    })
    return false
  }

  return {
    ensure,
  }
}
