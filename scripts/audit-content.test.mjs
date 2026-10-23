import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { auditBook, normalizeHtml, normalizeMarkdown } from './audit-content.mjs'

// 构造只含 local file header 的 stored（无压缩）ZIP；readZipEntries 顺序扫描
// 签名即可读出，无需 central directory。
function makeZip(files) {
  const enc = new TextEncoder()
  const chunks = []
  for (const [name, content] of files) {
    const nameB = enc.encode(name)
    const body = enc.encode(content)
    const header = Buffer.alloc(30)
    header.writeUInt32LE(0x04034b50, 0)
    header.writeUInt16LE(0, 6) // flags
    header.writeUInt16LE(0, 8) // method: stored
    header.writeUInt32LE(body.length, 18) // compressed size
    header.writeUInt32LE(body.length, 22) // uncompressed size
    header.writeUInt16LE(nameB.length, 26)
    chunks.push(header, nameB, body)
  }
  return Buffer.concat(chunks)
}

function chapterBody(marker) {
  // 章节标记高密度重复：保证任何 24 字抽样窗口都含 marker，
  // 两章内容互不匹配（区分度低的正文会让缺失章的样本误命中）
  return `<html><body><h1>${marker}</h1>${('<p>' + marker.repeat(20) + '</p>').repeat(8)}</body></html>`
}

function buildEpub() {
  return makeZip([
    ['META-INF/container.xml', '<container><rootfile full-path="OEBPS/content.opf"/></container>'],
    ['OEBPS/content.opf', `
      <package>
        <manifest>
          <item id="c1" href="Text/c1.html" media-type="application/xhtml+xml"/>
          <item id="c2" href="Text/c2.html" media-type="application/xhtml+xml"/>
          <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
        </manifest>
        <spine><itemref idref="c1"/><itemref idref="c2"/></spine>
      </package>`],
    ['OEBPS/Text/c1.html', chapterBody('第一章')],
    ['OEBPS/Text/c2.html', chapterBody('第二章')],
  ])
}

function buildBooksDir(files) {
  const booksDir = mkdtempSync(join(tmpdir(), 'audit-content-'))
  const bookDir = join(booksDir, 'test-book')
  mkdirSync(bookDir)
  for (const [name, content] of files) writeFileSync(join(bookDir, name), content, 'utf8')
  writeFileSync(join(bookDir, 'index.md'), '---\nlayout: doc\n---\n\n# 测试\n', 'utf8')
  return { booksDir, bookDir }
}

test('normalizes html and markdown to comparable whitespace-free text', () => {
  const html = '<html><body><h1>标题</h1><p>正文&nbsp;甲</p><a href="x.html">链接文字</a><img src="a.jpg"/></body></html>'
  const md = '# 标题\n\n- 正文 甲\n\n[链接文字](./01-标题.md)\n\n![](a.jpg)\n'
  assert.equal(normalizeHtml(html), '标题正文甲链接文字')
  assert.equal(normalizeMarkdown(md), '标题正文甲链接文字')
})

function chapterMarkdown(marker) {
  return `# ${marker}\n\n${(marker.repeat(20) + '\n\n').repeat(8)}`
}

test('audit passes when output markdown matches the source epub', () => {
  const epubPath = join(tmpdir(), `audit-pass-${Date.now()}.epub`)
  writeFileSync(epubPath, buildEpub())
  const { booksDir } = buildBooksDir([
    ['01-第一章.md', chapterMarkdown('第一章')],
    ['02-第二章.md', chapterMarkdown('第二章')],
  ])
  try {
    const report = auditBook({ slug: 'test-book', epubPath, booksDir })
    assert.equal(report.misses.length, 0)
    assert.equal(report.toleranceExceeded, false)
    assert.equal(report.sampledFiles, 2)
    assert.equal(report.samples, 6)
  } finally {
    rmSync(booksDir, { recursive: true, force: true })
    rmSync(epubPath, { force: true })
  }
})

test('audit reports missing samples when a chapter is absent from output', () => {
  const epubPath = join(tmpdir(), `audit-miss-${Date.now()}.epub`)
  writeFileSync(epubPath, buildEpub())
  const { booksDir } = buildBooksDir([
    ['01-第一章.md', chapterMarkdown('第一章')],
  ])
  try {
    const report = auditBook({ slug: 'test-book', epubPath, booksDir })
    assert.ok(report.misses.length >= 3)
    assert.ok(report.misses.every(miss => miss.href === 'OEBPS/Text/c2.html'))
    assert.equal(report.toleranceExceeded, true)
  } finally {
    rmSync(booksDir, { recursive: true, force: true })
    rmSync(epubPath, { force: true })
  }
})
