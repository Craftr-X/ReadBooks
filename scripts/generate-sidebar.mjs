import { existsSync, readFileSync, writeFileSync } from 'fs'
import { basename, dirname, extname, join, relative, resolve, sep } from 'path'
import { fileURLToPath } from 'url'
import { readJson, walkMarkdown, sortMarkdown } from './content-utils.mjs'

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function titleFromMarkdown(file) {
  return basename(file, '.md').replace(/^\d+-/, '')
}

function hasSidebarFalseFrontmatter(content) {
  const frontmatter = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!frontmatter) return false
  return /^sidebar:\s*false\s*$/m.test(frontmatter[1])
}

function sidebarVisible(file) {
  return !hasSidebarFalseFrontmatter(readFileSync(file, 'utf8'))
}

function toLink(docsBooksDir, slug, file) {
  const rel = relative(join(docsBooksDir, slug), file)
  const withoutExt = rel.slice(0, -extname(rel).length).split(sep).join('/')
  return `/books/${slug}/${withoutExt}`
}

/**
 * 递归收集一个 sidebar 节点树下的所有叶子 item（带 link 的项）。
 * 用于兼容扁平结构与 collapsible 分组结构。
 */
function collectLeafItems(nodes) {
  const out = []
  for (const node of nodes || []) {
    if (node.link) {
      out.push(node)
    } else if (node.items) {
      out.push(...collectLeafItems(node.items))
    }
  }
  return out
}

/**
 * 折叠分组阈值与每组大小。
 * 章节数超过 GROUP_THRESHOLD 才分组；每组 GROUP_SIZE 章。
 */
const GROUP_THRESHOLD = 20
const GROUP_SIZE = 10

/**
 * 从章节 link 中提取数字前缀（如 /books/x/02-标题 → 2）；无前缀返回 -1。
 */
function numericPrefixFromLink(link) {
  const segment = (link || '').split('/').pop() || ''
  const m = segment.match(/^(\d+)/)
  return m ? Number(m[1]) : -1
}

/**
 * 把扁平的章节 items 按数字前缀每 GROUP_SIZE 章分一组，生成 collapsible 分组结构。
 * 仅当 items 数 > GROUP_THRESHOLD 时分组，否则原样返回（保持短书扁平）。
 *
 * 分组策略：
 *  - 有数字前缀的章节按前缀分组：前缀 1-10 一组、11-20 一组……
 *  - 无数字前缀的章节（如「开篇词」「书名页」）归入最前的「其他」组
 *  - 每组最多 GROUP_SIZE 个章节；不足 GROUP_SIZE 的尾组按实际数量命名
 */
function groupByDecade(items) {
  if (items.length <= GROUP_THRESHOLD) return items

  const buckets = []
  const others = []
  for (const item of items) {
    const prefix = numericPrefixFromLink(item.link)
    if (prefix < 0) {
      others.push(item)
    } else {
      const idx = Math.floor((prefix - 1) / GROUP_SIZE)
      if (!buckets[idx]) buckets[idx] = []
      buckets[idx].push(item)
    }
  }

  const groups = []
  if (others.length > 0) {
    groups.push({
      text: '其他',
      collapsible: true,
      collapsed: false,
      items: others,
    })
  }
  for (let i = 0; i < buckets.length; i += 1) {
    if (!buckets[i] || buckets[i].length === 0) continue
    const start = i * GROUP_SIZE + 1
    const end = start + GROUP_SIZE - 1
    groups.push({
      text: `第 ${String(start).padStart(2, '0')}-${String(end).padStart(2, '0')} 章`,
      collapsible: true,
      collapsed: true,
      items: buckets[i],
    })
  }
  return groups
}

/**
 * 从 index.md 目录区块抽取 segment → text 映射，作为 sidebar 显示文本的首选来源。
 * 让 index.md 成为显示文本的单一真相源，避免在代码里硬编码每本书的章节标题。
 * 返回的 map 以「不带后缀的 segment」（如 08-第一章-xxx）为 key。
 */
function indexTextsForBook(root, slug) {
  const indexPath = join(root, 'docs', 'books', slug, 'index.md')
  if (!existsSync(indexPath)) return new Map()
  const original = readFileSync(indexPath, 'utf8')
  if (!TOC_HEADING_RE.test(original)) return new Map()
  // 仅扫描目录区块：## 目录 到下一个 ## 之间
  const lines = original.split('\n')
  let startIdx = -1
  for (let i = 0; i < lines.length; i += 1) {
    if (TOC_HEADING_RE.test(lines[i])) { startIdx = i; break }
  }
  if (startIdx === -1) return new Map()
  let endIdx = lines.length
  for (let i = startIdx + 1; i < lines.length; i += 1) {
    if (/^## /.test(lines[i])) { endIdx = i; break }
  }
  const blockContent = lines.slice(startIdx, endIdx).join('\n')
  const entries = existingEntriesBySegment(blockContent)
  const map = new Map()
  for (const [segment, entry] of entries) {
    if (entry.text) map.set(segment, entry.text)
  }
  return map
}

/**
 * 构建单本书的扁平章节 items（未分组）。
 * 抽取自 generateSidebar / updateSidebarForBook，避免分组逻辑修改时两处不同步。
 *
 * 显示文本优先级：index.md 目录区块手写文本 > 旧 sidebar 文本 > 文件名。
 * index.md 是真相源：在那里改标题，sidebar 自动跟随，无需改代码。
 *
 * @param docsBooksDir docs/books 绝对路径
 * @param book 书籍元数据（含 slug/title）
 * @param existingTexts 可选：旧 sidebar 的 link→text 映射，用于保留已存在的显示文本
 * @param indexTexts 可选：index.md 目录区块的 segment→text 映射（首选来源）
 * @returns 扁平的 [{text, link}]（未分组；分组由调用方按需用 groupByDecade 处理）
 */
function buildBookItems(docsBooksDir, book, existingTexts, indexTexts) {
  const bookDir = join(docsBooksDir, book.slug)
  return walkMarkdown(bookDir)
    .sort(sortMarkdown)
    .filter(sidebarVisible)
    .map(file => {
      const link = toLink(docsBooksDir, book.slug, file)
      const segment = link.split(`/books/${book.slug}/`)[1] || ''
      const text =
        (indexTexts && indexTexts.get(segment)) ||
        (existingTexts && existingTexts.get(link)) ||
        titleFromMarkdown(file)
      return { text, link }
    })
}

function existingTextByLink(sidebarEntry) {
  const map = new Map()
  for (const node of collectLeafItems(sidebarEntry || [])) {
    if (node.link && node.text) map.set(node.link, node.text)
  }
  return map
}

function pathsFor(root) {
  return {
    docsBooksDir: join(root, 'docs', 'books'),
    booksPath: join(root, 'books.json'),
    sidebarPath: join(root, 'sidebar-generated.json'),
  }
}

/**
 * 目录区块标题（兼容历史样式 ## 📖 目录），统一重写为 ## 目录。
 */
const TOC_HEADING_RE = /^## (📖\s*)?目录\s*$/m

/**
 * 从 index.md 现有目录区块抽取 segment → {order, text} 映射。
 * - order：在该区块中出现的序号，用于保留用户手写的章节顺序
 * - text：手写的显示文本，优先于 sidebar 的自动文本
 */
function existingEntriesBySegment(content) {
  const map = new Map()
  const linkRe = /^-\s+\[([^\]]*)\]\(([^)]+)\)/gm
  let m
  let order = 0
  while ((m = linkRe.exec(content)) !== null) {
    const key = m[2].replace(/^\.\//, '').replace(/\.md$/, '')
    if (!map.has(key)) {
      map.set(key, { order: order += 1, text: m[1] })
    }
  }
  return map
}

/**
 * 幂等重写单本书 index.md 的「## 目录」区块。
 * - 只重写该区块（## 目录 / ## 📖 目录 到下一个 ## 之间），保留 frontmatter 和其他内容
 * - 章节顺序：沿用 index.md 现有顺序；新增章节（不在 index.md 里的）追加到末尾
 * - 显示文本优先级：index.md 现有手写文本 > sidebar items 的 text
 * - 若 index.md 没有目录区块，跳过（不破坏手写结构）
 * 返回 true 表示文件被修改，false 表示无变化。
 */
function regenerateBookIndex(root, slug, items) {
  const indexPath = join(root, 'docs', 'books', slug, 'index.md')
  if (!existsSync(indexPath)) return false
  const original = readFileSync(indexPath, 'utf8')
  const match = original.match(TOC_HEADING_RE)
  if (!match) return false

  const lines = original.split('\n')
  let startIdx = -1
  for (let i = 0; i < lines.length; i += 1) {
    if (TOC_HEADING_RE.test(lines[i])) {
      startIdx = i
      break
    }
  }
  if (startIdx === -1) return false

  // 找下一个 ## 标题作为区块结束（排除 split 产生的末尾空串）
  let endIdx = lines.length
  for (let i = startIdx + 1; i < lines.length; i += 1) {
    if (/^## /.test(lines[i])) {
      endIdx = i
      break
    }
  }
  // 收集区块后的剩余内容（trim 掉纯空行元素）
  const trailing = lines.slice(endIdx).filter(l => l !== '')
  // 区块内（startIdx 到 endIdx，含标题）的现有顺序与文本
  const blockContent = lines.slice(startIdx, endIdx).join('\n')
  const existing = existingEntriesBySegment(blockContent)

  // 按现有顺序排在前；新增章节（不在 index.md 里的）按 sidebar 顺序追加
  const segmentOf = (item) => (item.link || '').split(`/books/${slug}/`)[1] || ''
  const ordered = [...items].sort((a, b) => {
    const sa = segmentOf(a)
    const sb = segmentOf(b)
    const oa = existing.get(sa)?.order
    const ob = existing.get(sb)?.order
    if (oa !== undefined && ob !== undefined) return oa - ob
    if (oa !== undefined) return -1
    if (ob !== undefined) return 1
    return 0 // 都不在 index.md：保持 sidebar 原序
  })

  const newBlock = ['## 目录', '']
  for (const item of ordered) {
    const segment = segmentOf(item)
    const key = segment.replace(/\.md$/, '')
    const text = existing.get(key)?.text ?? item.text ?? ''
    newBlock.push(`- [${text}](./${segment}.md)`)
  }

  const next = [
    ...lines.slice(0, startIdx),
    ...newBlock,
    // 区块后若还有内容，补一个空行分隔
    ...(trailing.length > 0 ? ['', ...trailing] : []),
  ]
  const updated = `${next.join('\n')}\n`
  if (updated === original) return false
  writeFileSync(indexPath, updated, 'utf8')
  return true
}

function generateSidebar(options = {}) {
  const root = options.root || defaultRoot
  const { docsBooksDir, booksPath, sidebarPath } = pathsFor(root)
  const books = readJson(booksPath, [])
  const sidebar = readJson(sidebarPath, {})
  const activeBookKeys = new Set()

  for (const book of books) {
    const bookDir = join(docsBooksDir, book.slug)
    if (!existsSync(bookDir)) continue
    const key = `/books/${book.slug}/`
    activeBookKeys.add(key)

    const existingTexts = existingTextByLink(sidebar[key])
    const indexTexts = indexTextsForBook(root, book.slug)
    const items = buildBookItems(docsBooksDir, book, existingTexts, indexTexts)

    sidebar[key] = [
      {
        text: book.title,
        collapsible: true,
        items: groupByDecade(items),
      },
    ]
  }

  for (const key of Object.keys(sidebar)) {
    if (key.startsWith('/books/') && !activeBookKeys.has(key)) {
      delete sidebar[key]
    }
  }

  writeFileSync(sidebarPath, `${JSON.stringify(sidebar, null, 2)}\n`, 'utf8')

  // 幂等刷新各书 index.md 的目录区块。
  // 注意：index.md 用扁平的完整章节列表（书首页是阅读入口，不折叠），
  // 即便 sidebar 已分了 collapsible 组，这里也要拍平传给 index.md。
  for (const book of books) {
    const entry = sidebar[`/books/${book.slug}/`]
    const flatItems = collectLeafItems(entry?.[0] ? [entry[0]] : [])
    regenerateBookIndex(root, book.slug, flatItems)
  }

  return sidebar
}

export function updateSidebarForBook(book, options = {}) {
  const root = options.root || defaultRoot
  const { docsBooksDir, sidebarPath } = pathsFor(root)
  const bookDir = join(docsBooksDir, book.slug)
  if (!existsSync(bookDir)) throw new Error(`书籍目录不存在：${bookDir}`)

  const sidebar = readJson(sidebarPath, {})
  const items = buildBookItems(docsBooksDir, book, undefined, indexTextsForBook(root, book.slug))

  sidebar[`/books/${book.slug}/`] = [
    {
      text: book.title,
      collapsible: true,
      items: groupByDecade(items),
    },
  ]

  writeFileSync(sidebarPath, `${JSON.stringify(sidebar, null, 2)}\n`, 'utf8')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  generateSidebar()
}

export { generateSidebar, regenerateBookIndex, collectLeafItems, hasSidebarFalseFrontmatter }
