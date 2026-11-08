import DefaultTheme from 'vitepress/theme'
import { h, Fragment } from 'vue'
import type { Theme } from 'vitepress'
import './custom.css'
import HomePage from './components/HomePage.vue'
import BookComment from './components/BookComment.vue'
import ReadingProgressBar from './components/ReadingProgressBar.vue'
import BookIndexProgress from './components/BookIndexProgress.vue'
import ChapterReadingTime from './components/ChapterReadingTime.vue'
import FontSizeControl from './components/FontSizeControl.vue'
import { installImageFallback } from './imageFallback'
import { installImageZoom } from './imageZoom'
import { installSidebarAutoExpand } from './sidebarAutoExpand'

export default {
  extends: DefaultTheme,
  Layout: () => h(DefaultTheme.Layout, null, {
    'doc-footer-before': () => h(BookComment),
    // doc-before 同槽挂两个组件：BookIndexProgress 仅书 index 页、ChapterReadingTime 仅章节页，互斥
    'doc-before': () => h(Fragment, null, [
      h(BookIndexProgress),
      h(ChapterReadingTime),
    ]),
    // 两个 fixed 控件都借 layout-top 注入；字号控件组件内部按路由自判是否渲染
    'layout-top': () => h(Fragment, null, [h(ReadingProgressBar), h(FontSizeControl)]),
  }),
  enhanceApp({ app, router }) {
    // 注册全局组件
    app.component('HomePage', HomePage)
    app.component('BookComment', BookComment)
    // ReadingProgressBar / BookIndexProgress 仅通过 Layout 插槽渲染，无需全局注册
    installImageFallback()
    installImageZoom(router)
    installSidebarAutoExpand(router)
  }
} satisfies Theme
