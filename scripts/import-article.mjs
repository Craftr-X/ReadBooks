/**
 * import-article.mjs — 将单篇文章写入「文章收藏」合辑（slug=articles）。
 *
 * 输入优先级：
 * 1. --markdown <file>  已抽好的 Markdown 正文（浏览器/OCR/人工）
 * 2. --url <url>        尝试 Jina Reader → 直连抓取（知乎/公众号等常失败）
 *
 * 失败时以明确错误码退出，供 agent 改走浏览器抽取后再 --markdown 入库。
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { titleFileSegment } from './import-book.mjs'
import { updateSidebarForBook } from './generate-sidebar.mjs'
import { generateContentStats } from './generate-content-stats.mjs'
import { readJson } from './content-utils.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const COLLECTION_SLUG = 'articles'
const COLLECTION_TITLE = '文章收藏'

const PLATFORM_RULES = [
  { re: /zhihu\.com/i, name: '知乎' },
  { re: /mp\.weixin\.qq\.com|weixin\.qq\.com/i, name: '微信公众号' },
  { re: /juejin\.cn/i, name: '掘金' },
  { re: /sspai\.com/i, name: '少数派' },
  { re: /medium\.com/i, name: 'Medium' },
  { re: /substack\.com/i, name: 'Substack' },
  { re: /github\.com/i, name: 'GitHub' },
]

function parseArgs(argv) {
  const args = { dryRun: false, force: false }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--dry-run') args.dryRun = true
    else if (arg === '--force') args.force = true
    else if (arg === '--url') args.url = argv[++i]
    else if (arg === '--markdown' || arg === '--md') args.markdown = argv[++i]
    else if (arg === '--title') args.title = argv[++i]
    else if (arg === '--author') args.author = argv[++i]
    else if (arg === '--platform') args.platform = argv[++i]
    else if (arg === '--date') args.date = argv[++i]
    else if (arg === '--short-title') args.shortTitle = argv[++i]
    else if (arg === '--root') args.root = argv[++i]
    else if (arg === '--help' || arg === '-h') args.help = true
    else if (arg.startsWith('--')) throw new Error(`未知参数：${arg}`)
    else if (!args.url) args.url = arg
    else throw new Error(`多余参数：${arg}`)
  }
  return args
}

function usage() {
  return [
    '用法：',
    '  npm run import:article -- --url <url> [--title t] [--author a]',
    '  npm run import:article -- --markdown ./draft.md --url <url> --title t',
    '',
    '选项：',
    '  --url           原文链接（写入引用块；无 --markdown 时尝试自动抓取）',
    '  --markdown      已抽取的 Markdown 正文文件（知乎等站点推荐）',
    '  --title         文章标题（抓取失败或不准时必填）',
    '  --author        作者',
    '  --platform      来源平台名（默认按域名推断）',
    '  --date          收录日期 YYYY-MM-DD（默认今天本地日期）',
    '  --short-title   文件名短标题（默认从标题截断）',
    '  --force         覆盖已存在的同名编号文件',
    '  --dry-run       只打印将写入的路径与元数据，不落盘',
  ].join('\n')
}

function todayLocal() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function detectPlatform(url, override) {
  if (override) return override
  if (!url) return '网页'
  try {
    const host = new URL(url).hostname
    for (const rule of PLATFORM_RULES) {
      if (rule.re.test(host)) return rule.name
    }
    return host.replace(/^www\./, '')
  } catch {
    return '网页'
  }
}

function isLikelyBlockedHost(url) {
  if (!url) return false
  return /zhihu\.com|mp\.weixin\.qq\.com|weixin\.qq\.com/i.test(url)
}

/** 从标题生成文件名短段（保留中文，去掉不安全字符） */
function shortTitleFrom(title, override, maxLen = 24) {
  if (override) return titleFileSegment(override).slice(0, maxLen).replace(/-+$/g, '') || 'article'
  const segment = titleFileSegment(title)
  if (!segment) return 'article'
  if (segment.length <= maxLen) return segment
  return segment.slice(0, maxLen).replace(/-+$/g, '') || 'article'
}

/** 扫描合辑目录，得到下一个两位编号 */
function nextArticleNumber(collectionDir) {
  if (!existsSync(collectionDir)) return 1
  let max = 0
  for (const name of readdirSync(collectionDir)) {
    const m = name.match(/^(\d{2,})-.*\.md$/i)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return max + 1
}

function buildCitation({ platform, url, author, date }) {
  const parts = [`📌 来源：${platform}`]
  if (url) parts[0] = `📌 来源：[${platform}](${url})`
  if (author) parts.push(`作者：${author}`)
  parts.push(`收录于 ${date}`)
  return `> ${parts.join(' · ')}`
}

function stripFetchedNoise(markdown) {
  let body = String(markdown || '').replace(/^\uFEFF/, '')
  // Jina Reader 头信息
  const jinaMatch = body.match(/^Title:\s*(.+)\s*\nURL Source:\s*.+\s*\n(?:Warning:.*\n)?(?:Markdown Content:\s*\n)?([\s\S]*)$/i)
  if (jinaMatch) {
    return { title: jinaMatch[1].trim(), body: jinaMatch[2].trim() }
  }
  // 常见「标题在首行 #」
  const heading = body.match(/^#\s+(.+)\n+([\s\S]*)$/)
  if (heading) return { title: heading[1].trim(), body: heading[2].trim() }
  return { title: '', body: body.trim() }
}

async function fetchViaJina(url) {
  const endpoint = `https://r.jina.ai/${url}`
  const res = await fetch(endpoint, {
    headers: {
      Accept: 'text/markdown',
      'User-Agent': 'CraftXBooksArticleImporter/1.0',
    },
  })
  if (!res.ok) throw new Error(`Jina Reader HTTP ${res.status}`)
  const text = await res.text()
  if (/没有知识存在的荒原|登录\/注册|Verification|captcha/i.test(text) && text.length < 2500) {
    throw new Error('Jina Reader 返回登录墙或空页')
  }
  return stripFetchedNoise(text)
}

async function fetchDirect(url) {
  const res = await fetch(url, {
    headers: {
      Accept: 'text/html,application/xhtml+xml',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`直连 HTTP ${res.status}`)
  const html = await res.text()
  const title =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.replace(/\s*[|\-].*$/, '').trim() ||
    ''
  // 极简去标签：仅作开放站点兜底，复杂站点请走 --markdown
  const cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
  if (cleaned.length < 80) throw new Error('直连正文过短')
  return { title: decodeHtmlEntities(title), body: cleaned }
}

function decodeHtmlEntities(text) {
  return String(text || '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

async function resolveContent(args) {
  if (args.markdown) {
    const path = resolve(args.markdown)
    if (!existsSync(path)) throw new Error(`找不到 Markdown 文件：${path}`)
    const raw = readFileSync(path, 'utf8')
    const parsed = stripFetchedNoise(raw)
    return {
      title: args.title || parsed.title || '',
      body: parsed.body || raw.trim(),
      source: 'markdown-file',
    }
  }
  if (!args.url) throw new Error('请提供 --url 或 --markdown')

  const errors = []
  try {
    const viaJina = await fetchViaJina(args.url)
    if (viaJina.body && viaJina.body.length >= 80) {
      return {
        title: args.title || viaJina.title,
        body: viaJina.body,
        source: 'jina',
      }
    }
    errors.push('Jina 正文过短')
  } catch (e) {
    errors.push(`Jina: ${e.message}`)
  }

  if (!isLikelyBlockedHost(args.url)) {
    try {
      const direct = await fetchDirect(args.url)
      return {
        title: args.title || direct.title,
        body: direct.body,
        source: 'direct',
      }
    } catch (e) {
      errors.push(`直连: ${e.message}`)
    }
  } else {
    errors.push('站点可能防抓（知乎/公众号），跳过直连')
  }

  const hint = isLikelyBlockedHost(args.url)
    ? '请用浏览器打开原文，复制/抽取正文为 .md 后重试：npm run import:article -- --markdown draft.md --url <url> --title "..."'
    : '请改用 --markdown 提供正文'
  const err = new Error(`FETCH_BLOCKED：无法自动抓取。${errors.join('；')}。${hint}`)
  err.code = 'FETCH_BLOCKED'
  throw err
}

function ensureCollection(projectRoot) {
  const books = readJson(join(projectRoot, 'books.json'), [])
  const entry = books.find(b => b.slug === COLLECTION_SLUG)
  if (!entry) {
    throw new Error(`books.json 中未登记 slug=${COLLECTION_SLUG}，请先合并「文章收藏」栏目 PR`)
  }
  const dir = join(projectRoot, 'docs', 'books', COLLECTION_SLUG)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  const indexPath = join(dir, 'index.md')
  if (!existsSync(indexPath)) {
    writeFileSync(
      indexPath,
      [
        '---',
        'layout: doc',
        `title: ${COLLECTION_TITLE}`,
        'description: 好文章随手收录',
        'aside: false',
        'editLink: false',
        '---',
        '',
        `# ${COLLECTION_TITLE}`,
        '',
        '> 按收录时间编号归档。',
        '',
        '## 目录',
        '',
        '',
      ].join('\n'),
      'utf8',
    )
  }
  return { entry, dir, indexPath }
}

function appendIndexLink(indexPath, title, fileName) {
  let content = readFileSync(indexPath, 'utf8')
  const link = `- [${title}](./${fileName})`
  if (content.includes(`](./${fileName})`)) return false
  if (!content.endsWith('\n')) content += '\n'
  if (!/\n## 目录\s*\n/.test(content) && !/^## 目录\s*$/m.test(content)) {
    content += `\n## 目录\n\n${link}\n`
  } else {
    content += `${link}\n`
  }
  writeFileSync(indexPath, content, 'utf8')
  return true
}

function buildArticleMarkdown({ title, citation, body }) {
  const cleaned = body.replace(/^#\s+.+\n+/, '').trim()
  return [`# ${title}`, '', citation, '', cleaned, ''].join('\n')
}

async function importArticle(options = {}) {
  const projectRoot = resolve(options.root || root)
  const args = {
    url: options.url,
    markdown: options.markdown,
    title: options.title,
    author: options.author,
    platform: options.platform,
    date: options.date || todayLocal(),
    shortTitle: options.shortTitle,
    dryRun: Boolean(options.dryRun),
    force: Boolean(options.force),
  }

  const { entry, dir, indexPath } = ensureCollection(projectRoot)
  const content = await resolveContent(args)
  const title = (args.title || content.title || '').trim()
  if (!title) throw new Error('缺少标题：请传 --title')

  const platform = detectPlatform(args.url, args.platform)
  const citation = buildCitation({
    platform,
    url: args.url,
    author: args.author,
    date: args.date,
  })
  const num = nextArticleNumber(dir)
  const short = shortTitleFrom(title, args.shortTitle)
  const fileName = `${String(num).padStart(2, '0')}-${short}.md`
  const filePath = join(dir, fileName)

  if (existsSync(filePath) && !args.force) {
    throw new Error(`目标已存在：${filePath}（加 --force 可覆盖）`)
  }

  const markdown = buildArticleMarkdown({ title, citation, body: content.body })
  const result = {
    slug: COLLECTION_SLUG,
    title,
    fileName,
    filePath,
    platform,
    source: content.source,
    url: args.url || null,
    bytes: Buffer.byteLength(markdown, 'utf8'),
  }

  if (args.dryRun) return { ...result, dryRun: true, markdown }

  writeFileSync(filePath, markdown, 'utf8')
  appendIndexLink(indexPath, title, fileName)
  updateSidebarForBook(entry, { root: projectRoot })
  generateContentStats({ root: projectRoot })

  return { ...result, dryRun: false }
}

async function main(argv = process.argv.slice(2)) {
  const args = parseArgs(argv)
  if (args.help) {
    console.log(usage())
    return
  }
  const result = await importArticle({ ...args, root: args.root || root })
  if (result.dryRun) {
    console.log(JSON.stringify({ ...result, markdown: undefined }, null, 2))
    console.log('--- markdown preview ---')
    console.log(result.markdown.slice(0, 1200))
    return
  }
  console.log(
    JSON.stringify(
      {
        ok: true,
        file: `docs/books/${COLLECTION_SLUG}/${result.fileName}`,
        title: result.title,
        platform: result.platform,
        source: result.source,
      },
      null,
      2,
    ),
  )
}

export {
  parseArgs,
  detectPlatform,
  shortTitleFrom,
  nextArticleNumber,
  buildCitation,
  stripFetchedNoise,
  buildArticleMarkdown,
  importArticle,
  isLikelyBlockedHost,
  COLLECTION_SLUG,
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error.message)
    process.exitCode = error.code === 'FETCH_BLOCKED' ? 2 : 1
  })
}
