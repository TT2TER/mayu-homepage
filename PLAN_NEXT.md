# 下一轮交接

## 起点

先读 README.md、progress.md 和 SEO.md 的最新记录。本目录为 /Users/ma/Documents/projects/mayu-homepage；关联博客目录为 /Users/ma/Documents/TT2TER.Github.io。

当前网站源码已发布；收尾文档提交保留在本地。开始工作时检查 git status、git log 和远程分支关系，再决定是否快进更新。

## 第一优先：百度复查

用户决定保持 DNS 与 Cloudflare 代理原样，待解析稳定后再验证。已有一次自动复查任务 mayu-my，安排在北京时间 2026-10-16 09:00；先查看任务状态与最新项目记录，复用已有任务。

1. 检查 https://mayu.my/ 的 HTTP 状态、HTTPS 与百度验证标签。
2. 比较阿里、DNSPod、Google、Cloudflare 公共解析；必要时指定解析地址对照 TLS，保留域名 SNI 和证书校验。
3. 打开已有百度账号的 https://mayu.my/ HTML 标签验证，重试一次并保存准确结果。遇到登录或验证码时交接用户。
4. 成功后按账号可用功能提交首页及 https://mayu.my/sitemap-baidu.xml；保存提交回执。
5. 若仍有连接错误，结合新 DNS 与 Cloudflare 安全事件证据诊断。DNS/CDN 配置变更需先取得用户确认。

验收：平台明确显示验证成功，或保存新故障证据与具体所需用户操作。不同检查出口的访问结果分别记录。

## 第二优先：Google / Bing 处理状态

- Google 已成功处理 sitemap，发现 1 页；实时测试确认首页可索引、个人资料结构化数据有效；索引申请已接收。
- Bing sitemap 已提交、当次为 Processing；实时测试确认首页可索引、SEO/GEO 问题为零；索引申请已接收。
- 下一轮查看实际索引状态、Bing sitemap 读取结果和平台新增错误。已有申请保持等待，出现新问题再处理。

验收：区分平台已接收申请、实时抓取通过、已编入索引与搜索展示；按当前平台证据报告。

## 博客维护

博士帽入口在博客 source 分支的 _config.fluid.yml；SVG 为 source/img/graduation-cap.svg，CSS 位于 source/css/custom.css。关于页正文保持当前简洁布局。

构建使用既有依赖：

```sh
npm run build 2>&1 | tee build.log
```

构建后截图检查、按请求推送 source，再核对 Netlify ready、commit_ref 与正式网页。更新自定义 CSS 时同步更换 custom_css 的版本参数。源码发布使用 GitHub source → Netlify 的现有流程。

## 证据位置

- 科研主页历史证据：qa/seo-*、qa/baidu-*、qa/search-console-final-*。
- 博客入口与图标截图：qa/inbound-blog-*、qa/blog-cap-*。
- GitHub/博客部署提交与回执：progress.md 最新条目。
