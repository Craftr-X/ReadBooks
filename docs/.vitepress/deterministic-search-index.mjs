import { runInNewContext } from 'node:vm'

/**
 * VitePress 1.6 的本地搜索插件用 pMap 并发调用 MiniSearch.add()，
 * 页面渲染完成的先后会抖动内部短 ID 分配顺序，导致序列化 JSON 每次不同。
 * 本插件在产物层把序列化结果规范化：短 ID 按业务 ID（页面 URL）排序重建，
 * 倒排表按 term 排序，使同一份源码产出完全一致的字节。
 *
 * 短 ID 只是 MiniSearch 内部标识，重映射不改变任何搜索语义。
 * 挂在 transform 上：必须在索引虚拟模块进入 Rollup 之前完成规范化，
 * 否则 Vite 已按原始内容算好带 hash 的 chunk 名，级联 rehash 仍然存在。
 */

/** 逐个产出 code 中的 JS 字符串字面量位置，兼容转义字符。 */
function* stringLiterals(code) {
  for (let i = 0; i < code.length; i += 1) {
    const quote = code[i]
    if (quote !== "'" && quote !== '"') continue
    let j = i + 1
    let closed = false
    while (j < code.length) {
      if (code[j] === '\\') { j += 2; continue }
      if (code[j] === quote) { closed = true; break }
      j += 1
    }
    if (!closed) return
    yield { start: i, end: j + 1, quote }
    i = j
  }
}

/**
 * 定位 code 中的 MiniSearch 序列化 JSON。
 * 不假设压缩格式：renderChunk 拿到的是未压缩 code（分号与 export 之间有换行），
 * 最终产物才是 minify 后的 `const e='...';export{e as default};`。
 */
export function locateIndexJson(code) {
  if (!code || !code.includes('documentCount')) return null
  for (const loc of stringLiterals(code)) {
    const literal = code.slice(loc.start, loc.end)
    let raw
    try {
      raw = runInNewContext(`(${literal})`)
    } catch {
      continue
    }
    if (typeof raw !== 'string' || !raw.includes('documentCount')) continue
    try {
      const data = JSON.parse(raw)
      if (data && data.documentIds && Array.isArray(data.index)) return { ...loc, data }
    } catch {
      // 不是索引字面量，继续找下一个
    }
  }
  return null
}

export function extractIndexJson(code) {
  return locateIndexJson(code)?.data ?? null
}

/** 按业务 ID 排序重建短 ID，并同步重映射所有引用；返回新对象，不改入参。 */
export function normalizeSearchIndex(data) {
  if (!data || typeof data !== 'object' || !data.documentIds || !Array.isArray(data.index)) {
    return null
  }

  const sorted = Object.entries(data.documentIds).sort((a, b) =>
    a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : Number(a[0]) - Number(b[0]))
  const remap = new Map(sorted.map(([oldId], i) => [String(oldId), String(i)]))

  const remapKeys = (obj) => {
    if (!obj || typeof obj !== 'object') return obj
    const out = {}
    for (const [key, value] of Object.entries(obj)) {
      out[remap.get(String(key)) ?? String(key)] = value
    }
    return out
  }

  const documentIds = {}
  sorted.forEach(([, url], i) => { documentIds[String(i)] = url })

  const index = data.index.map(([term, byField]) => {
    const out = {}
    for (const [fieldId, byDoc] of Object.entries(byField || {})) {
      out[fieldId] = remapKeys(byDoc)
    }
    return [term, out]
  }).sort((a, b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)

  const fieldLength = remapKeys(data.fieldLength)
  const storedFields = remapKeys(data.storedFields)

  // MiniSearch 在 add() 时增量维护 averageFieldLength（浮点累加）。并发下
  // add 顺序不同会让末位舍入不同，这是序列化里最后一个不确定源；实测真实索引
  // 与整数重算值在第 15~16 位就有差异。改用整数 fieldLength 累加后相除，
  // 结果与顺序无关，BM25 评分差异在 1e-15 量级，可忽略。
  const sums = []
  for (const lens of Object.values(fieldLength || {})) {
    for (let i = 0; i < lens.length; i += 1) sums[i] = (sums[i] || 0) + lens[i]
  }
  const averageFieldLength = sums.length && data.documentCount
    ? sums.map((sum) => sum / data.documentCount)
    : (data.averageFieldLength || []).map((value) => Number(value.toPrecision(12)))

  return {
    documentCount: data.documentCount,
    nextId: data.nextId,
    documentIds,
    fieldIds: data.fieldIds,
    fieldLength,
    averageFieldLength,
    storedFields,
    dirtCount: data.dirtCount,
    index,
    serializationVersion: data.serializationVersion,
  }
}

/** 把规范化后的 JSON 写回 code 中的原字面量位置。 */
export function rebuildIndexChunk(code, normalized) {
  const loc = locateIndexJson(code)
  if (!loc) return code
  const json = JSON.stringify(normalized)
  // 统一输出单引号字面量：避免把内部每个双引号都转义成 \"，
  // 否则 21M 字符的索引会凭空多出约 4M 字符。
  const literal = `'${json.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
  return `${code.slice(0, loc.start)}${literal}${code.slice(loc.end)}`
}

/**
 * Vite 插件：在 transform 阶段规范化 VitePress 的搜索索引虚拟模块。
 *
 * 必须是 transform 而不是 renderChunk：Vite/Rollup 在 renderChunk 之前就按
 * 模块内容算好了带 hash 的 chunk 文件名，等到那时再改 code，内容虽然确定，
 * 文件名仍会抖，app/theme 与全部 HTML 还是会重写（已实测证伪）。
 * 在虚拟模块进入 Rollup 之前规范化，才能让哈希与内容一起稳定。
 */
export function deterministicSearchIndex() {
  let hits = 0
  let scanned = 0
  return {
    name: 'craftx:deterministic-search-index',
    apply: 'build',
    transform(code, id) {
      if (!id || !id.includes('@localSearchIndex')) return null
      if (typeof code === 'string' && code.includes('documentCount')) scanned += 1
      const loc = locateIndexJson(code)
      if (!loc) return null
      const normalized = normalizeSearchIndex(loc.data)
      if (!normalized) return null
      hits += 1
      return { code: rebuildIndexChunk(code, normalized), map: null }
    },
    generateBundle() {
      if (hits === 0) {
        this.warn(`未命中本地搜索索引虚拟模块（含 documentCount 的模块: ${scanned} 个），构建确定性可能未被修复。`)
      }
    },
  }
}
