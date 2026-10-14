# mayu.my 搜索优化与站长平台设置

日期：2026-10-15（北京时间）。生产网站：https://mayu.my/ 。

## 已上线的网站配置

- 标题包含 Yu Ma、马煜、AI for Finance 和 Semantic Communication；描述包含学校和研究方向。
- canonical 固定为 https://mayu.my/，统一页面身份。
- 添加 robots 索引与摘要许可、Open Graph 和 Twitter 分享元数据。
- JSON-LD 包含 Person、ProfilePage 和六篇 ScholarlyArticle；姓名、学校、研究方向、作者和外部链接依据主页既有内容。论文年份和出版状态沿用现有显示文字。
- 六篇论文有稳定锚点，例如 https://mayu.my/#m3-market-microstructure 和 https://mayu.my/#lgvsc 。锚点指向同一页面的不同位置，sitemap 只列首页这一个独立页面。
- https://mayu.my/robots.txt 允许公共内容抓取，并公布 sitemap 地址。
- https://mayu.my/sitemap.xml 列出正式 HTTPS 首页。构建脚本复制以上文件进入 dist。
- 可见正文、英文页面语言和样式保持原样。

## 验证证据

SEO 提交：43839756ea95f17fb13393e740770675232aecec。
Netlify 部署：6acfc61c6d2b65496d29f38a；状态 ready；commit_ref 与 SEO 提交一致。

本地执行 `node build.mjs` 和 `git diff --check` 通过。检查确认：八个结构化实体、六个唯一论文锚点、XML 可解析、四个构建文件与源文件一致，页面可见正文保持原样。

线上首页返回 200 / text/html，robots 返回 200 / text/plain，sitemap 返回 200 / application/xml。线上 HTML 实际含 canonical 与 JSON-LD。以 Googlebot、Baiduspider、bingbot、OAI-SearchBot、PerplexityBot、Claude-SearchBot、360Spider 和 Sogou web spider 作为 User-Agent 的请求均返回 200 且包含结构化数据。这些请求来自本次检查环境；真实搜索引擎来源 IP 的 WAF 处理与收录状态需结合平台抓取诊断、访问日志核验。

本地证据位于 qa/seo-deploy-status.json、qa/seo-live-checks.json、qa/seo-live-index.html、qa/seo-live-robots.txt、qa/seo-live-sitemap.xml。布局截图为 qa/seo-desktop.png、qa/seo-mobile.png。qa/ 为忽略目录。

## 当前待完成事项

用户确认：Google Search Console、Bing Webmaster Tools 和百度搜索资源平台均尚未验证。网站配置已经发布；平台账户验证、主动提交、实际收录和排名效果待确认。

### 1. Google

入口：https://search.google.com/search-console/ 。

快捷方式：添加“网址前缀”资源，输入 https://mayu.my/，选择“HTML 标记”，取得平台生成的 google-site-verification 标签。将完整标签交给维护者放入 index.html 的 head，部署后点击“验证”。

如希望统一管理 http/https 和子域名，可改选“网域”资源，输入 mayu.my，并在 Cloudflare DNS 添加平台指定的 TXT 记录。验证通过后保留记录。

在 Sitemaps 页面提交 https://mayu.my/sitemap.xml；在网址检查中检查 https://mayu.my/，必要时请求编入索引。验收以平台的实时测试和页面索引状态为准。

### 2. Bing / Copilot

入口：https://www.bing.com/webmasters/ 。

添加 https://mayu.my/；可在完成 Google 验证后选择从 Search Console 导入，或选择 HTML meta 标记验证。验证成功后确认 sitemap 已存在，否则提交 https://mayu.my/sitemap.xml；使用 URL Inspection 检查首页。后续结合平台提供的搜索表现和 AI 引用数据观察效果，以账户实际可用功能为准。

### 3. 百度

入口：https://ziyuan.baidu.com/ 。

登录并添加 https://mayu.my/，选择平台提供的 HTML 标签或文件验证。标签验证可由维护者写入首页；文件验证需要同时确保 build.mjs 将验证文件发布至 dist 根目录。取得平台生成的内容后再配置。

验证通过后，在“普通收录”使用当前账号提供的链接提交方式提交 https://mayu.my/；若 sitemap 提交功能可用，提交 https://mayu.my/sitemap.xml。功能与额度按账户实际页面为准。使用 robots 检查、抓取诊断和索引数据确认结果。

### 4. 其他搜索与 AI 助手

通用 robots 规则允许其他合规搜索爬虫访问；主流搜索与 AI 搜索共同依赖可访问正文、稳定网址和可信的学术身份信息。ChatGPT 搜索使用 OAI-SearchBot；Perplexity 使用 PerplexityBot；Claude 有 Claude-SearchBot。Google 的 AI 搜索功能沿用基本 SEO 要求。不同助手的数据来源和展示机制分别由平台决定。

后续如平台抓取诊断显示 Cloudflare 拦截，需要结合真实爬虫 IP 和访问日志确定具体规则，再调整相应 CDN 配置。仅修改 User-Agent 的测试用于发现部分响应差异。

## 学术身份与后续维护

建议用户将 mayu.my 添加为 Google Scholar 的主页，并在 GitHub 个人资料、学校或学院个人资料、博客中链接到同一正式地址。真实身份页面之间的链接有助于访客与检索系统辨认同一位作者。新增资料应与本人研究和论文相符。

后续如希望重点提升中文研究方向检索，可增加独立的中文简介页面，保留当前英文主页，并设置语言对应关系；中文内容需由用户确认。新增论文时同时维护可见列表、锚点与 JSON-LD。

效果观测建议使用“Yu Ma”“马煜”“Yu Ma market microstructure”“马煜 语义通信”等查询，并以站长平台的索引、展示、点击与引用数据为主要证据。收录、排名和 AI 引用由平台评估，需在部署后持续观察。

## 官方参考

- Google AI 搜索与 SEO：https://developers.google.com/search/docs/appearance/ai-features
- Google 所有权验证：https://support.google.com/webmasters/answer/9008080?hl=zh-Hans
- Bing 站点验证：https://www.bing.com/webmasters/help/add-and-verify-site-12184f8b
- 百度普通收录：https://ziyuan.baidu.com/linksubmit/index
- OpenAI 爬虫：https://developers.openai.com/api/docs/bots
- Perplexity 爬虫：https://docs.perplexity.ai/docs/resources/perplexity-crawlers
- Anthropic 爬虫：https://privacy.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler

## 2026-10-15 — 按 Google SEO 入门指南复查与改进

本轮依据：https://developers.google.com/search/docs/fundamentals/seo-starter-guide?hl=zh-cn 。结合当前单页科研主页，重点落实网址统一、清楚的链接文字和可访问资源，并检查既有标题、摘要、结构化数据、站点地图和内容结构。

### 本轮新增

- 网址统一：/index.html 和 mayu-homepage.netlify.app 的生产入口使用 301 跳转至 mayu.my；资源路径保持对应关系。www 已有跳转继续有效。
- 描述性链接：六篇论文的完整标题直接链接至论文页面；资源文字使用 arXiv preprint、Publisher page、Source code、Model weights，辅助标签包含对应论文标题。
- 身份数据：Person 的别名采用主页可见的中文姓名；ScholarlyArticle 的 sameAs 采用论文的其他版本链接，代码和模型作为页面资源链接提供。
- 构建新增 _redirects；当前构建复制五个文件。研究介绍、论文作者、出版信息和英文页面语言沿用既有内容。

### 本轮验收

源码提交：4b6a1f814a019ddbf994a3a95a5e64d8a0c00c86。Netlify 部署：6acfc7c13cf80d991aec86ad，状态 ready，commit_ref 一致。前一轮本地说明提交随本轮推送同步到 GitHub。

实际检查：正式首页、CSS、robots、sitemap 返回 200；/index.html、Netlify 默认域名首页和其 CSS 入口返回正确的 301；www 返回正确的 301；不存在的地址返回 404。线上首页包含六个完整论文标题链接及描述性资源标签。证据：qa/seo-guide-deploy-status.json 和 qa/seo-guide-live-checks.json。

已检查 qa/seo-guide-desktop.png 与 qa/seo-guide-mobile.png。桌面视口及页面宽度均为 1440px；手机视口及页面宽度均为 390px，论文标题与资源链接排版正常。

### 后续工作

三个站长平台的所有权验证与主动提交仍待用户取得账户专属验证标签。随后通过平台实时抓取诊断与索引状态确认实际搜索引擎访问。建议维护 Google Scholar、GitHub 和学校资料中的正式主页链接；内容扩充优先采用经过论文原文核验、能帮助访客理解研究的介绍。

## 2026-10-15 — Google / 百度验证配置与普通收录准备

当前生产提交：858bdec56c691fb6554bfd09d720ec1e70b416ad；Netlify 部署 6acfcb1d043a65b501f2c8a8，状态 ready，commit_ref 一致。Google 验证标签于提交 354ffa9fe4dd68f1753d08e68ce6f021c9fed75f 发布，百度验证标签于当前提交发布；两个标签在生产首页 head 中各出现一次。平台上的验证结果待用户点击验证后确认。

用户选定顺序：先配置 Google 和百度，随后由 Bing 导入 Google 站点。

百度参考页面：https://ziyuan.baidu.com/college/courseinfo?id=267&page=2 。该页主题为普通收录，正文通过 curl 获取；网页检索工具遇到重定向循环。页面展示的章节更新时间为 2020-08-14，实际可用提交方式与额度应按登录后的平台页面确认。

新增 https://mayu.my/sitemap-baidu.xml，使用百度文档定义的 mobile 命名空间和 type="pc,mobile"，声明首页采用桌面 / 手机共用的自适应页面。标准 https://mayu.my/sitemap.xml 继续供 Google 使用。两个 sitemap 都只包含正式首页这个独立网址，返回 200 / application/xml，并带有 ETag。build.mjs 当前复制六个文件。

本地构建与精确标签 / XML 检查通过。生产首页、标准 sitemap、百度 sitemap、robots 使用 Baiduspider User-Agent 检查均返回 200。此检查使用本次环境网络出口，真实百度爬虫访问仍需平台抓取诊断确认。证据位于 qa/baidu-verification-build.log、qa/baidu-verification-deploy.json、qa/baidu-live-checks.json。

### 验证后的提交步骤

1. Google Search Console 点击验证，随后提交 https://mayu.my/sitemap.xml，并用网址检查工具检查正式首页。
2. 百度搜索资源平台点击验证。在普通收录的手动提交入口提交 https://mayu.my/。如果账号提供 sitemap 提交功能，提交 https://mayu.my/sitemap-baidu.xml；按页面要求选择 URL 列表和合适的抓取周期。
3. Bing 后续使用用户选定的 Google 导入方式，并确认站点地图已导入。

当前单页主页采用一次首页提交与 sitemap 发现方式。后续新增独立页面时更新 sitemap；API 推送可在取得平台额度及安全配置推送凭据后设置。百度验证 meta 标签与 API 推送凭据用途不同；后者应存入本地凭据文件或托管平台的秘密变量。平台返回的提交数量与实际收录数量分别记录，实际收录以索引数据为准。
