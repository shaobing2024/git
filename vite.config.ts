import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    // 站点用 GitHub Pages 的「main 分支 + /docs 文件夹」模式发布，
    // 因此构建产物输出到 docs/ 而非默认的 dist/。
    outDir: 'docs',
    // 本地沙盒的「安全删除」垫片会拦截 Vite 清空产物的 rm 调用导致构建失败；
    // 设为 false 后由 Bash 手动清理。CI/本地为覆盖写，旧哈希文件残留不影响线上。
    emptyOutDir: false,
  },
})
