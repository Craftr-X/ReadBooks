import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  cleanTitle,
  importEpub,
  lintFixBook,
  normalizeHref,
  normalizeProseBlocks,
  numberedChapterLabel,
  parseNavDocToc,
  parseNcxToc,
  parseOpf,
  safeFileName,
  titleFileSegment,
} from './import-book.mjs'

test('parses EPUB3 nav toc titles by normalized href', () => {
  const toc = parseNavDocToc(`
    <html><body>
      <nav epub:type="toc">
        <ol>
          <li><a href="../Text/chapter-01.xhtml#top">实践论</a></li>
          <li><a href="../Text/chapter-02.xhtml">矛盾论</a></li>
          <li><a href="../Text/chapter-02.xhtml#note">重复锚点不覆盖</a></li>
        </ol>
      </nav>
    </body></html>
  `, 'OPS/nav/nav.xhtml')

  assert.equal(toc.get('OPS/Text/chapter-01.xhtml'), '实践论')
  assert.equal(toc.get('OPS/Text/chapter-02.xhtml'), '矛盾论')
})

test('parses EPUB2 NCX toc titles by normalized href', () => {
  const toc = parseNcxToc(`
    <ncx>
      <navMap>
        <navPoint>
          <navLabel><text>第一卷</text></navLabel>
          <content src="Text/vol1.xhtml#toc"/>
          <navPoint>
            <navLabel><text>中国社会各阶级的分析</text></navLabel>
            <content src="Text/chapter-001.xhtml"/>
          </navPoint>
        </navPoint>
      </navMap>
    </ncx>
  `, 'OPS/toc.ncx')

  assert.equal(toc.toc.get('OPS/Text/vol1.xhtml'), '第一卷')
  assert.equal(toc.toc.get('OPS/Text/chapter-001.xhtml'), '中国社会各阶级的分析')
  assert.deepEqual(toc.anchors.get('OPS/Text/vol1.xhtml'), [{ fragment: 'toc', title: '第一卷' }])
})

test('imports EPUB spine files split by NCX anchors', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'import-book-anchor-'))
  try {
    const info = {
      title: '锚点书',
      desc: '测试',
      warnings: [],
      entries: new Map([
        ['OPS/Text/vol.xhtml', Buffer.from(`
          <html><body>
            <p><a href="vol.xhtml#chapter-two">跳到第二章</a></p>
            <p>卷首内容卷首内容卷首内容卷首内容卷首内容卷首内容卷首内容卷首内容卷首内容卷首内容卷首内容卷首内容卷首内容卷首内容卷首内容卷首内容卷首内容卷首内容卷首内容卷首内容卷首内容卷首内容卷首内容卷首内容卷首内容卷首内容卷首内容卷首内容卷首内容卷首内容卷首内容</p>
            <h2 id="chapter-one">第一章</h2><p>第一章正文</p>
            <h2 name="chapter-two">第二章</h2><p>第二章正文</p>
          </body></html>
        `)],
      ]),
      opf: {
        manifest: new Map(),
        spine: [{ href: 'OPS/Text/vol.xhtml' }],
        tocTitleMap: new Map([['OPS/Text/vol.xhtml', '卷首']]),
        fileAnchors: new Map([[
          'OPS/Text/vol.xhtml',
          [
            { fragment: 'chapter-one', title: '第一章' },
            { fragment: 'chapter-two', title: '第二章' },
          ],
        ]]),
      },
    }

    importEpub(tempDir, info)

    const files = readdirSync(tempDir).filter(file => file.endsWith('.md')).sort()
    assert.deepEqual(files, ['01-卷首.md', '02-第一章.md', '03-第二章.md', 'index.md'])
    assert.match(readFileSync(join(tempDir, '01-卷首.md'), 'utf8'), /\[跳到第二章\]\(\.\/03-第二章\.md\)/)
    assert.match(readFileSync(join(tempDir, '02-第一章.md'), 'utf8'), /第一章正文/)
    assert.match(readFileSync(join(tempDir, '03-第二章.md'), 'utf8'), /第二章正文/)
    assert.equal(info.chapterCount, 3)
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
})

test('imports full EPUB spine file when NCX anchors are missing in HTML', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'import-book-missing-anchor-'))
  try {
    const info = {
      title: '缺失锚点书',
      desc: '测试',
      warnings: [],
      entries: new Map([
        ['OPS/Text/vol.xhtml', Buffer.from('<html><body><p>完整正文</p></body></html>')],
      ]),
      opf: {
        manifest: new Map(),
        spine: [{ href: 'OPS/Text/vol.xhtml' }],
        tocTitleMap: new Map([['OPS/Text/vol.xhtml', '完整章节']]),
        fileAnchors: new Map([[
          'OPS/Text/vol.xhtml',
          [{ fragment: 'missing-anchor', title: '不会匹配' }],
        ]]),
      },
    }

    importEpub(tempDir, info)

    const files = readdirSync(tempDir).filter(file => file.endsWith('.md')).sort()
    assert.deepEqual(files, ['01-完整章节.md', 'index.md'])
    assert.match(readFileSync(join(tempDir, '01-完整章节.md'), 'utf8'), /完整正文/)
    assert.match(info.warnings.join('\n'), /章节锚点未匹配/)
    assert.equal(info.chapterCount, 1)
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
})

test('cleans noisy titles and keeps Chinese punctuation', () => {
  assert.equal(cleanTitle('<a class="zy" href="#id1">1</a>'), '')
  assert.equal(cleanTitle('chapter-118'), '')
  assert.equal(cleanTitle('&#x5b9e;&#36341;&#35770;（一九三七年七月）'), '实践论（一九三七年七月）')
  assert.equal(titleFileSegment('中国革命战争的战略问题（一九三六年十二月）'), '中国革命战争的战略问题（一九三六年十二月）')
})

test('rescues numbered chapter markers for NCX whole-file entries only', () => {
  const result = parseNcxToc(`
    <ncx>
      <navMap>
        <navPoint>
          <navLabel><text>CHAPTER 01</text></navLabel>
          <content src="Text/chapter001.xhtml"/>
        </navPoint>
        <navPoint>
          <navLabel><text>第一章</text></navLabel>
          <content src="Text/chapter002.xhtml"/>
        </navPoint>
        <navPoint>
          <navLabel><text>chapter-118</text></navLabel>
          <content src="Text/chapter003.xhtml#sec1"/>
        </navPoint>
      </navMap>
    </ncx>
  `, 'OPS/toc.ncx')

  assert.equal(result.toc.get('OPS/Text/chapter001.xhtml'), 'Chapter-01')
  assert.equal(result.toc.get('OPS/Text/chapter002.xhtml'), '第一章')
  // 带锚点的条目保持严格过滤，不参与标题拯救
  assert.equal(result.toc.get('OPS/Text/chapter003.xhtml'), undefined)
})

test('numbered chapter labels survive titleFileSegment', () => {
  assert.equal(numberedChapterLabel('CHAPTER 01'), 'Chapter-01')
  assert.equal(numberedChapterLabel('chapter 3'), 'Chapter-03')
  assert.equal(numberedChapterLabel('第 3 章'), '第3章')
  assert.equal(numberedChapterLabel('第一章'), '第一章')
  assert.equal(numberedChapterLabel('chapter-118'), 'Chapter-118')
  assert.equal(numberedChapterLabel('实践论'), '')
  assert.equal(titleFileSegment('第 3 章'), '第3章')
  assert.equal(titleFileSegment('Chapter 01'), 'Chapter-01')
})

test('four-digit numeric titles survive cleanTitle but page numbers do not', () => {
  assert.equal(cleanTitle('2015'), '2015')
  assert.equal(cleanTitle('1984'), '1984')
  assert.equal(cleanTitle('92'), '')
  assert.equal(cleanTitle('page3'), '')
})

test('titleFileSegment merges hyphens between Han characters', () => {
  assert.equal(titleFileSegment('自 序'), '自序')
  assert.equal(titleFileSegment('说 明'), '说明')
  assert.equal(titleFileSegment('上篇 我的舅舅'), '上篇我的舅舅')
  assert.equal(titleFileSegment('Chapter 01'), 'Chapter-01')
})

test('skips title-only prelude before the first NCX anchor', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'import-book-shell-prelude-'))
  try {
    const info = {
      title: '空壳前置书',
      desc: '测试',
      warnings: [],
      entries: new Map([
        ['OPS/Text/vol.xhtml', Buffer.from(`
          <html><body>
            <h1>卷名标题</h1>
            <h2 id="chapter-one">第一章</h2><p>第一章正文第一章正文第一章正文第一章正文第一章正文</p>
            <h2 name="chapter-two">第二章</h2><p>第二章正文第二章正文第二章正文第二章正文第二章正文</p>
          </body></html>
        `)],
      ]),
      opf: {
        manifest: new Map(),
        spine: [{ href: 'OPS/Text/vol.xhtml' }],
        tocTitleMap: new Map(),
        fileAnchors: new Map([[
          'OPS/Text/vol.xhtml',
          [
            { fragment: 'chapter-one', title: '第一章' },
            { fragment: 'chapter-two', title: '第二章' },
          ],
        ]]),
      },
    }

    importEpub(tempDir, info)

    const files = readdirSync(tempDir).filter(file => file.endsWith('.md')).sort()
    assert.deepEqual(files, ['01-第一章.md', '02-第二章.md', 'index.md'])
    assert.equal(info.chapterCount, 2)
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
})

test('skips whole-file shell pages that contain only a repeated title', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'import-book-shell-page-'))
  try {
    const info = {
      title: '空壳页书',
      desc: '测试',
      warnings: [],
      entries: new Map([
        ['OPS/Text/fly.xhtml', Buffer.from('<html><body><h1>某书名</h1></body></html>')],
        ['OPS/Text/ch1.xhtml', Buffer.from('<html><body><h1>第一章</h1><p>正文正文正文正文正文正文正文正文正文正文正文正文正文正文正文正文正文正文正文正文正文正文</p></body></html>')],
      ]),
      opf: {
        manifest: new Map(),
        spine: [{ href: 'OPS/Text/fly.xhtml' }, { href: 'OPS/Text/ch1.xhtml' }],
        tocTitleMap: new Map([['OPS/Text/ch1.xhtml', '第一章']]),
        fileAnchors: new Map(),
      },
    }

    importEpub(tempDir, info)

    const files = readdirSync(tempDir).filter(file => file.endsWith('.md')).sort()
    assert.deepEqual(files, ['01-第一章.md', 'index.md'])
    assert.match(info.warnings.join('\n'), /空壳页面已跳过/)
    assert.equal(info.chapterCount, 1)
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
})

test('imports untitled spine files as continuations of the previous NCX chapter', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'import-book-continuation-'))
  try {
    const info = {
      title: '续写书',
      desc: '测试',
      warnings: [],
      entries: new Map([
        ['OPS/Text/cover.xhtml', Buffer.from('<html><body><img src="../Images/cover.jpg" alt="封面"/><p><a href="../Images/cover.jpg">封面大图</a></p></body></html>')],
        ['OPS/Text/chapter01.xhtml', Buffer.from('<html><body><h1>第一章</h1><p>第一章开头第一章开头第一章开头第一章开头第一章开头第一章开头第一章开头第一章开头</p></body></html>')],
        ['OPS/Text/chapter01b.xhtml', Buffer.from('<html><body><p>第一章续写第一章续写第一章续写第一章续写第一章续写第一章续写第一章续写第一章续写</p></body></html>')],
        ['OPS/Text/chapter02.xhtml', Buffer.from('<html><body><h1>第二章</h1><p>第二章开头第二章开头第二章开头第二章开头第二章开头第二章开头第二章开头第二章开头</p></body></html>')],
        ['OPS/Images/cover.jpg', Buffer.from('fake-jpg-bytes')],
      ]),
      opf: {
        manifest: new Map([
          ['img-cover', { id: 'img-cover', href: 'OPS/Images/cover.jpg', mediaType: 'image/jpeg', properties: '' }],
        ]),
        spine: [
          { href: 'OPS/Text/cover.xhtml' },
          { href: 'OPS/Text/chapter01.xhtml' },
          { href: 'OPS/Text/chapter01b.xhtml' },
          { href: 'OPS/Text/chapter02.xhtml' },
        ],
        tocTitleMap: new Map([
          ['OPS/Text/chapter01.xhtml', '第一章'],
          ['OPS/Text/chapter02.xhtml', '第二章'],
        ]),
        fileAnchors: new Map(),
      },
    }

    importEpub(tempDir, info)

    const files = readdirSync(tempDir).filter(file => file.endsWith('.md')).sort()
    // 封面无目录标题且位于首个目录章节之前 → 独立成章；
    // chapter01b 无目录标题且前面有目录章节 → 并入第一章
    assert.deepEqual(files, ['01-第1章.md', '02-第一章.md', '03-第二章.md', 'index.md'])
    const coverMd = readFileSync(join(tempDir, '01-第1章.md'), 'utf8')
    assert.match(coverMd, /!\[封面\]\(_assets\/image-001\.jpg\)/)
    // <a> 包裹图片资产时重写到本地抽取路径，避免死链
    assert.match(coverMd, /\[封面大图\]\(_assets\/image-001\.jpg\)/)
    const merged = readFileSync(join(tempDir, '02-第一章.md'), 'utf8')
    assert.match(merged, /第一章开头/)
    assert.match(merged, /第一章续写/)
    assert.equal(info.chapterCount, 3)
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
})

test('normalizes hrefs and creates title-based filenames', () => {
  assert.equal(normalizeHref('../Text/a.xhtml?id=1#x', 'OPS/nav'), 'OPS/Text/a.xhtml')
  const used = new Set()
  assert.equal(safeFileName(0, '实践论', used), '01-实践论.md')
  assert.equal(safeFileName(1, '', used), '02-chapter-02.md')
})

test('parseOpf prefers nav toc titles while preserving spine order', () => {
  const entries = new Map([
    ['META-INF/container.xml', Buffer.from('<container><rootfiles><rootfile full-path="OPS/content.opf"/></rootfiles></container>')],
    ['OPS/content.opf', Buffer.from(`
      <package>
        <metadata><dc:title>测试书</dc:title><dc:creator>作者</dc:creator></metadata>
        <manifest>
          <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
          <item id="chap1" href="Text/c1.xhtml" media-type="application/xhtml+xml"/>
          <item id="chap2" href="Text/c2.xhtml" media-type="application/xhtml+xml"/>
        </manifest>
        <spine>
          <itemref idref="chap2"/>
          <itemref idref="chap1"/>
        </spine>
      </package>
    `)],
    ['OPS/nav.xhtml', Buffer.from(`
      <nav epub:type="toc">
        <ol>
          <li><a href="Text/c1.xhtml">第一章</a></li>
          <li><a href="Text/c2.xhtml">第二章</a></li>
        </ol>
      </nav>
    `)],
  ])

  const opf = parseOpf(entries)
  assert.deepEqual(opf.spine.map(item => item.href), ['OPS/Text/c2.xhtml', 'OPS/Text/c1.xhtml'])
  assert.equal(opf.tocTitleMap.get('OPS/Text/c1.xhtml'), '第一章')
  assert.equal(opf.tocTitleMap.get('OPS/Text/c2.xhtml'), '第二章')
})

test('parseOpf falls back to spine when no toc exists', () => {
  const entries = new Map([
    ['META-INF/container.xml', Buffer.from('<container><rootfiles><rootfile full-path="content.opf"/></rootfiles></container>')],
    ['content.opf', Buffer.from(`
      <package>
        <metadata><dc:title>无目录书</dc:title></metadata>
        <manifest><item id="chap1" href="c1.xhtml" media-type="application/xhtml+xml"/></manifest>
        <spine><itemref idref="chap1"/></spine>
      </package>
    `)],
  ])

  const opf = parseOpf(entries)
  assert.deepEqual(opf.spine.map(item => item.href), ['c1.xhtml'])
  assert.equal(opf.tocTitleMap.size, 0)
})

test('lintFixBook folds consecutive blank lines and surrounds headings with blanks', () => {
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const testDir = join(repoRoot, `.import-lint-test-${process.pid}-${Date.now()}`)
  mkdirSync(join(testDir, 'sub'), { recursive: true })
  const md = join(testDir, 'sub', '01-测试.md')
  // 连续空行(MD012) + 标题下方缺空行(MD022) —— EPUB/掘金源最常漏的两类
  writeFileSync(md, '# 标题\n段落一\n\n\n\n段落二\n')
  try {
    lintFixBook(testDir)
    const fixed = readFileSync(md, 'utf8')
    assert.ok(!/\n{3,}/.test(fixed), '连续空行应被折叠为最多 1 个空行（MD012）')
    assert.match(fixed, /# 标题\n\n/, '标题下方应补空行（MD022）')
  } finally {
    rmSync(testDir, { recursive: true, force: true })
  }
})

test('normalizeProseBlocks removes paragraph indentation that becomes code blocks', () => {
  const input = [
    '### 一座城池',
    '',
    '    火车慢慢停下。这又是一个全新的地方。地方不似商品，全新总是不好。',
    '',
  ].join('\n')

  const output = normalizeProseBlocks(input)
  assert.ok(!/^ {4,}/m.test(output), '段首 4 空格缩进应被去掉')
  assert.match(output, /火车慢慢停下。/)
})

test('normalizeProseBlocks joins hard-wrapped prose chunks into one paragraph', () => {
  const input = [
    '    老板说：“没问题，只要你站着别动，信号绝对好。”我立定，拨打电话。拨半天没动静。老板说：“你站的朝向不对。你看，这城里的发射站在那',
    '',
    '',
    '',
    '    头，你要面对那座塔站。”我说：“这信号又不是靠我的脸接收的，天线不还是朝着',
    '',
    '',
    '',
    '    老地方嘛！”老板说：“不定的，不定的。”于是我转过脸朝向远处最高的一栋建筑。',
    '',
  ].join('\n')

  const output = normalizeProseBlocks(input)
  assert.match(output, /发射站在那头，你要面对那座塔站/)
  assert.match(output, /天线不还是朝着老地方嘛/)
  // 合并后的三块应只剩一个段落：以句号结尾的完整段落
  const paragraphs = output.trim().split(/\n\n+/)
  assert.equal(paragraphs.length, 1)
})

test('normalizeProseBlocks joins short chunks that end inside an unclosed quote', () => {
  const input = [
    '    我说：“肯定是要抓我们俩的，因为只有我们俩带刀',
    '',
    '    抓到了，我就说是我干的。”',
    '',
  ].join('\n')

  const output = normalizeProseBlocks(input)
  assert.match(output, /只有我们俩带刀抓到了/)
})

test('normalizeProseBlocks keeps deliberate short lines separate (epigraph and lyrics)', () => {
  const input = [
    '这是个关于城市的故事，',
    '',
    '    城市寄托了我们的大多数希望，',
    '',
    '    可终究，',
    '',
    '    每一座城池都不是我们的。',
    '',
    '    姐妹出来混啊',
    '',
    '    只为钓凯子啊',
    '',
  ].join('\n')

  const output = normalizeProseBlocks(input)
  const nonBlank = output.trim().split('\n').filter(line => line.trim())
  assert.equal(nonBlank.length, 6, '题记与歌词的每一行都应保持独立')
  assert.match(output, /城市寄托了我们的大多数希望，\n\n可终究，/)
})

test('normalizeProseBlocks does not merge prose into headings or lists', () => {
  const input = [
    '    这一整段还没有讲完就被断开了，正在朝三十个字以上的长度走去，然后',
    '',
    '### 小标题',
    '',
    '- 列表项',
    '',
  ].join('\n')

  const output = normalizeProseBlocks(input)
  assert.match(output, /然后\n\n### 小标题/)
  assert.match(output, /### 小标题\n\n- 列表项/)
})

test('normalizeProseBlocks keeps fenced code blocks untouched', () => {
  const input = [
    '```text',
    '    indented inside fence stays',
    '```',
    '',
    '    正常段落。正常结束。',
    '',
  ].join('\n')

  const output = normalizeProseBlocks(input)
  assert.match(output, /```text\n    indented inside fence stays\n```/)
})

test('normalizeProseBlocks joins wrapped ASCII words with a space and CJK without', () => {
  const output = normalizeProseBlocks([
    '    The quick brown fox jumps over the lazy dog and keeps',
    '',
    '    running through the forest.',
    '',
  ].join('\n'))
  assert.match(output, /keeps running through the forest\./)
})

test('normalizeProseBlocks collapses extra blank lines and returns empty for empty input', () => {
  assert.equal(normalizeProseBlocks(''), '')
  assert.equal(normalizeProseBlocks('   \n\n\n'), '')
  const output = normalizeProseBlocks('第一段。\n\n\n\n第二段。\n')
  assert.match(output, /第一段。\n\n第二段。\n/)
})

test('importEpub normalizes indented wrapped paragraphs from EPUB sources', () => {
  const tempDir = mkdtempSync(join(tmpdir(), 'import-book-prose-normalize-'))
  try {
    const info = {
      title: '断段书',
      desc: '测试',
      warnings: [],
      entries: new Map([
        ['OPS/Text/c1.xhtml', Buffer.from([
          '<html><body>',
          '<p>    老板说：“没问题，只要你站着别动，信号绝对好。”我立定，拨打电话。拨半天没动静。老板说：“你站的朝向不对。你看，这城里的发射站在那</p>',
          '<p>    头，你要面对那座塔站。”我说：“这信号又不是靠我的脸接收的，天线不还是朝着</p>',
          '<p>    老地方嘛！”老板说：“不定的，不定的。”</p>',
          '</body></html>',
        ].join(''))],
      ]),
      opf: {
        manifest: new Map(),
        spine: [{ href: 'OPS/Text/c1.xhtml' }],
        tocTitleMap: new Map([['OPS/Text/c1.xhtml', '第一章']]),
        fileAnchors: new Map(),
      },
    }

    importEpub(tempDir, info)

    const chapter = readFileSync(join(tempDir, '01-第一章.md'), 'utf8')
    assert.ok(!/^ {4,}/m.test(chapter), 'EPUB 源的段首缩进不应变成代码块')
    assert.match(chapter, /发射站在那头，你要面对那座塔站/)
    assert.match(chapter, /天线不还是朝着老地方嘛/)
  } finally {
    rmSync(tempDir, { recursive: true, force: true })
  }
})

test('normalizeProseBlocks stops at em dash introductions and keeps lyric lines separate', () => {
  const input = [
    '    学校里的DJ永不停歇，不停放歌。不幸中的万幸是那DJ似乎不是很摇滚，劣质的广播里居然传来邓',
    '',
    '    丽君的声音——',
    '',
    '    如果没有遇见你我将会是在哪里',
    '',
    '    我回去一听，歌词是这样的——',
    '',
    '    每一首想你的诗',
    '',
    '    写在雨后的玻璃窗前',
    '',
  ].join('\n')

  const output = normalizeProseBlocks(input)
  // “邓/丽君”是词中的硬折行，应拼回
  assert.match(output, /传来邓丽君的声音——/)
  // “——”引出的歌词逐行排版，不应并入正文或互相合并
  assert.match(output, /声音——\n\n如果没有遇见你我将会是在哪里/)
  assert.match(output, /歌词是这样的——\n\n每一首想你的诗/)
  assert.match(output, /每一首想你的诗\n\n写在雨后的玻璃窗前/)
})

test('normalizeProseBlocks treats symbol-only separators as non-prose', () => {
  const input = [
    '    这一段话说到一半就被折断了，长度早已经超过三十个字的门槛，然后',
    '',
    '    ※',
    '',
    '    下一段从这里开始。',
    '',
  ].join('\n')

  const output = normalizeProseBlocks(input)
  assert.match(output, /然后\n\n※\n\n下一段从这里开始。/)
})
