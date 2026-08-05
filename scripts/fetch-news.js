#!/usr/bin/env node
/**
 * 抓取中文 AI 资讯 RSS，聚合生成 public/news.json
 * 用法: node scripts/fetch-news.js
 * 结构兼容前端 src/App.tsx 的 news.json 读取（items: id/title/source/url/date/summary/tag）
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// 多个候选 URL：依次尝试，第一个成功即用（容错）
const SOURCES = [
  { name: '量子位', urls: ['https://www.qbitai.com/feed'] },
  { name: 'Hugging Face Blog', urls: ['https://huggingface.co/blog/feed.xml'] },
  {
    name: '机器之心',
    urls: [
      'https://www.jiqizhixin.com/feed',
      'https://www.jiqizhixin.com/rss',
      'https://jiqizhixin.com/feed',
    ],
  },
  { name: 'AIbase', urls: ['https://www.aibase.com/zh/feed', 'https://www.aibase.com/feed'] },
]

// 简单关键词打标，保持前端 tag 样式
const TAG_RULES = {
  开源: ['开源', 'open source', 'llama', 'hugging', 'model release', '开源模型'],
  大模型: ['gpt', 'claude', 'gemini', '大模型', 'llm', 'model', 'gpt-', 'o1', 'o3'],
  Agent: ['agent', '智能体', 'computer use', '工具调用', '工作流'],
  多模态: ['多模态', 'multimodal', 'vision', '图像', '视频', '文生图', '文生视频'],
}

function tagOf(text) {
  const t = (text || '').toLowerCase()
  for (const [tag, kws] of Object.entries(TAG_RULES)) {
    if (kws.some((k) => t.includes(k))) return tag
  }
  return 'AI'
}

function stripTags(html) {
  return (html || '')
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parseFeed(xml, sourceName) {
  // 同时支持 RSS(<item>) 与 Atom(<entry>)
  const blocks =
    xml.match(/<item[\s\S]*?<\/item>/gi) ||
    xml.match(/<entry[\s\S]*?<\/entry>/gi) ||
    []
  const out = []
  for (const b of blocks) {
    const pick = (tag) => {
      const m = b.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'))
      return m ? stripTags(m[1]) : ''
    }
    const title = pick('title')
    if (!title) continue
    // link: RSS => <link>url</link>；Atom => <link href="url"/>
    let link =
      pick('link') ||
      (b.match(/<link[^>]*href="([^"]+)"/i) || [])[1] ||
      ''
    const pub = pick('pubDate') || pick('updated') || pick('published') || pick('dc:date')
    const desc =
      pick('description') || pick('summary') || pick('content') || pick('content:encoded')
    const d = pub ? new Date(pub) : new Date()
    const dateStr = isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
    out.push({
      id: 'n-' + Buffer.from(link || title).toString('hex').slice(0, 12),
      title: title.slice(0, 120),
      source: sourceName,
      url: link,
      date: dateStr,
      summary: desc.slice(0, 140),
      tag: tagOf(title + ' ' + desc),
    })
  }
  return out
}

async function fetchSource(src) {
  for (const url of src.urls) {
    try {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), 12000)
      const r = await fetch(url, {
        signal: ctrl.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; github-curated-news-fetcher)' },
      })
      clearTimeout(timer)
      if (!r.ok) {
        console.warn(`  [${src.name}] ${url} -> HTTP ${r.status}，尝试下一个`)
        continue
      }
      const xml = await r.text()
      const items = parseFeed(xml, src.name)
      if (items.length) {
        console.log(`  [${src.name}] ${url} -> ${items.length} 条`)
        return items
      }
      console.warn(`  [${src.name}] ${url} 解析为空，尝试下一个`)
    } catch (e) {
      console.warn(`  [${src.name}] ${url} 失败: ${e.message}`)
    }
  }
  return []
}

;(async () => {
  console.log('抓取 AI 新闻 RSS ...')
  let all = []
  for (const src of SOURCES) {
    const items = await fetchSource(src)
    all = all.concat(items)
  }
  // 去重（按 url）
  const seen = new Set()
  all = all.filter((it) => {
    if (!it.url || seen.has(it.url)) return false
    seen.add(it.url)
    return true
  })
  // 按日期降序，取前 12 条
  all.sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  const items = all.slice(0, 12)

  const out = {
    lastUpdated: new Date().toISOString().slice(0, 10),
    sources: SOURCES.map((s) => ({ name: s.name, url: s.urls[0] })),
    items,
  }

  const target = path.join(__dirname, '..', 'public', 'news.json')
  fs.writeFileSync(target, JSON.stringify(out, null, 2) + '\n', 'utf8')
  console.log(`完成：写入 ${items.length} 条 -> ${path.relative(process.cwd(), target)}`)
  if (!items.length) {
    console.error('警告：未抓到任何新闻，news.json 未更新（保持原样）')
    process.exit(1)
  }
})()
