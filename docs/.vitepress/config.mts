import { defineConfig } from 'vitepress'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { generateSidebar } from '../../scripts/generate-sidebar.mjs'
import { groupBooks, FALLBACK } from './genres'

// 读取生成的侧边栏配置；若文件缺失（如 fresh clone 后未跑 prebuild），构建期兜底生成。
const sidebarPath = join(__dirname, '../../sidebar-generated.json')
let sidebarConfig = {}
if (existsSync(sidebarPath)) {
  try {
    sidebarConfig = JSON.parse(readFileSync(sidebarPath, 'utf-8'))
  } catch {
    sidebarConfig = {}
  }
}
if (Object.keys(sidebarConfig).length === 0) {
  sidebarConfig = generateSidebar()
}

const booksPath = join(__dirname, '../../books.json')
let books: Array<{ slug: string; title: string; desc?: string; category?: string }> = []
try {
  books = JSON.parse(readFileSync(booksPath, 'utf-8'))
} catch {
  books = []
}

// 顶部导航由 genre 展示分类驱动（注册表见 ./genres.ts）：
// - 「技术小册」合并为一个顶级项，下拉内按 genre 分组
// - top 侧 genre（文学小说 / 历史人文 / …）各自独立成顶级栏
// 显式 genre 跨 category 生效；未归类的书按 category 兜底，保证新导入的书不丢入口。
const bookLink = (book: { title: string; slug: string }) => ({
  text: book.title,
  link: `/books/${book.slug}/`,
})

const techGroups = groupBooks(books, 'group')
const ebookGroups = groupBooks(books, 'top')

const nav: Array<any> = [{ text: '首页', link: '/' }]
if (techGroups.length > 0) {
  nav.push({
    text: '技术小册',
    items: techGroups.map(group => ({
      text: group.genre ? `${group.genre.icon} ${group.genre.label}` : FALLBACK.group,
      items: group.books.map(bookLink),
    })),
  })
}
for (const group of ebookGroups) {
  nav.push({
    text: group.genre ? group.genre.label : FALLBACK.top,
    items: group.books.map(bookLink),
  })
}

// 打断 {{ / }}，避免 VitePress 把 Markdown 正文里的双花括号当作 Vue 模板插值渲染。
// 历史上由 scripts/escape-vitepress-braces.mjs 在 prebuild 阶段就地改写源文件实现，
// 现迁移为运行时 markdown-it 转换：build 不再修改源文件。
const BRACE_OPEN = '{\u200b{'
const BRACE_CLOSE = '}\u200b}'
function escapeVueBraces(md: any) {
  md.core.ruler.after('inline', 'escape_vue_braces', state => {
    for (const token of state.tokens) {
      if (token.type !== 'inline' || !token.children) continue
      for (const child of token.children) {
        if (child.type !== 'text') continue
        const c = child.content
        if (!c.includes('{{') && !c.includes('}}') && !c.includes('&#123;&#123;') && !c.includes('&#125;&#125;')) continue
        child.content = c
          .replaceAll('&#123;&#123;', BRACE_OPEN)
          .replaceAll('&#125;&#125;', BRACE_CLOSE)
          .replaceAll('{{', BRACE_OPEN)
          .replaceAll('}}', BRACE_CLOSE)
      }
    }
  })
}

function renderMissingAssetPlaceholders(md: any) {
  const pattern = /\[(图片|缺失资源)：([^\]]+)\]/g

  md.core.ruler.after('inline', 'render_missing_asset_placeholders', state => {
    for (const token of state.tokens) {
      if (token.type !== 'inline' || !token.children) continue

      const nextChildren = []
      for (const child of token.children) {
        if (child.type !== 'text' || !pattern.test(child.content)) {
          pattern.lastIndex = 0
          nextChildren.push(child)
          continue
        }

        pattern.lastIndex = 0
        let lastIndex = 0
        for (const match of child.content.matchAll(pattern)) {
          const index = match.index ?? 0
          if (index > lastIndex) {
            const text = new state.Token('text', '', 0)
            text.content = child.content.slice(lastIndex, index)
            nextChildren.push(text)
          }

          const kind = md.utils.escapeHtml(match[1])
          const assetPath = md.utils.escapeHtml(match[2])
          const html = new state.Token('html_inline', '', 0)
          html.content = [
            `<span class="missing-asset-card" data-asset-kind="${kind}" data-asset-src="${assetPath}">`,
            '<strong>图片资源未随文档入库</strong>',
            '<span>未下载全量图片，可按这个路径回源或补入单张资源。</span>',
            `<code>${assetPath}</code>`,
            '</span>',
          ].join('')
          nextChildren.push(html)
          lastIndex = index + match[0].length
        }

        if (lastIndex < child.content.length) {
          const text = new state.Token('text', '', 0)
          text.content = child.content.slice(lastIndex)
          nextChildren.push(text)
        }
      }

      token.children = nextChildren
    }
  })
}

// GitHub Pages 项目站点部署在 /ReadBooks/ 子路径下。
// head 里的静态资源 href 不会被 VitePress 自动补 base，必须在这里显式拼接。
const BASE = '/ReadBooks/'

export default defineConfig({
  title: 'CraftX Books',
  description: '技术小册与电子书 — 沉浸式阅读体验',
  lang: 'zh-CN',
  base: BASE,
  outDir: '../dist',
  cleanUrls: true,
  ignoreDeadLinks: true,
  // 默认 VitePress 会把全站 pageToHashMap + siteData（约 200KB）内联进每一个
  // HTML；1300+ 页时等于把同一份数据复制上千遍，产物凭空多出 260MB+。
  // 开启后改为单个可缓存的共享 metadata chunk，每页只留一行 script 引用。
  metaChunk: true,
  vite: {
    build: {
      // Local search emits a large index chunk; regular page chunks should remain small.
      chunkSizeWarningLimit: 9000,
    },
  },

  head: [
    ['link', { rel: 'icon', href: `${BASE}favicon.svg` }],
    // 首帧前套用用户保存的阅读字号，避免刷新时正文先大后小的闪烁；与
    // theme/components/FontSizeControl.vue 使用同一 localStorage key
    ['script', {}, `(function(){try{var s=localStorage.getItem('reading-font-size');if(s){var n=Number(s);if(n>=14&&n<=22)document.documentElement.style.setProperty('--reading-font-size',n+'px')}}catch(e){}})()`],
    ['meta', { name: 'referrer', content: 'no-referrer' }],
    ['meta', { name: 'theme-color', content: '#6366f1' }],
    // Open Graph 协议规定 og:* 用 property 属性（name 是非标准写法，部分抓取器不识别）；
    // og:image / og:url 必须是绝对 URL，拼接部署域名 + base
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: 'CraftX Books' }],
    ['meta', { property: 'og:title', content: 'CraftX Books' }],
    ['meta', { property: 'og:description', content: '技术小册与电子书 — 沉浸式阅读体验' }],
    ['meta', { property: 'og:url', content: `https://craftr-x.github.io${BASE}` }],
    ['meta', { property: 'og:image', content: `https://craftr-x.github.io${BASE}og-image.png` }],
    ['meta', { property: 'og:image:width', content: '1200' }],
    ['meta', { property: 'og:image:height', content: '630' }],
    ['meta', { property: 'og:image:alt', content: 'CraftX Books — 技术小册与电子书' }],
    ['meta', { property: 'og:locale', content: 'zh_CN' }],
    // Twitter/X 分享卡：summary_large_image 展示大图
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'CraftX Books' }],
    ['meta', { name: 'twitter:description', content: '技术小册与电子书 — 沉浸式阅读体验' }],
    ['meta', { name: 'twitter:image', content: `https://craftr-x.github.io${BASE}og-image.png` }],
  ],

  // sitemap：VitePress 按干净 URL 生成全站 sitemap.xml（含每本书每个章节页）
  sitemap: {
    hostname: `https://craftr-x.github.io${BASE}`,
  },

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'CraftX Books',

    nav,

    sidebar: sidebarConfig,

    socialLinks: [
      { icon: 'github', link: 'https://github.com/Craftr-X/ReadBooks' },
    ],

    search: {
      provider: 'local',
      options: {
        translations: {
          button: { buttonText: '搜索文档', buttonAriaLabel: '搜索' },
          modal: {
            noResultsText: '没有找到相关结果',
            resetButtonTitle: '清除搜索条件',
            footer: { selectText: '选择', navigateText: '切换', closeText: '关闭' }
          }
        }
      }
    },

    outline: {
      label: '页面导航',
      level: [2, 3],
    },

    lastUpdated: {
      text: '最后更新于',
    },

    docFooter: {
      prev: '上一篇',
      next: '下一篇',
    },

    returnToTopLabel: '回到顶部',
    sidebarMenuLabel: '菜单',
    darkModeSwitchLabel: '主题',
    lightModeSwitchTitle: '切换到浅色模式',
    darkModeSwitchTitle: '切换到深色模式',
  },

  markdown: {
    lineNumbers: true,
    image: {
      lazyLoading: true,
    },
    config(md) {
      escapeVueBraces(md)
      renderMissingAssetPlaceholders(md)
    },
  },
})
