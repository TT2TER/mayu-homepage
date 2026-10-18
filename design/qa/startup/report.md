# 首页启动速度优化核验

2026-10-18。对象：`site/printed-left.html` 及其构建入口 `site/index.html`、`site/interactive.html`。

## 实测结果

| 项目 | 优化前 | 优化后 | 降幅 |
|---|---:|---:|---:|
| 完整山景首帧，中位数 | 371.9 ms | 139.3 ms | 62.5% |
| DOMContentLoaded，中位数 | 177.5 ms | 51.1 ms | — |
| HTML 与必要图片总量，十进制 MB | 10.47 | 2.85 | 72.8% |

每版 5 次，本机 Chrome 无头浏览器，1440×1000、DPR 1；每次新建浏览器上下文，系统文件缓存保持热缓存。首帧时间取 Canvas 首次设置 `data-rendered=true` 的观察时间。该数字描述本地完整山景绘制，线上网速及 Safari 启动耗时需另行测量。首次文本绘制不是完整山景首帧。

优化前首帧样本：413.4, 369.9, 371.4, 371.9, 371.9 ms。
优化后首帧样本：147.9, 134.3, 139.3, 141.9, 132.9 ms。
本次修复后 5 次各记录到一项 50–53 ms 的启动长任务。原始数据为 `before.json`、`after-color-fix.json`，汇总为 `summary.json`。

## 实现与维护

- 展示照片保留原照的 Display P3 ICC 配置，已验证 536 字节配置与原照一致。橙色衣物区域在统一 sRGB 空间比较，相对等尺寸原图的平均 RGB 绝对误差由 12.57 降至 2.76；范围、样本数及方法见 `../quality-comparison/color-profile-check.json`。
- 当前确认版通过 `data-photo` 选择 2880×2160、JPEG quality 90 的展示照片；原照保存在 `site/assets/mountain-original.jpg`。照片从 HTML 中独立出来，浏览器可以单独缓存，文档无需解析原照 Base64。
- 照片在文档头部预加载，采用高加载优先级。Canvas 继续使用原有 4032×3024 坐标，山景裁切、姓名、石堆遮挡及交互几何保持原有设置。展示照片使用有损压缩，已检查桌面、窄屏和 Safari 实际画面。
- 地形深度阴影从现有几何预生成 `scene-depth.png`，首帧读取纹理；加载失败时自动回退到实时计算。浏览器核对预生成版本与实时版本截图逐字节一致。
- `build-single.mjs` 内嵌样式和脚本，保留图片资源引用。使用时应保留 `site/assets/` 目录。源码页面与构建页面截图完全一致。
- 修改原照或地形几何后，先执行 `python3 site/prepare-startup-assets.py 2>&1 | tee /private/tmp/mayu-startup-assets.txt`，再执行 `node site/build-single.mjs 2>&1 | tee /private/tmp/mayu-startup-build.txt`。资源生成需要已有 Python/Pillow 与 Node；常规构建只用 Node。

## 验证证据

- 54 项既有测试通过：`tests.txt`。
- 源码与构建一致性、桌面/窄屏样式、箭头导航、零脚本错误：`checks.json`、`browser-checks-color-fix.txt`。
- 自动扫亮、鼠标中断、离屏停止、reduced-motion 和阴影等价性：`interaction.json`。
- 优化前后首屏：`before.png`、`after.png`；最终完整桌面与窄屏：`built-desktop.png`、`mobile.png`。已人工查看。
- Safari 使用当前文件页面原生刷新并检查山景、姓名、石堆遮挡、投影和介绍文字，截图在本轮工具记录。

## 复现命令

在项目根目录运行，浏览器脚本使用仓库既有的本机 Playwright 路径：

```sh
node qa/startup/measure.cjs file:///Users/ma/Documents/projects/mayu-homepage-design/site/index.html qa/startup/recheck 2>&1 | tee /private/tmp/mayu-startup-measure.txt
node qa/startup/verify-layout.cjs 2>&1 | tee /private/tmp/mayu-startup-layout.txt
node qa/startup/verify-interaction.cjs 2>&1 | tee /private/tmp/mayu-startup-interaction.txt
node --test site/test-idle-market-sweep.js site/test-market-candles.js site/test-network.js site/test-scene-core.js site/test-scene-data.js 2>&1 | tee /private/tmp/mayu-startup-tests.txt
```

交付为本地设计源码和构建入口。后续如部署线上，可在实际网络下测量首次访问与缓存访问；发布依照项目现有约定处理。
