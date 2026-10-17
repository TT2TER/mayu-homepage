# 确认版与后续交接

## 当前确认状态

项目：`/Users/ma/Documents/projects/mayu-homepage-design`。固定开发目录：`site/`。

用户已选择四个位置方案的第一版，源页面为 `site/printed-left.html`。介绍保留 20px 的逐行白底黑字，位于山景左侧；桌面位置为照片容器高度的 63%。邮箱、Google Scholar、GitHub、Blog 使用白字与黑色阴影，保持已确认的间距。窄屏采用照片下方的可读排版。

山景姓名、石堆遮挡与地形投影沿用第十二轮视觉。K 线维持原有鼠标交互，静止 1500ms 后从上到中再到下依次从左向右扫亮，鼠标移动立即恢复交互；系统减少动态效果时关闭自动扫描。照片与正文由白色硬边界衔接；照片底部中央设有可点击、可键盘操作的白色向下箭头，目标为 About。

About 开始的正文完整复用现有学术主页 `mayu.my` 的原始样式，包括字体、字号、行高、间距和内容宽度。首页呈现身份与研究方向两句英文及链接，白底 About 使用原文剩余内容。当前内容来源目录为 `/Users/ma/Documents/projects/mayu-homepage`。

## 开始工作

1. 阅读 `README.md`、`progress.md` 及本文件。
2. 以 `site/printed-left.html` 为当前确认版；执行 `node site/build-single.mjs` 更新单文件入口，然后打开项目根目录 `index.html`。
3. 查看 `qa/final-approved/desktop.png` 和 `mobile.png`，以及该目录的测试、构建与一致性记录。
4. 历轮预览用于参考。六种介绍方案入口为 `site/intro-six.html`，四个位置方案入口为 `site/printed-compare.html`。

## 核验要求

- 修改首页排版后亲自检查桌面与窄屏截图。
- 修改交互后检查静止扫亮、移动打断、键盘入口、离屏停止与 reduced-motion 行为。
- 正文样式以现有学术主页为准；在修改字体、字号、宽度、颜色和内容前核对本轮用户要求。
- 保持英文正文、完整论文作者顺序、Yu Ma 加粗及两条研究方向。
- 所有页面发布与推送按用户后续指示处理。
