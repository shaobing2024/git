export interface Category {
  id: string
  name: string
  count: number
}

export interface Project {
  id: string
  rank: number
  owner: string
  repo: string
  name: string
  description: string
  recommendation: string
  category: string
  tags: string[]
  stars: number
  forks: number
  updatedAt: string
  /** 雷达分（0-100），用于「雷达分」排序 */
  score?: number
}

/** 造物最前沿：精选 AI 产品 / 创意工具（非 GitHub 仓库） */
export interface FrontierItem {
  id: string
  rank: number
  name: string
  /** 官网地址 */
  url: string
  description: string
  recommendation: string
  category: string
  tags: string[]
  /** 雷达分（0-100），用于排序与推荐权重 */
  score: number
}

/** AI News：行业动态 / 信源速报 */
export interface NewsItem {
  id: string
  title: string
  /** 来源名称 */
  source: string
  /** 来源 / 原文链接 */
  url: string
  /** YYYY-MM-DD */
  date: string
  summary: string
  tag: string
}

/** AI News 顶部「信源」入口 */
export interface NewsSource {
  name: string
  url: string
}
