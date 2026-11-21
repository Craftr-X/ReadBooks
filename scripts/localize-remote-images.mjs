#!/usr/bin/env node
/**
 * Download remote book images into docs/books/<slug>/_assets/
 * and rewrite Markdown references to ./_assets/remote-<hash12>.<ext>
 *
 * Usage:
 *   node scripts/localize-remote-images.mjs --slug redis7
 *   node scripts/localize-remote-images.mjs --slug redis7 --slug docker-guide
 *   node scripts/localize-remote-images.mjs --all-hotlink
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const BOOKS = path.join(ROOT, 'docs/books')

const HOTLINK_HOST_RE =
  /^(?:user-gold-cdn\.xitu\.io|(?:mirror|b)-gold-cdn\.xitu\.io|p\d+-juejin\.byteimg\.com|p\d+-jj\.byteimg\.com|static001\.geekbang\.org)$/i

const INLINE_RE = /!\[([^\]]*)\]\((https?:\/\/[^)\s]+)\)/g
const REF_DEF_RE = /^(\s*)\[([^\]]+)\]:\s*(https?:\/\/\S+)\s*$/gm

function parseArgs(argv) {
  const slugs = []
  let allHotlink = false
  let concurrency = 6
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--slug') slugs.push(argv[++i])
    else if (a === '--all-hotlink') allHotlink = true
    else if (a === '--concurrency') concurrency = Number(argv[++i]) || 6
  }
  return { slugs, allHotlink, concurrency }
}

function isHotlink(url) {
  try {
    const u = new URL(url)
    return HOTLINK_HOST_RE.test(u.hostname)
  } catch {
    return false
  }
}

function hash12(url) {
  return crypto.createHash('md5').update(url).digest('hex').slice(0, 12)
}

function extFrom(url, contentType) {
  const ct = (contentType || '').split(';')[0].trim().toLowerCase()
  if (ct === 'image/jpeg' || ct === 'image/jpg') return '.jpg'
  if (ct === 'image/png') return '.png'
  if (ct === 'image/gif') return '.gif'
  if (ct === 'image/webp') return '.webp'
  if (ct === 'image/svg+xml') return '.svg'
  const m = url.match(/\.(png|jpe?g|gif|webp|svg)(?:[?#]|$)/i)
  if (m) return `.${m[1].toLowerCase().replace('jpeg', 'jpg')}`
  // juejin often ends with .image
  return '.png'
}

function refererFor(url) {
  if (url.includes('geekbang.org')) return 'https://time.geekbang.org/'
  return 'https://juejin.cn/'
}

/** Markdown sometimes escapes `~` as `\~` inside image URLs; CDN needs the bare tilde. */
function canonicalizeFetchUrl(url) {
  return url.replace(/\\~/g, '~').replace(/\?+$/, '')
}

async function download(url, destPath) {
  const fetchUrl = canonicalizeFetchUrl(url)
  const res = await fetch(fetchUrl, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Referer: refererFor(fetchUrl),
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    },
    redirect: 'follow',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < 32) throw new Error(`too small (${buf.length})`)
  const head = buf.slice(0, 200).toString('utf8').toLowerCase()
  const looksSvg = head.includes('<svg') || (head.includes('<?xml') && head.includes('svg'))
  // reject HTML error pages (but allow SVG)
  if (!looksSvg && (head.includes('<!doctype') || head.includes('<html'))) {
    throw new Error('got HTML instead of image')
  }
  const ext = looksSvg ? '.svg' : extFrom(fetchUrl, res.headers.get('content-type'))
  const finalPath = destPath.replace(/\.[^.]+$/, ext)
  fs.writeFileSync(finalPath, buf)
  return { bytes: buf.length, path: finalPath, ext }
}

async function mapPool(items, concurrency, fn) {
  const results = new Array(items.length)
  let i = 0
  async function worker() {
    while (i < items.length) {
      const idx = i++
      results[idx] = await fn(items[idx], idx)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()))
  return results
}

function collectUrls(text) {
  const urls = new Set()
  for (const m of text.matchAll(INLINE_RE)) {
    if (isHotlink(m[2])) urls.add(m[2])
  }
  for (const m of text.matchAll(REF_DEF_RE)) {
    if (isHotlink(m[3])) urls.add(m[3])
  }
  return urls
}

function rewriteText(text, urlToLocal) {
  let out = text.replace(INLINE_RE, (full, alt, url) => {
    const local = urlToLocal.get(url)
    return local ? `![${alt}](${local})` : full
  })
  out = out.replace(REF_DEF_RE, (full, indent, id, url) => {
    const local = urlToLocal.get(url)
    return local ? `${indent}[${id}]: ${local}` : full
  })
  return out
}

function discoverHotlinkSlugs() {
  const slugs = []
  for (const ent of fs.readdirSync(BOOKS, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue
    const dir = path.join(BOOKS, ent.name)
    let hit = false
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith('.md')) continue
      const text = fs.readFileSync(path.join(dir, f), 'utf8')
      if ([...collectUrls(text)].length) {
        hit = true
        break
      }
    }
    // also scan nested? books are flat md + _assets
    if (!hit) {
      // deep scan
      const walk = (d) => {
        for (const e of fs.readdirSync(d, { withFileTypes: true })) {
          const p = path.join(d, e.name)
          if (e.isDirectory()) walk(p)
          else if (e.name.endsWith('.md')) {
            if ([...collectUrls(fs.readFileSync(p, 'utf8'))].length) hit = true
          }
        }
      }
      walk(dir)
    }
    if (hit) slugs.push(ent.name)
  }
  return slugs.sort()
}

async function localizeSlug(slug, concurrency) {
  const bookDir = path.join(BOOKS, slug)
  if (!fs.existsSync(bookDir)) throw new Error(`missing book: ${slug}`)
  const assetsDir = path.join(bookDir, '_assets')
  fs.mkdirSync(assetsDir, { recursive: true })

  const mdFiles = []
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) {
        if (e.name === '_assets' || e.name === 'node_modules') continue
        walk(p)
      } else if (e.name.endsWith('.md')) mdFiles.push(p)
    }
  }
  walk(bookDir)

  const allUrls = new Set()
  for (const f of mdFiles) {
    for (const u of collectUrls(fs.readFileSync(f, 'utf8'))) allUrls.add(u)
  }
  const urls = [...allUrls]
  console.log(`[${slug}] remote images: ${urls.length}`)

  const urlToLocal = new Map()
  const failures = []

  await mapPool(urls, concurrency, async (url) => {
    const key = hash12(canonicalizeFetchUrl(url))
    const base = `remote-${key}.png`
    const provisional = path.join(assetsDir, base)
    try {
      // reuse existing remote-* with same hash any ext
      const existing = fs.readdirSync(assetsDir).find((n) => n.startsWith(`remote-${key}.`))
      if (existing) {
        urlToLocal.set(url, `./_assets/${existing}`)
        return
      }
      const { path: finalPath } = await download(url, provisional)
      const name = path.basename(finalPath)
      urlToLocal.set(url, `./_assets/${name}`)
      process.stdout.write('.')
    } catch (err) {
      failures.push({ url, error: String(err.message || err) })
      process.stdout.write('x')
    }
  })
  process.stdout.write('\n')

  let changedFiles = 0
  for (const f of mdFiles) {
    const text = fs.readFileSync(f, 'utf8')
    const next = rewriteText(text, urlToLocal)
    if (next !== text) {
      fs.writeFileSync(f, next)
      changedFiles++
    }
  }

  let residual = 0
  for (const f of mdFiles) {
    residual += collectUrls(fs.readFileSync(f, 'utf8')).size
  }

  console.log(
    `[${slug}] ok=${urlToLocal.size} fail=${failures.length} mdChanged=${changedFiles} residual=${residual}`,
  )
  if (failures.length) {
    console.log(`[${slug}] failures (first 10):`)
    for (const f of failures.slice(0, 10)) console.log(' ', f.error, f.url.slice(0, 100))
  }
  return { slug, ok: urlToLocal.size, fail: failures.length, residual, failures }
}

const { slugs, allHotlink, concurrency } = parseArgs(process.argv.slice(2))
const targets = allHotlink ? discoverHotlinkSlugs() : slugs
if (!targets.length) {
  console.error('No slugs. Use --slug <s> or --all-hotlink')
  process.exit(1)
}
console.log('targets:', targets.join(', '))

const summary = []
for (const slug of targets) {
  summary.push(await localizeSlug(slug, concurrency))
}
console.log('\n=== summary ===')
for (const s of summary) {
  console.log(`${s.slug}: ok=${s.ok} fail=${s.fail} residual=${s.residual}`)
}
const bad = summary.filter((s) => s.residual > 0 || s.fail > 0)
process.exit(bad.length ? 2 : 0)
