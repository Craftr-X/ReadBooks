<script setup lang="ts">
import { useData } from 'vitepress'
import books from '../../../../books.json'
import contentStats from '../../../../content-stats.json'
import { categoryStats, formatMinutes } from '../statsCore.mjs'

const { site } = useData()
const base = site.value.base

// 数据构建期冻结（与 HomePage 同口径）：两侧合计即全部书目，计数不会打架
const stats = categoryStats(books)

const summary = [
  { label: '总书籍', value: stats.total, icon: '📚' },
  { label: '展示分类', value: stats.group.length + stats.top.length, icon: '🏷️' },
  { label: '文章总数', value: contentStats.chapterCount, icon: '📄' },
  { label: '总阅读时长', value: formatMinutes(contentStats.totalReadingMinutes), icon: '⏱' },
]

// 每分区一条数据源：count 供分区标题、max 供比例条按分区内最大值归一化
const sections = [
  { icon: '📚', title: '技术小册分类', rows: stats.group },
  { icon: '📖', title: '电子书分类', rows: stats.top },
].map(s => ({
  ...s,
  count: s.rows.reduce((n, r) => n + r.count, 0),
  max: Math.max(1, ...s.rows.map(r => r.count)),
}))
</script>

<template>
  <div class="stats-page">
    <!-- 全站汇总 -->
    <div class="home-stats">
      <div v-for="item in summary" :key="item.label" class="stat-card">
        <span class="stat-icon">{{ item.icon }}</span>
        <span class="stat-value">{{ item.value }}</span>
        <span class="stat-label">{{ item.label }}</span>
      </div>
    </div>

    <!-- 各分类书籍数量：分区口径与首页大区一致 -->
    <section v-for="s in sections" :key="s.title" class="book-section">
      <h2 class="section-title">
        <span class="section-icon">{{ s.icon }}</span>
        {{ s.title }}
        <span class="section-count">{{ s.count }} 本</span>
      </h2>
      <div v-if="s.rows.length" class="genre-stats">
        <div v-for="row in s.rows" :key="row.key || 'uncategorized'" class="genre-row">
          <span class="genre-name">{{ row.icon }} {{ row.label }}</span>
          <span class="genre-bar-track">
            <span class="genre-bar" :style="{ width: (row.count / s.max) * 100 + '%' }"></span>
          </span>
          <span class="genre-count">{{ row.count }} 本</span>
        </div>
      </div>
      <p v-else class="genre-empty">该分区暂无书籍</p>
    </section>
  </div>
</template>

<style scoped>
/* ========== 汇总卡片（与 HomePage 统计卡同风格） ==========
 * doc 布局内容区较窄，用自适应网格保证桌面端 4 张卡单行等宽，窄屏自动换行 */
.home-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 16px;
  padding: 24px 0 8px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px 16px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 24px rgba(99, 102, 241, 0.15);
  transform: translateY(-4px);
}

.stat-icon {
  font-size: 32px;
}

.stat-value {
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--vp-c-brand-1), #06b6d4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 14px;
  color: var(--vp-c-text-2);
  font-weight: 500;
}

/* ========== 分区标题（与 HomePage 大区标题同风格） ========== */
.book-section {
  margin-top: 48px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 24px;
  padding-bottom: 12px;
  border-bottom: 2px solid var(--vp-c-brand-soft);
}

.section-icon {
  font-size: 28px;
}

.section-count {
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  padding: 2px 10px;
  border-radius: 10px;
  margin-left: 4px;
}

/* ========== 分类行：名称 + 比例条 + 数量 ========== */
.genre-row {
  display: grid;
  grid-template-columns: 168px 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
}

.genre-row + .genre-row {
  border-top: 1px dashed var(--vp-c-divider);
}

.genre-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

.genre-bar-track {
  height: 10px;
  background: var(--vp-c-bg-soft);
  border-radius: 5px;
  overflow: hidden;
}

.genre-bar {
  display: block;
  height: 100%;
  border-radius: 5px;
  background: linear-gradient(90deg, var(--vp-c-brand-1), #06b6d4);
  transition: width 0.3s ease;
}

.genre-count {
  font-size: 12px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  padding: 1px 8px;
  border-radius: 10px;
  white-space: nowrap;
}

.genre-empty {
  margin: 0;
  font-size: 14px;
  color: var(--vp-c-text-3);
}

/* ========== 响应式（与 HomePage 断点一致） ========== */
@media (max-width: 768px) {
  .home-stats {
    gap: 12px;
    padding: 16px 0 8px;
  }

  .stat-value {
    font-size: 22px;
  }

  .section-title {
    font-size: 20px;
  }

  .genre-row {
    grid-template-columns: 120px 1fr auto;
    gap: 8px;
  }
}
</style>
