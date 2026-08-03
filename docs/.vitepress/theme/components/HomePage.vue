<script setup lang="ts">
import { computed } from 'vue'
import { useData } from 'vitepress'
import books from '../../../../books.json'
import contentStats from '../../../../content-stats.json'

interface BookEntry {
  slug: string
  title: string
  desc: string
  category: 'booklet' | 'ebook'
}

const { site } = useData()
const base = computed(() => site.value.base)

// 拼接带 base 前缀的书籍路由
const bookHref = (slug: string) => `${base.value}books/${slug}/`

const booklets = computed(() =>
  (books as BookEntry[]).filter(b => (b.category || 'booklet') === 'booklet')
)
const ebooks = computed(() =>
  (books as BookEntry[]).filter(b => b.category === 'ebook')
)

const formatMinutes = (min: number): string => {
  if (min < 60) return `${min} 分`
  const hours = Math.floor(min / 60)
  const rest = min % 60
  // 不足半小时按半小时显示，超过半小时按整小时向上取整
  if (rest === 0) return `${hours} 小时`
  if (rest <= 30) return `${hours}½ 小时`
  return `${hours + 1} 小时`
}

const stats = [
  { label: '技术小册', value: contentStats.bookletCount, icon: '📚' },
  { label: '电子书', value: contentStats.ebookCount, icon: '📖' },
  { label: '文章总数', value: contentStats.chapterCount, icon: '📄' },
  { label: '总阅读时长', value: formatMinutes(contentStats.totalReadingMinutes), icon: '⏱' },
]
</script>

<template>
  <div class="home-section">
    <!-- 统计卡片 -->
    <div class="home-stats">
      <div v-for="item in stats" :key="item.label" class="stat-card">
        <span class="stat-icon">{{ item.icon }}</span>
        <span class="stat-value">{{ item.value }}</span>
        <span class="stat-label">{{ item.label }}</span>
      </div>
    </div>

    <!-- 技术小册区 -->
    <section class="book-section">
      <h2 class="section-title">
        <span class="section-icon">📚</span>
        技术小册
        <span class="section-count">{{ booklets.length }} 本</span>
      </h2>
      <div class="book-grid">
        <a
          v-for="book in booklets"
          :key="book.slug"
          :href="bookHref(book.slug)"
          class="book-card"
        >
          <div class="book-card-body">
            <h3 class="book-title">{{ book.title }}</h3>
            <p class="book-desc">{{ book.desc }}</p>
          </div>
          <span class="book-arrow" aria-hidden="true">→</span>
        </a>
      </div>
    </section>

    <!-- 电子书区 -->
    <section class="book-section">
      <h2 class="section-title">
        <span class="section-icon">📖</span>
        电子书
        <span class="section-count">{{ ebooks.length }} 本</span>
      </h2>
      <div class="book-grid">
        <a
          v-for="book in ebooks"
          :key="book.slug"
          :href="bookHref(book.slug)"
          class="book-card"
        >
          <div class="book-card-body">
            <h3 class="book-title">{{ book.title }}</h3>
            <p class="book-desc">{{ book.desc }}</p>
          </div>
          <span class="book-arrow" aria-hidden="true">→</span>
        </a>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-section {
  max-width: 1152px;
  margin: 0 auto;
  padding: 0 24px 48px;
}

/* ========== 统计卡片 ========== */
.home-stats {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 40px 20px 16px;
  flex-wrap: wrap;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 24px 32px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 16px;
  min-width: 140px;
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

/* ========== 书籍分区 ========== */
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

/* ========== 书籍卡片网格 ========== */
.book-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.book-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 18px 20px;
  background: var(--vp-c-bg-soft);
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  min-height: 96px;
}

.book-card:hover {
  border-color: var(--vp-c-brand-1);
  box-shadow: 0 0 20px rgba(99, 102, 241, 0.15);
  transform: translateY(-2px);
}

.book-card:hover .book-arrow {
  color: var(--vp-c-brand-1);
  transform: translateX(4px);
}

.book-card:hover .book-title {
  color: var(--vp-c-brand-1);
}

.book-card-body {
  flex: 1;
  min-width: 0;
}

.book-title {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 6px;
  color: var(--vp-c-text-1);
  transition: color 0.2s;
  /* 超长标题不换行，省略号 */
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-desc {
  font-size: 13px;
  line-height: 1.5;
  color: var(--vp-c-text-2);
  margin: 0;
  /* 简介最多两行 */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.book-arrow {
  flex-shrink: 0;
  font-size: 18px;
  color: var(--vp-c-text-3);
  transition: all 0.2s;
}

/* ========== 响应式 ========== */
@media (max-width: 768px) {
  .home-section {
    padding: 0 16px 32px;
  }

  .home-stats {
    gap: 12px;
    padding: 24px 12px 12px;
  }

  .stat-card {
    min-width: 120px;
    padding: 16px 20px;
  }

  .stat-value {
    font-size: 22px;
  }

  .section-title {
    font-size: 20px;
  }

  .book-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }
}
</style>
