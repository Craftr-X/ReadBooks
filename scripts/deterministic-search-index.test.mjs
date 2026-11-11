import { test } from 'node:test'
import assert from 'node:assert/strict'
import MiniSearch from 'minisearch'
import {
  deterministicSearchIndex,
  extractIndexJson,
  normalizeSearchIndex,
  rebuildIndexChunk,
} from '../docs/.vitepress/deterministic-search-index.mjs'

const options = { fields: ['title', 'text'], storeFields: ['title'] }
const docs = [
  ['/readbooks/a', 'Alpha', 'foo bar'],
  ['/readbooks/b', 'Beta', 'baz foo'],
  ['/readbooks/c', 'Gamma', 'qux quux'],
]

function serialized(order) {
  const index = new MiniSearch(options)
  for (const [id, title, text] of order) index.add({ id, title, text })
  return JSON.parse(JSON.stringify(index.toJSON()))
}

const forward = serialized(docs)
const reversed = serialized(docs.slice().reverse())

test('不同 add 顺序确实产生不同的序列化字节（复现抖动）', () => {
  assert.notEqual(JSON.stringify(forward), JSON.stringify(reversed))
})

test('规范化后两种顺序产出完全一致的字节', () => {
  const a = normalizeSearchIndex(forward)
  const b = normalizeSearchIndex(reversed)
  assert.ok(a && b)
  assert.equal(JSON.stringify(a), JSON.stringify(b))
})

test('规范化后 term 按字典序排列，短 ID 按业务 ID 排序', () => {
  const normalized = normalizeSearchIndex(forward)
  const terms = normalized.index.map(([term]) => term)
  assert.deepEqual(terms, terms.slice().sort())
  const urls = Object.values(normalized.documentIds)
  assert.deepEqual(urls, urls.slice().sort())
})

test('规范化不改变搜索结果', () => {
  const original = MiniSearch.loadJSON(JSON.stringify(forward), options)
  const normalized = MiniSearch.loadJSON(JSON.stringify(normalizeSearchIndex(forward)), options)
  for (const query of ['foo', 'bar', 'Gamma', 'qux']) {
    const before = original.search(query)
    const after = normalized.search(query)
    assert.deepEqual(
      after.map((hit) => hit.id).sort(),
      before.map((hit) => hit.id).sort(),
      `查询 ${query} 的结果应一致`,
    )
  }
})

test('索引 chunk 的提取与重写可往返', () => {
  const code = `const e='${JSON.stringify(forward)}';export{e as default};`
  const parsed = extractIndexJson(code)
  assert.deepEqual(parsed, forward)
  const rebuilt = rebuildIndexChunk(code, normalizeSearchIndex(forward))
  assert.deepEqual(extractIndexJson(rebuilt), normalizeSearchIndex(forward))
})

test('未压缩的 renderChunk code（分号与 export 间有换行）也能定位并重写', () => {
  const code = `const e = ${JSON.stringify(JSON.stringify(forward))};\n\nexport { e as default };\n`
  assert.deepEqual(extractIndexJson(code), forward)
  const rebuilt = rebuildIndexChunk(code, normalizeSearchIndex(forward))
  assert.deepEqual(extractIndexJson(rebuilt), normalizeSearchIndex(forward))
  assert.match(rebuilt, /export \{ e as default \}/)
})

test('code 前面存在其它字符串字面量时仍能定位索引', () => {
  const code = `import "virtual:polyfill";\nconst e = ${JSON.stringify(JSON.stringify(forward))};\nexport { e as default };`
  assert.deepEqual(extractIndexJson(code), forward)
})

test('插件 transform 处理 VitePress 虚拟模块并忽略其它模块', () => {
  const plugin = deterministicSearchIndex()
  const code = `export default ${JSON.stringify(JSON.stringify(forward))};`
  const result = plugin.transform(code, '/@localSearchIndex')
  assert.ok(result && typeof result.code === 'string')
  assert.match(result.code, /^export default /)
  assert.deepEqual(extractIndexJson(result.code), normalizeSearchIndex(forward))
  assert.equal(plugin.transform('export const a = 1;', '/some-other-module'), null)
})

test('非索引 chunk 返回 null，不会误改其它产物', () => {
  assert.equal(extractIndexJson('export const a = 1;'), null)
  assert.equal(normalizeSearchIndex({ hello: 'world' }), null)
})
