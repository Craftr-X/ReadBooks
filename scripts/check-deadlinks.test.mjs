import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { scan, checkBooksRegistry, shouldSkip } from './check-deadlinks.mjs'

function makeDocs() {
  const root = mkdtempSync(join(tmpdir(), 'craftx-deadlink-'))
  const docs = join(root, 'docs')
  mkdirSync(join(docs, 'books', 'alpha'), { recursive: true })
  return { root, docs }
}

function writeBooksJson(root, books) {
  writeFileSync(join(root, 'books.json'), `${JSON.stringify(books, null, 2)}\n`)
}

test('scan reports zero dead links for a clean book', () => {
  const { root, docs } = makeDocs()
  try {
    writeFileSync(join(docs, 'books', 'alpha', 'index.md'),
      '# Alpha\n\n- [First](./01-first.md)\n')
    writeFileSync(join(docs, 'books', 'alpha', '01-first.md'),
      '# First\n\n- [back](./index.md)\n')

    const result = scan({ docsDir: docs, root })

    assert.equal(result.files, 2)
    assert.equal(result.dead.length, 0)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('scan detects broken internal markdown links', () => {
  const { root, docs } = makeDocs()
  try {
    writeFileSync(join(docs, 'books', 'alpha', 'index.md'),
      '# Alpha\n\n- [missing](./02-missing.md)\n')

    const result = scan({ docsDir: docs, root })

    assert.equal(result.dead.length, 1)
    assert.equal(result.dead[0].target, './02-missing.md')
    assert.equal(result.dead[0].kind, 'link')
    assert.match(result.dead[0].file, /books.alpha.index\.md/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('scan detects broken image references', () => {
  const { root, docs } = makeDocs()
  try {
    writeFileSync(join(docs, 'books', 'alpha', '01-first.md'),
      '# First\n\n![gone](_assets/gone.png)\n')

    const result = scan({ docsDir: docs, root })

    assert.equal(result.dead.length, 1)
    assert.equal(result.dead[0].kind, 'image')
    assert.equal(result.dead[0].target, '_assets/gone.png')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('scan accepts cleanUrls style links without .md extension', () => {
  const { root, docs } = makeDocs()
  try {
    writeFileSync(join(docs, 'books', 'alpha', 'index.md'),
      '# Alpha\n\n- [first](./01-first)\n')
    writeFileSync(join(docs, 'books', 'alpha', '01-first.md'),
      '# First\n\n- [home](/books/alpha/)\n')

    const result = scan({ docsDir: docs, root })

    assert.equal(result.dead.length, 0)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('scan skips external http(s) links, anchors, and angle-bracket URLs', () => {
  const { root, docs } = makeDocs()
  try {
    writeFileSync(join(docs, 'books', 'alpha', '01-first.md'), [
      '# First',
      '',
      '[external](https://example.com/path)',
      '[mdn](http://mdn.io/x)',
      '[top](#section)',
      '[zhihu](<https://zhihu.com/q/1>)',
      '',
    ].join('\n'))

    const result = scan({ docsDir: docs, root })

    assert.equal(result.dead.length, 0)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('scan skips regex-like text that looks like links', () => {
  const { root, docs } = makeDocs()
  try {
    writeFileSync(join(docs, 'books', 'alpha', '01-first.md'), [
      '> [a-z0-9]([-a-z0-9]*[a-z0-9])?(\\.[a-z0-9]([-a-z0-9]*[a-z0-9])?)*',
      '',
    ].join('\n'))

    const result = scan({ docsDir: docs, root })

    assert.equal(result.dead.length, 0)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('shouldSkip classifies links correctly', () => {
  assert.equal(shouldSkip('https://example.com'), true)
  assert.equal(shouldSkip('http://example.com'), true)
  assert.equal(shouldSkip('<https://example.com>'), true)
  assert.equal(shouldSkip('#section'), true)
  assert.equal(shouldSkip('mailto:a@b.com'), true)
  assert.equal(shouldSkip(''), true)
  assert.equal(shouldSkip('[-a-z0-9]*[a-z0-9]'), true)
  assert.equal(shouldSkip('./02-missing.md'), false)
  assert.equal(shouldSkip('/books/alpha/01-first'), false)
})

// ===== books.json slug 校验（覆盖 HomePage.vue 渲染出的 /books/<slug>/ 盲区）=====

test('scan reports no missing books when registry matches directories', () => {
  const { root, docs } = makeDocs()
  try {
    writeFileSync(join(docs, 'books', 'alpha', 'index.md'), '# Alpha\n')
    writeBooksJson(root, [{ slug: 'alpha', title: 'Alpha', category: 'booklet' }])

    const result = scan({ docsDir: docs, root })

    assert.deepEqual(result.missingBooks, [])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('scan flags a slug whose directory is missing', () => {
  const { root, docs } = makeDocs()
  try {
    writeFileSync(join(docs, 'books', 'alpha', 'index.md'), '# Alpha\n')
    writeBooksJson(root, [
      { slug: 'alpha', title: 'Alpha', category: 'booklet' },
      { slug: 'ghost', title: 'Ghost', category: 'ebook' },
    ])

    const result = scan({ docsDir: docs, root })

    assert.equal(result.missingBooks.length, 1)
    assert.equal(result.missingBooks[0].slug, 'ghost')
    assert.match(result.missingBooks[0].missing, /目录缺失/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('scan flags a slug whose index.md is missing', () => {
  const { root, docs } = makeDocs()
  try {
    // alpha 目录存在但无 index.md（makeDocs 只建了空目录）
    writeBooksJson(root, [{ slug: 'alpha', title: 'Alpha', category: 'booklet' }])

    const result = scan({ docsDir: docs, root })

    assert.equal(result.missingBooks.length, 1)
    assert.equal(result.missingBooks[0].slug, 'alpha')
    assert.match(result.missingBooks[0].missing, /index\.md 缺失/)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})

test('checkBooksRegistry returns empty when books.json is absent or invalid', () => {
  const { root, docs } = makeDocs()
  try {
    // 无 books.json
    assert.deepEqual(checkBooksRegistry(join(root, 'missing.json'), join(docs, 'books'), root), [])
    // 损坏的 books.json
    writeFileSync(join(root, 'books.json'), '{ not valid json')
    assert.deepEqual(checkBooksRegistry(join(root, 'books.json'), join(docs, 'books'), root), [])
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
