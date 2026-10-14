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
