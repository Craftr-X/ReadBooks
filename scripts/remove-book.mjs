/**
 * remove-book.mjs — 书籍下架工作流脚本（import-book.mjs 的对称操作）。
 *
 * 一条命令完成删除 + 查漏 + 自检：
 *   node scripts/remove-book.mjs <slug> [--find 关键词] [--dry-run] [--force]
 *
 * 删除范围（一个 book slug 的全部挂钩）：
 *   1. docs/books/<slug>/          内容目录（含图片资源）
 *   2. books.json                  registry 条目
 *   3. README.md                   书籍表格行
 *   4. docs/** 内的硬编码引用       默认阻断，要求先人工处理（--force 放行）
 *
 * 其余派生数据（sidebar-generated.json / content-stats.json / 搜索索引 / sitemap）
 * 均为构建产物：执行后调用 generateSidebar + generateContentStats 立即重建，
 * 它们自带对已删 slug 的清理逻辑；首页「继续阅读」卡对已删 slug 天然容错。
 *
 * 恢复兜底是 git 历史，因此 CLI 路径要求 books.json / README.md / 书目录
 * 在删除前无未提交改动（--force 可跳过）。
 */

import { spawnSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { generateSidebar } from './generate-sidebar.mjs'
import { generateContentStats } from './generate-content-stats.mjs'
import { loadBooks, walkMarkdown } from './content-utils.mjs'

const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

function writeJson(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function parseArgs(argv) {
  const args = { positionals: [] }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--force') args.force = true
    else if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--find') args.find = argv[++i]
    else if (arg === '--root') args.root = argv[++i] // 内部/测试用：指定项目根目录
    else if (arg === '--help' || arg === '-h') args.help = true
    else if (arg.startsWith('--')) throw new Error(`未知参数：${arg}`)
    else args.positionals.push(arg)
  }
  args.slug = args.positionals[0]
  return args
}

function usage() {
  return [
    '用法：node scripts/remove-book.mjs <slug> [--dry-run] [--force] [--find 关键词]',
    '',
    '删除一本书的全部挂钩：内容目录、books.json 条目、README 表格行，',
    '并重建 sidebar-generated.json / content-stats.json，最后运行内置自检。',
    '',
    '选项：',
    '  --find 关键词   按书名/简介/slug 关键词列出候选条目（用于把书名定位到 slug）',
    '  --dry-run       只做校验与预览，不写任何文件',
    '  --force         放行 docs/ 内的外部引用阻断，并跳过工作树干净检查',
    '',
    '示例：',
    '  node scripts/remove-book.mjs yan-tie-lun --dry-run   # 先预览',
    '  node scripts/remove-book.mjs yan-tie-lun             # 正式删除',
    '  node scripts/remove-book.mjs --find 盐铁论            # 按书名找 slug',
  ].join('\n')
}

/**
 * slug 归一化：去首尾空白与斜杠、转小写。
 * registry 中的 slug 一律为小写 kebab-case，这里宽容常见的手输变体。
 */
function normalizeSlug(value) {
  return String(value || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
    .toLowerCase()
}

/**
 * 按关键词筛候选：命中 title / desc / slug 任一即返回（大小写不敏感）。
 */
function findCandidates(books, keyword) {
  const needle = String(keyword || '').trim().toLowerCase()
  if (!needle) return []
  return books.filter(book =>
    [book.title, book.desc, book.slug]
      .filter(Boolean)
      .some(field => String(field).toLowerCase().includes(needle)),
  )
}

/**
 * 引用匹配：`books/<slug>` 且前后不是 [a-z0-9-]，
 * 同时覆盖站点绝对链接 `/books/<slug>/` 与仓库相对链接 `./docs/books/<slug>/`，
 * 并避免 slug 前缀误伤（如 books/intro 不会命中 books/intro-2）。
 */
function referencePattern(slug) {
  const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`(?<![a-z0-9-])books/${escaped}(?![a-z0-9-])`)
}

function collectMarkdownFiles(dir, out = []) {
  if (!existsSync(dir)) return out
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) collectMarkdownFiles(full, out)
    else if (entry.toLowerCase().endsWith('.md')) out.push(full)
  }
  return out
}

/**
 * 扫描 docs 下全部 Markdown（排除书自身目录）与 README.md 中对该书的引用。
 * 返回 { docs: [{file, line, text}], readme: [{file, line, text}] }，file 为相对 root 的路径。
 */
function findBookReferences(slug, options = {}) {
  const root = options.root || defaultRoot
  const pattern = referencePattern(slug)
  const hits = []
  const scanFile = filePath => {
    const rel = relative(root, filePath)
    const lines = readFileSync(filePath, 'utf8').split('\n')
    lines.forEach((line, index) => {
      if (pattern.test(line)) hits.push({ file: rel, line: index + 1, text: line.trim() })
    })
  }

  const docsDir = join(root, 'docs')
  const excludedDir = join(docsDir, 'books', slug)
  for (const file of collectMarkdownFiles(docsDir)) {
    if (file === excludedDir || file.startsWith(`${excludedDir}${join('')}`) || file.startsWith(excludedDir + '/')) continue
    scanFile(file)
  }
  const readmePath = join(root, 'README.md')
  if (existsSync(readmePath)) scanFile(readmePath)

  return {
    docs: hits.filter(hit => hit.file !== 'README.md'),
    readme: hits.filter(hit => hit.file === 'README.md'),
  }
}

/**
 * 删除前信息收集：registry 条目、目录状态、章节数、外部引用、警告。
 * slug 既不在 registry 也无目录时抛错（附 --find 提示与当前书库清单）。
 */
function collectRemovalInfo(slug, options = {}) {
  const root = options.root || defaultRoot
  const normalized = normalizeSlug(slug)
  if (!normalized) throw new Error('slug 不能为空')

  const books = loadBooks(root)
  const entry = books.find(book => book.slug === normalized)
  const bookDir = join(root, 'docs', 'books', normalized)
  const dirExists = existsSync(bookDir)

  if (!entry && !dirExists) {
    const known = books.map(book => book.slug).join('、') || '（书库为空）'
    throw new Error(`书籍不存在：${normalized}。先用 --find <书名关键词> 定位 slug。当前书库：${known}`)
  }

  const references = findBookReferences(normalized, { root })
  const warnings = []
  if (!entry) warnings.push('registry（books.json）无此条目：孤儿目录，仅删除内容目录')
  if (!dirExists) warnings.push('内容目录缺失：仅清理 registry 与 README 中的登记')
  if (references.docs.length > 0) {
    warnings.push(`docs/ 内有 ${references.docs.length} 处外部引用，默认阻断（确认后可用 --force 放行）`)
  }

  return {
    slug: normalized,
    title: entry?.title,
    desc: entry?.desc,
    category: entry?.category,
    genre: entry?.genre,
    entryExists: Boolean(entry),
    dirExists,
    bookDir,
    chapterCount: dirExists ? walkMarkdown(bookDir).length : 0,
    references,
    warnings,
  }
}

function preview(info) {
  console.log('删除预览')
  console.log(`- 书名：${info.title || '（registry 无条目）'}`)
  console.log(`- slug：${info.slug}`)
  console.log(`- 分类：${info.category || '-'}${info.genre ? ` / 展示分类：${info.genre}` : ''}`)
  console.log(`- 章节数量：${info.chapterCount}`)
  console.log(`- 内容目录：${info.dirExists ? info.bookDir : '（已缺失）'}`)
  console.log(`- README 引用：${info.references.readme.length} 行（自动清理）`)
  console.log(`- docs 引用：${info.references.docs.length} 处（阻断项）`)
  if (info.warnings.length > 0) {
    console.log('- 可疑项：')
    for (const warning of info.warnings) console.log(`  - ${warning}`)
  } else {
    console.log('- 可疑项：无')
  }
}

/**
 * 删除 README.md 中引用该书的整行（书籍表格行）。文件缺失或无匹配时不动。
 */
function removeReadmeLines(readmePath, slug) {
  if (!existsSync(readmePath)) return 0
  const raw = readFileSync(readmePath, 'utf8')
  const pattern = referencePattern(slug)
  const lines = raw.split('\n')
  const kept = lines.filter(line => !pattern.test(line))
  const removed = lines.length - kept.length
  if (removed === 0) return 0
  writeFileSync(readmePath, kept.join('\n'), 'utf8')
  return removed
}

/**
 * 删除后自检：六项残留检查全部通过才算下架完成。
 * 返回 { slug, passed, checks: [{check, status, detail?}] }。
 */
function verifyRemoval(slug, options = {}) {
  const root = options.root || defaultRoot
  const normalized = normalizeSlug(slug)
  const checks = []
  const check = (name, failed, detail) => {
    checks.push(failed ? { check: name, status: 'fail', detail } : { check: name, status: 'pass' })
  }

  const books = loadBooks(root)
  check('registry', books.some(book => book.slug === normalized), `books.json 仍存在条目：${normalized}`)

  const bookDir = join(root, 'docs', 'books', normalized)
  check('book-dir', existsSync(bookDir), `内容目录仍存在：${bookDir}`)

  const sidebarPath = join(root, 'sidebar-generated.json')
  const sidebar = JSON.parse(existsSync(sidebarPath) ? readFileSync(sidebarPath, 'utf8') : '{}')
  const sidebarKey = `/books/${normalized}/`
  check('sidebar', Boolean(sidebar[sidebarKey]), `sidebar-generated.json 仍存在 key：${sidebarKey}`)

  const statsPath = join(root, 'content-stats.json')
  const stats = JSON.parse(existsSync(statsPath) ? readFileSync(statsPath, 'utf8') : '{}')
  check('content-stats', Boolean(stats.books && stats.books[normalized]), `content-stats.json 仍存在条目：${normalized}`)

  const readmePath = join(root, 'README.md')
  const readmeRefs = existsSync(readmePath)
    ? findBookReferences(normalized, { root }).readme
    : []
  check('readme', readmeRefs.length > 0, `README.md 仍引用该书：${readmeRefs.map(ref => `${ref.file}:${ref.line}`).join('、')}`)

  const docsRefs = findBookReferences(normalized, { root }).docs
  check(
    'docs-references',
    docsRefs.length > 0,
    `docs/ 内仍有引用：${docsRefs.map(ref => `${ref.file}:${ref.line}`).join('、')}`,
  )

  return { slug: normalized, passed: checks.every(c => c.status === 'pass'), checks }
}

/**
 * 核心：校验 → 删除（README 行 → registry 条目 → 内容目录）→ 重建派生文件 → 自检。
 * dryRun 时只收集信息不写任何文件。
 */
function removeBook(slug, options = {}) {
  const root = options.root || defaultRoot
  const dryRun = options.dryRun === true
  const force = options.force === true

  const info = collectRemovalInfo(slug, { root })

  if (info.references.docs.length > 0 && !force) {
    const list = info.references.docs.map(ref => `${ref.file}:${ref.line} ${ref.text}`).join('\n  ')
    throw new Error(`docs/ 内存在对 ${info.slug} 的外部引用，请先处理后再删除（确认执意删除可用 --force）：\n  ${list}`)
  }

  if (dryRun) return { slug: info.slug, info, dryRun: true, readmeRemoved: 0, report: null }

  const readmeRemoved = removeReadmeLines(join(root, 'README.md'), info.slug)

  const books = loadBooks(root)
  const nextBooks = books.filter(book => book.slug !== info.slug)
  if (nextBooks.length !== books.length) writeJson(join(root, 'books.json'), nextBooks)

  if (info.dirExists) rmSync(info.bookDir, { recursive: true, force: true })

  generateSidebar({ root })
  generateContentStats({ root })

  const report = verifyRemoval(info.slug, { root })
  return { slug: info.slug, info, dryRun: false, readmeRemoved, report }
}

/**
 * CLI 路径专用：books.json / README.md / 书目录三处必须无未提交改动。
 * 删除的恢复兜底是 git 历史，这三处脏了就失去兜底。--force 可跳过。
 */
function assertCleanWorktree(root, slug, force) {
  if (force) return
  const result = spawnSync('git', ['status', '--porcelain', '--', 'books.json', 'README.md', `docs/books/${slug}`], {
    cwd: root,
    encoding: 'utf8',
  })
  if (result.status !== 0) return // 非 git 仓库（如临时目录），交由上层决定
  const dirty = (result.stdout || '').trim()
  if (dirty) {
    throw new Error(`以下与删除相关的路径有未提交改动，先提交或暂存（git 兜底要求）：\n${dirty}`)
  }
}

function printReport(report) {
  console.log('下架自检')
  for (const item of report.checks) {
    console.log(`- [${item.status === 'pass' ? '✓' : '✗'}] ${item.check}${item.detail ? `：${item.detail}` : ''}`)
  }
  console.log(report.passed ? '自检全部通过。' : '自检存在失败项！')
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help || (!args.slug && !args.find)) {
    console.log(usage())
    return
  }

  if (args.find) {
    const books = loadBooks(args.root || defaultRoot)
    const candidates = findCandidates(books, args.find)
    if (candidates.length === 0) {
      console.log(`无匹配：「${args.find}」。可换关键词重试，或查看 books.json 全量清单。`)
      process.exitCode = 1
      return
    }
    console.log(`候选 ${candidates.length} 项：`)
    for (const book of candidates) {
      console.log(`- ${book.slug}  《${book.title}》  [${book.category}${book.genre ? `/${book.genre}` : ''}] ${book.desc || ''}`)
    }
    return
  }

  const root = args.root || defaultRoot
  const info = collectRemovalInfo(args.slug, { root })
  preview(info)

  if (!args.dryRun) assertCleanWorktree(root, info.slug, args.force)

  const result = removeBook(args.slug, { root, dryRun: args.dryRun, force: args.force })

  if (result.dryRun) {
    console.log('dry-run：未做任何修改。确认无误后去掉 --dry-run 正式执行。')
    return
  }

  console.log(`已删除：docs/books/${result.slug}/、registry 条目、README ${result.readmeRemoved} 行；已重建 sidebar/content-stats。`)
  printReport(result.report)
  if (!result.report.passed) process.exitCode = 1
}

export {
  parseArgs,
  usage,
  normalizeSlug,
  findCandidates,
  findBookReferences,
  collectRemovalInfo,
  removeReadmeLines,
  verifyRemoval,
  removeBook,
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
