# 手机字体修复验收（2026-10-19）

正式入口使用内嵌的 Yu Ma 透明字形素材绘制姓名、投影和石堆遮挡。素材由已确认的桌面字形导出，调色板保留全部 256 档透明度，源码共 30,183 字节，随 HTML 内嵌。首帧等待素材解码。旧设计入口继续使用原有字体绘制路径。

介绍重点文字采用 700 字重，存在 Helvetica Neue Medium 时使用该本地字形，其余环境回退到 Helvetica/Arial 粗体，并允许合成粗体。

验证：

- 原桌面 1440px 截图与本次截图逐像素一致，变化像素 0。
- 1440、1200、768、486、390、320px 六档排版与生成前设计入口一致，页面无横向溢出。
- 390px、320px / DPR 3 强制使用不存在的本地苹果字体并回退 Arial：重点文字 700、普通文字 400；姓名绘制调用 fillText 次数 0；切换字体前后场景 Canvas 像素相同。
- 现有 57 项自动测试通过；SEO 元数据、8 个结构化实体、6 个论文锚点及两份 sitemap 与 v0.1 一致。
- 独立只读审查发现的旧原型入口依赖问题已修复并复核。

本次手机验证使用桌面 Chromium 的触屏及字体缺失模拟。实体手机应用内浏览器的显示仍需用户在预览中验收。

复现：使用现有 Node 与 Playwright 运行 scripts/check-portable-fonts.cjs、scripts/check-browser.cjs、scripts/check-first-frame.cjs 和 python3 scripts/check-seo.py；脚本生成截图及 JSON 证据。Chrome 需按本机规则申请单次沙箱外执行权限。
