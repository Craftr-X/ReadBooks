import { test } from 'node:test'
import assert from 'node:assert/strict'
import { compareSnapshots, formatSummary } from './verify-build-determinism.mjs'

const snap = (entries) => new Map(entries.map(([path, size, hash]) => [path, { size, hash }]))

test('两份相同快照判定为一致', () => {
  const a = snap([['index.html', 100, 'aa'], ['assets/app.js', 200, 'bb']])
  const diff = compareSnapshots(a, new Map(a))
  assert.equal(diff.same, true)
  assert.deepEqual(diff.added, [])
  assert.deepEqual(diff.removed, [])
  assert.deepEqual(diff.changed, [])
})

test('新增与删除的文件被分别识别', () => {
  const a = snap([['a.html', 10, 'x'], ['b.html', 10, 'y']])
  const b = snap([['a.html', 10, 'x'], ['c.html', 10, 'z']])
  const diff = compareSnapshots(a, b)
  assert.equal(diff.same, false)
  assert.deepEqual(diff.added, ['c.html'])
  assert.deepEqual(diff.removed, ['b.html'])
})

test('大小相同但内容不同的文件算作变化并记录字节差', () => {
  const a = snap([['a.js', 892, 'hash-1']])
  const b = snap([['a.js', 900, 'hash-2']])
  const diff = compareSnapshots(a, b)
  assert.equal(diff.same, false)
  assert.deepEqual(diff.changed, [{ path: 'a.js', sizeA: 892, sizeB: 900, delta: 8 }])
})

test('变化文件按字节差绝对值降序排列', () => {
  const a = snap([['small.js', 10, 'a'], ['big.js', 1000, 'b'], ['mid.js', 100, 'c']])
  const b = snap([['small.js', 30, 'x'], ['big.js', 2000, 'y'], ['mid.js', 150, 'z']])
  const diff = compareSnapshots(a, b)
  assert.deepEqual(diff.changed.map((item) => item.path), ['big.js', 'mid.js', 'small.js'])
})

test('摘要在一致与不一致两种情况下都给出可读结论', () => {
  assert.match(formatSummary(compareSnapshots(snap([]), snap([]))), /完全一致/)
  assert.match(formatSummary(compareSnapshots(snap([]), snap([['new.html', 1, 'h']]))), /新增 1/)
})
