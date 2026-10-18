# mayu.my 科研主页

正式地址为 https://mayu.my/ 。英文正文、论文作者顺序、Funding 与搜索验证配置沿用既有主页；山景首页整合连续裁切、文字缩放、K线与MA5视觉及导航位置恢复。

## 源码与版本

- 主工作区：`/Users/ma/Documents/projects/mayu-homepage`；预览Worktree：`/Users/ma/Documents/projects/mayu-homepage-release`。
- 部署仓库：`TT2TER/mayu-homepage`；GitHub的 `main` 会触发 Netlify 正式部署。
- `v0.1` 对应已核验的生产源码提交 `156a92f3ecb57f4039ad66a10dce6f1cd25f553c`，已推送标签。
- `design/` 通过Git subtree保留设计仓库的完整历史；包含 `responsive-hero`、`orange-cream-preview` 和原Safari修复。
- 本轮先部署草稿预览；用户最终确认后才推送生产 `main` 并建立 `v1.0` 标签。

## 构建与检索

- `design/site/printed-left.html`、相关CSS与脚本是视觉源码。
- `seo-head.html` 保存生产验证标签、canonical、分享元数据及8个JSON-LD实体。
- `build.mjs` 构建设计入口，将学术正文转换为普通HTML并为其CSS添加作用范围，生成根目录 `index.html` 和 `dist/index.html`。根目录入口为可直接预览的构建结果。
- 6篇论文使用既有锚点，关闭JavaScript时仍能读取正文；Google/百度验证标签、robots与两份sitemap保留。
- `style.css` 保留原公开资源路径。部署资源包含保留Display P3的全尺寸AVIF、渐进JPEG回退、静态首屏与地形纹理。构建时按内容散列命名；浏览器原生picture选择格式，失败时回退。
- 正式构建保留索引策略及原301规则；散列资源缓存一年，HTML每次重新校验。预览构建增加 `X-Robots-Tag: noindex, nofollow`，并将预览的 `/index.html` 跳回当前预览根路径。

```sh
node build.mjs 2>&1 | tee /private/tmp/mayu-production-build.txt
DEPLOY_TARGET=preview node build.mjs 2>&1 | tee /private/tmp/mayu-preview-build.txt
```

## 本地核验

```sh
python3 scripts/check-seo.py 2>&1 | tee /private/tmp/mayu-seo-check.txt
node --test scripts/test-navigation-races.cjs design/site/test-idle-market-sweep.js design/site/test-market-candles.js design/site/test-network.js design/site/test-scene-core.js design/site/test-scene-data.js 2>&1 | tee /private/tmp/mayu-unit-tests.txt
node scripts/check-browser.cjs 2>&1 | tee /private/tmp/mayu-browser-check.txt
node scripts/check-first-frame.cjs 2>&1 | tee /private/tmp/mayu-first-frame-check.txt
node scripts/check-resize.cjs after 2>&1 | tee /private/tmp/mayu-resize-check.txt
node scripts/check-history.cjs after 2>&1 | tee /private/tmp/mayu-history-check.txt
python3 scripts/check-http.py 2>&1 | tee /private/tmp/mayu-preview-http-check.txt
```

浏览器检查使用本机已有Playwright与Chrome，启动时遵循本机沙箱提权规则。`check-seo.py` 针对预览构建检查noindex响应头文件。检索平台的抓取、收录、排名状态继续以平台实际结果为准。

## 核验与交接

本轮证据位于 `reports/v1-preview/`。历史检索配置和平台回执保留于 `SEO.md`、`SEO.html`、`progress.md`；设计历史记录位于 `design/`。触屏交互规则等待后续补充。

## 2026-10-19 加载优化

首屏先显示轻量静态画面，完整画布绘制后接管；图片或Canvas失败时保留静态内容。照片保持2880×2160与原Display P3配置；JPEG回退通过无损渐进编码生成。浏览器正常路径只下载一张完整照片。

验证入口为 `node scripts/check-loading-build.cjs` 和 `node scripts/check-loading.cjs`。后者使用 `scripts/serve-performance.cjs` 提供的本地gzip HTTP对照服务，原版快照与测试结果位于 `reports/performance-20261019/`。浏览器启动沿用本机沙箱提权规则。CLI审查的默认模型被账号拒绝后，已通过会话内独立只读审查。Cloudflare HTML缓存沿用现有配置。详细结果与公网部署验收见该目录的report.md / report.html。
