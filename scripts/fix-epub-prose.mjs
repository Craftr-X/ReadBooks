// 修复存量"zlib 转制 EPUB"散文书籍的两类排版遗留（对应 import-book.mjs 的
// normalizeProseBlocks，导入流程已内建同样的规范化，此脚本用于修历史数据）：
// 1. 段首 4 空格缩进被 CommonMark 渲染成代码块：等宽字体、不随页宽换行；
// 2. 源文本按固定宽度硬折行，一个段落被断成多块，断点常落在词中间。
//
// 用法：
//   node scripts/fix-epub-prose.mjs <slug> [<slug>...] [--dry-run]
//
// 仅用于散文书籍（EPUB 小说等）。掘金类技术书源里的缩进代码块是有意的，
// 不要对它们运行本脚本。index.md 由导入流程生成（纯目录列表），不在处理范围。

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'fs'
import { dirname, join, resolve } from 'path'
import { fileURLToPath } from 'url'
import { normalizeProseBlocks } from './import-book.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function fixBook(slug, { dryRun }) {
  const bookDir = join(root, 'docs', 'books', slug)
  if (!existsSync(bookDir)) throw new Error(`书籍目录不存在：${bookDir}`)
  const files = readdirSync(bookDir)
    .filter(name => name.endsWith('.md') && name !== 'index.md')
    .sort()

  let changed = 0
  for (const name of files) {
    const file = join(bookDir, name)
    const before = readFileSync(file, 'utf8')
    const after = normalizeProseBlocks(before)
    // 字符不增不减的安全校验：去空白后前后必须完全一致（只允许移除换行/空白）
    const compactBefore = before.replace(/\s+/g, '')
    const compactAfter = after.replace(/\s+/g, '')
    if (compactBefore !== compactAfter) {
      throw new Error(`${name} 规范化后内容字符发生变化，已跳过写回，请人工检查。`)
    }
    if (after !== before) {
      if (!dryRun) writeFileSync(file, after, 'utf8')
      changed += 1
      console.log(`  ${dryRun ? '[dry-run] ' : ''}${name}`)
    }
  }
  console.log(`${slug}: ${changed}/${files.length} 个文件${dryRun ? '将' : '已'}更新`)
}

function main() {
  const argv = process.argv.slice(2)
  const dryRun = argv.includes('--dry-run')
  const slugs = argv.filter(arg => arg !== '--dry-run')
  if (slugs.length === 0) {
    console.error('用法：node scripts/fix-epub-prose.mjs <slug> [<slug>...] [--dry-run]')
    process.exitCode = 1
    return
  }
  for (const slug of slugs) fixBook(slug, { dryRun })
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main()
  } catch (error) {
    console.error(error.message)
    process.exitCode = 1
  }
}
