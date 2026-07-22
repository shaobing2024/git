# GitHub 精选

一个参考「造物雷达」风格的中文 GitHub 项目精选站，用于采集高星开源项目并配置中文说明，最终部署在 GitHub Pages 上。

## 在线预览

<https://<你的用户名>.github.io/github-curated>

> 部署前请将 `package.json` 和 `vite.config.ts` 中的 `<username>` 替换为你的 GitHub 用户名或组织名。

## 本地开发

```bash
cd github-curated
npm install
npm run dev
```

## 数据采集

项目数据保存在 `scripts/repos.json`，你可以手动维护项目列表和中文说明。

如果需要自动从 GitHub API 同步最新的 stars / forks / updatedAt，运行：

```bash
cd github-curated
GITHUB_TOKEN=你的_Personal_Access_Token npm run fetch
```

> `GITHUB_TOKEN` 不是必须的，但建议配置，否则容易触发 GitHub API 速率限制。

同步完成后会生成 `public/projects.json`，前端页面会读取该文件渲染。

## 部署到 GitHub Pages

1. 在 GitHub 新建仓库 `github-curated`。
2. 将本项目推送到该仓库的 `main` 分支。
3. 进入仓库 **Settings → Pages → Build and deployment**，选择 **GitHub Actions**。
4. 每次推送到 `main` 分支都会自动构建并部署。

## 项目结构

```
github-curated/
├── .github/workflows/deploy.yml   # GitHub Pages 自动部署
├── public/projects.json           # 前端渲染数据
├── scripts/
│   ├── repos.json                 # 仓库列表与中文配置
│   └── fetch-projects.js          # GitHub API 采集脚本
├── src/
│   ├── App.tsx                    # 主页面
│   ├── types.ts                   # TypeScript 类型
│   └── index.css                  # Tailwind 入口
├── index.html
├── package.json
├── tailwind.config.js
└── vite.config.ts
```

## 自定义

- 修改 `scripts/repos.json` 增删项目或分类。
- 修改 `src/App.tsx` 调整界面布局。
- 修改 `tailwind.config.js` 和 `src/index.css` 调整颜色、字体等视觉风格。

## 许可证

MIT
