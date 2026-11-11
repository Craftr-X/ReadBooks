import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const distDir = join(root, 'dist')
const reportPath = join(root, 'logs', 'build-determinism.json')

/** 对比两份 dist 快照：文件清单 + 每文件 SHA-256。 */
export function compareSnapshots(a, b) {
  const added = []
  const removed = []
  const changed = []
  for (const [path, info] of a) {
    const other = b.get(path)
    if (!other) removed.push(path)
    else if (other.hash !== info.hash) {
      changed.push({ path, sizeA: info.size, sizeB: other.size, delta: other.size - info.size })
    }
  }
  for (const path of b.keys()) if (!a.has(path)) added.push(path)
  return {
    same: added.length === 0 && removed.length === 0 && changed.length === 0,
    added: added.sort(),
    removed: removed.sort(),
    changed: changed.sort((x, y) => Math.abs(y.delta) - Math.abs(x.delta) || x.path.localeCompare(y.path)),
  }
}

/** 递归扫描目录，返回 Map<相对路径, {size, hash}>。路径统一用 / 分隔。 */
export function snapshot(dir) {
  const out = new Map()
  function walk(current) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.isFile()) {
        const buf = readFileSync(full)
        out.set(relative(dir, full).split('\\').join('/'), {
          size: buf.length,
          hash: createHash('sha256').update(buf).digest('hex'),
        })
      }
    }
  }
  walk(dir)
  return out
}

function runBuild(label) {
  console.log(`\n>>> 第 ${label} 次 npm run build ...`)
  const start = Date.now()
  execSync('npm run build', {
    cwd: root,
    stdio: 'inherit',
    env: { ...process.env, NODE_OPTIONS: '--max-old-space-size=8192' },
  })
  const seconds = Math.round((Date.now() - start) / 1000)
  console.log(`>>> 第 ${label} 次构建完成，耗时 ${seconds}s`)
  return seconds
}

export function formatSummary(diff, limit = 15) {
  const lines = [
    `差异结论：${diff.same ? '两次构建产物完全一致' : '两次构建产物不一致'}`,
    `新增 ${diff.added.length} / 删除 ${diff.removed.length} / 内容变化 ${diff.changed.length} 个文件`,
  ]
  if (!diff.same) {
    lines.push('', '变化最大的文件（按字节差绝对值）：')
    for (const item of diff.changed.slice(0, limit)) {
      lines.push(`  ${item.path}  ${item.sizeA} -> ${item.sizeB} (${item.delta >= 0 ? '+' : ''}${item.delta} B)`)
    }
    for (const path of diff.added.slice(0, limit)) lines.push(`  [新增] ${path}`)
    for (const path of diff.removed.slice(0, limit)) lines.push(`  [删除] ${path}`)
  }
  return lines.join('\n')
}

function main() {
  const strict = process.argv.includes('--strict')
  const reuse = process.argv.includes('--reuse')
  if (!existsSync(distDir)) {
    console.error('dist/ 不存在，请先执行一次 npm run build。')
    process.exit(2)
  }

  const buildSeconds = []
  let first
  if (reuse) {
    // 已手工用修复后的配置构建过一次时，复用该 dist 作基线，只再构建一次。
    console.log('\n>>> --reuse：以现有 dist 作为第一次快照')
    first = snapshot(distDir)
  } else {
    buildSeconds.push(runBuild(1))
    first = snapshot(distDir)
  }
  buildSeconds.push(runBuild(reuse ? '2（对比复用基线）' : 2))
  const second = snapshot(distDir)

  const diff = compareSnapshots(first, second)
  const report = {
    generatedAt: new Date().toISOString(),
    reuse,
    fileCount: { first: first.size, second: second.size },
    buildSeconds,
    same: diff.same,
    added: diff.added,
    removed: diff.removed,
    changed: diff.changed,
  }
  mkdirSync(dirname(reportPath), { recursive: true })
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)

  console.log(`\n=== 构建确定性报告 ===`)
  console.log(formatSummary(diff))
  console.log(`\n完整报告：${reportPath}`)
  if (strict && !diff.same) process.exit(1)
}

const isMain = process.argv[1]
  && import.meta.url === pathToFileURL(resolve(process.argv[1])).href
if (isMain) main()
