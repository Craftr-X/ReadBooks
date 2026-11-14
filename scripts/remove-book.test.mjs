import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

import { generateSidebar } from './generate-sidebar.mjs'
import { generateContentStats } from './generate-content-stats.mjs'
import {
  findCandidates,
  normalizeSlug,
  collectRemovalInfo,
  removeBook,
  verifyRemoval,
} from './remove-book.mjs'

const scriptPath = fileURLToPath(new URL('./remove-book.mjs', import.meta.url))

/**
 * 临时项目夹具：结构与真实仓库一致的最小子集
 * - books.json（顶层数组）
 * - docs/books/<slug>/（index.md + 编号章节）
 * - README.md（书籍表格）
 * - sidebar-generated.json / content-stats.json（调用真实生成器产出，而非手写假数据）
 */
function makeProject() {
  const root = mkdtempSync(join(tmpdir(), 'craftx-remove-'))
  mkdirSync(join(root, 'docs', 'books'), { recursive: true })
  return root
}

function writeBook(root, slug, chapterNames) {
  const bookDir = join(root, 'docs', 'books', slug)
  mkdirSync(bookDir, { recursive: true })
  writeFileSync(join(bookDir, 'index.md'), `# ${slug}\n\n## 目录\n\n`)
  for (const name of chapterNames) {
    writeFileSync(join(bookDir, `${name}.md`), `# ${name}\n\n正文内容，用于统计阅读时长。\n`)
  }
  return bookDir
}

/** 两本书的最小完整项目：alpha（2 章，ebook/genre）+ beta（1 章，booklet 无 genre） */
function setupTwoBooks(root) {
  writeBook(root, 'alpha', ['01-开篇', '02-结尾'])
  writeBook(root, 'beta', ['01-绪论'])
  writeJson(join(root, 'books.json'), [
    { slug: 'alpha', title: 'Alpha 书', desc: '第一本', category: 'ebook', genre: 'history' },
    { slug: 'beta', title: 'Beta 书', desc: '第二本', category: 'booklet' },
  ])
  writeFileSync(
    join(root, 'README.md'),
    [
      '# Craftx Books',
      '',
      '## 电子书',
      '',
      '| 书名 | 简介 | |',
      '| --- | --- | --- |',
      '| Alpha 书 | 第一本 | [开始阅读](./docs/books/alpha/) |',
      '| Beta 书 | 第二本 | [开始阅读](./docs/books/beta/) |',
      '',
    ].join('\n'),
  )
  generateSidebar({ root })
  generateContentStats({ root })
}

function writeJson(file, value) {
  writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
}

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'))
}

function snapshot(root) {
  const read = file => (existsSync(join(root, file)) ? readFileSync(join(root, file), 'utf8') : null)
  return {
    books: read('books.json'),
    readme: read('README.md'),
    sidebar: read('sidebar-generated.json'),
    stats: read('content-stats.json'),
    alphaIndex: read('docs/books/alpha/index.md'),
  }
}

test('removeBook 全链路删除：目录/registry/README 行/侧边栏/统计同步消失，自检全过', () => {
  const root = makeProject()
  try {
    setupTwoBooks(root)

    const result = removeBook('alpha', { root })

    // 目录已删
    assert.equal(existsSync(join(root, 'docs', 'books', 'alpha')), false)
    // registry 只剩 beta
    assert.deepEqual(readJson(join(root, 'books.json')), [
      { slug: 'beta', title: 'Beta 书', desc: '第二本', category: 'booklet' },
    ])
    // README：alpha 行没了，beta 行原样保留
    const readme = readFileSync(join(root, 'README.md'), 'utf8')
    assert.equal(readme.includes('alpha'), false)
    assert.equal(readme.includes('| Beta 书 | 第二本 | [开始阅读](./docs/books/beta/) |'), true)
    assert.equal(readme.includes('| 书名 | 简介 | |'), true)
    // 侧边栏：alpha key 清理，beta key 保留
    const sidebar = readJson(join(root, 'sidebar-generated.json'))
    assert.equal('/books/alpha/' in sidebar, false)
    assert.equal('/books/beta/' in sidebar, true)
    // 统计：alpha 条目清理，bookCount 同步
    const stats = readJson(join(root, 'content-stats.json'))
    assert.equal('alpha' in stats.books, false)
    assert.equal('beta' in stats.books, true)
    assert.equal(stats.bookCount, 1)
    // 预览信息与自检报告
    assert.equal(result.info.chapterCount, 2)
    assert.equal(result.report.passed, true)
    for (const check of result.report.checks) {
      assert.equal(check.status, 'pass', `${check.check} 应为 pass：${JSON.stringify(check)}`)
    }
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('dry-run 零改动：五处关键文件字节级不变，书目录仍在', () => {
  const root = makeProject()
  try {
    setupTwoBooks(root)
    const before = snapshot(root)

    const result = removeBook('alpha', { root, dryRun: true })

    assert.equal(result.dryRun, true)
    const after = snapshot(root)
    assert.deepEqual(after, before)
    assert.equal(existsSync(join(root, 'docs', 'books', 'alpha')), true)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('未知 slug 报错并提示 --find 用法', () => {
  const root = makeProject()
  try {
    setupTwoBooks(root)
    assert.throws(
      () => removeBook('ghost-book', { root }),
      error => {
        assert.match(error.message, /ghost-book/)
        assert.match(error.message, /--find/)
        return true
      },
    )
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('findCandidates：中文关键词命中、拉丁词大小写不敏感、无匹配返回空数组', () => {
  const books = [
    { slug: 'alpha', title: 'Alpha 书', desc: '第一本', category: 'ebook' },
    { slug: 'mysql-running', title: 'MySQL 是怎样运行的', desc: '从根儿上理解 MySQL', category: 'booklet' },
    { slug: 'beta', title: 'Beta 书', desc: '第二本', category: 'booklet' },
  ]
  assert.deepEqual(
    findCandidates(books, 'Alpha').map(b => b.slug),
    ['alpha'],
  )
  assert.deepEqual(
    findCandidates(books, 'beta').map(b => b.slug),
    ['beta'],
  )
  assert.deepEqual(
    findCandidates(books, 'mysql').map(b => b.slug),
    ['mysql-running'],
  )
  assert.deepEqual(findCandidates(books, '不存在的书'), [])
})

test('docs 内硬编码引用默认阻断；--force 放行但自检报告失败项', () => {
  const root = makeProject()
  try {
    setupTwoBooks(root)
    mkdirSync(join(root, 'docs'), { recursive: true })
    writeFileSync(join(root, 'docs', 'index.md'), '---\ntitle: 首页\n---\n\n[Alpha](/books/alpha/)\n')

    assert.throws(
      () => removeBook('alpha', { root }),
      error => {
        assert.match(error.message, /docs\/index\.md/)
        assert.match(error.message, /--force/)
        return true
      },
    )

    const result = removeBook('alpha', { root, force: true })
    assert.equal(existsSync(join(root, 'docs', 'books', 'alpha')), false)
    assert.equal(result.report.passed, false)
    const failed = result.report.checks.filter(c => c.status === 'fail')
    assert.equal(failed.length, 1)
    assert.equal(failed[0].check, 'docs-references')
    assert.match(failed[0].detail, /docs\/index\.md/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('孤儿目录（registry 无条目）可删除，books.json 保持不动并给出警告', () => {
  const root = makeProject()
  try {
    setupTwoBooks(root)
    writeBook(root, 'orphan', ['01-孤章'])

    const result = removeBook('orphan', { root })

    assert.equal(existsSync(join(root, 'docs', 'books', 'orphan')), false)
    assert.equal(readJson(join(root, 'books.json')).length, 2)
    assert.equal(
      result.info.warnings.some(w => w.includes('孤儿') || w.includes('registry 无此条目')),
      true,
    )
    assert.equal(result.report.passed, true)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('slug 归一化：大小写与首尾斜杠不阻断删除', () => {
  const root = makeProject()
  try {
    setupTwoBooks(root)
    const result = removeBook('/ALPHA/', { root })
    assert.equal(existsSync(join(root, 'docs', 'books', 'alpha')), false)
    assert.equal(result.report.passed, true)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('verifyRemoval 能抓出删除后残留的 docs 引用', () => {
  const root = makeProject()
  try {
    setupTwoBooks(root)
    removeBook('alpha', { root })
    writeFileSync(join(root, 'docs', 'note.md'), '参见 [/books/alpha/](/books/alpha/)\n')

    const report = verifyRemoval('alpha', { root })

    assert.equal(report.passed, false)
    const failed = report.checks.filter(c => c.status === 'fail')
    assert.equal(failed.length, 1)
    assert.equal(failed[0].check, 'docs-references')
    assert.match(failed[0].detail, /docs\/note\.md/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('registry 有条目但目录已缺失时，仍可清理登记并自检通过', () => {
  const root = makeProject()
  try {
    setupTwoBooks(root)
    rmSync(join(root, 'docs', 'books', 'alpha'), { recursive: true, force: true })

    const result = removeBook('alpha', { root })

    assert.deepEqual(readJson(join(root, 'books.json')), [
      { slug: 'beta', title: 'Beta 书', desc: '第二本', category: 'booklet' },
    ])
    assert.equal(readFileSync(join(root, 'README.md'), 'utf8').includes('alpha'), false)
    assert.equal(
      result.info.warnings.some(w => w.includes('目录缺失')),
      true,
    )
    assert.equal(result.report.passed, true)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('collectRemovalInfo 返回完整预览信息且不做任何修改', () => {
  const root = makeProject()
  try {
    setupTwoBooks(root)
    const before = snapshot(root)

    const info = collectRemovalInfo('alpha', { root })

    assert.deepEqual(snapshot(root), before)
    assert.equal(info.slug, 'alpha')
    assert.equal(info.title, 'Alpha 书')
    assert.equal(info.category, 'ebook')
    assert.equal(info.genre, 'history')
    assert.equal(info.chapterCount, 2)
    assert.equal(info.entryExists, true)
    assert.equal(info.dirExists, true)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('normalizeSlug 去首尾斜杠并转小写', () => {
  assert.equal(normalizeSlug('/Alpha/'), 'alpha')
  assert.equal(normalizeSlug('  Beta  '), 'beta')
  assert.equal(normalizeSlug('MySQL-Running'), 'mysql-running')
})

/** CLI 集成测试夹具：临时项目初始化为 git 仓库并全部提交 */
function gitCommitAll(root) {
  spawnSync('git', ['init', '-q'], { cwd: root })
  spawnSync('git', ['add', '-A'], { cwd: root })
  const commit = spawnSync(
    'git',
    ['-c', 'user.email=test@test.local', '-c', 'user.name=test', 'commit', '-q', '-m', 'init'],
    { cwd: root, encoding: 'utf8' },
  )
  if (commit.status !== 0) throw new Error(`fixture git commit 失败：${commit.stderr}`)
}

function runCli(args, root) {
  return spawnSync(process.execPath, [scriptPath, ...args, '--root', root], { encoding: 'utf8' })
}

test('CLI：与删除相关的路径有未提交改动时阻断（exit 1，不产生任何删除）', () => {
  const root = makeProject()
  try {
    setupTwoBooks(root)
    gitCommitAll(root)
    // 制造脏文件：改动 books.json 使删除失去 git 兜底
    const booksPath = join(root, 'books.json')
    const books = JSON.parse(readFileSync(booksPath, 'utf8'))
    books[0].desc = '改动后的简介'
    writeJson(booksPath, books)

    const result = runCli(['alpha'], root)

    assert.equal(result.status, 1)
    assert.match(result.stderr, /未提交/)
    assert.equal(existsSync(join(root, 'docs', 'books', 'alpha')), true)
    assert.equal(JSON.parse(readFileSync(booksPath, 'utf8')).length, 2)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('CLI：干净工作树正式删除成功（exit 0，自检全过）', () => {
  const root = makeProject()
  try {
    setupTwoBooks(root)
    gitCommitAll(root)

    const result = runCli(['alpha'], root)

    assert.equal(result.status, 0)
    assert.match(result.stdout, /自检全部通过/)
    assert.equal(existsSync(join(root, 'docs', 'books', 'alpha')), false)
    assert.equal(JSON.parse(readFileSync(join(root, 'books.json'), 'utf8')).length, 1)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('CLI：docs 引用阻断 exit 1；--force 放行后自检失败仍以 exit 1 收尾', () => {
  const root = makeProject()
  try {
    setupTwoBooks(root)
    mkdirSync(join(root, 'docs'), { recursive: true })
    writeFileSync(join(root, 'docs', 'index.md'), '[Alpha](/books/alpha/)\n')
    gitCommitAll(root)

    const blocked = runCli(['alpha'], root)
    assert.equal(blocked.status, 1)
    assert.match(blocked.stderr, /外部引用/)

    const forced = runCli(['alpha', '--force'], root)
    assert.equal(existsSync(join(root, 'docs', 'books', 'alpha')), false)
    assert.equal(forced.status, 1)
    assert.match(forced.stdout, /自检存在失败项/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
