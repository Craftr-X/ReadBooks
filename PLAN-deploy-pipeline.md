# 部署管线治理落地方案（P0 – P3）

> 建立日期：2026-11-11
> 范围：仅治理 `.github/workflows/deploy.yml`、`scripts/`、`docs/.vitepress/` 的构建确定性与部署链路；不改书籍内容、不改主题外观、不改 `dist/` 源文件。
> 状态：按 P0 → P1 → P2 → P3 顺序执行，每档有独立验收，验收不过不进下一档。

---

## 一、问题定性

GitHub Pages 部署超时不是一次故障，是三层叠加：

| 层 | 内容 | 可控性 |
| --- | --- | --- |
| 触发源 | Pages 后端 `syncing_files` 间歇性挂起，10 分钟是服务端硬超时 | 平台侧，仓库改不掉 |
| 放大器 | 每次部署都在给后端压全站同步（1498 个 HTML 全部重写） | **仓库侧，唯一杠杆** |
| 恶化循环 | #57 移除自动重试并把 `pages: write` 降为 `read`，后端一挂就要人工 `workflow_dispatch`；全量同步又抬高挂起概率 | 已由 `dd807d3` 止血 |

### 已确认的根因（源码级）

`node_modules/vitepress@1.6.4/dist/node/chunk-D3CUZ4fa.js:40527`：

```js
async function scanForBuild() {
  await pMap(siteConfig.pages, indexFile, {
    concurrency: siteConfig.buildConcurrency   // 默认 64
  });
}
```

`indexFile()` 内部渲染 markdown、切分章节后调用 `index.add({ id, ... })`。并发下每个页面**渲染完成的先后顺序不稳定**，MiniSearch 按 `add()` 顺序分配内部短 ID（`documentIds`），于是序列化 JSON 的字节内容每次都不同 → 32.5 MB 的 `@localSearchIndexroot.*.js` 内容哈希变 → 文件名哈希变 → `app` / `theme` 引用变 → 全部 HTML 重写。

`buildConcurrency` 同时用于页面 SSR 渲染（同文件 `:49638`），**不能简单设为 1**，否则 1497 页串行渲染会让构建时间暴涨。这是本次不采用「改并发配置」的原因。

### 实测证据（2026-11-11 查 Actions 日志）

- 同一源码 `98f787b` 两次部署：run `42841200644` 变更 7498 文件（首次切增量发布）；10 分钟后手动重跑 `42843016571`，源码零改动，仍变更 **1502 文件**。
- 两次 gh-pages 提交 tree 不同（`91f2f886bc` / `80b3ed0b87`），`additions == deletions`（3008/3008、66298/66298），是内容改写而非新增。
- 两次 Pages 构建各耗 6~7 分钟；后端正常时成功部署只要 16 秒。#55 3m16s → #56 8m31s → #57 9m49s，随全量同步递增。

### 已证伪的假设

- 产物体积是瓶颈 → metaChunk 让 artifact 247 → 150 MB，deploy 仍 600s 超时。
- 放宽 `deploy-pages` timeout → 服务端 10 分钟硬限制，无效。
- `deploy-pages` 通道本身 → #55 换 gh-pages 分支发布后仍挂。

---

## 二、决策门

**P2 与 P3 互斥。** P1 拿到实测差异后二选一：

- 决定继续用 GitHub Pages → 执行 P2 修构建确定性，P3 只留预案。
- 决定迁移托管 → **跳过 P2**，换托管后「增量发布」这个假设整体作废，哈希抖动只剩 CDN 缓存影响。

本方案默认走「继续用 Pages」这条（不需要外部账号/备案，可本地完整验证），P3 产出可直接执行的配置模板，实际切换需用户选定平台并提供账号。

---

## P0 — 止血：让部署免人工干预

**目标**：把 `dd807d3` 推到 main，恢复 Pages 构建失败自动重触发。

**动作**

1. 用 `js-yaml` 解析 `deploy.yml` 并做结构断言：`on` / `permissions` / `concurrency` / `jobs.build-and-publish.steps` 齐全，`pages: write` 已恢复，重试 step 存在，summary step 存在。
2. 抽出所有 `run:` 块用 `bash -n` 做语法检查。
3. `git push origin main`（当前 `origin/main = 98f787b`，本地 ahead 1，工作区干净）。

**验收**

- `origin/main == dd807d3`。
- 触发的 run 里能看到部署摘要「变更文件数」，后端挂起时自动重触发到 `built`，无需人工点击。

**风险 / 回滚**：4 轮重试（每轮最长约 11 分钟 + 退避）叠加全量同步，可能顶到 job 的 60 分钟兜底。回滚 `git revert dd807d3` 即可，但会退回人工干预状态。P0 是止血，不是治本。

---

## P1 — 可观测：把「构建是否确定」变成可测

**目标**：不再靠猜，用产物级证据锁定所有不稳定文件。

**动作**

1. 新增 `scripts/verify-build-determinism.mjs`：连续跑两次 `npm run build`，每次对 `dist/` 做文件清单 + SHA-256 快照（流式，不复制 300 MB 产物），输出差异报告。
2. `package.json` 加 `verify:determinism` script。
3. 新增 `scripts/verify-build-determinism.test.mjs`，覆盖差异比较函数（相同 / 新增 / 删除 / 内容变化）。
4. 跑一次，报告写到 `logs/build-determinism.json`。

**验收**

- 报告能明确列出「哪些文件变了、各差多少字节」，预期主差异为 `@localSearchIndexroot.*.js` 及其级联的 `app` / `theme` chunk 与 1498 个 HTML。
- `npm test` 全过（含新增单测）。

**风险**：两次完整 build 约 8~10 分钟；本机构建清空 `dist/` 可能触发工具侧批量删除保护，若被打断则改为手动分步执行并保留快照。

---

## P2 — 治本：让构建产物确定

**目标**：同一份源码连跑两次 build，`dist/` 文件级哈希完全一致；只改一个 md 时 gh-pages 变更数回落到个位数。

**主方案：在虚拟模块进入 Rollup 之前规范化 MiniSearch 序列化**

新增 `docs/.vitepress/deterministic-search-index.mjs`，注册为 Vite 插件，在 `transform` 阶段拦截 VitePress 的 `@localSearchIndex` 虚拟模块：

1. 用通用字符串字面量定位解析 `export default "<json>"`，不依赖产物压缩格式。
2. 按业务 ID（页面 URL）排序重建短 ID 映射，同步重映射 `documentIds` / `fieldLength` / `storedFields` / `index` 四处引用，倒排表按 term 字典序重排。
3. **`averageFieldLength` 从整数 `fieldLength` 重新累加计算**。MiniSearch 在 `add()` 时增量维护该浮点值，并发顺序不同会让末位舍入不同（真实索引实测 `1.8320357793606086` vs 整数重算 `...6097`），这是最后一个不确定源。
4. 保持紧凑的单引号字面量写回，产物体积实测 +0.00%；在 `docs/.vitepress/config.mts` 的 `vite.plugins` 注册。

**实测证伪的两条路径**（避免后来者重走）：

- `renderChunk` 太晚：插件确实命中并把索引 chunk 规范化了，但两次 build 仍是 4 新增 / 4 删除 + 1498 HTML 变化 —— Vite/Rollup 在该 hook 之前就按模块内容算好了带 hash 的 chunk 名。
- 只规范化 ID 与 term 不够：transform 命中且产物 URL / term 都已排序，文件名仍在抖，最终定位到 `averageFieldLength` 的浮点累加顺序。

**为什么不用其它方案**

| 方案 | 不采用的原因 |
| --- | --- |
| 固定 `entryFileNames` / `chunkFileNames` | VitePress 1.6 把 `output` 写死并覆盖用户配置，级联 rehash 风险高，属未经验证的 hack |
| `buildConcurrency: 1` | 同时拖慢 1497 页 SSR 渲染，构建时间不可接受 |
| patch `node_modules` 改 `pMap` | 需引入 `patch-package` / postinstall，升级即失效，CI `npm ci` 后不可靠 |
| 换搜索方案 / 分片索引 | 改动主题组件，侵入大，与部署问题不成比例 |

**备用路径（未启用）**：若 `transform` 仍无法稳定，才考虑「固定索引 chunk 文件名 + 在 `generateBundle` 改写引用」——即使 32 MB 索引内容仍变，也能让 1498 个 HTML 与 app/theme 保持稳定，把变更压到 1 个文件。该路径风险高且同样须两次 build 验收。

**验收**

- 单测：同一组乱序输入经规范化后输出字节一致；`MiniSearch.loadJSON()` 能加载且搜索结果与原始一致。
- `npm test` 全过、`npm run build` 成功。
- `npm run verify:determinism` 报告 **0 个差异文件**。
- `npm run check:deadlinks` 无新增死链。

**回滚**：删除插件注册即可，不改动任何书籍内容。

---

## P3 — 迁移预案（不擅自切换）

**目标**：产出可立即执行的切换包，把决策留给平台选型。

**动作**

1. 写 `docs-deploy-migration.md`（本仓库根目录）：两条路线的对比、前置条件、代价、回滚。
2. 产出 workflow 变体模板：
   - Cloudflare Pages：`wrangler pages deploy dist` + `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` 两个 secrets。
   - 腾讯云 EdgeOne Pages / CloudBase：对应的 CLI 上传步骤与 secrets 清单。
3. 列出切换检查表：域名与 DNS、备案、旧链接 301、`base` 路径、回滚开关、首次全量上传。

**验收**：文档与模板齐全，用户选定平台后照单配置即可切换；本轮**不创建外部账号、不改线上域名、不推送迁移 workflow**。

---

## 三、任务与验收总表

| 档 | 交付物 | 验收 | 需用户决策 |
| --- | --- | --- | --- |
| P0 | `dd807d3` 已上线 | 摘要出现、失败自动恢复 | 推送授权（本轮视为已授权） |
| P1 | 确定性校验脚本 + 单测 + `logs/build-determinism.json` | 差异可定位、`npm test` 全过 | 无 |
| P2 | 规范化插件 + 单测 + 配置注册 | 两次 build 零差异 | 仅在「继续用 Pages」时执行 |
| P3 | 迁移方案文档 + workflow 模板 + 检查表 | 照单可执行 | **需要**：平台选型、账号、域名/备案 |

---

## 四、明确不做的事

- 不往 workflow 里塞未经验证的 hack。
- 不改 `entryFileNames` / `chunkFileNames`。
- 不动书籍内容、主题外观、`dist/` 生成物。
- 不擅自创建外部托管账号、不切换线上域名。
- P1/P2 的代码改动默认只做本地验证与本地提交，是否推送由用户确认（推送会触发一次真实部署）；2026-11-11 用户已以「开干」授权本次推送。

---

## 五、执行记录（2026-11-11）

| 档 | 结果 |
| --- | --- |
| P0 | `dd807d3` 已推，`origin/main` 同步。run `42964517356` 的 Checkout / Build / Publish 全部 success，但被 `timeout-minutes: 60` 取消（1h0m19s）。**当日复核后订正：不是后端挂起**——同期 4 次 Pages build 全部 `built`（47~53 秒），远端 gh-pages `3f2e51f6` 的 index.html 引用 `app.BBkJR8Uw.js`，与线上首页完全一致，`Last-Modified` 也对应最后一次 build，站点一直是健康的。真因是 workflow 依赖 `/pages/builds/latest` 判定，该端点在 Actions 的 `GITHUB_TOKEN` 下读不到有效状态，4 轮全判 `timeout` 误报失败。详见 P0′。 |
| P1 | 校验脚本、单测、`--reuse` / `--strict` 落地。基线实测 649s / 503s 两次构建：1498 个 HTML 内容变化且**字节差全为 0**，新增/删除各 4 个带 hash 文件（app、theme、VPLocalSearchBox、索引 chunk）。 |
| P2 | 三次实证迭代（renderChunk 定位失败 → renderChunk 时机被证伪 → transform + `averageFieldLength` 整数重算）。**`npm run verify:determinism -- --strict` 最终通过：两次完整构建 344s / 532s，新增 0 / 删除 0 / 内容变化 0，退出码 0。** |
| P3 | 迁移方案文档 + 两个官方 CLI workflow 模板交付；未切换、未创建账号、未改线上域名。**决策：暂缓**——P0 复核证明后端未挂，「恢复后仍挂起就迁走」的前提不成立。 |
| P0′ | 判定链修复（随 P2 同一次推送上线）：合并 `Wait for Pages build` 与 `Verify live content` 为 `Verify live content (auto retry)`，以「线上首页是否引用本次 dist 的 `app.*.js` 指纹」为唯一成功判定；Pages API 降为辅助信号（仅 `errored` 时快速重触发）；删除 240 秒 commit 注册等待，从 4 轮 ×14 分钟压缩为 3 轮 ×12 分钟；`gh api` 错误不再被静默吞掉。本地验收：结构断言 7 项、`bash -n` 0 失败、线上指纹正反用例通过。 |

验证汇总：`npm test` 151 项全过、`npm run lint` 0 error（1505 个 md）、`check:deadlinks` 1497 个 md 零死链、真实 21M 字符索引的往返与搜索语义单测通过。

**上线预期**：P2 改动本身会改变索引与入口 chunk 的内容哈希，因此修复上线后的**第一次部署仍会是全量**（1500+ 文件），不要误判为失败；从第二次起，内容无变化的推送应直接跳过发布，只改一个 md 时变更数应回落到个位数。P0 触发的 run 因误报被取消、未产出部署摘要，本次推送是第一次在修正后的判定链下观察「变更文件数」与「线上内容校验」。

**P3 触发条件（取代原「再挂一次就迁」）**：仅当修正后的判定链下，线上指纹在 3 轮 ×12 分钟内仍不更新、且 Pages build 明确 `errored` 时，才认定为真实后端故障并启动迁移。此时优先按 `deploy-templates/` 走 Cloudflare（省事）或 EdgeOne（北京访问优先）。
