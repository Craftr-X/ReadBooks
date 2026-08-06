import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'fs'
import { dirname, extname, join } from 'path'

// 把 docs/books 下指向不存在本地资源的图片/音频引用就地改写为占位文本。
//
// 历史上挂在 prebuild 链里每次构建都跑（会改写源 .md 文件）。
// 自 braces/assets 治理迁移后，本脚本改为按需调用的一次性修复工具，
// 主要在导入新书（EPUB/掘金源）后运行：
//   npm run fix:missing-assets
// 构建期不再执行——避免 build 修改源文件，保持 build 为纯产出函数。
// 配套的运行时占位渲染见 docs/.vitepress/config.mts 的 renderMissingAssetPlaceholders。

const root = join(process.cwd(), 'docs')

function walk(dir, out) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    const stat = statSync(full)
    if (stat.isDirectory()) {
      walk(full, out)
    } else if (extname(full) === '.md') {
      out.push(full)
    }
  }
}

function localAssetExists(file, assetPath) {
  return existsSync(join(dirname(file), assetPath))
}

function normalize(file, input) {
  let output = input

  output = output.replace(
    /!\[([^\]]*)\]\(((?:_assets|images)\/[^)]+)\)/g,
    (match, alt, assetPath) => {
      if (localAssetExists(file, assetPath)) return match
      return `[${alt || '缺失资源'}：${assetPath}]`
    },
  )

  output = output.replace(
    /\[([^\]]*)\]\((_assets\/[^)]+)\)/g,
    (match, text, assetPath) => {
      if (localAssetExists(file, assetPath)) return match
      return `[${text || '缺失资源'}：${assetPath}]`
    },
  )

  output = output.replace(
    /<audio\s+controls\s+src="(_assets\/[^"]+)"\s*><\/audio>/g,
    (match, assetPath) => {
      if (localAssetExists(file, assetPath)) return match
      return ''
    },
  )

  return output
}

const files = []
walk(root, files)

for (const file of files) {
  const input = readFileSync(file, 'utf8')
  const output = normalize(file, input)
  if (output !== input) {
    writeFileSync(file, output, 'utf8')
  }
}
