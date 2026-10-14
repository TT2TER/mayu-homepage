# mayu.my 科研主页

Yu Ma（马煜）的静态科研主页：https://mayu.my/ 。正文为英文，姓名为中英文；包含 About、Research、Publications 和 Funding。

## 源码与发布

- 本地目录：`/Users/ma/Documents/projects/mayu-homepage`。
- GitHub：https://github.com/TT2TER/mayu-homepage ，源码分支 `main`。
- Netlify 监听 GitHub 的 main，推送后自动执行 `node build.mjs`，发布 `dist/`。
- 主域名 mayu.my；Cloudflare 管理 DNS 和代理，Netlify 托管网站与源站 HTTPS。www、/index.html 和 Netlify 默认生产域名跳转到正式主页。
- `dist/`、`qa/`、`.netlify/` 为本地构建、证据及工具状态目录，已忽略。

## 文件

- `index.html`：可见内容、Google/百度验证标签、分享信息、JSON-LD。
- `style.css`：主页排版与响应式样式。
- `robots.txt`：公开抓取规则和标准站点地图地址。
- `sitemap.xml`：标准站点地图。
- `sitemap-baidu.xml`：百度自适应页面标记 `pc,mobile`。
- `_redirects`：重复入口的 301 规则。
- `build.mjs`：将以上六个网站文件复制到 dist。
- `netlify.toml`：构建与发布配置。
- `SEO.md` / `SEO.html`：搜索优化、平台操作和验收记录。
- `progress.md`：按时间记录部署回执与未完成事项。
- `PLAN_NEXT.md`：下一轮执行交接。

## 内容维护

论文保留完整作者顺序并加粗 Yu Ma，期刊与会议使用既有正式缩写，综述标记 Survey。Funding 使用用户提供的 Qiyan 项目名称、Grant Recipient 和 2024–2026。研究介绍保持适合公开主页的宽泛表述。

新增论文时同时维护可见列表、唯一锚点和 ScholarlyArticle 数据。ProfilePage 的 mainEntity 指向本人 Person；作品通过 hasPart 引用，其 url 指向论文来源。Google/Bing 验证与收录状态以平台最新结果为准。

## 常用检查

开始编辑前检查工作区和远程分支，保留用户通过 GitHub 网页提交的更改。构建命令：

```sh
node build.mjs 2>&1 | tee build.log
```

发布后核验 Netlify 的 ready 状态、commit_ref 和线上实际内容；涉及视觉修改时截图检查。DNS/TLS 检查使用 curl -q，必要时用 --noproxy '*' 对照，保持证书校验。

## 关联入口

- GitHub 个人 README：https://github.com/TT2TER/TT2TER/blob/main/README.md 。
- 博客：https://blog.1314171.xyz/ ，源码位于 `/Users/ma/Documents/TT2TER.Github.io`；仓库 TT2TER/TT2TER.Github.io 的 `source` 分支触发独立 Netlify 部署。
- 博客导航和关于页使用博士帽链接到 mayu.my；维护方法见博客目录的 README.md。
