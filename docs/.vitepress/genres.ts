// 展示分类（genre）注册表的 TS 入口：纯实现与 CLI 脚本共享，见 ./genres-registry.mjs
// （import-book.mjs 校验 --genre、verify-import.mjs 校验 books.json 直接 import .mjs）。
// VitePress 侧从这里取值并补齐 TS 类型；`./genres` 按扩展名解析只会命中本文件，
// 与 genres-registry.mjs 不会冲突。

import {
  GENRES as _GENRES,
  FALLBACK as _FALLBACK,
  getGenre as _getGenre,
  groupBooks as _groupBooks,
} from './genres-registry.mjs'

export interface GenreDef {
  key: string
  label: string
  icon: string
  /** top：独立顶级导航栏；group：折叠进「技术小册」下拉内部分组 */
  nav: 'top' | 'group'
}

export interface BookEntry {
  slug: string
  title: string
  desc?: string
  category?: 'booklet' | 'ebook'
  genre?: string
}

export interface GenreGroup {
  /** null 表示未归类（genre 缺失或无效）的兜底组 */
  genre: GenreDef | null
  books: BookEntry[]
}

/** 导航里的兜底组文案：下拉内部分组用「其他」，顶级兜底栏用「电子书」 */
export const FALLBACK: { group: string; top: string } = _FALLBACK

export const GENRES: GenreDef[] = _GENRES

export const getGenre = (key?: string): GenreDef | undefined => _getGenre(key)

export const groupBooks = (books: BookEntry[], nav: 'group' | 'top'): GenreGroup[] =>
  _groupBooks(books, nav)
