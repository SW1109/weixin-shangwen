<script setup lang="ts">
import { onLaunch } from '@dcloudio/uni-app'
import { useAuthStore } from '@/stores/auth'
import { useCartStore } from '@/stores/cart'

onLaunch(() => {
  const authStore = useAuthStore()
  const cartStore = useCartStore()

  authStore.hydrate()
  cartStore.hydrate()
})
</script>

<style lang="scss">
:root {
  --brand-color: #AC27ED;
  --brand-dark: #7A1FA8;
  --brand-deep: #52156F;
  --brand-cyan: #8B5CF6;
  --brand-light: #F4ECF8;
  --brand-soft: #EADCF2;
  --brand-gradient: linear-gradient(135deg, #AC27ED 0%, #C95BFF 100%);
  --brand-glow: 0 14rpx 34rpx rgba(172, 39, 237, 0.22);
  --page-bg: #F8F5FA;
  --surface-bg: #ffffff;
  --surface-bg-strong: rgba(255, 255, 255, 0.96);
  --surface-muted: #F3EEF7;
  --surface-line: #E8DDED;
  --surface-tech-line: rgba(31, 41, 51, 0.1);
  --text-primary: #25313b;
  --text-strong: #111827;
  --text-secondary: #5c6670;
  --text-muted: #6c7580;
  --danger-color: #d73f35;
  --warning-color: #c77800;
  --radius-card: 24rpx;
  --radius-button: 999rpx;
  --shadow-card: 0 14rpx 34rpx rgba(17, 24, 39, 0.08);
}

page {
  background: linear-gradient(180deg, #FCFAFD 0%, #F8F5FA 52%, #F3EEF7 100%);
  color: #25313b;
  font-size: 28rpx;
}

view,
text,
button,
input,
textarea {
  box-sizing: border-box;
}

button {
  min-height: 64rpx;
}

.page-shell {
  min-height: 100vh;
  padding: 24rpx;
}

.panel {
  background: #ffffff;
  border-radius: 24rpx;
  border: 2rpx solid rgba(31, 41, 51, 0.1);
  box-shadow: 0 14rpx 34rpx rgba(17, 24, 39, 0.08);
}

.section-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #25313b;
}

.section-subtitle {
  margin-top: 8rpx;
  font-size: 24rpx;
  color: #5c6670;
}
</style>
