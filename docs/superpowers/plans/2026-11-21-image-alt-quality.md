# 图片 alt 质量补全 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans (or subagent-driven-development) to implement task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按设计文档质量优先补全图片 alt：先试点三本并沉淀 SOP，再分批全站。

**Architecture:** 不改主题/导入器；只改各书 Markdown 中的空 alt 图片语法（`![]` + 路径）为带说明的写法。试点期人工/Agent 看图+上下文写说明；SOP 稳定后再考虑清单脚本。

**Tech Stack:** Markdown、rg 验收、可选临时下载外链图供视觉审阅。

## Global Constraints

- 质量条：8–30 字中文；装饰图用「装饰图」；禁止文件名冒充 alt；不改图片路径。
- 分支：`docs/alt-<slug>`；提交：`docs: 补全《书名》图片 alt（slug）`。
- SOP 跑通前不启用 MD045。
- 不治理掘金居中 HTML `<img>`。

---

### Task 1: 设计文档入库并标为已批准

**Files:**

- Modify: `docs/superpowers/specs/2026-11-21-image-alt-quality-design.md`（状态 → 已批准）

- [x] 将文首状态改为「已批准」
- [x] 确保设计提交在可合入分支上（可与首本试点同 PR 或先合设计）

### Task 2: 试点精修 `typescript-intro`（~21）

**Files:**

- Modify: `docs/books/typescript-intro/**/*.md` 中所有 `![](` 行

- [x] `rg -n '!\[\]\(' docs/books/typescript-intro` 列出清单
- [x] 对每张图：读前后文 + 查看图片，写 8–30 字 alt
- [x] `rg '!\[\]\(' docs/books/typescript-intro` 无命中
- [x] 抽检 ≥3 张说明与图意一致
- [x] Commit：`docs: 补全《TypeScript 入门教程》图片 alt（typescript-intro）`

### Task 3: 试点精修 `docker-guide`（~54）

**Files:**

- Modify: `docs/books/docker-guide/**/*.md`

- [x] 同 Task 2 流程
- [x] Commit：`docs: 补全《开发者必备的 Docker 实践指南》图片 alt（docker-guide）`

### Task 4: 试点精修 `attached`（~40）

**Files:**

- Modify: `docs/books/attached/**/*.md`

- [x] 同 Task 2；本地 `_assets` 用 Read 直接看图
- [x] Commit：`docs: 补全《关系的重建》图片 alt（attached）`

### Task 5: 沉淀 SOP 文档

**Files:**

- Create: `docs/superpowers/specs/image-alt-sop.md`

- [x] 写入清单→写 alt→装饰图规则→自检命令→分支/PR 约定→已完成 slug 表
- [x] 用三本试点经验修订质量条示例（好/坏对照各 2 条）
- [x] Commit：`docs: 图片 alt 补全 SOP`

### Task 6: 按 SOP 分批剩余书籍

**Files:**

- Modify: 各 `docs/books/<slug>/**/*.md`（每书一 PR）

- [ ] 按空 alt 数量从少到多处理；大户靠后
- [ ] 每书验收：空 alt=0、抽检、独立 PR

### Task 7: 全站收尾（全部清零后）

**Files:**

- Modify: `.markdownlint-cli2.yaml`、`README.md`

- [ ] 评估启用 MD045
- [ ] 更新 README TODO 状态与计数

---

## Spec coverage

| 设计要求 | 对应任务 |
| --- | --- |
| 试点三本 | Task 2–4 |
| SOP | Task 5 |
| 分批全站 | Task 6 |
| 开 MD045 / README | Task 7 |
| 不治理居中 HTML | Global Constraints |
