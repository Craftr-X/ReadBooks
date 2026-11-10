import{_ as n,o as a,c as p,a3 as e}from"./chunks/framework.DdpBa4_E.js";const d=JSON.parse('{"title":"21｜实操课：一次完整改造的全流程演示 + 验收复盘","description":"","frontmatter":{},"headers":[],"relativePath":"books/claude-code-legacy/21-实操课-一次完整改造的全流程演示-+-验收复盘.md","filePath":"books/claude-code-legacy/21-实操课-一次完整改造的全流程演示-+-验收复盘.md","lastUpdated":1794316978000}'),l={name:"books/claude-code-legacy/21-实操课-一次完整改造的全流程演示-+-验收复盘.md"};function i(r,s,c,t,o,b){return a(),p("div",null,[...s[0]||(s[0]=[e(`<h1 id="_21-实操课-一次完整改造的全流程演示-验收复盘" tabindex="-1">21｜实操课：一次完整改造的全流程演示 + 验收复盘 <a class="header-anchor" href="#_21-实操课-一次完整改造的全流程演示-验收复盘" aria-label="Permalink to &quot;21｜实操课：一次完整改造的全流程演示 + 验收复盘&quot;">​</a></h1><p><strong>作者：Robert</strong></p><blockquote><p>整个“老项目改造”的方法论全部跑完。</p></blockquote><p>你好，我是 Robert。</p><p>这一讲是第四部分的收尾。前面 17-20 讲每一讲做一段，这一讲把“接到一句话需求”到“前端跑通可提 PR”的所有动作连起来跑一遍。从“leader 给你一句话”到“需求文档 + 改造方案 + 后端代码 + 测试 + 前端跑通 + docs/ 全部同步更新”。</p><p><strong>这是一节实操课，视频演示</strong>。提示词都在下面，你可以打开 Claude Code 照着跑。跑完你的项目里就有一次完整的改造闭环。</p><p><a href="https://media001.geekbang.org/customerTrans/7e27d07d27d407ebcc195a0e78395f55/30699aaa-19e4a0ddcea-0000-0000-01d-dbacd.mp4" target="_blank" rel="noreferrer">![：_assets/979914_img_001.jpg]</a></p><p>还有一件事必须开篇提示：20 讲我做过一次复盘，确认我和 AI 一起做了一个本来不需要做的功能（项目里其实已经有版本对比了）。这个翻车留下了一条新的硬约束：<strong>任何改造开始之前，先打开产品点几下确认现状</strong>。</p><h2 id="准备" tabindex="-1">准备 <a class="header-anchor" href="#准备" aria-label="Permalink to &quot;准备&quot;">​</a></h2><p>17-20 讲的准备工作都做完了：项目跑通（13 讲）、护栏到位（14-16 讲）、CLAUDE.md 写好（10 讲）、docs/ 资产齐全（08-09 讲）。</p><p>如果你跳过了前面直接看这一讲，先回到 16 讲跑一遍实操，确保有一个跑通且测试覆盖到位的项目。否则后面所有提示词的“基于 docs/…”都没有素材。</p><div class="language-plain vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">plain</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>cd spring-ai-alibaba/spring-ai-alibaba-admin</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br></div></div><p>在项目根目录启动 Claude Code，所有提示词都在这里跑。</p><h2 id="改造前的硬约束-先点产品确认现状" tabindex="-1">改造前的硬约束：先点产品确认现状 <a class="header-anchor" href="#改造前的硬约束-先点产品确认现状" aria-label="Permalink to &quot;改造前的硬约束：先点产品确认现状&quot;">​</a></h2><p>这一步是 20 讲复盘留下的硬约束，比所有提示词都重要。</p><p>任何改造任务开始之前，先打开生产环境点几下，<strong>确认你以为要做的功能是不是真的不存在。</strong></p><div class="language-plain vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">plain</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>./scripts/deps-start.sh</span></span>
<span class="line"><span># 然后启动后端、启动前端、登录账号 saa/123456</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br></div></div><p>打开浏览器，带着 leader 的一句话需求去点产品。比如 leader 说“给 Prompt 加版本对比”，你打开 Prompt 管理 → 版本历史，点一下就知道：旧的对比按钮是不是已经在工作？如果在工作，你的需求就不是“加新功能”，是“性能优化”或者“重构”，立项方向完全不同。</p><p><strong>提示词 0：现状确认</strong></p><div class="language-plain vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">plain</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>我打算做一个新需求：&quot;给 Prompt 管理加一个版本对比功能&quot;。</span></span>
<span class="line"><span>我已经在产品上点了一遍，确认这个功能[已存在 / 不存在 / 部分存在]。</span></span>
<span class="line"><span>现状描述：[一两句话写清楚，比如：版本历史页面已经有&quot;对比&quot;按钮，</span></span>
<span class="line"><span>点击后能弹出 modal 显示两个版本的 diff，功能完整]。</span></span>
<span class="line"><span></span></span>
<span class="line"><span>基于这个现状，告诉我下面的改造路径应该怎么定：是新增、重构、还是优化？</span></span>
<span class="line"><span>给一个判断 + 理由。</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br></div></div><p>跑完这一步，你已经避开了一个老项目改造里最常见的坑。</p><p><strong>review 重点</strong>：你自己点了产品确认了，不是 AI 替你确认的。<strong>AI 扫代码无法发现“功能已存在”，必须人手验证</strong>。</p><h2 id="场景一-把一句话需求拆成需求文档" tabindex="-1">场景一：把一句话需求拆成需求文档 <a class="header-anchor" href="#场景一-把一句话需求拆成需求文档" aria-label="Permalink to &quot;场景一：把一句话需求拆成需求文档&quot;">​</a></h2><p>对应 17 讲。产出 <code>docs/requirements/prompt-version-diff.md</code>。</p><p><strong>提示词 1：六维拆解</strong></p><div class="language-plain vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">plain</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>我有一个新需求：给 Prompt 管理加版本对比功能。</span></span>
<span class="line"><span>GET /api/prompt/version/diff？promptKey=xxx&amp;versionA=v3&amp;versionB=v5</span></span>
<span class="line"><span>返回两个版本的 diff 结果。</span></span>
<span class="line"><span></span></span>
<span class="line"><span>读 docs/ 下所有资产 + CLAUDE.md，再扫一下代码里现有 Prompt 版本</span></span>
<span class="line"><span>相关的实现(PromptVersionController、PromptService、PromptVersionEntity)，</span></span>
<span class="line"><span>按以下六维写需求文档草稿：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>1. 业务目标(一句话)</span></span>
<span class="line"><span>2. 用户场景(典型场景 + 痛点)</span></span>
<span class="line"><span>3. 接口契约(方法、路径、入参、返回、错误码，对齐项目现有风格)</span></span>
<span class="line"><span>4. 边界场景清单(至少 8 条 edge case，每条标&quot;基于代码推断&quot;或&quot;待产品决策&quot;)</span></span>
<span class="line"><span>5. 老项目约束(CLAUDE.md 禁区和历史包袱里相关的，每条标 CLAUDE.md 来源)</span></span>
<span class="line"><span>6. 不在这次范围里的事(先列候选)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>输出 markdown，保存到 docs/requirements/prompt-version-diff.md。</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br></div></div><p><strong>产出</strong>：六维草稿，覆盖 70% 内容。</p><p><strong>review 重点</strong>：六维都填上了、边界场景至少 8 条、老项目约束都有 CLAUDE.md 来源、“不在这次范围里”有候选清单。</p><p><strong>提示词 2：人审核三个判断 + 让 AI 出定稿</strong></p><p>review 三件事：<strong>业务目标方向、边界场景的产品决策、不在这次范围里的事</strong>。其他维度（接口契约、老项目约束、技术边界）AI 写的直接用。</p><p>review 完把三个判断打包反馈：</p><div class="language-plain vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">plain</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>我对 docs/requirements/prompt-version-diff.md 做了三个判断：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>业务目标修正：从&quot;工程师 review 自己的修改&quot;改成&quot;团队多人协作下的</span></span>
<span class="line"><span>Prompt 演进追溯&quot;。diff 结果要返回 versionA/versionB 的元信息</span></span>
<span class="line"><span>(创建时间、状态)不只是内容。</span></span>
<span class="line"><span></span></span>
<span class="line"><span>边界场景的产品决策：</span></span>
<span class="line"><span>- E04(template 为 null)：null 视同空字符串</span></span>
<span class="line"><span>- E07(已软删除)：允许查 diff</span></span>
<span class="line"><span>- E08(LONGTEXT 超大)：本期不做大小限制</span></span>
<span class="line"><span>- E09(版本号大小写)：不在应用层 toLowerCase</span></span>
<span class="line"><span>- E10(高并发)：本期不加缓存</span></span>
<span class="line"><span></span></span>
<span class="line"><span>不在这次范围里的事最终决策：</span></span>
<span class="line"><span>- 砍掉：后端生成 unified diff、跨 promptKey 对比、N 版本对比、</span></span>
<span class="line"><span>  diff 缓存、versionDescription diff、权限控制</span></span>
<span class="line"><span>- 留到下期：diff 导出、一键比对上一版</span></span>
<span class="line"><span></span></span>
<span class="line"><span>按以上判断更新文档，整理为正式 PRD 格式，保存到原文件。</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br><span class="line-number">17</span><br><span class="line-number">18</span><br><span class="line-number">19</span><br></div></div><p><strong>产出</strong>：定稿的需求文档。</p><p>跑完场景一，需求文档定稿。<strong>20 分钟</strong>。</p><h2 id="场景二-把需求文档拆成改造方案" tabindex="-1">场景二：把需求文档拆成改造方案 <a class="header-anchor" href="#场景二-把需求文档拆成改造方案" aria-label="Permalink to &quot;场景二：把需求文档拆成改造方案&quot;">​</a></h2><p>对应 18 讲。产出 <code>docs/requirements/prompt-version-diff-solution.md</code>。</p><p>七个提示词跑完。</p><p><strong>提示词 3：摸链路（含前端）</strong></p><div class="language-plain vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">plain</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>基于 docs/requirements/prompt-version-diff.md 的需求，扫一下代码：</span></span>
<span class="line"><span>- 找出这次改造涉及的完整链路(HTTP 入口到 DB)</span></span>
<span class="line"><span>- 每个节点说明：文件、状态(现有/新增/修改)、关键逻辑</span></span>
<span class="line"><span>- 不要漏前端节点(页面、组件、API、类型声明)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>输出表格 + 链路图，保存到 docs/requirements/prompt-version-diff-impact.md。</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br></div></div><p><strong>review 重点</strong>：前端节点列得对不对、链路完整性。</p><p><strong>提示词 4：列改造点</strong></p><div class="language-plain vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">plain</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>基于上一步的链路，把改造拆成具体改造点列表(P01， P02， ...)。</span></span>
<span class="line"><span>后端 / 前端 / 测试 / 文档都列出来，每条标类型 + 文件路径 + 一</span></span>
<span class="line"><span>句话改什么。追加到 prompt-version-diff-impact.md。</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br></div></div><p><strong>review 重点</strong>：前端列得齐不齐、测试有没有列。</p><p><strong>提示词 5：画改造流程图</strong></p><div class="language-plain vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">plain</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>基于改造点，画一张改造流程图(mermaid sequence diagram)。</span></span>
<span class="line"><span>要展示：用户从前端发起请求的完整调用链 + 数据流。</span></span>
<span class="line"><span>保存到 docs/requirements/prompt-version-diff-flow(mermaid 代码块)。</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br></div></div><p><strong>review 重点</strong>：前端到后端的调用链完整、数据流画清楚。</p><p><strong>提示词 6：说影响范围</strong></p><div class="language-plain vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">plain</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>基于改造点和流程图，说明影响范围(每条标&quot;高/中/低&quot;风险)：</span></span>
<span class="line"><span>1. 现有接口受不受影响</span></span>
<span class="line"><span>2. 现有调用链路受不受影响</span></span>
<span class="line"><span>3. 测试影响</span></span>
<span class="line"><span>4. 文档影响</span></span>
<span class="line"><span>5. 前端兼容性</span></span>
<span class="line"><span>6. 性能影响</span></span>
<span class="line"><span></span></span>
<span class="line"><span>输出表格。</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br></div></div><p><strong>review 重点</strong>：风险等级合理吗、有没有漏的影响项。</p><p><strong>提示词 7：说改造步骤和顺序</strong></p><div class="language-plain vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">plain</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>基于改造点和影响范围，给出改造步骤和顺序：</span></span>
<span class="line"><span>- 按依赖关系排序，后端在前、前端跟上、测试穿插</span></span>
<span class="line"><span>- 每步说明：做什么、依赖、工作量、关键决策点</span></span>
<span class="line"><span>- 没有方案分歧的步骤直接给一个方案，不要硬凑多方案</span></span>
<span class="line"><span></span></span>
<span class="line"><span>输出表格。</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br></div></div><p><strong>review 重点</strong>：关键决策点准、前端步骤的“前置依赖”对（前端不需要等后端全部完成，有 mock 就能并行）。</p><p><strong>提示词 8：整合成方案文档（关键决策单独抽出来）</strong></p><div class="language-plain vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">plain</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>把前面五步的产出整合成完整方案文档：</span></span>
<span class="line"><span>1. 一句话概要</span></span>
<span class="line"><span>2. 涉及链路</span></span>
<span class="line"><span>3. 改造点清单</span></span>
<span class="line"><span>4. 改造流程图</span></span>
<span class="line"><span>5. 影响范围与风险</span></span>
<span class="line"><span>6. 改造步骤与顺序</span></span>
<span class="line"><span>7. 待审核的关键决策点(单独抽出来，方便人 review)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>第 7 节是关键：把前面散落的所有&quot;需要人决策&quot;的点集中列出来。</span></span>
<span class="line"><span></span></span>
<span class="line"><span>保存到 docs/requirements/prompt-version-diff-solution.md。</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br></div></div><p><strong>review 重点</strong>：第 7 节决策点提取得齐、结构清晰。</p><p><strong>提示词 9：人审核反馈调整</strong></p><p>打开方案文档，先看第 7 节“待审核的关键决策点”，每条给出判断。把所有 review 发现汇总反馈：</p><div class="language-plain vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">plain</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>我审核了方案文档，以下需要调整：</span></span>
<span class="line"><span>- P10 补充细节：用户在版本列表选中两条后，要禁用其他版本的勾选</span></span>
<span class="line"><span>- 影响范围漏了：Spring Security 配置中需要把 GET diff 接口加白名单</span></span>
<span class="line"><span>- 第 7 节决策全部拍板：</span></span>
<span class="line"><span>  - D1 null 视同空字符串</span></span>
<span class="line"><span>  - D2 直接改 props，同步更新调用方</span></span>
<span class="line"><span>  - D3 加 loading 状态</span></span>
<span class="line"><span>  - D4 加 latency 监控</span></span>
<span class="line"><span></span></span>
<span class="line"><span>更新 prompt-version-diff-solution.md。</span></span>
<span class="line"><span>第 7 节决策全部从&quot;待审核&quot;改成最终决策。</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br></div></div><p>跑完场景二，改造方案定稿。<strong>60 分钟</strong>。</p><h2 id="场景三-跑通后端改造" tabindex="-1">场景三：跑通后端改造 <a class="header-anchor" href="#场景三-跑通后端改造" aria-label="Permalink to &quot;场景三：跑通后端改造&quot;">​</a></h2><p>对应 19 讲。产出后端代码 + 测试 + commit。</p><p><strong>提示词 10：锁住改造前的行为</strong></p><div class="language-plain vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">plain</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>我要改造 PromptVersionServiceImpl 复用 getByPromptKeyAndVersion，</span></span>
<span class="line"><span>改之前先用 Characterization Test 锁住该方法现有行为。</span></span>
<span class="line"><span></span></span>
<span class="line"><span>要求：</span></span>
<span class="line"><span>- 不要凭&quot;应该是什么&quot;写断言，凭&quot;实际跑出来是什么&quot;写</span></span>
<span class="line"><span>- 用 Mockito mock PromptVersionMapper，覆盖正常返回 + 版本不存在</span></span>
<span class="line"><span>  抛 StudioException 两种场景</span></span>
<span class="line"><span>- 测试加在 server-start 模块下(实现类在这个模块)</span></span>
<span class="line"><span>  路径：src/test/java/.../admin/service/impl/PromptVersionServiceImplTest.java</span></span>
<span class="line"><span>- 跑通汇报每个测试断言基于的实际值</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br></div></div><p><strong>review 重点（最关键）</strong>：<strong>断言凭“实际”写、测试能跑通</strong>。</p><p><strong>提示词 11：建 DTO（按 P 编号）</strong></p><div class="language-plain vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">plain</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>基于 prompt-version-diff-solution.md 的 P01-P03，建对应的 DTO 类</span></span>
<span class="line"><span>(PromptVersionDiffResult、VersionMeta、DiffItem)。严格按 solution.md 决策，</span></span>
<span class="line"><span>对齐项目现有风格(lombok 注解、字段命名、null 处理)，不要顺手改其他文件。</span></span>
<span class="line"><span>只做这三个 DTO，不要继续做下一批。</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br></div></div><p><strong>review 重点</strong>：字段和 solution.md 对得上、<code>git status</code> 只有新建文件。</p><p><strong>提示词 12：实现 Service</strong></p><div class="language-plain vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">plain</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>基于 prompt-version-diff-solution.md 的 P04-P05，给 PromptVersionService</span></span>
<span class="line"><span>加 diffVersions 方法 + 在 PromptVersionServiceImpl 里实现。</span></span>
<span class="line"><span></span></span>
<span class="line"><span>- 复用 getByPromptKeyAndVersion(影响范围已确认无 metrics 副作用)</span></span>
<span class="line"><span>- 不要重构 getByPromptKeyAndVersion 任何细节，只调用它</span></span>
<span class="line"><span>- null 处理用 a != null ？ a ： &quot;&quot; 后再 Objects.equals 比较(对应 D1 决策)</span></span>
<span class="line"><span>- 异常用 StudioException + INVALID_PARAM / NOT_FOUND 错误码</span></span>
<span class="line"><span></span></span>
<span class="line"><span>跑 mvn test 确认 Step 10 的 Characterization Test 全过(行为不偏移)。</span></span>
<span class="line"><span>失败就 stop，告诉我具体哪个测试。</span></span>
<span class="line"><span>只做 P04-P05，不要做 P06。</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br></div></div><p><strong>review 重点</strong>：没动现有方法、null 处理对、Characterization Test 全过。</p><p><strong>提示词 13：加 Controller</strong></p><div class="language-plain vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">plain</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>基于 prompt-version-diff-solution.md 的 P06，给 PromptController </span></span>
<span class="line"><span>加 GET /api/prompt/version/diff 接口。</span></span>
<span class="line"><span>异常走全局 GlobalExceptionHandler，不要在 Controller 里 try-catch。</span></span>
<span class="line"><span>不要重构 PromptController 现有的其他接口。</span></span>
<span class="line"><span>跑通 mvn test 确认全过。</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br></div></div><p><strong>review 重点</strong>：接口签名对、没重构其他接口。</p><p><strong>提示词 14：补单元测试</strong></p><div class="language-plain vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">plain</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>给 diffVersions 方法补单元测试。测试加在 server-start 模块下：</span></span>
<span class="line"><span>PromptVersionServiceDiffTest.java(如果不存在就新建)。</span></span>
<span class="line"><span>用 @ExtendWith(MockitoExtension.class) + Mockito mock PromptVersionMapper</span></span>
<span class="line"><span>和 PromptMapper(diffVersions 内部调了两个 Mapper，两个都要 mock)。</span></span>
<span class="line"><span></span></span>
<span class="line"><span>覆盖需求文档 prompt-version-diff.md 第 4 节的关键边界：</span></span>
<span class="line"><span>- E01 versionA == versionB → 抛 StudioException(INVALID_PARAM)</span></span>
<span class="line"><span>- E02 versionA 不存在 → 抛 StudioException(NOT_FOUND)</span></span>
<span class="line"><span>- E04 template 为 null → valueA/valueB 返回 &quot;&quot;、changed=false</span></span>
<span class="line"><span>- happy path：两版本 template 不同 → changed=true</span></span>
<span class="line"><span></span></span>
<span class="line"><span>断言凭&quot;实际跑出来是什么&quot;写，不凭&quot;应该是什么&quot;。</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br></div></div><p><strong>review 重点</strong>：断言基于实际行为、边界场景齐全。</p><p><strong>提示词 15：人来 curl 验证 JSON 结构</strong></p><p>启动应用，手动 curl 一下新接口看实际返回的 JSON 结构和 solution.md 接口契约对得上：</p><div class="language-plain vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">plain</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>TOKEN=$(curl -s -X POST http：//localhost：8080/api/account/login \\</span></span>
<span class="line"><span>  -H &quot;Content-Type： application/json&quot; \\</span></span>
<span class="line"><span>  -d &#39;{&quot;username&quot;：&quot;saa&quot;，&quot;password&quot;：&quot;123456&quot;}&#39; | jq -r &#39;.data.access_token&#39;)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>curl -s -H &quot;Authorization： Bearer $TOKEN&quot; \\</span></span>
<span class="line"><span>  &quot;http：//localhost：8080/api/prompt/version/diff？promptKey=xxx&amp;versionA=v1&amp;versionB=v2&quot; \\</span></span>
<span class="line"><span>  | jq .</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br></div></div><p><strong>review 重点</strong>：data 不是 null、嵌套字段都有、字段类型正确。<strong>这一步人来做，AI 报告“接口跑通了”不可信</strong>。</p><p><strong>提示词 16：跑通 mvn test 全套</strong></p><div class="language-plain vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">plain</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>跑完整测试，输出测试结果(通过 / 失败 / 跳过 各多少)。</span></span>
<span class="line"><span>失败的列出来不要试图修。</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br></div></div><p><strong>review 重点</strong>：失败数为 0、Characterization Test 全过、总测试数 = 改造前 + 新增。</p><p>跑完场景三，后端改造收尾。<strong>1-2 小时</strong>。</p><h2 id="场景四-跑通前端改造-资产同步" tabindex="-1">场景四：跑通前端改造 + 资产同步 <a class="header-anchor" href="#场景四-跑通前端改造-资产同步" aria-label="Permalink to &quot;场景四：跑通前端改造 + 资产同步&quot;">​</a></h2><p>对应 20 讲。产出前端代码 + 浏览器跑通 + docs/ 全部更新。</p><p><strong>提示词 17：让 AI 告诉你前端改造在哪里</strong></p><div class="language-plain vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">plain</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>基于 prompt-version-diff-solution.md，告诉我这次改造的前端入口在哪里</span></span>
<span class="line"><span>(菜单路径 + UI 位置)，方便我截图看现状。</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br></div></div><p>照着点一遍，把现状截屏存下来。这是改造前的截图，后面对照用。</p><p><strong>提示词 18：让 AI 概述要改什么 + 改完前端</strong></p><div class="language-plain vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">plain</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>基于 prompt-version-diff-solution.md，简单说一下前端要改哪些点、</span></span>
<span class="line"><span>改完应该是什么效果。</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br></div></div><p>确认效果符合预期，让 AI 直接改完：</p><div class="language-plain vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">plain</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>按上面说的改完前端，对齐项目风格，改完跑前端构建确认无报错。</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br></div></div><p>跑通后 <code>git diff</code> 扫一眼改动范围、构建无报错。</p><p><strong>人来预览</strong>：浏览器重新加载，按改造目标操作一遍。把改造后的状态截屏，对照前面的截图。</p><p><strong>提示词 19：回灌 docs/</strong></p><p>前端跑通后，改造闭环完成。最后一步把这一轮的所有新发现回灌到 docs/：</p><div class="language-plain vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">plain</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>17-20 讲的改造跑完了。把这一轮的所有新发现回灌到 docs/：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>1. docs/api-list.md：把新接口标&quot;已上线&quot;，入参返回校对一遍</span></span>
<span class="line"><span>2. docs/data-model.md：加新增的 DTO(注意嵌套关系)</span></span>
<span class="line"><span>3. docs/requirements/prompt-version-diff.md：补审核新发现的边界</span></span>
<span class="line"><span>4. CLAUDE.md：加项目级新约束(如有)</span></span>
<span class="line"><span>   判断标准：影响所有未来类似改造的写进 CLAUDE.md，</span></span>
<span class="line"><span>   只这一次的特殊处理留在 solution.md</span></span>
<span class="line"><span></span></span>
<span class="line"><span>输出每份文件改动 diff。</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br></div></div><p>跑完场景四，<strong>前端改造收尾 + docs/ 资产被这一轮深度思考反向丰富了一圈</strong>。前端改造 30-40 分钟，文档同步 10 分钟。</p><h2 id="一键跑完整流程-让-claude-code-自主执行" tabindex="-1">一键跑完整流程：让 Claude Code 自主执行 <a class="header-anchor" href="#一键跑完整流程-让-claude-code-自主执行" aria-label="Permalink to &quot;一键跑完整流程：让 Claude Code 自主执行&quot;">​</a></h2><p>前面四个场景一个个跑是为了让你看清每一步的产出和 review 点。真正上手之后，你会希望一次粘贴、Claude Code 自主跑完整流程、关键决策点停下来等你判断。</p><p>下面这段提示词就是干这个的。<strong>整段粘贴到 Claude Code，关键决策点会停下来等你输入</strong>。</p><div class="language-plain vp-adaptive-theme line-numbers-mode"><button title="Copy Code" class="copy"></button><span class="lang">plain</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>我刚拿到一个新需求：[把 leader 的一句话需求填这里]</span></span>
<span class="line"><span></span></span>
<span class="line"><span>完整跑通改造流程，全程自主推进，遇到关键决策点停下来等我，</span></span>
<span class="line"><span>不要每一步都问我。请按以下顺序执行：</span></span>
<span class="line"><span></span></span>
<span class="line"><span>第零步：现状确认(必做，不能跳)</span></span>
<span class="line"><span>- 提醒我打开浏览器、按需求路径点一下产品看现状</span></span>
<span class="line"><span>- 等我确认&quot;功能不存在&quot;才能进下一步</span></span>
<span class="line"><span>- 如果功能已存在，停下来让我重新评估改造方向(新增 vs 重构 vs 优化)</span></span>
<span class="line"><span></span></span>
<span class="line"><span>第一步：拆需求</span></span>
<span class="line"><span>- 读 docs/ + CLAUDE.md + 现有代码</span></span>
<span class="line"><span>- 按六维写需求文档草稿到 docs/requirements/&lt;feature&gt;.md</span></span>
<span class="line"><span>- 列出所有&quot;待产品决策&quot;的边界场景和&quot;不在这次范围里&quot;的候选</span></span>
<span class="line"><span>- 停下来等我反馈业务目标修正、边界场景决策、范围决策</span></span>
<span class="line"><span></span></span>
<span class="line"><span>我反馈完后：</span></span>
<span class="line"><span>- 整理为正式 PRD 文档定稿</span></span>
<span class="line"><span></span></span>
<span class="line"><span>第二步：拆方案</span></span>
<span class="line"><span>- 摸链路(含前端)+ 列改造点 + 画流程图 + 说影响 + 说步骤</span></span>
<span class="line"><span>- 整合成 solution.md，第 7 节&quot;待审核的关键决策点&quot;单独抽出来</span></span>
<span class="line"><span>- 停下来等我审核 solution.md 第 7 节 + 反馈调整</span></span>
<span class="line"><span></span></span>
<span class="line"><span>我反馈完后：</span></span>
<span class="line"><span>- 更新 solution.md 把决策落定</span></span>
<span class="line"><span></span></span>
<span class="line"><span>第三步：后端改造</span></span>
<span class="line"><span>- 锁现有行为 Characterization Test 先跑</span></span>
<span class="line"><span>- 按 P01-P03、P04-P05、P06 三批小步执行，每批跑通后才下一批</span></span>
<span class="line"><span>- 任何 Characterization Test 失败立刻 stop</span></span>
<span class="line"><span>- 补单元测试覆盖关键边界</span></span>
<span class="line"><span>- 跑 mvn test 全套，告诉我总测试数 + 失败数</span></span>
<span class="line"><span></span></span>
<span class="line"><span>第四步：前端改造(先停下来让我截图改造前)</span></span>
<span class="line"><span>- 告诉我前端入口位置(菜单路径)，等我截图改造前</span></span>
<span class="line"><span>- 改完前端，跑构建确认无报错</span></span>
<span class="line"><span>- 等我浏览器验证</span></span>
<span class="line"><span></span></span>
<span class="line"><span>第五步：文档自动更新</span></span>
<span class="line"><span>- api-list.md / data-model.md / requirements/&lt;feature&gt;.md / CLAUDE.md</span></span>
<span class="line"><span>  全部同步更新</span></span>
<span class="line"><span></span></span>
<span class="line"><span>自主原则：</span></span>
<span class="line"><span>- 每步跑完自己 review 输出质量，不合格自己重跑</span></span>
<span class="line"><span>- 失败自己 debug 自己修(除非连续 3 次同一错误)</span></span>
<span class="line"><span>- 测试断言凭实际不凭应该</span></span>
<span class="line"><span>- 不要重构现有方法，只调用</span></span>
<span class="line"><span>- 关键决策点停下来等我，不要替我拍板</span></span>
<span class="line"><span></span></span>
<span class="line"><span>跑完输出 summary.md，列每个产出文件 + 我应该重点 review 的地方。</span></span></code></pre><div class="line-numbers-wrapper" aria-hidden="true"><span class="line-number">1</span><br><span class="line-number">2</span><br><span class="line-number">3</span><br><span class="line-number">4</span><br><span class="line-number">5</span><br><span class="line-number">6</span><br><span class="line-number">7</span><br><span class="line-number">8</span><br><span class="line-number">9</span><br><span class="line-number">10</span><br><span class="line-number">11</span><br><span class="line-number">12</span><br><span class="line-number">13</span><br><span class="line-number">14</span><br><span class="line-number">15</span><br><span class="line-number">16</span><br><span class="line-number">17</span><br><span class="line-number">18</span><br><span class="line-number">19</span><br><span class="line-number">20</span><br><span class="line-number">21</span><br><span class="line-number">22</span><br><span class="line-number">23</span><br><span class="line-number">24</span><br><span class="line-number">25</span><br><span class="line-number">26</span><br><span class="line-number">27</span><br><span class="line-number">28</span><br><span class="line-number">29</span><br><span class="line-number">30</span><br><span class="line-number">31</span><br><span class="line-number">32</span><br><span class="line-number">33</span><br><span class="line-number">34</span><br><span class="line-number">35</span><br><span class="line-number">36</span><br><span class="line-number">37</span><br><span class="line-number">38</span><br><span class="line-number">39</span><br><span class="line-number">40</span><br><span class="line-number">41</span><br><span class="line-number">42</span><br><span class="line-number">43</span><br><span class="line-number">44</span><br><span class="line-number">45</span><br><span class="line-number">46</span><br><span class="line-number">47</span><br><span class="line-number">48</span><br><span class="line-number">49</span><br><span class="line-number">50</span><br><span class="line-number">51</span><br></div></div><p>粘贴完等 Claude Code 跑。整个流程 <strong>3-4 小时</strong>（含你的几次 review）。你不在的时候它在跑，你回来的时候它停在那里等你判断。</p><p>为什么这段提示词这么写？</p><ol><li><strong>第零步“现状确认”摆在第一位且强制等待人确认</strong>。20 讲翻车的教训：跳过这一步可能会让你白跑 4 小时。这一条是这次工作流相比 16 讲护栏脚本最关键的新增。</li><li><strong>关键决策点显式让 AI 停下来</strong>。需求方向、边界决策、范围决策、方案 review、前端截图，这五个决策点 AI 不能替你做，必须停。其他时间它自主跑。</li><li><strong>所有硬约束都明确写进去</strong>。Characterization Test、断言凭实际、不重构现有方法、3 次同错才停。这些约束散落在 17-20 讲，一键流程里要全部明确写出来。</li><li><strong>summary.md 集中暴露 review 点</strong>。AI 不可能完全替你思考，但可以把“我不确定的地方”集中到 summary 让你重点看。</li></ol><h2 id="小结" tabindex="-1">小结 <a class="header-anchor" href="#小结" aria-label="Permalink to &quot;小结&quot;">​</a></h2><p>第四部分到这里结束。从 17 讲拆需求、到 18 讲拆方案、到 19 讲后端改造、到 20 讲前端改造和复盘，整个“老项目改造”的方法论全部跑完。</p><p>第二、三、四部分加起来一句话：<strong>理解了项目（脑图）、跑通了项目（环境）、护住了项目（测试 + CI）、改造了项目（一次完整闭环）</strong>。这四件事做完，你已经具备在任何老项目上独立做改造的能力。</p><p>这次改造还留下了一条最值钱的教训：改造前先点产品看现状，AI 扫代码不能替代。这条教训已经写进 CLAUDE.md，下次类似改造 AI 会主动提醒你做。这一讲开头的“改造前的硬约束”和一键工作流里“第零步现状确认”也是这次教训的产物。</p><p>第五部分，我们会做整个改造的大复盘，把方法论再深一层。</p><h2 id="思考题" tabindex="-1">思考题 <a class="header-anchor" href="#思考题" aria-label="Permalink to &quot;思考题&quot;">​</a></h2><ol><li>跑完整套流程大约花了你多少时间？最卡你的是哪一步：现状确认、拆需求、拆方案、后端改造、还是前端改造？</li><li>这一讲的 19 个提示词 + 一键工作流里，“现状确认”是 20 讲翻车后新加的硬约束。回想你的工作里，有没有类似“踩了一次坑、留下一条规则”的经历？这条规则后来真的避免了再次踩坑吗？</li></ol><p>欢迎在评论区把你的答案写出来。如果今天的课程让你有所收获，也欢迎转发给有需要的朋友，邀请他来一起学习，我们下节课再见！</p>`,114)])])}const m=n(l,[["render",i]]);export{d as __pageData,m as default};
