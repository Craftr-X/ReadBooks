<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useData } from 'vitepress'
import { useNormalizedPath } from '../routePath'

const { frontmatter } = useData()
const path = useNormalizedPath()
const container = ref<HTMLElement | null>(null)
const mounted = ref(false)
const giscusScript = ref<HTMLScriptElement | null>(null)
const isBookIndex = computed(() => /^\/books\/[^/]+\/?$/.test(path.value))
const shouldRender = computed(() => {
  const layout = frontmatter.value.layout
  return frontmatter.value.comments !== false && layout !== 'home' && layout !== 'page' && !isBookIndex.value
})

// ⚠️ Giscus pathname 映射注意事项：
// data-mapping="pathname" 的匹配键来自 client.js 的
//   location.pathname.substring(1).replace(/\.\w+$/, "")
// 即「去掉开头 / 的完整 pathname（含 VitePress base 前缀）」。
// 因此 base 路径一变（如仓库改名导致 base 从 /Craftx-books.github.io/ 改为 /ReadBooks/），
// term 就和旧 discussion 标题对不上，评论区会整体变空（评论数据并未丢失）。
// 改仓库名/域名后，需同步把旧 discussion 标题里的旧前缀改成新前缀。
// 历史事件：仓库 Craftx-books.github.io → ReadBooks 改名后，曾靠迁移 discussion
// 标题前缀（Craftx-books.github.io → ReadBooks）恢复评论关联。
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
  script.setAttribute('data-mapping', 'pathname')
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
