# 把 GitHub Pages 从部署链路摘掉 · 迁移预案

> 状态：**预案，未执行**。本文件与 `deploy-templates/` 下的 workflow 模板只做交付，不创建外部账号、不改线上域名、不替换现有 `deploy.yml`。
> 触发条件：P1 的变更数趋势确认「每次部署仍接近 1500 文件」，且决定不再投入修构建确定性（跳过 P2）。

---

## 一、要解决的到底是什么

GitHub Actions 侧的构建、测试、增量判定都没问题，卡点在 **Pages 后端同步**：`syncing_files` 间歇性挂起，10 分钟是服务端硬超时，仓库侧无法根治。现在 `dd807d3` 用 4 轮自动重触发把人工干预降到 0，但每次仍要向后端推全站内容。

迁移后的链路：

```
push main → Actions 只构建 dist → 平台 CLI 直接上传 dist → 平台边缘网络
                    （不再有 gh-pages 分支、不再有 Pages 后端同步）
```

构建产物哈希抖动在 Pages 链路上会级联 1498 个 HTML 重写；换托管后这个假设整体作废，抖动最多影响 CDN 缓存命中，不影响交付。

---

## 二、两条路线对比

| 项 | Cloudflare Pages | 腾讯云 EdgeOne Pages |
| --- | --- | --- |
| 部署命令 | `wrangler pages deploy dist --project-name=<name>` | `npx edgeone pages deploy ./dist -n <name> -t <token>` |
| GitHub Secrets | `CLOUDFLARE_API_TOKEN`、`CLOUDFLARE_ACCOUNT_ID`（2 个） | `EDGEONE_API_TOKEN`（1 个） |
| 项目创建 | **需预先创建** Direct Upload 项目，否则 CI 报 `Project not found` | 项目不存在时自动创建 |
| Token 权限 | 自定义 Token，仅 `Account · Cloudflare Pages · Edit`，限定单账号 | 控制台生成 API Token |
| 国内访问（北京） | 不稳定，边缘节点在境外 | 优先，国内节点 |
| 自定义域名 / 备案 | 自定义域名不需备案（境外）；国内访问体验仍受链路影响 | 国内 CDN 自定义域名**多半要备案** |
| 回滚 | Pages 项目 → Deployments → Rollback，即时生效 | 控制台回滚到历史部署 |
| 官方文档 | https://developers.cloudflare.com/pages/how-to/use-direct-upload-with-continuous-integration/ | https://pages.edgeone.ai/zh/document/use-github-actions |

**建议**：先用 Cloudflare Pages 做**并行验证**（零备案成本、最快跑通链路），确认构建与上传无误后，再按国内实测访问速度决定是否落到 EdgeOne。不要一次同时改域名和平台。

---

## 三、切换检查表

- [ ] 平台账号、API Token 已创建，GitHub 仓库 Secrets 已写入
- [ ] Cloudflare 路线：Direct Upload 项目已用 `npx wrangler pages project create <name> --production-branch=main` 创建
- [ ] **确认 `base` 路径**：当前站点是 `https://craftr-x.github.io/ReadBooks/`，`vite` base 为 `/ReadBooks/`。换到平台二级域名时若根目录提供服务，需把 `base` 改为 `/` 并重新构建；否则保留 `/ReadBooks/` 并配置对应路径
- [ ] 首页、随机 3 本书的章节页、图片、`sitemap.xml`、`robots.txt`、搜索索引 chunk 均返回 200
- [ ] 站点内搜索功能实测可用（32.5 MB 索引的加载与解析）
- [ ] 旧链接方案：原 Pages 地址是保留跳转、还是 301 到新域名；`og:url` / canonical / sitemap 中的绝对 URL 是否要改
- [ ] DNS 与证书：自定义域名解析、HTTPS 证书、备案（如走国内 CDN）
- [ ] 并行观察期：新旧链路同时可用至少一次完整发布周期
- [ ] 下线：仓库 Settings → Pages 关闭或改为其它来源；停用旧 `deploy.yml`；保留 `gh-pages` 分支作为回滚备份
- [ ] 回滚开关：新 workflow 失败时，把 `deploy.yml` 恢复即可退回 Pages 链路

---

## 四、切换步骤（分阶段，不要一步到位）

1. **并行期**：保留现有 `deploy.yml` 不动，把模板之一另存为 `.github/workflows/deploy-alt.yml`，只在 `workflow_dispatch` 触发，手动跑一次验证产物上传。
2. **验证期**：按检查表逐项验收，重点看 `base` 路径与站内搜索。
3. **切换期**：把新 workflow 改为 `push: branches: [main]` 触发，旧 `deploy.yml` 改名或移除触发条件。
4. **收尾**：DNS 切换、旧地址 301、关闭 Pages 服务、更新 README 中的站点链接。
5. **观察**：连续 3 次 push 发布成功、访问速度符合预期后再清理 `gh-pages` 分支。

---

## 五、明确不做的事

- 不擅自创建外部托管账号、不生成或写入真实 Token。
- 不替换现有 `.github/workflows/deploy.yml`。
- 不修改 `docs/.vitepress/config.mts` 的 `base`，除非用户确认新域名的路径结构。
- 不在本轮切换线上域名或做 DNS 变更。

模板文件：`deploy-templates/cloudflare-pages.yml`、`deploy-templates/edgeone-pages.yml`（均为 `.yml` 后缀的模板，放入 `.github/workflows/` 前需按检查表改项目名与触发条件；当前放在模板目录，不会被 Actions 加载）。
