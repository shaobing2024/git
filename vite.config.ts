import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    // 本地沙盒的「安全删除」垫片会拦截 Vite 清空 dist 的 rm 调用导致构建失败；
    // 设为 false 后由 Bash 手动清理。CI 为全新 checkout，dist 不存在，不受影响。
    emptyOutDir: false,
  },
})
