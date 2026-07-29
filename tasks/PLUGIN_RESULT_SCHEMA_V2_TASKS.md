# 插件结果 Schema V2 任务清单

## 状态说明

- `[ ]` 未开始
- `[-]` 进行中
- `[x]` 已完成
- `[!]` 阻塞，需要用户确认

## T0：接手与基线确认

- [ ] 按顺序读取 `README.md`、`AGENTS.md`、Plan、Task、Handoff。
- [ ] 确认当前分支为 `feat/plugin-result-schema-v2`。
- [ ] 确认 Base 为 `custom/main`，基线祖先包含 `594d32ede96acd106b0256deaa8bb440ffcdff40`。
- [ ] 确认工作区干净。
- [ ] 阅读真实文件：
  - `src/window/Translate/components/TargetArea/index.jsx`
  - 插件调用与 `setResult` 路径
  - 历史记录写入路径
  - 自动复制、朗读和反向翻译逻辑
  - `.github/workflows/package.yml`
- [ ] 记录当前 Node、pnpm、Rust 和 Tauri 环境，不升级依赖。

## T1：定义结果 Schema V2

- [ ] 严格使用 `schemaVersion: 2` 识别 V2。
- [ ] 定义顶层 `copyText` 和 `sections`。
- [ ] 定义以下 section：
  - `summary`
  - `metadata`
  - `dictionary`
  - `code-list`
  - `note`
  - `status`
- [ ] 定义受控 `source` 值。
- [ ] 定义受控 `severity` 值。
- [ ] 定义折叠字段：`collapsible/defaultCollapsed`。
- [ ] 定义单项 `copyText`。
- [ ] 明确数量、长度和 ID 字符边界。

## T2：归一化纯函数

- [ ] 新增 `src/utils/plugin_result_schema.js` 或等价路径。
- [ ] 实现 `isPluginResultV2()`。
- [ ] 实现 `normalizePluginResultV2()`。
- [ ] 实现 section 归一化。
- [ ] 实现重复 ID 稳定处理。
- [ ] 实现未知 section 安全跳过或降级。
- [ ] 实现 `resolveResultCopyText()`。
- [ ] 忽略 `html/style/className/component` 等危险字段。
- [ ] 错误 Schema 不得抛出到整个翻译窗口。

## T3：纯函数与安全测试

- [ ] 使用 Node 内置 `node:test`。
- [ ] 覆盖最小 V2。
- [ ] 覆盖全部六种 section。
- [ ] 覆盖错误版本号。
- [ ] 覆盖错误数组和对象形状。
- [ ] 覆盖未知 section。
- [ ] 覆盖重复 ID。
- [ ] 覆盖超长文本和超量数据。
- [ ] 覆盖恶意 HTML/CSS/组件字段。
- [ ] 覆盖 `copyText` 回退。
- [ ] 覆盖 V2 与旧字段同时存在。

## T4：抽取旧结果渲染组件

- [ ] 从 `TargetArea` 抽出字符串结果渲染。
- [ ] 从 `TargetArea` 抽出旧对象结果渲染。
- [ ] 保持 `pronunciations` 当前行为。
- [ ] 保持 `explanations` 当前行为。
- [ ] 保持 `associations` 当前行为。
- [ ] 保持 `sentence` 当前行为。
- [ ] 抽取阶段不主动改变旧结果视觉。
- [ ] 不修改服务调用、加载、错误和卡片头部主流程。

## T5：建立结果组件入口

- [ ] 新增 `TranslationResult` 或等价统一组件。
- [ ] 渲染优先级：字符串 → V2 → 旧对象 → 纯文本兜底。
- [ ] V2 识别失败时安全回退。
- [ ] 组件接收 `appFontSize`、复制回调等必要受控参数。
- [ ] 不向插件暴露组件实例或样式注入入口。

## T6：核心释义和标识符信息

- [ ] 实现 `summary` 卡片。
- [ ] 核心释义成为第一视觉焦点。
- [ ] `source` 映射为受控标记。
- [ ] 实现 `metadata` 卡片。
- [ ] 实现 token Chip。
- [ ] 超长原文和 token 可换行。
- [ ] 单项复制使用纯文本。

## T7：逐词解释

- [ ] 实现 `dictionary` 卡片。
- [ ] 一行一个 token。
- [ ] 音标可选且弱化显示。
- [ ] 本地、AI、混合来源使用受控标记。
- [ ] 长词义可换行，不横向溢出。
- [ ] 单项复制不暴露 Schema JSON。

## T8：命名转换与 AI 补充

- [ ] 实现 `code-list`。
- [ ] 支持紧凑布局。
- [ ] 支持受控折叠。
- [ ] 支持每项复制。
- [ ] 实现 `note`。
- [ ] AI 补充可默认折叠。
- [ ] 不渲染 Markdown 或 HTML。

## T9：诊断状态

- [ ] 实现 `status`。
- [ ] 支持 `info/success/warning/error`。
- [ ] 颜色和图标由 Pot 固定映射。
- [ ] 插件不能指定任意颜色、图标 URL 或 className。
- [ ] 状态内容可换行。
- [ ] 多状态卡片保持可扫读。

## T10：完整复制、自动复制与历史

- [ ] V2 有效 `copyText` 时启用完整复制。
- [ ] 自动复制使用 `copyText`。
- [ ] 历史记录优先保存 `copyText`。
- [ ] 不把对象直接写入剪贴板。
- [ ] 不把内部 Schema JSON直接展示给用户。
- [ ] 旧字符串复制行为不变。
- [ ] 旧对象行为如需改变，先写测试并在 PR 说明。

## T11：朗读与反向翻译

- [ ] 审查当前按钮只支持字符串的原因。
- [ ] V2 可在安全情况下使用 `copyText` 作为反向翻译输入。
- [ ] 朗读策略不应造成超长或逐项网络调用。
- [ ] 不为每个 token 单独调用 TTS。
- [ ] 若需要改变旧对象行为，先向用户确认。

## T12：旧结果兼容回归

- [ ] 字符串结果。
- [ ] 仅 `explanations`。
- [ ] `explanations + associations`。
- [ ] `pronunciations`。
- [ ] `sentence`。
- [ ] 旧对象的字号、换行和顺序不明显退化。
- [ ] V2 与旧字段同时存在时新版优先 V2。
- [ ] 错误 V2 可回退旧字段。

## T13：视觉与交互验收

- [ ] 对照方案二概念图检查信息层级，不做像素级复刻。
- [ ] 暗色主题。
- [ ] 亮色主题。
- [ ] 窄窗口。
- [ ] 多翻译服务并排。
- [ ] 长核心释义。
- [ ] 长 token 和长词义。
- [ ] 折叠状态。
- [ ] 单项复制。
- [ ] 完整复制。
- [ ] 键盘聚焦和基础可访问性。

## T14：构建与审计

- [ ] 运行全部新增 Node 测试。
- [ ] 运行 `pnpm build`。
- [ ] 检查没有新增运行时依赖。
- [ ] 检查没有无关锁文件变化。
- [ ] 检查没有 `dangerouslySetInnerHTML` 用于 V2。
- [ ] 检查没有插件自定义 CSS 或组件注入。
- [ ] `git diff --check` 通过。
- [ ] `git status --short` 干净。

## T15：文档与 Draft PR

- [ ] 编写 Schema V2 字段说明和 JSON 示例。
- [ ] 记录安全限制和旧版兼容策略。
- [ ] 提供程序员划词翻译插件未来双结构接入示例。
- [ ] 创建 Draft PR，Base 为 `custom/main`。
- [ ] PR 标题建议：`feat: 添加插件结构化结果 Schema V2`。
- [ ] 未经用户授权不得转 Ready 或合并。

## T16：本地 AI 只读验收交接

- [ ] 输出包含仓库链接的本地验收 Prompt。
- [ ] 本地 AI 只允许 fetch、checkout/reset 指定 SHA、安装依赖、构建和 UI 验收。
- [ ] 本地 AI 禁止修改、格式化、commit、push、创建或合并 PR。
- [ ] 要求回传字符串、旧对象、V2 六种 section、窄窗口和主题截图。
