# 响应式适配与首屏启动检查

2026-10-18。检查对象为当前响应式 Worktree 与原目录已确认构建。

## 当前加载与绘制行为

- 单文件构建继续内嵌样式和脚本。HTML由178,644字节增至181,581字节，增加2,937字节。
- 依赖继续为两张相同图片：展示照片2,650,198字节，深度纹理19,598字节；两版图片内容散列相同。完整资源引用及字节核对见 `startup-assets.json`。
- 首次尺寸初始化使用原来的 requestAnimationFrame 路径；已有画面改变尺寸时才在回调中即时补绘。桌面1440px和手机390px各3次静态首屏检查，绘制次数均为1，见 `startup-single-frame.json`。
- 尺寸变化回调核验24次，回调结束时空白间隙为0；桌面视觉、源页面与构建一致性、触摸、键盘导航、扫亮和减少动态效果回归通过。54项单元测试通过。
- 手机端为保留人物构图采用更宽的画布；390px视窗对应约749px的CSS画布宽度，增加首帧绘制工作量。尺寸保持不变时，响应式适配等待尺寸变化通知。

## 初步耗时探测

每个设备和版本各5次，使用本机Chrome、独立浏览器上下文、本地文件热缓存，交替测试顺序。完整山景绘制完成时间由 `data-rendered` 的观察时刻记录。手机模拟视窗为390×844、DPR3，画布内部DPR上限为2。

|设备|基线首帧中位数|适配版首帧中位数|单位|
|---|---:|---:|---|
|桌面1440px|432.6|406.3|ms|
|手机模拟390px|595.0|442.0|ms|

该批耗时数据采集于首次绘制去重之前；其中适配版在初始化阶段绘制2次，随后已调整为1次并独立复查。原始样本见 `startup-comparison.json`。该批样本波动较大，手机基线存在7,539.6ms的样本；记录用途为检查启动开销来源，不能用中位数差值证明提速。当前去重版的确认结果为加载资源、首次绘制次数与功能回归。线上网络及实体手机耗时需要对应环境的测量。

## 复查命令

在当前Worktree根目录运行。浏览器命令按本机规则提权后启动。

```sh
node qa/responsive/startup-single-frame.cjs 2>&1 | tee /private/tmp/mayu-startup-single-frame.txt
node qa/responsive/resize-paint.cjs after 2>&1 | tee /private/tmp/mayu-resize-paint.txt
node qa/responsive/regression.cjs 2>&1 | tee /private/tmp/mayu-startup-regression.txt
```
