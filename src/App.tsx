import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BookOpen,
  Bot,
  Boxes,
  Cpu,
  Database,
  ExternalLink,
  FileCode,
  Flame,
  FolderGit2,
  GitFork,
  Globe,
  Layers,
  LayoutGrid,
  Newspaper,
  Palette,
  Puzzle,
  Radio,
  Share2,
  Shield,
  Sparkles,
  Star,
  Zap,
} from 'lucide-react'
import type {
  Category,
  FrontierItem,
  NewsItem,
  NewsSource,
  Project,
} from './types'

const navItems = [
  { id: 'github', icon: FolderGit2, label: 'GitHub 精选' },
  { id: 'frontier', icon: Flame, label: '造物最前沿' },
  { id: 'ainews', icon: Newspaper, label: 'AI News' },
]

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  tools: Boxes,
  tutorials: BookOpen,
  'ai-agent': Bot,
  'model-deploy': Cpu,
  multimodal: Sparkles,
  workflow: Zap,
  eval: Activity,
  data: Database,
  framework: FileCode,
  design: Palette,
  productivity: LayoutGrid,
  security: Shield,
  skill: Puzzle,
}

const frontierIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  chat: Bot,
  image: Sparkles,
  video: Zap,
  dev: FileCode,
  search: Globe,
  office: LayoutGrid,
}

const sectionMeta: Record<string, { subtitle: string }> = {
  frontier: { subtitle: '为创造者精选值得一试的 AI 产品与创意工具。' },
  github: { subtitle: '为创造者持续筛选值得试用、学习和二创的 GitHub 项目。' },
  ainews: { subtitle: '聚合权威信源，追踪 AI 领域每日关键动态。' },
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

function formatDate(date: string): string {
  // 显式按本地时区解析 YYYY-MM-DD，避免 new Date 按 UTC 解析导致的跨天偏移
  const [y, m, d] = date.split('-').map(Number)
  const local = new Date(y, (m || 1) - 1, d || 1)
  return `${String(local.getMonth() + 1).padStart(2, '0')}/${String(local.getDate()).padStart(2, '0')}`
}

function App() {
  const [projects, setProjects] = useState<Project[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [frontierItems, setFrontierItems] = useState<FrontierItem[]>([])
  const [frontierCategories, setFrontierCategories] = useState<Category[]>([])
  const [newsItems, setNewsItems] = useState<NewsItem[]>([])
  const [newsSources, setNewsSources] = useState<NewsSource[]>([])
  const [lastUpdated, setLastUpdated] = useState<string>('')
  const [frontierUpdatedAt, setFrontierUpdatedAt] = useState<string>('')
  const [newsUpdatedAt, setNewsUpdatedAt] = useState<string>('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [sort, setSort] = useState('最新')
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState('github')
  const [onlyWanxing, setOnlyWanxing] = useState(false)

  useEffect(() => {
    const base = import.meta.env.BASE_URL
    let done = 0
    const finish = () => {
      done += 1
      if (done === 3) setLoading(false)
    }
    fetch(`${base}projects.json`)
      .then((r) => r.json())
      .then((d) => {
        setProjects(d.projects)
        setCategories(d.categories)
        setLastUpdated(d.lastUpdated ?? '')
        finish()
      })
      .catch(finish)
    fetch(`${base}frontier.json`)
      .then((r) => r.json())
      .then((d) => {
        setFrontierItems(d.items)
        setFrontierCategories(d.categories)
        setFrontierUpdatedAt(d.lastUpdated ?? '')
        finish()
      })
      .catch(finish)
    fetch(`${base}news.json`)
      .then((r) => r.json())
      .then((d) => {
        setNewsItems(d.items)
        setNewsSources(d.sources)
        setNewsUpdatedAt(d.lastUpdated ?? '')
        finish()
      })
      .catch(finish)
  }, [])

  function switchSection(id: string) {
    setActiveSection(id)
    setActiveCategory('all')
    setSort('最新')
  }

  // GitHub 精选过滤（支持「仅看万星」）
  const baseList = useMemo(
    () => (onlyWanxing ? projects.filter((p) => p.stars > 10000) : projects),
    [projects, onlyWanxing],
  )
  const catCounts = useMemo(() => {
    const m: Record<string, number> = {}
    baseList.forEach((p) => {
      m[p.category] = (m[p.category] || 0) + 1
    })
    return m
  }, [baseList])

  const filtered = useMemo(() => {
    const list =
      activeCategory === 'all'
        ? baseList
        : baseList.filter((p) => p.category === activeCategory)
    if (sort === 'Stars') return [...list].sort((a, b) => b.stars - a.stars)
    if (sort === '雷达分')
      return [...list].sort(
        (a, b) => (b.score ?? b.stars) - (a.score ?? a.stars),
      )
    return [...list].sort(
      (a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt),
    )
  }, [baseList, activeCategory, sort])

  // 造物最前沿过滤
  const frontierFiltered = useMemo(() => {
    const list =
      activeCategory === 'all'
        ? frontierItems
        : frontierItems.filter((p) => p.category === activeCategory)
    if (sort === '雷达分') return [...list].sort((a, b) => b.score - a.score)
    return [...list].sort((a, b) => a.rank - b.rank)
  }, [frontierItems, activeCategory, sort])

  // AI News 按日期排序
  const newsSorted = useMemo(
    () => [...newsItems].sort((a, b) => +new Date(b.date) - +new Date(a.date)),
    [newsItems],
  )

  const total = baseList.length
  const currentCount =
    activeCategory === 'all' ? total : catCounts[activeCategory] ?? 0
  const latestDate = baseList.reduce(
    (max, p) => (p.updatedAt > max ? p.updatedAt : max),
    '',
  )

  async function handleShare(p: Project) {
    const url = `https://github.com/${p.name}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(p.id)
      setTimeout(() => setCopiedId((id) => (id === p.id ? null : id)), 1500)
    } catch {
      // 剪贴板不可用时静默失败
    }
  }

  const sectionTitle =
    navItems.find((n) => n.id === activeSection)?.label ?? 'GitHub 精选'

  return (
    <div className="min-h-screen flex">
      <a href="#main" className="skip-link">
        跳到主内容
      </a>
      {/* Sidebar */}
      <aside className="w-16 lg:w-20 border-r border-card-border bg-white/50 sticky top-0 h-screen flex flex-col items-center py-6 z-20">
        <div className="mb-8 p-2 bg-ink text-paper rounded-lg">
          <Globe className="w-5 h-5" />
        </div>
        <nav className="flex flex-col gap-6">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeSection === item.id
            return (
              <button
                key={item.id}
                title={item.label}
                onClick={() => switchSection(item.id)}
                className={`p-2.5 min-h-[44px] min-w-[44px] rounded-xl transition-colors ${
                  isActive
                    ? 'bg-accent-soft text-accent'
                    : 'text-muted hover:bg-card-border/40 hover:text-ink'
                }`}
              >
                <Icon className="w-5 h-5" />
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main */}
      <main id="main" className="flex-1 min-w-0">
        {/* Header */}
        <header className="px-6 lg:px-10 py-8 border-b border-card-border">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div>
              <h1 className="font-display text-4xl lg:text-5xl font-bold tracking-tight text-ink">
                {sectionTitle}
              </h1>
              <p className="mt-2 text-muted text-base lg:text-lg">
                {sectionMeta[activeSection]?.subtitle}
              </p>
            </div>
            <div className="flex gap-8 text-sm">
              {activeSection === 'github' && (
                <>
                  <div className="text-right">
                    <div className="text-muted text-xs uppercase tracking-wider">
                      总收录
                    </div>
                    <div className="text-2xl font-semibold text-ink">
                      {formatNumber(total)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted text-xs uppercase tracking-wider">
                      当前类目
                    </div>
                    <div className="text-2xl font-semibold text-ink">
                      {currentCount}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted text-xs uppercase tracking-wider">
                      数据更新于
                    </div>
                    <div className="text-2xl font-semibold text-ink">
                      {lastUpdated
                        ? lastUpdated.replace(/-/g, '/')
                        : latestDate
                          ? latestDate.replace(/-/g, '/')
                          : '—'}
                    </div>
                  </div>
                </>
              )}
              {activeSection === 'frontier' && (
                <>
                  <div className="text-right">
                    <div className="text-muted text-xs uppercase tracking-wider">
                      收录产品
                    </div>
                    <div className="text-2xl font-semibold text-ink">
                      {frontierItems.length}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted text-xs uppercase tracking-wider">
                      分类
                    </div>
                    <div className="text-2xl font-semibold text-ink">
                      {frontierCategories.length}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted text-xs uppercase tracking-wider">
                      数据更新于
                    </div>
                    <div className="text-2xl font-semibold text-ink">
                      {frontierUpdatedAt
                        ? frontierUpdatedAt.replace(/-/g, '/')
                        : '—'}
                    </div>
                  </div>
                </>
              )}
              {activeSection === 'ainews' && (
                <>
                  <div className="text-right">
                    <div className="text-muted text-xs uppercase tracking-wider">
                      动态
                    </div>
                    <div className="text-2xl font-semibold text-ink">
                      {newsItems.length}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted text-xs uppercase tracking-wider">
                      信源
                    </div>
                    <div className="text-2xl font-semibold text-ink">
                      {newsSources.length}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-muted text-xs uppercase tracking-wider">
                      数据更新于
                    </div>
                    <div className="text-2xl font-semibold text-ink">
                      {newsUpdatedAt ? newsUpdatedAt.replace(/-/g, '/') : '—'}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {activeSection === 'github' && (
          <>
            <div className="px-6 lg:px-10 py-5 border-b border-card-border overflow-x-auto">
              <div className="flex gap-2 min-w-max">
                {[{ id: 'all', name: '全部', count: total }, ...categories].map(
                  (cat) => {
                    const Icon =
                      cat.id === 'all' ? Layers : iconMap[cat.id] ?? Layers
                    const isActive = activeCategory === cat.id
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm border transition-all ${
                          isActive
                            ? 'bg-ink text-paper border-ink'
                            : 'bg-white border-card-border text-ink hover:border-muted'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{cat.name}</span>
                        <span
                          className={`ml-1 text-xs ${
                            isActive ? 'text-paper/70' : 'text-muted'
                          }`}
                        >
                          {cat.id === 'all' ? total : (catCounts[cat.id] ?? 0)}
                        </span>
                      </button>
                    )
                  },
                )}
              </div>
            </div>

            {/* Toolbar */}
            <div className="px-6 lg:px-10 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
                <span className="w-1 h-5 bg-accent rounded-full" />
                最新精选
              </h2>
              <div className="flex items-center gap-2 bg-white border border-card-border rounded-lg p-1">
                <button
                  onClick={() => setOnlyWanxing((v) => !v)}
                  title="只显示 star 数超过 1 万的项目"
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors flex items-center gap-1.5 ${
                    onlyWanxing ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                  }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  仅看万星
                </button>
                {['最新', '雷达分', 'Stars'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      sort === s ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="px-6 lg:px-10 pb-12">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-64 bg-white border border-card-border rounded-2xl animate-pulse"
                    />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center text-muted">
                  <Layers className="w-8 h-8 mb-3 opacity-40" />
                  <p>该类目下暂无项目，欢迎在 scripts/repos.json 中添加。</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filtered.map((p) => (
                    <article
                      key={p.id}
                      className="group bg-white border border-card-border rounded-2xl p-5 hover:shadow-sm transition-shadow flex flex-col"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-accent font-display font-bold text-lg leading-none">
                          #{String(p.rank).padStart(2, '0')}
                        </span>
                        {p.stars > 10000 && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-accent-soft text-accent border border-accent/20 whitespace-nowrap">
                            <Flame className="w-3 h-3" />
                            万星+
                          </span>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-ink truncate group-hover:text-accent transition-colors">
                            <a
                              href={`https://github.com/${p.name}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {p.name}
                            </a>
                          </h3>
                        </div>
                      </div>

                      <p className="text-sm text-muted leading-relaxed mb-4 line-clamp-3">
                        {p.description}
                      </p>

                      <div className="bg-accent-soft border border-accent/10 rounded-xl p-3 mb-4">
                        <div className="text-xs font-medium text-accent mb-1">
                          推荐理由
                        </div>
                        <p className="text-sm text-ink leading-relaxed line-clamp-3">
                          {p.recommendation}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4 mt-auto">
                        {p.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-card-border/40 text-muted border border-card-border"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-card-border text-sm text-muted">
                        <div className="flex items-center gap-4">
                          <span
                            className="flex items-center gap-1.5"
                            title="Stars"
                          >
                            <Star className="w-3.5 h-3.5" />
                            {formatNumber(p.stars)}
                          </span>
                          <span
                            className="flex items-center gap-1.5"
                            title="Forks"
                          >
                            <GitFork className="w-3.5 h-3.5" />
                            {formatNumber(p.forks)}
                          </span>
                          <span title="更新时间">{formatDate(p.updatedAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleShare(p)}
                            className="flex items-center gap-1.5 px-2 py-1.5 rounded-md hover:bg-card-border/40 text-muted hover:text-ink transition-colors"
                            aria-label="复制链接"
                            title={copiedId === p.id ? '已复制链接' : '复制链接'}
                          >
                            {copiedId === p.id ? (
                              <span className="text-xs text-accent">已复制</span>
                            ) : (
                              <Share2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeSection === 'frontier' && (
          <>
            <div className="px-6 lg:px-10 py-5 border-b border-card-border overflow-x-auto">
              <div className="flex gap-2 min-w-max">
                {[
                  { id: 'all', name: '全部', count: frontierItems.length },
                  ...frontierCategories,
                ].map((cat) => {
                  const Icon =
                    cat.id === 'all'
                      ? Layers
                      : frontierIconMap[cat.id] ?? Layers
                  const isActive = activeCategory === cat.id
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm border transition-all ${
                        isActive
                          ? 'bg-ink text-paper border-ink'
                          : 'bg-white border-card-border text-ink hover:border-muted'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{cat.name}</span>
                      <span
                        className={`ml-1 text-xs ${
                          isActive ? 'text-paper/70' : 'text-muted'
                        }`}
                      >
                        {formatNumber(cat.count)}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Toolbar */}
            <div className="px-6 lg:px-10 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
                <span className="w-1 h-5 bg-accent rounded-full" />
                精选产品
              </h2>
              <div className="flex items-center gap-2 bg-white border border-card-border rounded-lg p-1">
                {['最新', '雷达分'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSort(s)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                      sort === s ? 'bg-ink text-paper' : 'text-muted hover:text-ink'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid */}
            <div className="px-6 lg:px-10 pb-12">
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-64 bg-white border border-card-border rounded-2xl animate-pulse"
                    />
                  ))}
                </div>
              ) : frontierFiltered.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center text-muted">
                  <Layers className="w-8 h-8 mb-3 opacity-40" />
                  <p>该类目下暂无产品。</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {frontierFiltered.map((p) => (
                    <article
                      key={p.id}
                      className="group bg-white border border-card-border rounded-2xl p-5 hover:shadow-sm transition-shadow flex flex-col"
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <span className="text-accent font-display font-bold text-lg leading-none">
                          #{String(p.rank).padStart(2, '0')}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-ink truncate group-hover:text-accent transition-colors">
                            <a href={p.url} target="_blank" rel="noopener noreferrer">
                              {p.name}
                            </a>
                          </h3>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent-soft text-accent font-medium">
                          雷达 {p.score}
                        </span>
                      </div>

                      <p className="text-sm text-muted leading-relaxed mb-4 line-clamp-3">
                        {p.description}
                      </p>

                      <div className="bg-accent-soft border border-accent/10 rounded-xl p-3 mb-4">
                        <div className="text-xs font-medium text-accent mb-1">
                          推荐理由
                        </div>
                        <p className="text-sm text-ink leading-relaxed line-clamp-3">
                          {p.recommendation}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 mb-4 mt-auto">
                        {p.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs bg-card-border/40 text-muted border border-card-border"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="pt-4 border-t border-card-border">
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-ink text-paper text-sm font-medium hover:opacity-90 transition-opacity"
                        >
                          <ExternalLink className="w-4 h-4" />
                          访问官网
                        </a>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeSection === 'ainews' && (
          <>
            {/* 信源 */}
            <div className="px-6 lg:px-10 py-5 border-b border-card-border overflow-x-auto">
              <div className="flex items-center gap-2 min-w-max">
                <span className="text-xs text-muted mr-1 flex items-center gap-1.5">
                  <Radio className="w-3.5 h-3.5" />
                  信源
                </span>
                {newsSources.map((s) => (
                  <a
                    key={s.name}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-2 rounded-full text-sm border border-card-border bg-white text-ink hover:border-accent hover:text-accent transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {s.name}
                  </a>
                ))}
              </div>
            </div>

            {/* 动态列表 */}
            <div className="px-6 lg:px-10 pb-12">
              <h2 className="text-lg font-semibold text-ink flex items-center gap-2 py-4">
                <span className="w-1 h-5 bg-accent rounded-full" />
                近期动态
              </h2>
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-24 bg-white border border-card-border rounded-2xl animate-pulse"
                    />
                  ))}
                </div>
              ) : newsSorted.length === 0 ? (
                <div className="py-24 flex flex-col items-center justify-center text-muted">
                  <Radio className="w-8 h-8 mb-3 opacity-40" />
                  <p>暂无动态。</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {newsSorted.map((n) => (
                    <article
                      key={n.id}
                      className="group bg-white border border-card-border rounded-2xl p-5 hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-accent-soft text-accent font-medium">
                          {n.tag}
                        </span>
                        <span className="text-xs text-muted">
                          {n.source} · {formatDate(n.date)}
                        </span>
                      </div>
                      <h3 className="font-semibold text-ink text-lg mb-1.5 group-hover:text-accent transition-colors">
                        <a href={n.url} target="_blank" rel="noopener noreferrer">
                          {n.title}
                        </a>
                      </h3>
                      <p className="text-sm text-muted leading-relaxed">
                        {n.summary}
                      </p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}

export default App
