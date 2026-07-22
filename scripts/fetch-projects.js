#!/usr/bin/env node
/**
 * GitHub 项目数据采集脚本 (ESM)
 *
 * 用法:
 *   GITHUB_TOKEN=<token> node scripts/fetch-projects.js
 *
 * 说明:
 *   1. 读取 scripts/repos.json 中维护的仓库列表和中文配置。
 *   2. 调用 GitHub API 获取最新 stars / forks / updatedAt。
 *   3. 生成 public/projects.json 供前端使用。
 *
 * 注意:
 *   未提供 GITHUB_TOKEN 时，受每小时 60 次请求限制；
 *   提供 Token 后，限制放宽到每小时 5000 次。
 */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || ''
const BASE_DIR = path.resolve(__dirname, '..')
const REPOS_FILE = path.join(BASE_DIR, 'scripts', 'repos.json')
const OUTPUT_FILE = path.join(BASE_DIR, 'public', 'projects.json')

async function fetchRepo(owner, repo) {
  const url = `https://api.github.com/repos/${owner}/${repo}`
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'github-curated-fetcher',
  }
  if (GITHUB_TOKEN) headers.Authorization = `Bearer ${GITHUB_TOKEN}`

  const res = await fetch(url, { headers })
  if (!res.ok) {
    throw new Error(`GitHub API error for ${owner}/${repo}: ${res.status} ${await res.text()}`)
  }
  return res.json()
}

async function main() {
  if (!fs.existsSync(REPOS_FILE)) {
    console.error(`找不到仓库配置文件: ${REPOS_FILE}`)
    process.exit(1)
  }

  const repos = JSON.parse(fs.readFileSync(REPOS_FILE, 'utf-8'))
  const categories = repos.categories
  const projects = []

  for (let i = 0; i < repos.projects.length; i++) {
    const meta = repos.projects[i]
    const [owner, repo] = meta.name.split('/')
    try {
      const data = await fetchRepo(owner, repo)
      projects.push({
        id: meta.id,
        rank: i + 1,
        owner,
        repo,
        name: meta.name,
        description: meta.description,
        recommendation: meta.recommendation,
        category: meta.category,
        tags: meta.tags,
        stars: data.stargazers_count,
        forks: data.forks_count,
        updatedAt: data.updated_at.split('T')[0],
        score: meta.score,
      })
      console.log(`✓ ${meta.name}: ${data.stargazers_count} stars`)
    } catch (err) {
      console.error(`✗ ${meta.name}: ${err.message}`)
      // 使用 repos.json 中的静态数据兜底
      projects.push({
        id: meta.id,
        rank: i + 1,
        owner,
        repo,
        name: meta.name,
        description: meta.description,
        recommendation: meta.recommendation,
        category: meta.category,
        tags: meta.tags,
        stars: meta.stars || 0,
        forks: meta.forks || 0,
        updatedAt: meta.updatedAt || new Date().toISOString().split('T')[0],
        score: meta.score,
      })
    }
  }

  // 按实际生成的项目数重算每个分类的 count，避免与 repos.json 里写死的数值脱节
  const countedCategories = categories.map((c) => ({
    ...c,
    count: projects.filter((p) => p.category === c.id).length,
  }))
  const now = new Date()
  const lastUpdated = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  const output = { categories: countedCategories, projects, lastUpdated }
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2) + '\n', 'utf-8')
  console.log(`\n已生成 ${OUTPUT_FILE}，共 ${projects.length} 个项目。`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
