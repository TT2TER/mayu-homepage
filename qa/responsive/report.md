# 首页连续裁切核验

日期：2026-10-18。Worktree：`/Users/ma/Documents/projects/mayu-homepage-responsive`；分支：`responsive-hero`；基础提交：`9e0c50d`。

## 显示规则

- 1440px 及以上沿用当前确认版的照片、姓名、介绍、导航与硬边界。
- 750–1440px：画布保持 1440px 宽，左边缘固定；视窗缩小时逐步裁去右侧。
- 750px 以下：固定展示原构图左侧约 52.08%，整体连续缩小；人物头部与上身保持可见。
- 介绍保持逐行白底黑字，邮箱和个人链接保持白字阴影，始终放在照片上。介绍最小字号为 12px，链接最小字号为 11px；窄屏因换行增加的高度由内容撑开，继续显示照片下部。
- 照片、姓名、石堆遮挡、地形阴影、K 线沿用同一画布。指针坐标继续按画布实际尺寸换算。
- 手机向下箭头放在右下角，给左侧文字与链接留出空间；较宽视窗采用原中央位置。

画布 CSS 宽度：`max(100vw, min(1440px, 192vw))`。显示窗口为实际视窗宽度；这是连续几何规则。照片使用当前保留 Display P3 配置的展示图。

## 实测尺寸

单位均为 CSS px，来自 `checks.json`。

|视窗宽度|画布宽度|首页容器高度|介绍字号|
|---:|---:|---:|---:|
|1440|1440|782.27|20|
|1200|1440|782.27|20|
|768|1440|782.27|20|
|486|933.11|506.91|15.072|
|390|748.80|441.39|13.28|
|320|614.39|388.44|12|

## 缩放细化与重绘核验

缩放阶段设图片比例为 `s = 视窗宽度 / 750`，介绍文字比例为 `0.3 + 0.7s`，最小12px、最大20px。字号为 `clamp(12px, 6px + 1.866667vw, 20px)`。750px、600px、486px、390px、320px 实测字号依次为20、17.2、15.072、13.28、12px。390px下图片为基准的52%，文字为66.4%。白底留边、联系方式字号及间距随之调整。

已有画面在尺寸修改后立即在同一次 ResizeObserver 回调中重绘，再交给下一帧继续动画。首次加载沿用正常动画帧路径，单次初始绘制核验及加载开销见 `startup-notes.md`。`resize-paint.cjs` 在真实浏览器中记录画布尺寸属性写入、照片绘制及回调结束顺序。26次视窗尺寸设置触发24次画布尺寸通知；固定裁切阶段部分视窗变化保持画布尺寸相同。

- 修复前：24次通知结束时，画布均处于已清空、尚待绘制的状态。
- 修复后：24次通知结束时，画布均已绘制，空白间隙计数为0。
- 证据：`resize-paint-before.json`、`resize-paint-after.json`；修复前画布尺寸处理与基础提交 `9e0c50d` 的 `site/study-j.js` 一致。
- `390-before-text-scaling.png`、`486-before-text-scaling.png` 及 `checks-before-refinement.json` 保存第一版结果。当前同名视窗截图与 `checks.json` 为本轮细化后的结果。

## 检查结果

- Chrome 15 组视窗截图：1920×1080、1440×1000、1200×900、1024×768、820×1180、768×1024、750×900、749×900、600×900、486×850、430×932、390×844、360×800、320×640、844×390。
- 各组检查通过：页面宽度、介绍边界、联系方式位于照片内、导航位于视窗内、人物头部位置。截图已人工查看；486px 构图与用户参考图对照。
- 1440×1000 桌面截图与原目录当前构建的截图逐像素相同。
- 源页面和单文件构建在 1440px 与 390px 下截图相同。
- 连续调整宽度后，画布宽度符合公式且左边缘保持 0；介绍可见。
- 390px 下自动扫亮、指针移动打断、键盘箭头跳转及标题焦点通过；减少动态效果通过。
- 390×844、DPR 3、触摸模拟下，指针坐标和触摸跳转通过。
- 54 项既有单元测试通过。浏览器脚本错误为 0。

本轮使用桌面 Chrome 及移动设备模拟。实体折叠屏、iPhone Safari 尚待实机检查；本机缺少 Playwright WebKit 浏览器。本轮将原目录已有的 Safari 导航焦点修复同步到新 Worktree，内容见 `site/academic-navigation.js`。

## 源文件与证据

- `site/responsive-hero.css`：当前选定首页专用响应式规则。
- `site/printed-left.html`：加载上述样式；由原构建脚本内嵌至两个构建入口。
- `checks.json`、`regression.json`：视窗与交互断言结果。
- `check-output.txt`、`regression-output.txt`、`unit-tests.txt`：执行日志。
- `contact-sheet.png`：全部尺寸概览；各尺寸原图位于本目录。
- `report.html`：可视化核验记录；`../../site/index.html`：完整功能预览。

## 复查命令

在新 Worktree 根目录运行；启动 Chrome 的两条命令需按本机规则在获得沙箱提权后执行。

```sh
node site/build-single.mjs 2>&1 | tee /private/tmp/mayu-responsive-build.txt
node qa/responsive/check.cjs 2>&1 | tee /private/tmp/mayu-responsive-check.txt
node qa/responsive/regression.cjs 2>&1 | tee /private/tmp/mayu-responsive-regression.txt
node qa/responsive/resize-paint.cjs after 2>&1 | tee /private/tmp/mayu-responsive-resize.txt
node --test site/test-idle-market-sweep.js site/test-market-candles.js site/test-network.js site/test-scene-core.js site/test-scene-data.js 2>&1 | tee /private/tmp/mayu-responsive-tests.txt
```

下一步：用户查看 486px 与 390px 预览，确认人物保留比例及介绍字号。当前交付为新 Worktree 本地预览。
