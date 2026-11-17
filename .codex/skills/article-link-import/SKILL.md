---
name: article-link-import
description: Extract an online article from a user-provided URL (Zhihu/WeChat/etc.) and import it into the articles collection.
---

# Article Link Import

用户只发一个文章链接（知乎专栏/回答、公众号、掘金、博客等）时使用本 skill。目标：抽出可读 Markdown，写入 `docs/books/articles/`，更新目录与侧边栏。

## 硬约束

- 合辑 slug 固定为 `articles`；不要新建第二本「文章收藏」。
- 正常只改：`docs/books/articles/`、`content-stats.json`（脚本会写）、本地 gitignored 的 `sidebar-generated.json`。
- 不要改其它书、主题、部署配置。
- 在 feature 分支上改（已在 `feat/articles-collection` 或从它/`main` 拉 `docs/article-...`）。
- 未要求时不要 commit / push。

## 抽取策略（按顺序）

### 1. 开放站点：先让脚本自动抓

```bash
npm run import:article -- --url "<url>" --author "<若已知>"
```

成功则跳到「验收」。失败且退出码 2 / 报 `FETCH_BLOCKED` → 走步骤 2。

### 2. 知乎 / 公众号等防抓站：浏览器抽取

知乎常禁复制、禁匿名 API；**用用户本机已登录的 Chrome**（browser-use / cursor-ide-browser）：

1. 打开原文 URL，等待正文渲染。
2. 从 DOM 抽正文（标题、作者、段落）。不要依赖「复制」按钮。
3. 去掉登录墙、推荐卡、广告、「下一篇」等噪音。
4. 写成临时 Markdown（如 `%TEMP%/article-draft.md`），结构：

   ```markdown
   # 完整标题

   正文……
   ```

5. 入库：

   ```bash
   npm run import:article -- --markdown "%TEMP%/article-draft.md" --url "<url>" --title "<标题>" --author "<作者>"
   ```

### 3. 正文是长图 / 截图

1. 浏览器截图或用户提供的图片，用 Read 工具看图。
2. 按阅读顺序转写为 Markdown（保留小标题与列表）。
3. 同样用 `--markdown` 入库；引用块里注明「来源为图片转写」。

### 4. 实在抽不出

停下来问用户：粘贴正文、或导出 PDF/截图。不要编造正文。

## 文件与元数据约定

- 文件名：`NN-短标题.md`（编号由脚本递增）。
- 文首引用块由脚本生成：`来源平台链接 · 作者 · 收录日期`。
- `## 目录` 由脚本追加一行；`prebuild` / `generate:sidebar` 会再幂等对齐。

## 验收

```bash
node --test scripts/import-article.test.mjs
rg -n "缺失资源|text[0-9]+\.html|filepos" docs/books/articles
# 目检：新文章页标题、引用块、正文；侧边栏出现新条目
```

需要发布时再按仓库规范 commit + PR（用户明确要求才做）。

## 一句话触发

用户：「帮我收录这篇：\<url\>」→ 读本 skill → 抽取 → `import:article` → 汇报路径与标题。
