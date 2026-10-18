# mayu.my 视觉设计

当前响应式 Worktree：`/Users/ma/Documents/projects/mayu-homepage-responsive`，分支：`responsive-hero`。窄屏保留照片上的姓名、介绍与联系方式：先固定左侧连续裁切，750px 以下按固定构图整体缩小。介绍文字采用更缓的缩小速度。核验记录见 `qa/responsive/report.md` 与 `report.html`，首次加载检查见 `qa/responsive/startup-notes.md`。触屏交互规则等待后续补充，当前保持已有交互。

当前确认版为左侧逐行白底介绍：介绍与联系方式整体下移，邮箱及个人链接采用白字与黑色阴影。山景、纯白英文姓名与第十二轮地形阴影延续；K 线支持即时鼠标高亮和静止 1.5 秒后的上、中、下层轮流扫亮。照片与白色正文采用硬边界，照片底部中央的白色箭头可点击进入 About。

- [打开当前主页](/Users/ma/Documents/projects/mayu-homepage-responsive/index.html)
- [打开确认版源页面](/Users/ma/Documents/projects/mayu-homepage-responsive/site/printed-left.html)
- [四个位置方案](/Users/ma/Documents/projects/mayu-homepage-responsive/site/printed-compare.html)
- [六种介绍视觉方案](/Users/ma/Documents/projects/mayu-homepage-responsive/site/intro-six.html)

## 源码与内容

固定开发位置为 `site/`。当前入口源码是 `printed-left.html`，介绍样式在 `printed-variants.css`，页面容器样式在 `printed-shell.css`。`study-j.js` 和 `idle-market-sweep.js` 负责鼠标与自动扫亮；`academic-navigation.js` 负责正文目录跳转与键盘焦点。

About 起的正文格式直接复用现有学术主页 `mayu.my`。原样样式快照为 `mayu-current.css`，隔离后的样式为 `mayu-body-style.css`，各源页面中嵌入开放 Shadow DOM。2026-10-18 的线上样式与 `/Users/ma/Documents/projects/mayu-homepage/style.css` 一致；研究、论文与 Funding 采用现有源码。首页包含身份、研究方向和个人链接，白底 About 保留原文剩余内容。

## 构建与检查

在项目根目录运行：

```sh
node site/build-single.mjs 2>&1 | tee /private/tmp/mayu-design-build.txt
node --test site/test-idle-market-sweep.js site/test-market-candles.js site/test-network.js site/test-scene-core.js site/test-scene-data.js 2>&1 | tee /private/tmp/mayu-design-tests.txt
```

构建生成相同内容的 `site/index.html` 和 `site/interactive.html`，样式与脚本内嵌，照片与地形阴影保存在 `site/assets/`，可直接本地打开，移动页面时需保留资源目录。根目录 `index.html` 转到此构建入口。当前 54 项自动测试通过，最近记录在 `qa/startup/tests.txt`。

最终画面及构建一致性检查在 `qa/final-approved/`。正文与原主页样式逐项比对在 `qa/printed-variants/`，交互检查在 `qa/interaction-j/`。各阶段及 A 至 J 版、六种视觉方案、四个位置方案继续保留，便于回看。日期轮次目录和生成的两份单文件 HTML 由 `.gitignore` 管理。

本仓库保存本地设计、源码、核验材料和确认记录。当前进度见 `progress.md`，后续交接见 `PLAN_NEXT.md`。

启动性能核验见 [报告](qa/startup/report.md) 与 [HTML 版](qa/startup/report.html)。展示照片为保留原图 Display P3 色彩配置的 2880×2160 JPEG，地形阴影使用预生成纹理。修改原照或地形后运行 `python3 site/prepare-startup-assets.py`，再执行常规构建。
