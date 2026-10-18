# v1.0 预览交接

当前阶段：整合视觉与响应式源码，并部署Netlify草稿，等待用户最终上线确认。

## 当前约束

- `v0.1` 已指向实际生产提交 `156a92f` 并推送。
- 正式域名保持现有部署。`release/v1-preview` 的本地整合与草稿上传已获授权。
- 用户最终确认后，重新核对预览回执与产物散列，执行正式构建、推送生产main、验证mayu.my实际内容与Netlify生产回执，再建立及推送 `v1.0` 标签。
- 正式构建命令为 `node build.mjs`；其输出应保持可索引策略。预览构建使用 `DEPLOY_TARGET=preview`。

## 需要保持

1. 连续左侧裁切及750px以下的整体缩放；介绍文字采用更缓的缩放速度。
2. 价格橙色、MA5浅蓝、灰色阳线空心／阴线实心、高亮统一实心、白色姓名。
3. 首次静态绘制一次；已有画面改变尺寸时即时重绘。
4. 鼠标目录滚动、键盘标题焦点、刷新与历史阅读位置恢复。
5. 正文直接存在于HTML，6个论文锚点、8个结构化实体、Google/百度验证、canonical、robots及sitemap兼容。
6. 触屏规则等待后续补充，当前交互保持既有实现。

证据与预览回执：`reports/v1-preview/`。详细来源见 `README.md`、`progress.md` 与 `design/progress.md`。

## 已上传预览

https://mayu-v1-review-20261018--mayu-homepage.netlify.app/

最终部署回执见 `reports/v1-preview/deploy-receipt.json`，Netlify状态、线上HTTP与截图检查均已保存。下一步等待用户最终上线确认。
