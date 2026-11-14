/**
 * statsCore.mjs — 统计页纯逻辑：按展示分类（genre）汇总书籍数量 + 阅读时长文案。
 *
 * 与 continueReadingCore.mjs 同模式：不依赖 Vue/构建环境，供 StatsPage.vue
 * 与 node --test 直测共享。数据口径与首页一致——groupBooks 两侧合计恰好
 * 覆盖全部书目（显式 genre 只归属注册的一侧，未归类按 category 兜底），
 * 因此分类行计数之和恒等于总书籍数，页面数字不会打架。
 */

import { groupBooks } from '../genres-registry.mjs'

/** 统计页兜底行文案：两侧行内统一叫「未分类」。
 * 不复用 nav 的 FALLBACK（「其他」/「电子书」），避免统计页出现与分区标题重名的行。 */
const UNCATEGORIZED = '未分类'

/** @typedef {{ key: string | null, icon: string, label: string, count: number }} StatsRow */

/**
 * 把 groupBooks 的分组结果压成统计行；key 为 null 表示未分类兜底组。
 * @param {{ slug: string, title: string, category?: string, genre?: string }[]} books
 * @returns {{ total: number, group: StatsRow[], top: StatsRow[] }}
 */
export function categoryStats(books) {
  const toRows = groups =>
    groups.map(g =>
      g.genre
        ? { key: g.genre.key, icon: g.genre.icon, label: g.genre.label, count: g.books.length }
        : { key: null, icon: '📦', label: UNCATEGORIZED, count: g.books.length },
    )
  return {
    total: books.length,
    group: toRows(groupBooks(books, 'group')),
    top: toRows(groupBooks(books, 'top')),
  }
}

/**
 * 分钟数 → 展示文案：不足 1 小时按分，超出部分 ≤30 分钟折半、>30 向上取整。
 * 实现自 HomePage.vue 抽出共享，保证首页与统计页数字同口径。
 * @param {number} min
 * @returns {string}
 */
export function formatMinutes(min) {
  if (min < 60) return `${min} 分`
  const hours = Math.floor(min / 60)
  const rest = min % 60
  if (rest === 0) return `${hours} 小时`
  if (rest <= 30) return `${hours}½ 小时`
  return `${hours + 1} 小时`
}
