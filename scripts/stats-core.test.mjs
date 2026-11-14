import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { categoryStats, formatMinutes } from '../docs/.vitepress/theme/statsCore.mjs'

const here = dirname(fileURLToPath(import.meta.url))
// 用真实 books.json 做全量断言，避免夹具漂移导致口径失真。
// 下方的 total/各分类计数/总时长是刻意冻结的快照守卫：增删书籍后需同步更新这几个数字。
const realBooks = JSON.parse(readFileSync(join(here, '../books.json'), 'utf-8'))

test('real books.json: total equals registry size and per-genre counts match', () => {
  const stats = categoryStats(realBooks)
  assert.equal(stats.total, realBooks.length)
  assert.equal(stats.total, 39)

  const groupCounts = Object.fromEntries(stats.group.map(r => [r.key, r.count]))
  assert.deepEqual(groupCounts, { ai: 4, frontend: 4, backend: 2, devops: 3, career: 4 })
  const topCounts = Object.fromEntries(stats.top.map(r => [r.key, r.count]))
  assert.deepEqual(topCounts, { literature: 8, history: 5, cognition: 7, finance: 2 })
})

test('rows follow registry order and carry registry label/icon', () => {
  const stats = categoryStats(realBooks)
  assert.deepEqual(stats.group.map(r => r.key), ['ai', 'frontend', 'backend', 'devops', 'career'])
  assert.equal(stats.group[0].label, 'AI 与智能体')
  assert.equal(stats.group[0].icon, '🤖')
  assert.deepEqual(stats.top.map(r => r.key), ['literature', 'history', 'cognition', 'finance'])
  assert.equal(stats.top[0].label, '文学小说')
})

test('显式 genre 跨 category：置身钉内(ebook) 计入 career 组', () => {
  const stats = categoryStats(realBooks)
  const career = stats.group.find(r => r.key === 'career')
  assert.equal(career.count, 4) // 3 本 booklet + 1 本 ebook
})

test('两侧计数之和等于 total（一本书不多算不少算）', () => {
  const stats = categoryStats(realBooks)
  const sum = [...stats.group, ...stats.top].reduce((n, r) => n + r.count, 0)
  assert.equal(sum, stats.total)
})

test('missing / unknown genre falls back to 未分类 by category side', () => {
  const books = [
    { slug: 'a', title: 'A', category: 'booklet' }, // 缺 genre → group 侧兜底
    { slug: 'b', title: 'B', category: 'ebook', genre: 'nope' }, // 未知 genre → top 侧兜底
    { slug: 'c', title: 'C', category: 'booklet', genre: 'ai' }, // 合法 genre
    { slug: 'd', title: 'D' }, // 缺 category → 按 booklet 兜底 → group 侧
  ]
  const stats = categoryStats(books)
  assert.equal(stats.total, 4)

  assert.deepEqual(stats.group[0], { key: 'ai', icon: '🤖', label: 'AI 与智能体', count: 1 })
  const groupRest = stats.group[1]
  assert.equal(groupRest.key, null)
  assert.equal(groupRest.label, '未分类')
  assert.equal(groupRest.count, 2)

  assert.equal(stats.top.length, 1)
  assert.equal(stats.top[0].key, null)
  assert.equal(stats.top[0].label, '未分类')
  assert.equal(stats.top[0].count, 1)

  const sum = [...stats.group, ...stats.top].reduce((n, r) => n + r.count, 0)
  assert.equal(sum, 4)
})

test('empty input yields zeroed stats', () => {
  const stats = categoryStats([])
  assert.equal(stats.total, 0)
  assert.deepEqual(stats.group, [])
  assert.deepEqual(stats.top, [])
})

test('formatMinutes 与首页口径一致', () => {
  assert.equal(formatMinutes(0), '0 分')
  assert.equal(formatMinutes(59), '59 分')
  assert.equal(formatMinutes(60), '1 小时')
  assert.equal(formatMinutes(90), '1½ 小时')
  assert.equal(formatMinutes(91), '2 小时')
  assert.equal(formatMinutes(15238), '254 小时') // 当前全站总阅读时长
})
