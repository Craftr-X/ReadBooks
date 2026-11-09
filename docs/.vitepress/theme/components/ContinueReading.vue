<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useData } from 'vitepress'
import { getAllProgress } from '../readingProgress'
import { pickContinueTarget } from '../continueReadingCore.mjs'
import books from '../../../../books.json'
// @ts-expect-error sidebar-generated.json 是 prebuild 生成的构建期产物，无类型声明
import sidebarGenerated from '../../../../sidebar-generated.json'

/**
 * 首页「继续阅读」单张主卡：
 * - 数据全部来自 localStorage 进度表（craftx:reading-progress），零新增存储；
 *   章节标题 / 书名查 sidebar-generated.json（构建期产物，key 与进度表同为归一化路径）
 * - 选章规则见 continueReadingCore.mjs：优先 reading、按时间倒序、跳过失效路径
 * - 无任何阅读记录（或记录全部失效）时整块隐藏，不打扰新访客
 */

const { site } = useData()
const base = computed(() => site.value.base)
const mounted = ref(false)

// sidebar-generated.json 结构：{ "/books/<slug>/": [{ text: 书名, items: [{ text: 章节名, link: 章节路径 }] }] }
const catalog = new Map<string, { book: string; chapter: string }>()
for (const groups of Object.values(sidebarGenerated as Record<string, Array<{ text: string; items?: Array<{ text: string; link: string }> }>>)) {
  for (const group of groups) {
    for (const item of group.items || []) {
      catalog.set(item.link, { book: group.text, chapter: item.text })
    }
  }
}

const target = ref<{ path: string; maxScrollRatio: number; status: string; book: string; chapter: string } | null>(null)

onMounted(() => {
  mounted.value = true
  const picked = pickContinueTarget(getAllProgress(), path => catalog.has(path))
  if (!picked) return
  const meta = catalog.get(picked.path)!
  target.value = { ...picked, ...meta }
})

const percent = computed(() =>
  target.value ? Math.min(100, Math.round(target.value.maxScrollRatio * 100)) : 0
)

const href = computed(() =>
  target.value ? `${base.value.replace(/\/$/, '')}${target.value.path}` : '#'
)

const heading = computed(() => (target.value?.status === 'read' ? '上次读完' : '继续阅读'))
</script>

<template>
  <section v-if="mounted && target" class="continue-reading">
    <a :href="href" class="cr-card">
      <div class="cr-info">
        <span class="cr-label"><span class="cr-icon">📖</span> {{ heading }}</span>
        <span class="cr-title">{{ target.book }} · {{ target.chapter }}</span>
        <div class="cr-progress">
          <div class="cr-bar">
            <div class="cr-bar-fill" :style="{ width: `${percent}%` }"></div>
          </div>
          <span class="cr-percent">本章 {{ percent }}%</span>
        </div>
      </div>
      <span class="cr-action">继续阅读 →</span>
    </a>
  </section>
</template>

<style scoped>
.continue-reading {
  margin-top: 32px;
}

/* 卡片观感与 stat-card / book-card 一族保持一致：bg-soft 底 + 品牌描边悬停 */
.cr-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 20px 24px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
}

.cr-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 24px rgba(99, 102, 241, 0.15);
  transform: translateY(-2px);
}

.cr-card:hover .cr-action {
  color: var(--vp-c-brand-1);
  transform: translateX(4px);
}

.cr-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.cr-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--vp-c-text-2);
}

.cr-icon {
  font-size: 14px;
}

.cr-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--vp-c-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cr-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.cr-bar {
  flex: 1;
  max-width: 320px;
  height: 6px;
  border-radius: 3px;
  background: var(--vp-c-divider);
  overflow: hidden;
}

.cr-bar-fill {
  height: 100%;
  border-radius: 3px;
  background: linear-gradient(90deg, var(--vp-c-brand-1), #06b6d4);
  transition: width 0.4s ease;
}

.cr-percent {
  flex-shrink: 0;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  color: var(--vp-c-text-2);
}

.cr-action {
  flex-shrink: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-2);
  transition: all 0.2s;
}

@media (max-width: 768px) {
  .continue-reading {
    margin-top: 20px;
  }

  .cr-card {
    padding: 16px;
    gap: 12px;
  }

  .cr-title {
    white-space: normal;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  .cr-bar {
    max-width: none;
  }
}
</style>
