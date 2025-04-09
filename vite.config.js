import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import legacyPlugin from '@vitejs/plugin-legacy'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  build: {
    modulePreload: false, // 添加: 确保打包后不使用module模式
  },
  plugins: [
    vue(),
    legacyPlugin({
      targets: ['chrome 52'],  // 需要兼容的目标列表，可以设置多个
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'] // 面向IE11时需要此插件
    })]
})
