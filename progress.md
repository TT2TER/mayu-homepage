# 项目进度

## 2026-10-15 — v0.1 完成与部署验收

### 当前交付

- 工作目录：`/Users/ma/Documents/projects/mayu-homepage`。
- 主地址：https://mayu.my/ 。Netlify 默认地址：https://mayu-homepage.netlify.app/ 。
- 源码仓库：https://github.com/TT2TER/mayu-homepage ，发布分支 `main`。
- Netlify 项目 ID：`4c8c43b4-cb8d-4fb8-8a46-06fde81dc2bd`。
- 网页采用 dythuhu.cn 的简洁单栏文字布局，姓名为 Yu Ma 马煜，其他可见内容为英文。
- 内容包括 About、Research、Publications、Funding；论文共六篇，综述用 Survey 标记，本人姓名加粗，会议与期刊采用 IEEE TVT / IEEE/CIC ICCC 缩写。
- 两篇 TVT 的 arXiv 地址已加入：LGVSC 为 2606.12899；Multimodal Semantic Fusion 为 2502.13838。
- 学校、三位导师、Google Scholar、GitHub、博客链接均已加入。联系区使用学校邮箱。
- Funding 使用用户提供的项目英文名称，角色 Grant Recipient，期限 2024–2026。

### 发布配置与证据

- Netlify 关联 `TT2TER/mayu-homepage`，通过只读部署密钥读取源码，GitHub push webhook 触发构建。构建命令 `node build.mjs`，发布目录 `dist`。
- 自动发布验收：提交 `c8df8256f955c8230f3a90041670fe9e32af42e4` 自动产生部署 `6acfbe3ab5508cfc57f28241`，状态 ready。
- 最新页面修改：提交 `873e74d888089e8c09195908f81c0e603b087db9` 自动产生部署 `6acfc27a3cf80d991aeaa698`，状态 ready；已从 mayu.my 返回的 HTML 核验两个新增 arXiv 链接。
- Powered by Netlify 官方开关已关闭；公开页面未注入徽标脚本。
- QA 图片保存在本地 `qa/`，不纳入版本控制。`dist/` 和 `.netlify/` 同样忽略。
- 既有 TT2TER.github.io 网站继续使用原有配置。本科研主页由 Netlify 托管。

### DNS / HTTPS 最终检查

- 域名在 Porkbun 注册，公开权威 NS 已由独立 DNS-over-HTTPS 查询确认属于 Cloudflare。本机 DNS 曾返回旧 NS，后续域名检查优先结合独立查询。
- mayu.my 与 www.mayu.my 均返回 Cloudflare 代理地址。橙云隐藏实际 CNAME 目标，公共 DNS 查询不能完整审计 Cloudflare 控制台中的目标值。
- Netlify 主域名为 mayu.my。用户设置的根域名目标为 apex-loadbalancer.netlify.com，www 目标为 mayu-homepage.netlify.app。
- Netlify 证书最终状态 issued，覆盖 mayu.my、www.mayu.my；当次到期时间为 2027-01-13 00:59:17（北京时间）。证书时间为本次检查快照，后续应重新查询。
- 绕过本机代理，直接连接 Netlify 并使用各自域名校验证书：mayu.my 返回 200；www.mayu.my 返回 301，Location 为 https://mayu.my/ 。
- 通过 Cloudflare 的两个 HTTPS 地址均通过证书校验；根域名正常提供网页，HTTPS www 跳转到根域名。
- HTTP 根域名升级到 HTTPS。排除本机代理后的 HTTP www 完整链为：http://www.mayu.my/ → https://www.mayu.my/ → https://mayu.my/ → 200。
- Cloudflare 控制台中的 SSL/TLS 模式未读取；上述结果证明访客端证书与源站域名证书均通过独立校验。

### 后续维护

- v0.1 请求已完成。后续可按用户需求添加照片、项目展示、动画或主题设计。
- 开始下一次源码修改前先拉取远程 main，避免覆盖用户通过 GitHub 网页提交的内容。
- 本次 wrap-up 仅本地提交文档。后续推送会自动触发 Netlify 构建。

### 参考文档

- Netlify DNS：https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/
- Netlify 根域名与 www 跳转：https://docs.netlify.com/manage/domains/manage-domains/manage-multiple-domains/
- Cloudflare 根域名 CNAME flattening：https://developers.cloudflare.com/dns/cname-flattening/set-up-cname-flattening/

## 2026-10-15 — SEO 配置发布

- SEO 提交 `43839756ea95f17fb13393e740770675232aecec` 已推送至 main，Netlify 部署 `6acfc61c6d2b65496d29f38a` 为 ready。
- 已加入 canonical、姓名与研究方向元数据、学者及六篇论文 JSON-LD、论文锚点、robots.txt 与 sitemap.xml，并更新构建复制列表。
- 线上三类资源返回 200，八种搜索爬虫 User-Agent 请求返回包含 JSON-LD 的主页；这些检查使用本次环境的网络出口。
- 桌面截图与 390px 手机视口截图已人工检查；手机 innerWidth / scrollWidth 均为 390。
- 用户确认三个站长平台均尚未验证。下一步：用户登录平台取得 HTML 验证标签；加入首页并部署，再完成平台验证、sitemap 提交与抓取诊断。
- 完整设置与验收记录见 SEO.md / SEO.html，原始部署状态、线上抓取和截图位于忽略目录 qa/。
- 本次文档提交在本地保留，网站 SEO 代码已同步远程。

## 2026-10-15 — Google SEO 入门指南改进

- 发布提交 `4b6a1f814a019ddbf994a3a95a5e64d8a0c00c86`，部署 `6acfc7c13cf80d991aec86ad` ready。
- 重复生产入口已 301 统一；六篇论文标题可直接访问论文；资源链接和结构化身份信息已完善。
- 九项线上响应检查通过，桌面与 390px 手机截图已检查。详情见 SEO.md / SEO.html，原始证据位于 qa/seo-guide-*。
- 当前站长平台验证等待用户账户生成的验证标签。本轮验收文档已本地提交。

## 2026-10-15 — Google / 百度验证标签发布

- Google 与百度验证标签均已在生产首页 head 中核验。平台验证待用户点击确认。
- 最新网站提交 `858bdec56c691fb6554bfd09d720ec1e70b416ad`；Netlify 部署 `6acfcb1d043a65b501f2c8a8` ready。
- 新增百度专用 sitemap-baidu.xml，以 pc,mobile 标明同一网址的自适应页面；标准 sitemap 继续供 Google 使用。两个 XML 返回 200 且带 ETag。
- 用户决定先配置 Google、百度，Bing 后续从 Google 导入。操作步骤与来源见 SEO.md / SEO.html；生产检查证据位于 qa/baidu-*。
- 本轮验证与提交说明在本地提交。
