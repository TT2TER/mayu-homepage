# 下一轮交接

## 起点

先读 README.md、progress.md 和 SEO.md 的最新记录。本目录为 /Users/ma/Documents/projects/mayu-homepage；关联博客目录为 /Users/ma/Documents/TT2TER.Github.io。

当前网站源码已发布；收尾文档提交保留在本地。开始工作时检查 git status、git log 和远程分支关系，再决定是否快进更新。

## 第一优先：百度抓取与实际收录

用户已确认百度验证成功，普通收录已手动提交 https://mayu.my/ 共 1 条；用户完成滑块验证并确认“提交成功”提示。原验证复查任务 mayu-my 已 PAUSED，当前 DNS / Cloudflare 配置保持原样。

1. 查看百度普通收录的数据反馈、抓取诊断和索引量；按平台最新数据区分提交、抓取、索引与展示。
2. 当前首页已经提交，等待平台处理；新增独立页面或重要更新时再按账号额度通知百度。
3. sitemap 可使用 https://mayu.my/sitemap-baidu.xml，通过账号实际提供的专门入口提交。
4. API 自动推送尚未配置。如后续启用，凭据通过本地凭据文件或平台秘密变量保存；检查网页输出时隐藏接口密钥，采用 HTTPS 传输。
5. 参考 SEO.md 最新安全记录，提醒用户重置曾进入工具记录的博客推送密钥；保留此前成功的站点验证标签。

验收：保存平台的抓取或索引结果及来源；网页手动提交的成功记录与实际收录分别报告。

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
