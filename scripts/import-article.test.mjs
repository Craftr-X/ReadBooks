import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import {
  detectPlatform,
  shortTitleFrom,
  nextArticleNumber,
  buildCitation,
  stripFetchedNoise,
  buildArticleMarkdown,
  importArticle,
  COLLECTION_SLUG,
} from './import-article.mjs'
import { generateSidebar } from './generate-sidebar.mjs'
import { generateContentStats } from './generate-content-stats.mjs'

function makeProject() {
  const root = mkdtempSync(join(tmpdir(), 'craftx-article-'))
  mkdirSync(join(root, 'docs', 'books', COLLECTION_SLUG), { recursive: true })
  writeFileSync(
    join(root, 'books.json'),
    `${JSON.stringify(
      [
        {
          slug: COLLECTION_SLUG,
          title: '文章收藏',
          desc: 'test',
          category: 'booklet',
          genre: 'articles',
        },
      ],
      null,
      2,
    )}\n`,
  )
  writeFileSync(
    join(root, 'docs', 'books', COLLECTION_SLUG, 'index.md'),
    ['# 文章收藏', '', '## 目录', '', '- [已有一篇](./01-已有一篇.md)', ''].join('\n'),
  )
  writeFileSync(
    join(root, 'docs', 'books', COLLECTION_SLUG, '01-已有一篇.md'),
    '# 已有一篇\n\n正文\n',
  )
  writeFileSync(join(root, 'sidebar-generated.json'), '{}\n')
  generateSidebar({ root })
  generateContentStats({ root })
  return root
}

test('detectPlatform 按域名识别常见平台', () => {
  assert.equal(detectPlatform('https://zhuanlan.zhihu.com/p/123'), '知乎')
  assert.equal(detectPlatform('https://www.zhihu.com/question/1/answer/2'), '知乎')
  assert.equal(detectPlatform('https://mp.weixin.qq.com/s/abc'), '微信公众号')
  assert.equal(detectPlatform('https://juejin.cn/post/1'), '掘金')
  assert.equal(detectPlatform('https://example.com/a', '自定义'), '自定义')
})

test('shortTitleFrom 截断并清洗文件名', () => {
  const short = shortTitleFrom('真正的高手，是在一片混乱和不确定性中，依然能把事情往前推进的人')
  assert.ok(short.length <= 24)
  assert.equal(shortTitleFrom('任意', '自定义短标题'), '自定义短标题')
})

test('nextArticleNumber 基于现有编号递增', () => {
  const root = makeProject()
  const dir = join(root, 'docs', 'books', COLLECTION_SLUG)
  assert.equal(nextArticleNumber(dir), 2)
})

test('buildCitation 含链接作者与日期', () => {
  const line = buildCitation({
    platform: '知乎',
    url: 'https://zhuanlan.zhihu.com/p/1',
    author: '张三',
    date: '2026-11-17',
  })
  assert.match(line, /^> 📌 来源：\[知乎\]\(https:\/\/zhuanlan\.zhihu\.com\/p\/1\)/)
  assert.match(line, /作者：张三/)
  assert.match(line, /收录于 2026-11-17/)
})

test('stripFetchedNoise 解析 Jina 头信息', () => {
  const raw = [
    'Title: 示例标题',
    'URL Source: https://example.com/a',
    'Markdown Content:',
    '# 示例标题',
    '',
    '正文一段。',
  ].join('\n')
  const parsed = stripFetchedNoise(raw)
  assert.equal(parsed.title, '示例标题')
  assert.match(parsed.body, /正文一段/)
})

test('buildArticleMarkdown 文首含标题与引用块', () => {
  const md = buildArticleMarkdown({
    title: '标题',
    citation: '> 📌 来源：知乎 · 收录于 2026-11-17',
    body: 'Hello\n\nWorld',
  })
  assert.match(md, /^# 标题\n/)
  assert.match(md, /^> 📌 来源：知乎/m)
  assert.match(md, /Hello/)
})

test('importArticle 从 --markdown 写入下一编号并更新目录', async () => {
  const root = makeProject()
  const draft = join(root, 'draft.md')
  writeFileSync(draft, '# 草稿标题\n\n这是抽取出的正文，足够长用于入库测试。\n', 'utf8')

  const result = await importArticle({
    root,
    markdown: draft,
    url: 'https://zhuanlan.zhihu.com/p/999',
    author: '测试作者',
    date: '2026-11-17',
  })

  assert.equal(result.fileName, '02-草稿标题.md')
  assert.equal(existsSync(result.filePath), true)
  const written = readFileSync(result.filePath, 'utf8')
  assert.match(written, /^# 草稿标题/m)
  assert.match(written, /测试作者/)
  assert.match(written, /zhuanlan\.zhihu\.com\/p\/999/)

  const index = readFileSync(join(root, 'docs', 'books', COLLECTION_SLUG, 'index.md'), 'utf8')
  assert.match(index, /02-草稿标题\.md/)
})

test('importArticle dry-run 不落盘', async () => {
  const root = makeProject()
  const draft = join(root, 'draft.md')
  writeFileSync(draft, '# Dry\n\n正文内容不少于八十个字符用来满足基本长度检查——这里补一些字。\n', 'utf8')
  const before = nextArticleNumber(join(root, 'docs', 'books', COLLECTION_SLUG))
  const result = await importArticle({
    root,
    markdown: draft,
    url: 'https://example.com/x',
    dryRun: true,
  })
  assert.equal(result.dryRun, true)
  assert.equal(nextArticleNumber(join(root, 'docs', 'books', COLLECTION_SLUG)), before)
  assert.equal(existsSync(result.filePath), false)
})
