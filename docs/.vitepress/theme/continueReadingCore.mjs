/**
 * continueReadingCore.mjs — 「继续阅读」选章纯逻辑（无 window/DOM 依赖）。
 *
 * 与 readingProgressCore.mjs 同一约定：进度表以章节归一化路径为 key
 * （如 /books/ta-de-guo/04-第01章），值含 scrollRatio / maxScrollRatio / updatedAt。
 * 抽成纯模块以便 node --test 直测（组件侧只做渲染）。
 */

import { statusOf } from './readingProgressCore.mjs'

/**
 * 从进度表中选出「继续阅读」目标章节：
 * 1. 候选池优先取状态为 reading 的章节；没有任何 reading 时回退到全部记录
 * 2. 池内按 updatedAt 降序，取最近的一条
 * 3. isKnown(path) 为 false 的条目跳过（书下架 / 章节改名后的陈旧记录）；
 *    整池都未知时返回 null（组件据此隐藏区块）
 *
 * @param {Record<string, {scrollRatio:number, maxScrollRatio:number, updatedAt:number}>} progressMap
 * @param {(path: string) => boolean} [isKnown] 路径有效性过滤，缺省全部有效
 * @returns {{ path: string, maxScrollRatio: number, status: 'unread'|'reading'|'read' } | null}
 */
export function pickContinueTarget(progressMap, isKnown) {
  const known = typeof isKnown === 'function' ? isKnown : () => true
  const entries = Object.entries(progressMap || {})
  if (entries.length === 0) return null

  const reading = entries.filter(([, p]) => statusOf(p) === 'reading')
  const pool = reading.length > 0 ? reading : entries
  pool.sort((a, b) => b[1].updatedAt - a[1].updatedAt)

  for (const [path, progress] of pool) {
    if (!known(path)) continue
    return { path, maxScrollRatio: progress.maxScrollRatio, status: statusOf(progress) }
  }
  return null
}
