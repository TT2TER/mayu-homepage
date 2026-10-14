# 后续维护交接

## 起点

v0.1 已上线，下一阶段由用户提出具体内容或视觉需求后开始。先读取 README.md、progress.md、index.html 和 style.css。

- 目录：`/Users/ma/Documents/projects/mayu-homepage`。
- 仓库：`TT2TER/mayu-homepage`，分支 `main`。
- 生产地址：https://mayu.my/ 。
- Netlify 项目 ID：`4c8c43b4-cb8d-4fb8-8a46-06fde81dc2bd`。

## 修改流程

1. 检查工作区和本地提交；本次 wrap-up 文档仅在本地提交。
2. 获取远程最新 main，并检查是否包含用户通过 GitHub 网页所做修改。工作区干净且分支关系允许时才使用 fast-forward 拉取。
3. 按明确需求修改源文件。研究介绍采用适合公开主页的宽泛描述；论文元数据按原文和用户提供的 BibTeX 保持准确。
4. 执行 `node build.mjs 2>&1 | tee build.log`。仅 index.html、style.css 被复制到 dist/。
5. 用临时本机 HTTP 服务预览，截图检查涉及的页面区域；遇到线上浏览器读取超时时，使用同版本本地预览检查排版，并单独核验线上 HTML。
6. 对保存的文字运行 no-negative-echo 检测。依据用户请求决定是否提交和推送；推送到 main 会自动发布。
7. 用 Netlify 部署状态确认 commit_ref 对应本次提交、state 为 ready，并读取线上内容核验更改。

## 注意事项

- 直接编辑 index.html / style.css；dist 是构建产物。
- .netlify/ 中的本机关联状态不提交。认证信息沿用现有 CLI 配置，避免输出凭据和 webhook 地址。
- 公共 DNS 查询在橙云状态下不能显示实际 CNAME 目标。
- DNS、证书、重定向检查使用 `curl -q` 排除本地 curl 配置；必要时加 `--noproxy '*'` 对照，保留 TLS 校验。
- mayu.my 为用户选定的主域名。DNS 负责定位，www 到根域名的 301 由 Netlify 返回。

## 验收标准

- 公开内容和布局符合本轮需求，新增或修改外部链接已核对。
- 本地截图没有明显重叠、溢出或断行问题。
- 若请求上线，GitHub 提交对应的 Netlify 自动发布为 ready，mayu.my 实际返回更新内容。
- 若修改域名配置，重新检查根域名及 www 的证书和完整跳转链。
