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
