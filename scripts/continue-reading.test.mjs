import test from 'node:test'
import assert from 'node:assert/strict'
import { pickContinueTarget } from '../docs/.vitepress/theme/continueReadingCore.mjs'

// 构造一条进度记录；maxScrollRatio 决定状态：
// >= 0.85 read，< 0.15 unread，其余 reading
function p(maxScrollRatio, updatedAt) {
  return { scrollRatio: maxScrollRatio, maxScrollRatio, updatedAt }
}

test('empty progress map yields null', () => {
  assert.equal(pickContinueTarget({}), null)
  assert.equal(pickContinueTarget(undefined), null)
})

test('prefers reading entries over more recently read ones', () => {
  const map = {
    '/books/a/01': p(0.95, 2000), // read，时间更新
    '/books/b/02': p(0.4, 1000), // reading，时间更旧
  }
  const target = pickContinueTarget(map)
  assert.equal(target.path, '/books/b/02')
  assert.equal(target.status, 'reading')
})

test('falls back to most recent entry of any status when no reading', () => {
  const map = {
    '/books/a/01': p(0.95, 3000), // read，最近
    '/books/a/02': p(0.9, 2000), // read
    '/books/a/00': p(0.05, 500), // unread（低于 START_THRESHOLD），最旧
  }
  const target = pickContinueTarget(map)
  assert.equal(target.path, '/books/a/01')
  assert.equal(target.status, 'read')
})

test('sorts by updatedAt descending within the reading pool', () => {
  const map = {
    '/books/a/01': p(0.4, 1000),
    '/books/a/02': p(0.5, 2000),
    '/books/a/03': p(0.6, 3000),
  }
  assert.equal(pickContinueTarget(map).path, '/books/a/03')
})

test('skips unknown paths via isKnown and returns null when all unknown', () => {
  const map = {
    '/books/gone/01': p(0.5, 3000), // 书已下架
    '/books/a/renamed-02': p(0.5, 2000), // 章节已改名
  }
  // 全部未知 → null（组件据此隐藏区块）
  assert.equal(pickContinueTarget(map, () => false), null)
  // 有一条已知 → 跳过未知取已知
  const known = path => path.startsWith('/books/a/')
  assert.equal(pickContinueTarget(map, known).path, '/books/a/renamed-02')
})

test('isKnown also applies to the fallback pool', () => {
  const map = {
    '/books/gone/01': p(0.95, 3000), // read，最近，但未知
    '/books/a/02': p(0.95, 1000), // read，较旧，但已知
  }
  const target = pickContinueTarget(map, path => path.startsWith('/books/a/'))
  assert.equal(target.path, '/books/a/02')
})
