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
/* #ifdef H5 */
:root {
  --brand-color: #AC27ED;
  --brand-dark: #7A1FA8;
  --brand-deep: #52156F;
  --brand-cyan: #8B5CF6;
  --brand-light: #F4ECF8;
  --brand-soft: #EADCF2;
  --brand-gradient: linear-gradient(135deg, #AC27ED 0%, #C95BFF 100%);
  --brand-glow: 0 14rpx 34rpx rgba(172, 39, 237, 0.22);
  --brand-glow-strong: 0 18rpx 42rpx rgba(172, 39, 237, 0.28);
  --page-bg: #F8F5FA;
  --surface-bg: #ffffff;
  --surface-bg-strong: rgba(255, 255, 255, 0.9);
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
  --shadow-card-hover: 0 22rpx 48rpx rgba(54, 20, 82, 0.13);
  --motion-fast: 160ms ease-out;
  --motion-base: 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
  --motion-slow: 520ms cubic-bezier(0.2, 0.8, 0.2, 1);
}
/* #endif */

page {
  background: linear-gradient(180deg, #FCFAFD 0%, #F8F5FA 52%, #F3EEF7 100%);
  color: #25313b;
  font-size: 28rpx;
}

/* #ifdef H5 */
uni-page-body {
  height: 100%;
  min-height: 100%;
}

uni-page-wrapper {
  box-sizing: border-box;
}
/* #endif */

view,
text,
button,
input,
textarea {
  box-sizing: border-box;
}

button {
  min-height: 64rpx;
  transform: translateZ(0);
  transition:
    transform 160ms ease-out,
    box-shadow 160ms ease-out,
    opacity 160ms ease-out;
}

button:active {
  transform: scale(0.97);
}

.page-shell {
  min-height: 100vh;
  padding: 24rpx;
  animation: pageRise 520ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.panel {
  position: relative;
  overflow: hidden;
  background: #ffffff;
  border-radius: 24rpx;
  border: 2rpx solid rgba(172, 39, 237, 0.08);
  box-shadow: 0 14rpx 34rpx rgba(17, 24, 39, 0.08);
  /* #ifdef H5 */
  backdrop-filter: blur(18rpx);
  /* #endif */
  transition:
    transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color 240ms cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.panel::before {
  position: absolute;
  top: 0;
  right: 24rpx;
  left: 24rpx;
  height: 2rpx;
  background: linear-gradient(90deg, transparent, rgba(172, 39, 237, 0.38), transparent);
  content: '';
  opacity: 0.82;
}

.panel:active {
  transform: translateY(-2rpx) scale(0.995);
  border-color: rgba(172, 39, 237, 0.16);
  box-shadow: 0 18rpx 42rpx rgba(54, 20, 82, 0.12);
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

.motion-fade-up {
  animation: fadeUp 520ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.motion-pop {
  animation: popIn 340ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.login-box,
.user-card,
.order-stats,
.menu-list,
.form-section,
.address-section,
.dishes-section,
.remark-section,
.amount-section,
.status-card,
.section,
.info-card,
.category-item,
.stats-card,
.section-card,
.cart-item,
.address-wrap,
.dialog-container,
.bottom-bar,
.bottom-actions,
.submit-container,
.add-btn-wrapper,
.date-range,
.top-bar,
.categories,
.tabs {
  transform: translateZ(0);
  animation: surfaceIn 460ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}

.login-box,
.user-card,
.order-stats,
.menu-list,
.form-section,
.address-section,
.dishes-section,
.remark-section,
.amount-section,
.status-card,
.section,
.info-card,
.stats-card,
.section-card,
.cart-item,
.address-card,
.dialog-container,
.dish-card,
.order-card,
.metric-card,
.hero-card,
.range-panel,
.loading-panel,
.analysis-card,
.order-status-card,
.function-card,
.top-dishes-card,
.recent-orders-card,
.category-page .category-item,
.dish-detail-page .dish-info,
.dish-detail-page .detail-section,
.dish-detail-page .stats-section {
  border: 2rpx solid rgba(172, 39, 237, 0.09) !important;
  background:
    radial-gradient(circle at 88% 6%, rgba(40, 215, 255, 0.13), transparent 34%),
    linear-gradient(135deg, rgba(172, 39, 237, 0.07), rgba(255, 255, 255, 0.94) 48%),
    rgba(255, 255, 255, 0.92) !important;
  box-shadow:
    0 16rpx 38rpx rgba(54, 20, 82, 0.08),
    inset 0 0 0 1rpx rgba(255, 255, 255, 0.62) !important;
}

/* 深色信息卡改为浅色玻璃底后，强制文字回到可读色。 */
.profile-page .user-card,
.order-detail-page .status-card,
.merchant-order-detail-page .status-card {
  color: #25313b !important;
}

.profile-page .user-card,
.order-detail-page .status-card {
  margin: 20rpx !important;
  border-radius: 30rpx !important;
}

.profile-page .nickname,
.order-detail-page .status-text,
.merchant-order-detail-page .status-title {
  color: #111827 !important;
}

.profile-page .phone,
.profile-page .edit-tip,
.order-detail-page .status-desc,
.merchant-order-detail-page .status-desc {
  color: #5c6670 !important;
  opacity: 1 !important;
}

.profile-page .avatar {
  border-color: rgba(172, 39, 237, 0.14) !important;
  background:
    linear-gradient(135deg, rgba(244, 236, 248, 0.9), rgba(255, 255, 255, 0.8)) !important;
  box-shadow: 0 10rpx 24rpx rgba(54, 20, 82, 0.1);
}

.btn-add,
.btn-category,
.btn-login,
.btn-logout,
.category-tag,
.range-item,
.stats-item,
.menu-item,
.ranking-item,
.action-btn,
.dialog-btn,
.action-button,
.save-btn,
.submit-button,
.btn-submit,
.add-button,
.checkout-button,
.clear-button,
.cart-item,
.address-wrap {
  transition:
    transform 160ms ease-out,
    box-shadow 160ms ease-out,
    border-color 160ms ease-out,
    opacity 160ms ease-out;
}

.btn-add:active,
.btn-category:active,
.btn-login:active,
.btn-logout:active,
.category-tag:active,
.range-item:active,
.stats-item:active,
.menu-item:active,
.ranking-item:active,
.action-btn:active,
.dialog-btn:active,
.action-button:active,
.save-btn:active,
.submit-button:active,
.btn-submit:active,
.add-button:active,
.checkout-button:active,
.clear-button:active,
.cart-item:active,
.address-wrap:active {
  transform: translateY(-2rpx) scale(0.98);
}

.form-section:nth-child(2),
.section:nth-child(2),
.info-card:nth-child(2),
.category-item:nth-child(2),
.stats-card:nth-child(2),
.section-card:nth-child(2),
.cart-item:nth-child(2),
.address-wrap:nth-child(2),
.menu-item:nth-child(2),
.ranking-item:nth-child(2) {
  animation-delay: 40ms;
}

.form-section:nth-child(3),
.section:nth-child(3),
.info-card:nth-child(3),
.category-item:nth-child(3),
.stats-card:nth-child(3),
.section-card:nth-child(3),
.cart-item:nth-child(3),
.address-wrap:nth-child(3),
.menu-item:nth-child(3),
.ranking-item:nth-child(3) {
  animation-delay: 80ms;
}

.form-section:nth-child(4),
.section:nth-child(4),
.info-card:nth-child(4),
.category-item:nth-child(4),
.stats-card:nth-child(4),
.section-card:nth-child(4),
.cart-item:nth-child(4),
.address-wrap:nth-child(4),
.menu-item:nth-child(4),
.ranking-item:nth-child(4) {
  animation-delay: 120ms;
}

.dialog-mask {
  animation: overlayFade 180ms ease-out both;
}

@keyframes pageRise {
  from {
    opacity: 0;
    transform: translateY(18rpx);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(20rpx) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes surfaceIn {
  from {
    opacity: 0;
    transform: translateY(18rpx) scale(0.985);
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes overlayFade {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

@keyframes popIn {
  0% {
    opacity: 0;
    transform: scale(0.92);
  }

  100% {
    opacity: 1;
    transform: scale(1);
  }
}

/* #ifdef H5 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: 1ms !important;
  }
}
/* #endif */
</style>
