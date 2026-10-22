import { spawnSync } from 'node:child_process'
import { copyFileSync, cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from 'fs'
import { basename, dirname, extname, join, relative, resolve, sep } from 'path'
import { inflateRawSync } from 'zlib'
import { fileURLToPath } from 'url'
import { updateSidebarForBook } from './generate-sidebar.mjs'
import { readJson, walkMarkdown, sortMarkdown } from './content-utils.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const docsBooksDir = join(root, 'docs', 'books')
const booksPath = join(root, 'books.json')

function parseArgs(argv) {
  const args = { force: false, dryRun: false }
  const positionals = []
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--force') args.force = true
    else if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--slug') args.slug = argv[++i]
    else if (arg === '--title') args.title = argv[++i]
    else if (arg === '--desc') args.desc = argv[++i]
    else if (arg === '--help' || arg === '-h') args.help = true
    else if (arg.startsWith('--')) throw new Error(`未知参数：${arg}`)
    else positionals.push(arg)
  }
  args.input = positionals[0]
  return args
}

function usage() {
  return [
    '用法：node scripts/import-book.mjs <markdown-folder|book.epub> [--slug slug] [--title title] [--desc desc] [--force] [--dry-run]',
    '',
    '仅支持 Markdown 文件夹或 EPUB 文件。',
  ].join('\n')
}

function writeJson(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function hashText(text) {
  let hash = 0
  for (const ch of text) hash = ((hash << 5) - hash + ch.charCodeAt(0)) | 0
  return Math.abs(hash).toString(36)
}

function slugify(value) {
  const slug = String(value || '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return slug || `book-${hashText(String(value || 'book')).slice(0, 6)}`
}

function titleFileSegment(value) {
  const segment = (cleanTitle(value) || numberedChapterLabel(value))
    .normalize('NFC')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/[\u0000-\u001f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    // 中文标题里的空格（"自 序"、"说 明"）转连字符后读起来像两个词，
    // 汉字之间的连字符直接合并；英文单词边界不受影响。
    .replace(/(\p{Script=Han})-(\p{Script=Han})/gu, '$1$2')
    .slice(0, 80)
  return segment
}

function walk(dir, predicate, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) walk(full, predicate, out)
    else if (predicate(full)) out.push(full)
  }
  return out
}

function firstHeading(file) {
  const text = readFileSync(file, 'utf8')
  const match = text.match(/^#\s+(.+)$/m)
  return match ? match[1].trim() : ''
}

function markdownTitle(file) {
  return basename(file, '.md')
}

function markdownDisplayTitle(file) {
  return firstHeading(file) || basename(file, '.md')
}

function markdownLinkFromTarget(bookDir, file) {
  const rel = relative(bookDir, file).split(sep).join('/')
  return `./${rel}`
}

function writeIndex(bookDir, title, desc, mdFiles) {
  const lines = [
    '---',
    'layout: doc',
    `title: ${title}`,
    desc ? `description: ${desc}` : '',
    'aside: false',
    'editLink: false',
    '---',
    '',
    `# ${title}`,
    '',
  ].filter(line => line !== '')

  if (desc) {
    lines.push(`> ${desc}`, '')
  }

  lines.push('## 目录', '')
  for (const file of mdFiles) {
    lines.push(`- [${markdownDisplayTitle(file)}](${markdownLinkFromTarget(bookDir, file)})`)
  }
  writeFileSync(join(bookDir, 'index.md'), `${lines.join('\n')}\n`, 'utf8')
}

function detectMarkdownFolder(inputPath, args) {
  const mdFiles = walk(inputPath, file => extname(file).toLowerCase() === '.md')
  if (mdFiles.length === 0) {
    throw new Error('仅支持 Markdown 文件夹或 EPUB 文件：Markdown 文件夹内至少需要包含一个 .md 文件。')
  }
  const ordered = mdFiles.sort(sortMarkdown)
  const chapters = ordered.filter(file => basename(file).toLowerCase() !== 'index.md')
  const titleSource = chapters[0] || ordered[0]
  const title = args.title || firstHeading(titleSource) || basename(inputPath)
  return {
    kind: 'markdown',
    title,
    desc: args.desc || '',
    slug: slugify(args.slug || title || basename(inputPath)),
    chapterCount: chapters.length,
    warnings: [],
  }
}

function importMarkdownFolder(inputPath, tempDir, info) {
  cpSync(inputPath, tempDir, { recursive: true })
  const mdFiles = walkMarkdown(tempDir).sort(sortMarkdown)
  writeIndex(tempDir, info.title, info.desc, mdFiles)
}

function readZipEntries(file) {
  const data = readFileSync(file)
  const entries = new Map()
  let offset = 0
  while (offset < data.length - 30) {
    if (data.readUInt32LE(offset) !== 0x04034b50) {
      offset += 1
      continue
    }
    const flags = data.readUInt16LE(offset + 6)
    const method = data.readUInt16LE(offset + 8)
    const compressedSize = data.readUInt32LE(offset + 18)
    const fileNameLength = data.readUInt16LE(offset + 26)
    const extraLength = data.readUInt16LE(offset + 28)
    const nameStart = offset + 30
    const name = data.subarray(nameStart, nameStart + fileNameLength).toString('utf8')
    const bodyStart = nameStart + fileNameLength + extraLength

    if (flags & 0x1) throw new Error('EPUB 文件可能已加密或包含 DRM，无法导入。')
    if (flags & 0x8) throw new Error('暂不支持使用 ZIP data descriptor 的 EPUB，请先用常规 EPUB 工具重新打包。')

    const body = data.subarray(bodyStart, bodyStart + compressedSize)
    let content
    if (method === 0) content = body
    else if (method === 8) content = inflateRawSync(body)
    else throw new Error(`暂不支持 EPUB 内部压缩方法：${method}`)

    entries.set(name, content)
    offset = bodyStart + compressedSize
  }
  return entries
}

function textEntry(entries, name) {
  const body = entries.get(name)
  return body ? body.toString('utf8') : ''
}

function attr(text, name) {
  const match = text.match(new RegExp(`${name}=["']([^"']+)["']`, 'i'))
  return match ? match[1] : ''
}

function tagText(text, tag) {
  const match = text.match(new RegExp(`<[^:>]*:?${tag}[^>]*>([\\s\\S]*?)<\\/[^:>]*:?${tag}>`, 'i'))
  return match ? cleanTitle(match[1]) : ''
}

function stripTags(html) {
  return html.replace(/<[^>]+>/g, '')
}

function decodeHtml(text) {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCharCode(Number.parseInt(code, 16)))
}

function cleanTitle(value) {
  const decoded = decodeHtml(String(value || ''))
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<a\b[^>]*href=["'][^"']*["'][^>]*>([\s\S]*?)<\/a>/gi, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  const title = decoded
    .replace(/^#+\s*/, '')
    .replace(/^\[[^\]]*\]\(#?[^)]*\)\s*$/, '')
    .trim()

  if (!title) return ''
  if (/^chapter[-_\s]*\d+$/i.test(title)) return ''
  if (/^第\s*\d+\s*章$/.test(title)) return ''
  // 1-3 位纯数字视为页码/编号噪音；4 位（"2015"、"1984"）可能是真实篇名
  if (/^#?[a-z]*\d{1,3}$/i.test(title)) return ''
  if (/^[\[\]().#\-\s\d]+$/.test(title) && !/^\d{4}$/.test(title)) return ''
  if (/^a-class-[a-z0-9-]+$/i.test(title)) return ''
  return title
}

// cleanTitle 会把 "Chapter 3"、"CHAPTER 01"、"第 3 章" 这类纯编号标题当垃圾
// 过滤（为掘金类 EPUB 的噪音目录设计）。但小说类 EPUB 的章节本来就无题，
// NCX 里这类编号就是唯一可用的真实标题。此函数识别“纯章节编号标记”并返回
// 规范化形式（Chapter-01 / 第3章），供目录标题与文件名兜底使用。
function numberedChapterLabel(value) {
  const label = decodeHtml(String(value || '')).replace(/\s+/g, ' ').trim()
  if (/^第\s*[0-9一二三四五六七八九十百零〇]{1,4}\s*章$/.test(label)) return label.replace(/\s+/g, '')
  const match = label.match(/^(?:chapter|chap\.?)[ \t\-_·]*(\d{1,4})$/i)
  if (match) return `Chapter-${String(Number(match[1])).padStart(2, '0')}`
  return ''
}

function dirnamePosix(path) {
  const index = path.lastIndexOf('/')
  return index === -1 ? '' : path.slice(0, index)
}

function joinPosix(...parts) {
  return parts.filter(Boolean).join('/').replace(/\/+/g, '/')
}

function normalizePosix(path) {
  const parts = []
  for (const part of path.split('/')) {
    if (!part || part === '.') continue
    if (part === '..') parts.pop()
    else parts.push(part)
  }
  return parts.join('/')
}

function normalizeHref(href, baseDir = '') {
  const withoutFragment = String(href || '').split('#')[0]
  const withoutQuery = withoutFragment.split('?')[0]
  return normalizePosix(joinPosix(baseDir, decodeHtml(withoutQuery)))
}

function normalizeHrefWithFragment(href, baseDir = '') {
  const raw = String(href || '')
  const fragment = raw.includes('#') ? raw.split('#').slice(1).join('#') : ''
  const normalized = normalizeHref(raw, baseDir)
  return fragment ? `${normalized}#${decodeHtml(fragment)}` : normalized
}

function firstChildTagContent(text, tag) {
  const match = text.match(new RegExp(`<[^:>]*:?${tag}\\b[^>]*>([\\s\\S]*?)<\\/[^:>]*:?${tag}>`, 'i'))
  return match ? match[1] : ''
}

function parseNavDocToc(navHtml, navPath = '') {
  const navDir = dirnamePosix(navPath)
  const toc = new Map()
  const navBlocks = [...navHtml.matchAll(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi)]
  const candidates = navBlocks.length > 0 ? navBlocks.map(match => match[0]) : [navHtml]

  for (const block of candidates) {
    const isToc = /\bepub:type=["'][^"']*\btoc\b[^"']*["']/i.test(block) || /\brole=["']doc-toc["']/i.test(block)
    if (!isToc && navBlocks.length > 0) continue
    for (const match of block.matchAll(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
      const href = normalizeHref(match[1], navDir)
      const title = cleanTitle(match[2])
      if (href && title && !toc.has(href)) toc.set(href, title)
    }
    for (const match of block.matchAll(/<span\b[^>]*>([\s\S]*?)<\/span>\s*<ol\b[\s\S]*?<\/ol>/gi)) {
      const title = cleanTitle(match[1])
      if (title) continue
    }
    if (toc.size > 0) break
  }

  return toc
}

function parseNcxToc(ncxXml, ncxPath = '') {
  const ncxDir = dirnamePosix(ncxPath)
  const toc = new Map()
  /** @type {Map<string, Array<{fragment: string, title: string}>>} */
  const anchors = new Map()
  for (const match of ncxXml.matchAll(/<content\b[^>]*src=["']([^"']+)["'][^>]*>/gi)) {
    const navPointStart = ncxXml.lastIndexOf('<navPoint', match.index)
    const blockBeforeContent = navPointStart === -1 ? ncxXml.slice(0, match.index) : ncxXml.slice(navPointStart, match.index)
    const labelMatches = [...blockBeforeContent.matchAll(/<navLabel\b[^>]*>[\s\S]*?<\/navLabel>/gi)]
    const labelBlock = labelMatches.length > 0 ? labelMatches[labelMatches.length - 1][0] : ''
    const src = decodeHtml(match[1])
    const label = firstChildTagContent(labelBlock, 'text')
    const href = normalizeHref(src, ncxDir)
    const fragment = src.includes('#') ? src.split('#').slice(1).join('#') : ''
    // 指向整文件的 NCX 条目：纯编号标记（Chapter 3 / 第3章）也保留为标题，
    // 因为它映射到 spine 文件本身，比 chapter-NN 兜底文件名更真实。
    // 带锚点的条目仍走 cleanTitle 严格过滤，避免影响锚点拆分行为。
    const title = cleanTitle(label) || (!fragment ? numberedChapterLabel(label) : '')
    if (href && title && !toc.has(href)) toc.set(href, title)
    // Track anchor-based entries for splitting multi-chapter HTML files
    if (fragment && href && title) {
      if (!anchors.has(href)) anchors.set(href, [])
      anchors.get(href).push({ fragment, title })
    }
  }
  return { toc, anchors }
}

function mergeTocTitleMap(target, source) {
  for (const [href, title] of source) {
    if (href && title && !target.has(href)) target.set(href, title)
  }
  return target
}

function mergeAnchors(target, source) {
  for (const [href, items] of source) {
    if (!target.has(href)) target.set(href, [])
    target.get(href).push(...items)
  }
}

function parseOpf(entries) {
  const container = textEntry(entries, 'META-INF/container.xml')
  const opfPath = attr(container.match(/<rootfile\b[^>]*>/i)?.[0] || '', 'full-path')
  if (!opfPath) throw new Error('EPUB 缺少 META-INF/container.xml 或 rootfile。')
  const opf = textEntry(entries, opfPath)
  if (!opf) throw new Error(`EPUB 缺少 OPF 文件：${opfPath}`)

  const opfDir = dirnamePosix(opfPath)
  const manifest = new Map()
  for (const match of opf.matchAll(/<item\b[^>]*>/gi)) {
    const item = match[0]
    const id = attr(item, 'id')
    const href = attr(item, 'href')
    if (id && href) {
      manifest.set(id, {
        id,
        href: normalizePosix(joinPosix(opfDir, href)),
        mediaType: attr(item, 'media-type'),
        properties: attr(item, 'properties'),
      })
    }
  }

  const spine = []
  const spineTag = opf.match(/<spine\b[^>]*>/i)?.[0] || ''
  const spineTocId = attr(spineTag, 'toc')
  for (const match of opf.matchAll(/<itemref\b[^>]*>/gi)) {
    const idref = attr(match[0], 'idref')
    if (manifest.has(idref)) spine.push(manifest.get(idref))
  }

  const tocTitleMap = new Map()
  /** @type {Map<string, Array<{fragment: string, title: string}>>} */
  const fileAnchors = new Map()
  const navItems = [...manifest.values()].filter(item => /\bnav\b/i.test(item.properties || ''))
  for (const item of navItems) {
    const navHtml = textEntry(entries, item.href)
    if (navHtml) mergeTocTitleMap(tocTitleMap, parseNavDocToc(navHtml, item.href))
  }
  if (tocTitleMap.size === 0) {
    const ncxItems = [
      spineTocId ? manifest.get(spineTocId) : null,
      ...[...manifest.values()].filter(item => item.mediaType === 'application/x-dtbncx+xml' || /\.ncx$/i.test(item.href)),
    ].filter(Boolean)
    for (const item of ncxItems) {
      const ncxXml = textEntry(entries, item.href)
      if (ncxXml) {
        const result = parseNcxToc(ncxXml, item.href)
        const tocMap = result instanceof Map ? result : result.toc
        mergeTocTitleMap(tocTitleMap, tocMap)
        if (!(result instanceof Map) && result.anchors) mergeAnchors(fileAnchors, result.anchors)
      }
      if (tocTitleMap.size > 0) break
    }
  }

  return {
    title: tagText(opf, 'title'),
    creator: tagText(opf, 'creator'),
    opfDir,
    manifest,
    spine,
    tocTitleMap,
    fileAnchors,
  }
}

function htmlToMarkdown(html, assets, chapterPath, links = new Map()) {
  let body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html
  body = body.replace(/<script\b[\s\S]*?<\/script>/gi, '')
  body = body.replace(/<style\b[\s\S]*?<\/style>/gi, '')
  body = body.replace(/<!--[\s\S]*?-->/g, '')
  body = body.replace(/<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi, (_, tag, content) => {
    return `\n\n${'#'.repeat(Number(tag[1]))} ${decodeHtml(stripTags(content)).trim()}\n\n`
  })
  body = body.replace(/<img\b[^>]*>/gi, tag => {
    const src = attr(tag, 'src')
    const alt = attr(tag, 'alt')
    if (!src) return ''
    const resolved = normalizePosix(joinPosix(dirnamePosix(chapterPath), src.split('#')[0]))
    const local = assets.get(resolved)
    return local ? `\n\n![${decodeHtml(alt)}](${local})\n\n` : `\n\n[图片未找到：${src}]\n\n`
  })
  body = body.replace(/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, (_, href, content) => {
    const label = decodeHtml(stripTags(content)).trim()
    const decodedHref = decodeHtml(href)
    const baseDir = dirnamePosix(chapterPath)
    const target = links.get(normalizeHrefWithFragment(decodedHref, baseDir)) || links.get(normalizeHref(decodedHref, baseDir)) || ''
    // <a> 直接包裹图片资产（如目录页的“封面”链接）：重写到抽取后的本地路径
    if (!target) {
      const asset = assets.get(normalizeHref(decodedHref, baseDir))
      if (asset) return `[${label}](${asset})`
    }
    return `[${label}](${target || decodedHref})`
  })
  body = body.replace(/<\/(p|div|section|article|header|footer|blockquote)>/gi, '\n\n')
  body = body.replace(/<br\s*\/?>/gi, '\n')
  body = body.replace(/<li\b[^>]*>/gi, '\n- ')
  body = body.replace(/<\/li>/gi, '')
  body = body.replace(/<\/?(ul|ol)\b[^>]*>/gi, '\n')
  body = body.replace(/<tr\b[^>]*>/gi, '\n')
  body = body.replace(/<\/t[dh]>/gi, ' | ')
  body = body.replace(/<t[dh]\b[^>]*>/gi, '| ')
  body = body.replace(/<[^>]+>/g, '')
  body = decodeHtml(body)
  body = body.replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()
  return body ? `${body}\n` : ''
}

// zlib 转制 EPUB 常见"空壳页"：整个 HTML 只有一行重复书名/章节名的标题，
// 转成 Markdown 后没有任何正文。用它判定锚点前置段和整页文件是否有实质内容。
// 阈值取 30：足以滤掉纯标题行，又不会误杀约 40 字的真实题记页。
const MIN_BODY_CHARS = 30

function visibleTextLength(html) {
  const text = decodeHtml(
    String(html || '')
      .replace(/<script\b[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ''),
  )
  return text.replace(/\s+/g, '').length
}

// 含图片的页面（封面/插图页）可见文本天然很少，不算空壳
function isShellPage(html) {
  return !/<img\b/i.test(String(html || '')) && visibleTextLength(html) < MIN_BODY_CHARS
}

function safeFileName(index, title, used = new Set()) {
  const compact = titleFileSegment(title)
  const fallback = `chapter-${String(index + 1).padStart(2, '0')}`
  const prefix = String(index + 1).padStart(2, '0')
  let fileName = `${prefix}-${compact || fallback}.md`
  if (!used.has(fileName)) {
    used.add(fileName)
    return fileName
  }
  fileName = `${prefix}-${compact || fallback}-${hashText(title).slice(0, 4)}.md`
  used.add(fileName)
  return fileName
}

function detectEpub(inputPath, args) {
  const entries = readZipEntries(inputPath)
  const opf = parseOpf(entries)
  if (opf.spine.length === 0) throw new Error('EPUB 没有可导入的阅读顺序章节。')
  const title = args.title || opf.title || basename(inputPath, extname(inputPath))
  return {
    kind: 'epub',
    title,
    desc: args.desc || (opf.creator ? `作者：${opf.creator}` : ''),
    slug: slugify(args.slug || title),
    chapterCount: (() => {
      // 与 importEpub 的规划逻辑保持一致：锚点文件按锚点数拆分；有目录标题的
      // 文件各成一章；目录标题之后的无标题文件并入上一章（续写分片）；首个
      // 目录标题之前的前置页独立成章。
      let total = 0
      let open = false
      for (const item of opf.spine) {
        const href = normalizeHref(item.href)
        const html = textEntry(entries, item.href)
        if (html && isShellPage(html)) continue
        const anchors = (opf.fileAnchors && opf.fileAnchors.get(href)) || []
        if (anchors.length > 0) {
          total += anchors.length
          open = false
          continue
        }
        if (opf.tocTitleMap.has(href)) {
          total += 1
          open = true
          continue
        }
        if (open) continue
        total += 1
      }
      return total
    })(),
    warnings: ['EPUB 转 Markdown 会丢弃复杂 CSS 样式；表格会尽量转为文本管道格式。'],
    entries,
    opf,
  }
}

function importEpub(tempDir, info) {
  const assetsDir = join(tempDir, '_assets')
  mkdirSync(assetsDir, { recursive: true })
  const assets = new Map()
  let assetIndex = 1

  for (const item of info.opf.manifest.values()) {
    if (!item.mediaType.startsWith('image/')) continue
    const body = info.entries.get(item.href)
    if (!body) continue
    const ext = extname(item.href) || `.${item.mediaType.split('/')[1] || 'bin'}`
    const fileName = `image-${String(assetIndex).padStart(3, '0')}${ext}`
    assetIndex += 1
    copyBuffer(body, join(assetsDir, fileName))
    assets.set(item.href, `_assets/${fileName}`)
  }

  const chapters = []
  const usedFileNames = new Set()
  const plannedChapters = []
  let chapterIndex = 0
  // planChapter 返回计划对象；parts 保存该章节的各段 HTML（含并入的续写分片），
  // 每段保留自己的源路径，内部链接按各自基准目录解析。
  const planChapter = (title, item, html, fragment = '') => {
    const fileName = safeFileName(chapterIndex, title, usedFileNames)
    chapterIndex += 1
    const targetPath = join(tempDir, fileName)
    const planned = { title, item, parts: [{ html, href: item.href }], targetPath, fileName, fragment }
    plannedChapters.push(planned)
    chapters.push(targetPath)
    return planned
  }
  // 最近一个“由目录标题开启”的章节；后续没有目录标题的 spine 文件视为该章的
  // 续写分片并入（单章拆成多个 HTML 文件的 EPUB 常见）。首个目录标题之前的
  // 前置页（封面/版权等）保持独立章节，不参与合并。
  let mergeTarget = null
  info.opf.spine.forEach((item) => {
    const html = textEntry(info.entries, item.href)
    if (!html) {
      info.warnings.push(`章节缺失：${item.href}`)
      return
    }
    const normalizedHref = normalizeHref(item.href)
    const itemAnchors = (info.opf.fileAnchors && info.opf.fileAnchors.get(normalizedHref)) || []
    const tocTitle = info.opf.tocTitleMap.get(normalizedHref) || ''
    const h1 = html.match(/<h1\b[^>]*>[\s\S]*?<\/h1>/i)?.[0] || ''
    const fallbackTitle = tocTitle || tagText(html, 'title') || cleanTitle(h1) || `第 ${chapterIndex + 1} 章`

    if (itemAnchors.length > 0) {
      const bodyHtml = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html
      const splitPoints = []
      for (const anc of itemAnchors) {
        const escapedFragment = anc.fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const anchorRe = new RegExp(`<[^>]*(?:name|id)=["']${escapedFragment}["'][^>]*>`, 'i')
        const m = bodyHtml.match(anchorRe)
        if (m) splitPoints.push({ pos: m.index, title: anc.title, fragment: anc.fragment })
      }
      splitPoints.sort((a, b) => a.pos - b.pos)
      // 锚点前的"前置段"只有标题没有正文时不独立成章（zlib 转制 EPUB 每页
      // 开头的重复书名行），否则会产生只含一行标题的空壳 Markdown 文件。
      if (splitPoints.length > 0 && splitPoints[0].pos > 0 && !isShellPage(bodyHtml.slice(0, splitPoints[0].pos))) {
        splitPoints.unshift({ pos: 0, title: fallbackTitle })
      }

      if (splitPoints.length > 0) {
        for (let i = 0; i < splitPoints.length; i++) {
          const start = splitPoints[i].pos
          const end = i + 1 < splitPoints.length ? splitPoints[i + 1].pos : bodyHtml.length
          const chunk = bodyHtml.slice(start, end)
          planChapter(splitPoints[i].title, item, chunk, splitPoints[i].fragment || '')
        }
        mergeTarget = null
        return
      }

      info.warnings.push(`章节锚点未匹配，已按完整章节导入：${item.href}`)
      planChapter(fallbackTitle, item, html)
      mergeTarget = null
      return
    }

    if (!tocTitle && mergeTarget) {
      mergeTarget.parts.push({ html, href: item.href })
      return
    }

    // 整页只有一行重复标题的空壳文件（分册扉页等）：跳过，不占章节编号
    if (isShellPage(html)) {
      info.warnings.push(`空壳页面已跳过：${item.href}`)
      return
    }

    const planned = planChapter(fallbackTitle, item, html)
    mergeTarget = tocTitle ? planned : null
  })

  const links = new Map()
  for (const chapter of plannedChapters) {
    const local = `./${chapter.fileName}`
    for (const part of chapter.parts) {
      const href = normalizeHref(part.href)
      if (!links.has(href)) links.set(href, local)
    }
    if (chapter.fragment) {
      links.set(`${normalizeHref(chapter.item.href)}#${chapter.fragment}`, local)
    }
  }
  for (const chapter of plannedChapters) {
    const md = normalizeProseBlocks(chapter.parts
      .map(part => htmlToMarkdown(part.html, assets, part.href, links))
      .filter(Boolean)
      .join('\n\n'))
    writeFileSync(chapter.targetPath, md || `# ${chapter.title}\n`, 'utf8')
  }

  info.chapterCount = chapters.length
  writeIndex(tempDir, info.title, info.desc, chapters)
}

// zlib 转制 EPUB 的正文常带两类排版遗留：
// 1. 段首 4 个半角空格（TXT 首行缩进的残留）——CommonMark 会把 ≥4 空格缩进的
//    行渲染成代码块，页面上表现为等宽字体、不随页宽换行（横向滚动）。
// 2. 长段落在源里被按固定宽度硬折行成多个段落，断点常落在词中间。
// normalizeProseBlocks 去掉段首缩进（围栏代码块内除外），并把"句未结束却被
// 断开的散文段"拼回一段，供 EPUB 导入流程与存量书籍修复脚本共用。
// 仅适用于散文书籍（EPUB 小说等）：掘金类技术书源里的缩进代码块是有意的，
// 不能对其运行本函数。

// 段落以这些字符结尾视为句读完整，不再与下一段合并。破折号“——”视为句读
// 完整：小说常用它引出歌词/引用（“歌词是这样的——”），若继续合并会把随后
// 逐行排版的歌词全部连锁并成一段。
const PROSE_TERMINAL = /[。！？…”』」）》〉…；：!?;:—]$/
// CJK/全角字符：合并断行时直接拼接，不加空格
const CJK_CHAR = /[\u3000-\u30ff\u3400-\u9fff\uf900-\ufaff\uff00-\uffef]/

function isProseBlock(block) {
  const lines = block.split('\n').filter(line => line.trim())
  if (lines.length === 0) return false
  if (/^(#{1,6}\s|[-*+]\s|\d{1,9}[.)]\s|>|!?\[|<|\||`{3,}|~{3,})/.test(lines[0])) return false
  // 分隔线（---- / **** 等），无论是整块还是块的最后一行，都不参与合并
  if (/^[-*_~=.\s]{3,}$/.test(lines[0]) || /^[-*_~=.\s]{3,}$/.test(lines[lines.length - 1])) return false
  // 纯符号块（※、· 之类场景分隔符）不是散文
  if (!/[一-鿿A-Za-z0-9]/.test(block)) return false
  return true
}

function openQuoteDepth(text) {
  const opens = (text.match(/“/g) || []).length
  const closes = (text.match(/”/g) || []).length
  return opens - closes
}

function joinFragments(a, b) {
  if (!a) return b
  if (CJK_CHAR.test(a[a.length - 1]) || CJK_CHAR.test(b[0])) return a + b
  return `${a} ${b}`
}

// 块尾没有句末标点时，仅当"结尾处于未闭合引号内"或"块长 ≥30 字"才与下一块
// 合并。歌词、题记、版权信息等有意的短行（无句末标点但不满足上述条件）保持
// 原样分行。
function wantsJoin(text) {
  if (PROSE_TERMINAL.test(text)) return false
  return openQuoteDepth(text) > 0 || [...text].length >= 30
}

function normalizeProseBlocks(markdown) {
  const lines = String(markdown || '')
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(line => line.replace(/[ \t]+$/, ''))

  // 去段首缩进（围栏内除外）
  let inFence = false
  const stripped = lines.map((line) => {
    if (/^\s*(`{3,}|~{3,})/.test(line)) {
      inFence = !inFence
      return line
    }
    return inFence ? line : line.replace(/^[ \t]+/, '')
  })

  const normalized = stripped.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  if (!normalized) return ''
  const blocks = normalized.split(/\n\n+/)
  const out = []
  for (const block of blocks) {
    const prose = isProseBlock(block)
    const text = prose
      ? block.split('\n').reduce((acc, line) => joinFragments(acc, line.trim()), '')
      : block
    const prev = out[out.length - 1]
    if (prev && prev.joinable && prose) {
      prev.text = joinFragments(prev.text, text)
      prev.joinable = wantsJoin(prev.text)
    } else {
      out.push({ text, joinable: prose ? wantsJoin(text) : false })
    }
  }
  return `${out.map(block => block.text).join('\n\n').trim()}\n`
}

function copyBuffer(buffer, target) {
  writeFileSync(target, buffer)
}

function preview(info, targetDir) {
  console.log('导入预览')
  console.log(`- 类型：${info.kind === 'epub' ? 'EPUB' : 'Markdown 文件夹'}`)
  console.log(`- 书名：${info.title}`)
  console.log(`- slug：${info.slug}`)
  console.log(`- 章节数量：${info.chapterCount}`)
  console.log(`- 目标路径：${targetDir}`)
  if (info.warnings.length > 0) {
    console.log('- 可疑项：')
    for (const warning of info.warnings) console.log(`  - ${warning}`)
  } else {
    console.log('- 可疑项：无')
  }
}

function updateBooks(info) {
  const books = readJson(booksPath, [])
  const next = books.filter(book => book.slug !== info.slug)
  next.push({
    slug: info.slug,
    title: info.title,
    desc: info.desc,
    category: info.kind === 'epub' ? 'ebook' : 'booklet',
  })
  writeJson(booksPath, next)
}

function commitTarget(tempDir, targetDir, force) {
  let backupDir = ''
  if (existsSync(targetDir)) {
    if (!force) throw new Error(`目标书籍已存在：${targetDir}。如需覆盖，请显式传入 --force。`)
    backupDir = `${targetDir}.backup-${Date.now()}`
    renameSync(targetDir, backupDir)
  }
  try {
    try {
      renameSync(tempDir, targetDir)
    } catch (error) {
      if (error && (error.code === 'EPERM' || error.code === 'EXDEV')) {
        cpSync(tempDir, targetDir, { recursive: true })
        rmSync(tempDir, { recursive: true, force: true })
      } else {
        throw error
      }
    }
    if (backupDir) rmSync(backupDir, { recursive: true, force: true })
  } catch (error) {
    if (backupDir && existsSync(backupDir) && !existsSync(targetDir)) renameSync(backupDir, targetDir)
    throw error
  }
}

// 对刚导入的 book 目录自动运行 markdownlint --fix，根治 EPUB/掘金源常见的
// 连续空行(MD012)、标题缺空行(MD022)、尾随空格(MD009)等纯格式违规，
// 避免导入后忘跑 lint 导致 CI 红灯。不阻断导入：失败仅 warn。
function lintFixBook(bookDir) {
  const cliPath = join(root, 'node_modules', 'markdownlint-cli2', 'markdownlint-cli2-bin.mjs')
  if (!existsSync(cliPath)) {
    console.warn('未找到 markdownlint-cli2，跳过自动格式修复。请手动运行 npm run lint:fix。')
    return
  }
  const rel = relative(root, bookDir).split(sep).join('/')
  const result = spawnSync(process.execPath, [cliPath, '--fix', `${rel}/**/*.md`], {
    cwd: root,
    encoding: 'utf8',
  })
  // markdownlint-cli2 退出码：0 无违规；1 有违规（可自动修的已修，仍剩不可修）；2 致命错误
  if (result.status === 0) {
    console.log(`已对 ${rel} 自动运行 markdownlint --fix。`)
  } else if (result.status === 1) {
    console.warn(`⚠ ${rel} 经 --fix 后仍有无法自动修复的违规，请手动运行 npm run lint 检查。`)
  } else {
    console.warn(`⚠ markdownlint --fix 异常（退出码 ${result.status}）：\n${result.stderr || result.stdout || ''}`)
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2))
  if (args.help || !args.input) {
    console.log(usage())
    return
  }

  const inputPath = resolve(args.input)
  if (!existsSync(inputPath)) throw new Error(`输入路径不存在：${inputPath}`)

  const stat = statSync(inputPath)
  let info
  if (stat.isDirectory()) {
    info = detectMarkdownFolder(inputPath, args)
  } else if (stat.isFile() && extname(inputPath).toLowerCase() === '.epub') {
    info = detectEpub(inputPath, args)
  } else {
    throw new Error('仅支持 Markdown 文件夹或 EPUB 文件。')
  }

  const targetDir = join(docsBooksDir, info.slug)
  preview(info, targetDir)

  if (existsSync(targetDir) && !args.force) {
    throw new Error(`目标书籍已存在：${targetDir}。如需覆盖，请显式传入 --force。`)
  }
  if (args.dryRun) return

  const tempParent = mkdtempSync(join(docsBooksDir, `.import-${info.slug}-`))
  const tempDir = join(tempParent, info.slug)
  mkdirSync(tempDir)

  try {
    if (info.kind === 'markdown') importMarkdownFolder(inputPath, tempDir, info)
    else importEpub(tempDir, info)

    commitTarget(tempDir, targetDir, args.force)
    rmSync(tempParent, { recursive: true, force: true })
    updateBooks(info)
    updateSidebarForBook(info)
    lintFixBook(targetDir)
    console.log('导入完成。')
  } catch (error) {
    rmSync(tempParent, { recursive: true, force: true })
    throw error
  }
}

export {
  lintFixBook,
  cleanTitle,
  decodeHtml,
  normalizeHref,
  normalizeProseBlocks,
  numberedChapterLabel,
  parseNavDocToc,
  parseNcxToc,
  parseOpf,
  importEpub,
  readZipEntries,
  safeFileName,
  titleFileSegment,
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
