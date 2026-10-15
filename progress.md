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

## 2026-10-15 — 百度验证连接错误

- 用户确认 Google 已验证、Bing 导入成功；百度 https://mayu.my/ 报无法连接服务器。
- 标签、正式首页与模拟百度 User-Agent 响应正常；公共 DNS 结果有差异，一组地址 TLS 握手失败，Netlify HTTPS 源站直连成功。
- 原始检查已保存于 qa/baidu-*，完整边界和后续对照步骤见 SEO.md / SEO.html。
- 下一步需要百度重试 / Cloudflare 事件证据，或用户批准的临时 DNS-only 路径对照。

## 2026-10-15 — Google / Bing 真实平台验收

- Google sitemap 已成功处理，发现 1 页；实时测试通过，个人资料结构化数据有效；首页已请求编入索引。
- Bing sitemap 提交成功、正在处理；实时测试通过，SEO/GEO 问题为零；首页已请求编入索引。
- 当前生产提交 `156a92f3ecb57f4039ad66a10dce6f1cd25f553c`，部署 `6acfcfa419176816085ab3f5` ready。
- 原始部署与生产网页证据位于 qa/search-console-final-*；平台回执和截图见本次会话工具记录。完整记录见 SEO.md / SEO.html。
- 用户决定保持 DNS / Cloudflare 原样，百度延后。一次复查任务 mayu-my 定于北京时间 2026-10-16 09:00。
- Google/Bing 实际收录和 Bing sitemap 处理结果待后续平台确认。本轮记录已本地提交。

## 2026-10-15 — GitHub 与博客主页链接

- GitHub 个人资料的网站栏已核验指向 mayu.my。
- TT2TER/TT2TER 的个人 README 新增科研主页链接，提交 `1cac2aad40604982a0b88b26cc59ee2bf72ffa72`；API 回读和 GitHub 渲染页面均确认链接存在。
- 博客源码目录为 /Users/ma/Documents/TT2TER.Github.io，发布来源为 source 分支。导航栏新增“科研主页”，关于页新增“我的科研主页”及说明；提交 `cf6ec95f229adf7555406fbadea520cfd9eb36f4` 已推送。
- npm run build 通过；首页和关于页构建产物含正确链接，截图已检查。线上 https://blog.1314171.xyz/ 与 /about/ 返回 200，均包含新链接。
- 截图副本位于 qa/inbound-blog-nav.png、qa/inbound-blog-about.png。构建日志位于 /tmp/mayu-blog-link-build.log。

## 2026-10-15 — 本轮收尾与博士帽入口验收

- 科研主页完成搜索元数据、规范网址、抓取规则、站点地图及结构化数据；Google/Bing 平台的真实抓取与索引申请已在前条记录验收。实际收录及 Bing sitemap 读取结果待下一轮检查。
- 博客科研主页入口现为导航博士帽、头像下博士帽图标；图标行顺序为博士帽、GitHub、微信、RSS。关于页采用现有简洁图标布局。
- 博客最新发布提交 `91b239f8c6b354f4fb4b58b743cd0c40af7487f1`，Netlify 部署 `6acfd5fadaaf766c5dbc6189` ready。关于页、版本化 CSS、SVG 均返回 200；本地与线上截图已检查图标。
- README 和 PLAN_NEXT 已更新为当前六文件构建、两个仓库的发布分支及百度/Google/Bing 后续检查流程。博客目录新增 README / progress 说明维护入口。
- 本次 wrap-up 文档只本地提交；源码与公开 README 的先前发布已经完成。一次百度复查任务 mayu-my 当前 ACTIVE，安排在北京时间 2026-10-16 09:00。

## 2026-10-15 — 百度普通收录提交成功

- 用户确认百度站点验证已成功。切换普通收录的站点选择器至 https://mayu.my/ 后，手动提交首页 1 条。
- 用户完成滑块验证并确认看到了“提交成功”；页面表单已清空。实际收录与搜索展示待平台处理。
- 百度验证复查任务 mayu-my 已 PAUSED；DNS / Cloudflare 原样。
- 本轮手动提交已完成，API 自动推送尚未配置。详细依据及安全事件记录见 SEO.md / SEO.html 最新条目。
