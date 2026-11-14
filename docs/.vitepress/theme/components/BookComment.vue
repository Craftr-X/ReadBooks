<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'
import { useNormalizedPath } from '../routePath'

const { frontmatter, site } = useData()
const path = useNormalizedPath()
const container = ref<HTMLElement | null>(null)
const mounted = ref(false)
const giscusScript = ref<HTMLScriptElement | null>(null)
const isBookIndex = computed(() => /^\/books\/[^/]+\/?$/.test(path.value))
const shouldRender = computed(() => {
  const layout = frontmatter.value.layout
  return frontmatter.value.comments !== false && layout !== 'home' && layout !== 'page' && !isBookIndex.value
})

// giscus 匹配键（term）：「base 标签 + 解码后的逻辑路径」，与 discussion 标题一一对应。
// 例：base='/ReadBooks/'，页面 /books/money-dog/26-童话与理财 → 'ReadBooks/books/money-dog/26-童话与理财'
// 不用 data-mapping="pathname"：client.js 直接取 location.pathname（浏览器对中文
// 返回百分号编码），会导致 discussion 标题全是 %E7%AF%87… 乱码。
// ⚠️ term 是评论区的唯一关联键：改 base / 改章节文件名，都会让新 term 和旧
// discussion 标题对不上，评论区变空（评论数据并未丢失）——需同步重命名对应
// discussion 标题为新 term。
// 历史事件：
//   2026-08 仓库 Craftx-books.github.io → ReadBooks 改名，靠迁移 discussion 标题前缀恢复关联；
//   2026-11 映射从「编码 pathname」切到「解码 term」，同步把 #15/#22/#58 标题改为中文解码形式。
const giscusTerm = computed(() => {
  const base = site.value.base || '/'
  const baseLabel = base === '/' ? '' : base.replace(/^\//, '').replace(/\/$/, '')
  const term = baseLabel + path.value
  return term.startsWith('/') ? term.slice(1) : term
})
function mountGiscus() {
  if (container.value) {
    container.value.innerHTML = ''
  }
  giscusScript.value = null
  if (!container.value || !shouldRender.value) return

  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.async = true
  script.setAttribute('data-repo', 'Craftr-X/ReadBooks')
  script.setAttribute('data-repo-id', 'R_kgDOSm7eVQ')
  script.setAttribute('data-category', 'Announcements')
  script.setAttribute('data-category-id', 'DIC_kwDOSm7eVc4C-wiu')
  script.setAttribute('data-mapping', 'specific')
  script.setAttribute('data-term', giscusTerm.value)
  script.setAttribute('data-strict', '0')
  script.setAttribute('data-reactions-enabled', '1')
  script.setAttribute('data-emit-metadata', '0')
  script.setAttribute('data-input-position', 'bottom')
  script.setAttribute('data-theme', 'preferred_color_scheme')
  script.setAttribute('data-lang', 'zh-CN')
  script.setAttribute('crossorigin', 'anonymous')
  script.setAttribute('loading', 'lazy')

  container.value.appendChild(script)
  giscusScript.value = script
}

onMounted(() => {
  mounted.value = true
  mountGiscus()
})

watch([shouldRender, path], () => {
  if (mounted.value) {
    mountGiscus()
  }
})

onBeforeUnmount(() => {
  giscusScript.value?.remove()
  giscusScript.value = null
})
</script>

<template>
  <div v-if="shouldRender" class="comments-section">
    <div class="comments-divider">
      <span class="comments-title">评论讨论</span>
    </div>
    <div ref="container" class="giscus-wrapper">
      <div class="comments-placeholder">加载评论中...</div>
    </div>
  </div>
</template>

<style scoped>
.comments-section {
  margin-top: 64px;
  padding-top: 32px;
}

.comments-divider {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.comments-divider::before,
.comments-divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--vp-c-divider), transparent);
}

.comments-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--vp-c-text-1);
  white-space: nowrap;
}

.giscus-wrapper {
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--vp-c-divider);
  padding: 16px;
  background: var(--vp-c-bg-soft);
}

.comments-placeholder {
  text-align: center;
  padding: 40px;
  color: var(--vp-c-text-3);
  font-size: 14px;
}
</style>
