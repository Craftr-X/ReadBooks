#!/usr/bin/env node
/**
 * audit-content.mjs — 源 EPUB 与导入产出 Markdown 的内容对账。
 *
 * 用法：node scripts/audit-content.mjs <slug> <source.epub> [--tolerance 0.03]
 *
 * 两道检查，互补：
 * 1. 总量对比：源 EPUB spine 可见字符总数 vs docs/books/<slug>/ 章节 Markdown
 *    可见字符总数，差异超过阈值（默认 3%）报错。捕获大面积丢失。
 * 2. 逐文件抽样：每个 ≥100 字符的 spine 文件在 10%/50%/90% 三处各取 24 字符
 *    样本，验证其出现在产出 Markdown 拼接文本中。捕获单文件/单块丢失。
 *
 * 两边都归一化为"去空白纯文本"再比较，规避换行、Markdown 标记（标题/列表/
 * 引用/链接语法/表格管道符）与图片引用造成的差异。构造性验证（verify-import、
 * build、死链）验证的是结构完好；本脚本验证的是内容不丢。
 */

import { readdirSync, readFileSync } from 'fs'
import { join, resolve } from 'path'
import { decodeHtml, parseOpf, readZipEntries } from './import-book.mjs'

const SAMPLE_LEN = 24
const SAMPLE_MIN_FILE_CHARS = 100
const SAMPLE_POSITIONS = [0.1, 0.5, 0.9]
const DEFAULT_TOLERANCE = 0.03

function normalizeHtml(html) {
  const body = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html
  return decodeHtml(
    body
      .replace(/<script\b[\s\S]*?<\/script>/gi, '')
      .replace(/<style\b[\s\S]*?<\/style>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<[^>]+>/g, ''),
  ).replace(/\s+/g, '')
}

function normalizeMarkdown(text) {
  return text
    .replace(/^---\n[\s\S]*?\n---\n?/, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .split('\n')
    .map(line => line
      .replace(/^\s*#{1,6}\s*/, '')
      .replace(/^\s*[-*+]\s+/, '')
      .replace(/^\s*>\s?/, ''))
    .join('\n')
    .replace(/\|/g, '')
    .replace(/\s+/g, '')
}

/**
 * @returns {{
 *   slug: string,
 *   spineFiles: number,
 *   srcTotal: number,
 *   outTotal: number,
 *   delta: number,
 *   toleranceExceeded: boolean,
 *   sampledFiles: number,
 *   samples: number,
 *   misses: Array<{ href: string, sample: string }>,
 * }}
 */
function auditBook({ slug, epubPath, booksDir, tolerance = DEFAULT_TOLERANCE }) {
  const entries = readZipEntries(resolve(epubPath))
  const opf = parseOpf(entries)

  const bookDir = join(booksDir, slug)
  const mdFiles = readdirSync(bookDir).filter(file => file.endsWith('.md') && file !== 'index.md').sort()
  const output = mdFiles
    .map(file => normalizeMarkdown(readFileSync(join(bookDir, file), 'utf8')))
    .join('')

  let srcTotal = 0
  let sampledFiles = 0
  let samples = 0
  const misses = []
  for (const item of opf.spine) {
    const html = entries.get(item.href)?.toString('utf8') || ''
    const norm = normalizeHtml(html)
    srcTotal += norm.length
    if (norm.length < SAMPLE_MIN_FILE_CHARS) continue
    sampledFiles += 1
    for (const ratio of SAMPLE_POSITIONS) {
      const sample = norm.slice(Math.floor(norm.length * ratio), Math.floor(norm.length * ratio) + SAMPLE_LEN)
      if (sample.length < SAMPLE_LEN) continue
      samples += 1
      if (!output.includes(sample)) misses.push({ href: item.href, sample })
    }
  }

  const delta = srcTotal > 0 ? (srcTotal - output.length) / srcTotal : 0
  return {
    slug,
    spineFiles: opf.spine.length,
    srcTotal,
    outTotal: output.length,
    delta,
    toleranceExceeded: Math.abs(delta) > tolerance,
    tolerance,
    sampledFiles,
    samples,
    misses,
  }
}

function printReport(report) {
  const percent = (report.delta * 100).toFixed(2)
  const ok = !report.toleranceExceeded && report.misses.length === 0
  console.log(`内容对账：${report.slug}`)
  console.log(`- 源 EPUB：${report.spineFiles} 个 spine 文件，可见字符 ${report.srcTotal}`)
  console.log(`- 产出 Markdown：可见字符 ${report.outTotal}`)
  console.log(`- 总量差异：${percent > 0 ? '-' : '+'}${Math.abs(percent)}%（阈值 ${(report.tolerance * 100).toFixed(0)}%）`)
  console.log(`- 抽样：${report.sampledFiles} 个文件 × ${report.samples > 0 ? Math.round(report.samples / report.sampledFiles) : 0} 处 = ${report.samples} 处，缺失 ${report.misses.length} 处`)
  if (report.misses.length > 0) {
    console.log('- 缺失样本（源文件 → 样本内容）：')
    for (const miss of report.misses) console.log(`  - ${miss.href} → "${miss.sample}"`)
  }
  console.log(ok ? '✓ 通过' : '✗ 未通过')
  return ok
}

function main() {
  const args = process.argv.slice(2)
  let slug = ''
  let epub = ''
  let tolerance = DEFAULT_TOLERANCE
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--tolerance') tolerance = Number(args[++i])
    else if (!slug) slug = args[i]
    else if (!epub) epub = args[i]
  }
  if (!slug || !epub) {
    console.error('用法：node scripts/audit-content.mjs <slug> <source.epub> [--tolerance 0.03]')
    process.exit(2)
  }
  const root = resolve(import.meta.dirname, '..')
  const report = auditBook({ slug, epubPath: epub, booksDir: join(root, 'docs', 'books'), tolerance })
  if (!printReport(report)) process.exit(1)
}

export { auditBook, normalizeHtml, normalizeMarkdown, SAMPLE_LEN }

if (process.argv[1] && resolve(process.argv[1]) === import.meta.filename) {
  main()
}
