# mayu.my v1.0 候选预览核验

日期：2026-10-18。预览地址：https://mayu-v1-review-20261018--mayu-homepage.netlify.app/ 。当前阶段为Netlify草稿，最终上线与v1.0标签等待用户确认。

## 版本与整合来源

v0.1已标记并推送，对应实际生产提交156a92f及Netlify部署6acfcfa419176816085ab3f5。Netlify源站HTML与提交一致；Cloudflare公开响应包含邮箱保护改写，robots与两份sitemap与提交相同。证据见v0.1-baseline.json及生产回执。

响应式分支fcee9e9、颜色分支ec0980d、原Safari导航修复及后续导航回归修复已合入设计整合分支，再以Git subtree导入正式发布仓库design/，保留双方历史。

## 检索兼容性

- Google与百度验证标签、description、canonical、Open Graph、Twitter元数据与v0.1一致。
- 8个JSON-LD实体与v0.1逐项相同；6篇论文的正文、作者、会议信息和既有锚点保持一致。
- 正文位于普通HTML；关闭JavaScript仍可读取6篇论文。独立CSS作用范围保留原视觉。
- robots、sitemap.xml、sitemap-baidu.xml与v0.1逐字相同；规范网址与地图继续指向https://mayu.my/。
- 正式构建可索引并保留原301；草稿使用noindex响应头，预览index入口回到预览根路径。
- 本轮检查配置和可读取内容。平台实际收录及排名以Google/Bing/百度各自结果为准。

## 功能与视觉

- 57项测试通过，包括两项导航取消竞态回归。
- 1440、1200、768、486、390、320px截图与合并设计逐像素相同，35组正文元素样式逐项比较通过，无横向溢出及脚本错误。
- 键盘标题焦点、触摸点击、自动扫亮及减少动态效果通过。
- 历史阅读位置：Research 1171→后退1171，Publications 2061→前进2061；刷新2161→2161，跨页面返回2161；论文锚点位于视窗顶部约20px。
- 桌面和手机各3次静态首屏绘制次数为1；24次尺寸通知的空白间隙为0。
- 独立只读审查的限定复核完成，详见independent-review.md。

## 构建与回执

部署仅上传dist/的公开静态网站文件，源码、历史截图及检查记录保留在Git中。产物尺寸和SHA-256见dist-manifest.json。Netlify回执见deploy-receipt.json，HTTP线上核验见live-checks.json，线上截图及阅读位置检查见live-browser-checks.json。

Netlify CLI首次参数校验失败及HTTP/2传输失败的证据已保留；最终使用已构建草稿及HTTP/1.1客户端完成核验。

## 最终确认后的发布步骤

1. 再次核对工作区、远程main、预览回执和已验收产物。
2. 执行正式构建与 `python3 scripts/check-seo.py --production`，确认正式输出可索引。
3. 推送生产main，由既有Netlify构建链发布；验证部署commit_ref、mayu.my正文、图片、元数据、robots及地图。
4. 正式内容核验成功后建立并推送v1.0标签。

复查命令与日志捕获方式见根README。
