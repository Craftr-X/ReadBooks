/**
 * genres-registry.mjs — 展示分类（genre）注册表：顶部导航与首页分区的唯一数据源。
 *
 * 纯 JS 实现，供两类消费方共享：
 * - VitePress 侧：genres.ts 转出口给 config.mts / HomePage.vue（带 TS 类型）
 * - CLI 脚本侧：import-book.mjs 校验 --genre、verify-import.mjs 校验 books.json
 *
 * books.json 的 category 仅表示来源类型（booklet=Markdown、ebook=EPUB），
 * 导入/校验/统计脚本依赖该语义，保持不动。
 * 展示分组由 books.json 中可选的 genre 字段驱动，缺省时按 category 兜底。
 */

/** @typedef {{ key: string, label: string, icon: string, nav: 'top' | 'group' }} GenreDef */
/** @typedef {{ slug: string, title: string, desc?: string, category?: 'booklet' | 'ebook', genre?: string }} BookEntry */
/** @typedef {{ genre: GenreDef | null, books: BookEntry[] }} GenreGroup */

export const GENRES = [
  { key: 'ai', label: 'AI 与智能体', icon: '🤖', nav: 'group' },
  { key: 'frontend', label: '前端与调试', icon: '🧩', nav: 'group' },
  { key: 'backend', label: '后端与数据库', icon: '🗄️', nav: 'group' },
  { key: 'devops', label: '工程效率', icon: '⚙️', nav: 'group' },
  { key: 'career', label: '职业成长', icon: '🧭', nav: 'group' },
  { key: 'literature', label: '文学小说', icon: '✒️', nav: 'top' },
  { key: 'history', label: '历史人文', icon: '🏛️', nav: 'top' },
  { key: 'cognition', label: '认知成长', icon: '💡', nav: 'top' },
  { key: 'finance', label: '财富理财', icon: '💰', nav: 'top' },
]

/** 导航里的兜底组文案：下拉内部分组用「其他」，顶级兜底栏用「电子书」 */
export const FALLBACK = { group: '其他', top: '电子书' }

const genreByKey = new Map(GENRES.map(g => [g.key, g]))

/** @returns {GenreDef | undefined} */
export const getGenre = key => (key ? genreByKey.get(key) : undefined)

/** 全部合法 genre key（供 CLI 参数与 books.json 校验） */
export const genreKeys = () => GENRES.map(g => g.key)

/**
 * 按 nav 侧把书分组成有序列表（组内保持 books.json 原顺序）：
 * - group：技术小册下拉的内部分组（AI 与智能体 / 前端与调试 / …）
 * - top：电子书的顶级分栏（文学小说 / 历史人文 / …）
 *
 * 归类规则：显式写了合法 genre 的书跨 category 生效，且只归属该 genre
 * 注册的那一侧（读者只关心主题，不关心来源是 Markdown 还是 EPUB）；
 * 未写 genre 或 genre 无效时按 category 兜底——booklet 进 group 侧兜底组，
 * ebook 进 top 侧兜底组。任何一本书在两侧合计只出现一次。
 * 末尾可能追加一个 genre 为 null 的兜底组；空组会被过滤掉。
 * @param {BookEntry[]} books
 * @param {'group' | 'top'} nav
 * @returns {GenreGroup[]}
 */
export function groupBooks(books, nav) {
  const groups = GENRES.filter(g => g.nav === nav).map(g => ({ genre: g, books: [] }))
  const rest = []
  for (const book of books) {
    const g = getGenre(book.genre)
    if (g) {
      // 有合法 genre：只进它注册的一侧，不参与兜底，避免重复出现
      if (g.nav === nav) groups.find(x => x.genre === g).books.push(book)
      continue
    }
    const isBooklet = (book.category || 'booklet') === 'booklet'
    if (nav === 'group' ? isBooklet : !isBooklet) rest.push(book)
  }
  const result = groups.filter(g => g.books.length > 0)
  if (rest.length > 0) result.push({ genre: null, books: rest })
  return result
}
