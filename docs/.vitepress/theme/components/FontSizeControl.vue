<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useData } from 'vitepress'
import { useNormalizedPath } from '../routePath'

/**
 * 章节页字号调节控件：右下角浮动 [A−] [字号] [A+]。
 * - 生效范围：/books/<slug>/<chapter> 章节页（与 ChapterReadingTime 的路由判断口径一致）
 * - 字号写入 <html> 的 --reading-font-size 变量，custom.css 中 .vp-doc 消费；
 *   档位 14–22px，步进 1px，未调节时走 CSS 默认（桌面 17px / 移动 16px）
 * - 持久化到 localStorage；config.mts head 里有同 key 的内联脚本提前套用，避免刷新闪烁
 * - 点击中间数字恢复默认字号
 * - 移动端内容列全宽，固定悬浮会压住滚动经过的正文：滚动时淡出、停止 1.5s 后淡入
 */

const STORAGE_KEY = 'reading-font-size'
const MIN = 14
const MAX = 22
const DESKTOP_DEFAULT = 17
const REAPPEAR_DELAY_MS = 1500

const { frontmatter } = useData()
const path = useNormalizedPath()

const isBookIndex = computed(() => /^\/books\/[^/]+\/?$/.test(path.value))
const shouldRender = computed(
  () =>
    frontmatter.value.layout !== 'home' &&
    !isBookIndex.value &&
    /^\/books\/[^/]+\//.test(path.value)
)

// localStorage 只能在客户端读；首帧挂 mounted 后再渲染，避免 SSR 水合不一致
const mounted = ref(false)
const size = ref<number | null>(null)
const hiddenByScroll = ref(false)

let reappearTimer: ReturnType<typeof setTimeout> | undefined
function onScroll() {
  hiddenByScroll.value = true
  if (reappearTimer) clearTimeout(reappearTimer)
  reappearTimer = setTimeout(() => {
    hiddenByScroll.value = false
  }, REAPPEAR_DELAY_MS)
}

onMounted(() => {
  mounted.value = true
  window.addEventListener('scroll', onScroll, { passive: true })
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const n = raw === null ? NaN : Number(raw)
    if (Number.isInteger(n) && n >= MIN && n <= MAX) size.value = n
  } catch {
    // 隐私模式等 localStorage 不可用时静默降级为仅本次会话生效
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
  if (reappearTimer) clearTimeout(reappearTimer)
})

function apply(next: number | null) {
  size.value = next
  const root = document.documentElement
  try {
    if (next === null) {
      root.style.removeProperty('--reading-font-size')
      localStorage.removeItem(STORAGE_KEY)
    } else {
      root.style.setProperty('--reading-font-size', `${next}px`)
      localStorage.setItem(STORAGE_KEY, String(next))
    }
  } catch {
    if (next === null) root.style.removeProperty('--reading-font-size')
    else root.style.setProperty('--reading-font-size', `${next}px`)
  }
}

function step(delta: number) {
  const current = size.value ?? DESKTOP_DEFAULT
  const next = Math.min(MAX, Math.max(MIN, current + delta))
  if (next !== size.value) apply(next)
}

function reset() {
  if (size.value !== null) apply(null)
}
</script>

<template>
  <div
    v-if="mounted && shouldRender"
    class="font-size-control"
    :class="{ 'is-scrolling': hiddenByScroll }"
    role="group"
    aria-label="正文字号调节"
  >
    <button
      type="button"
      class="fs-btn"
      :disabled="size !== null && size <= MIN"
      aria-label="减小字号"
      @click="step(-1)"
    >A−</button>
    <button
      type="button"
      class="fs-value"
      :title="size === null ? '当前为默认字号' : '点击恢复默认字号'"
      @click="reset"
    >
      <template v-if="size === null">A</template>
      <template v-else>{{ size }}</template>
    </button>
    <button
      type="button"
      class="fs-btn"
      :disabled="size !== null && size >= MAX"
      aria-label="增大字号"
      @click="step(1)"
    >A+</button>
  </div>
</template>

<style scoped>
/* 右下角浮动，叠在 VitePress「回到顶部」按钮上方，避免遮挡 */
.font-size-control {
  position: fixed;
  right: 1.25rem;
  bottom: 5.25rem;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px;
  background: color-mix(in srgb, var(--vp-c-bg-elv) 88%, transparent);
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(8px);
}

/* 旧内核不支持 color-mix 时的不透明兜底 */
@supports not (background: color-mix(in srgb, red 50%, blue)) {
  .font-size-control {
    background: var(--vp-c-bg-elv);
  }
}

/* 滚动中淡出：移动端内容列全宽，悬浮控件会压住正文；停止滚动 1.5s 后淡入 */
.font-size-control.is-scrolling {
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease-out;
}

.font-size-control {
  transition: opacity 0.4s ease-in;
}

.fs-btn,
.fs-value {
  font-family: var(--vp-font-family-base);
  color: var(--vp-c-text-2);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: color 0.2s, background-color 0.2s;
}

.fs-btn {
  min-width: 34px;
  height: 30px;
  padding: 0 8px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 999px;
}

.fs-btn:hover:not(:disabled) {
  color: var(--vp-c-brand-1);
  background: var(--vp-c-brand-soft);
}

.fs-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.fs-value {
  min-width: 30px;
  height: 30px;
  padding: 0 6px;
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  border-radius: 999px;
}

.fs-value:hover {
  color: var(--vp-c-brand-1);
}

@media (max-width: 768px) {
  .font-size-control {
    right: 0.75rem;
    bottom: 5rem;
  }
}
</style>
