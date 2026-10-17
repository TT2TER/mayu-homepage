# mayu.my 视觉设计

当前确认基线为 **第十二轮**。正式开发副本位于 `site/`，其源码、照片和构建结果与第十二轮一致。

[打开当前主页](/Users/ma/Documents/projects/mayu-homepage-design/index.html)。首页入口会转到 `site/index.html`。

## 目录

- `site/`：确认版的源码、原照、四套自动检查与单文件构建脚本。
- `qa/`：确认版的测试日志、源码校验清单、整体画面与阴影局部图。
- `progress.md`：本阶段确认记录。
- `PLAN_NEXT.md`：其余页面视觉及首页融合的讨论交接。
- 日期轮次目录：本地历轮预览，保留原文件，作为设计过程参考。

Git 跟踪确认版源码、原照、关键核验材料和交接文档。日期轮次预览及生成的两份单文件 HTML 由 `.gitignore` 管理。

## 构建与检查

在项目根目录运行：

```sh
node site/build-single.mjs 2>&1 | tee /private/tmp/mayu-design-build.txt
node --test site/test-market-candles.js site/test-network.js site/test-scene-core.js site/test-scene-data.js 2>&1 | tee /private/tmp/mayu-design-tests.txt
```

构建生成相同内容的 `site/index.html`、`site/interactive.html`，可直接本地打开。照片、样式和脚本内嵌在单文件中。当前检查为 50 项通过，详见 `qa/approved-tests.txt`。

日期轮次原稿与 `site/` 独立；后续工作以 `site/` 为开发位置。
