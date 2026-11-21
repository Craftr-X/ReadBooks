# 图片 alt 补全 SOP

> 依据：`docs/superpowers/specs/2026-11-21-image-alt-quality-design.md`  
> 试点验证：`typescript-intro`（21）/ `docker-guide`（54）/ `attached`（40）  
> 目标：质量优先；普通读者视觉无感；读屏可读。

## 何时用本流程

对某一本书 `docs/books/<slug>/` 中所有 `![](` 空 alt 做语义补全时，按本 SOP 执行。  
**不要**用文件名批量灌假 alt；**不要**本阶段全站打开 MD045。

## 质量条（写每一句 alt）

1. **看图**（本地 `_assets`/`images` 直接打开；外链先下载再看）。
2. **看前后文**（「如下图」「对照表」等）。
3. 写 **8–30 字**中文，说明图传达的信息。
4. **装饰图**（无信息花边、重复装饰）：统一写 `装饰图`。
5. **禁止**：空 alt；`image-002` 一类文件名；整段正文粘贴进 alt；改图片 URL/路径。

### 好例子 / 坏例子

| 好 | 坏 |
| --- | --- |
| `VS Code 命令面板选择打开工作区设置` | `截图` / `图片` / `image-001` |
| `回避型安全型焦虑型恋人特质对照表` | `表格`（太空） |
| `微信公众号虞山脚下二维码` | `二维码`（缺主体） |
| `装饰图`（确无信息时） | 瞎编情节 |

## 单书操作步骤

### 1. 开分支

```bash
git checkout main && git pull
git checkout -b docs/alt-<slug>
```

### 2. 列清单

```bash
rg -n '!\[\]\(' docs/books/<slug> --glob '*.md'
```

记下：文件、行号、本地路径或外链。统计条数，写入 PR 说明。

### 3. 取图审阅

- **本地图**：`docs/books/<slug>/_assets/...` 用看图工具或编辑器预览。
- **外链图**：下载到临时目录再看。若 CDN 失效（试点中掘金旧域 `user-gold-cdn.xitu.io` SSL 失败），**改为强依赖上下文**写说明，并在 PR 注明「图源不可拉取，上下文推断」；勿编造看不到的细节。

### 4. 写回 Markdown

只改 alt，路径不变：

```markdown
![说明文字](原路径或原 URL)
```

多页连续问卷/参考文献可标「第 N 部分 / 第 N 页」，便于区分。

### 5. 自检

```bash
rg '!\[\]\(' docs/books/<slug> --glob '*.md'   # 应无输出
```

抽检 ≥3 张：打开图与 alt 对照，确认相符或确认为装饰图。  
确认未改其他 slug。

### 6. 提交与 PR

```text
docs: 补全《书名》图片 alt（<slug>）
```

PR 说明包含：处理数量、是否「上下文推断」（CDN 不可用时）、抽检结论。

## 全站分批顺序

1. 先扫空 alt 数量，**从少到多**。
2. 大户靠后：`yan-tie-lun`、`claude-code-dev` 等。
3. **每书一 PR**，避免巨型 diff。
4. 全部清零后，再评估启用 MD045，并更新 README TODO。

统计命令：

```bash
rg -c '!\[\]\(' docs/books --glob '*.md' | awk -F/ '{
  split($0,a,"/"); book=a[3]; sub(/.*:/,"",$0); c[book]+=$0
} END { for (b in c) print c[b], b }' | sort -n
```

## 已完成 slug

| slug | 数量 | 备注 | 完成日 |
| --- | ---: | --- | --- |
| typescript-intro | 21 | 掘金外链，可下载看图 | 2026-11-21 |
| docker-guide | 54 | 旧 xitu CDN 不可拉，上下文推断 | 2026-11-21 |
| attached | 40 | 本地 `_assets`，问卷/流程图/参考文献 | 2026-11-21 |
| cicd-guide | 1 | 掘金外链，上下文推断 | 2026-11-21 |
| mingchao-naxieshier | 1 | 封面 | 2026-11-21 |
| ta-de-guo | 1 | 封面 | 2026-11-21 |
| wosuo-lijie-de-shenghuo | 1 | 封面 | 2026-11-21 |
| yizuo-chengchi | 1 | 封面 | 2026-11-21 |
| build-agent-harness | 4 | 本地架构对比图 | 2026-11-21 |
| mysql-running | 4 | 旧 xitu CDN，上下文推断；含原 title 升格为 alt | 2026-11-21 |
| feibaoli-goutong | 6 | 封面折页与观察评论对照表 | 2026-11-21 |
| how-to-not-die-alone | 10 | 问卷、矩阵、曲线图 | 2026-11-21 |
| yi-ri-wei-jian | 12 | 篇首照片与统计表 | 2026-11-21 |

（后续按书追加行。）

## 试点经验备忘

- 技术小册外链图：上下文常有「如下图所示」，结合截图界面写具体名词（设置项名、产品名）。
- EPUB 问卷/表格图：按「问卷第 N 部分」「对照表」命名，避免只写「表格」。
- 参考文献整页图：`参考文献条目列表（第 N 页）` 足够；不必 OCR 全文进 alt。
- 同一张图在多章复用：同一 alt 即可。
