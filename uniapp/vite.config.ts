/*
 * @Author: wxs
 * @Date: 2026-06-02 08:52:27
 * @LastEditTime: 2026-06-02 08:52:39
 * @LastEditors: wxs
 * @FilePath: /shangwen/weixin-shangwen/uniapp/vite.config.ts
 * @Description: Vite 本地开发配置
 */
import { defineConfig, loadEnv } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const proxyTarget = env.VITE_DEV_SERVER_PROXY_TARGET

  return {
    plugins: [uni()],
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true,
      open: true,
      ...(proxyTarget
        ? {
            proxy: {
              '/api': {
                target: proxyTarget,
                changeOrigin: true,
                secure: false,
              },
            },
          }
        : {}),
    },
  }
})
