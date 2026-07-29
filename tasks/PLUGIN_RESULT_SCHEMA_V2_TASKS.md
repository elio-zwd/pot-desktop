# 插件结果 Schema V2 任务清单

## 状态说明

- `[ ]` 未开始
- `[-]` 进行中或等待本地只读验收
- `[x]` 已完成
- `[!]` 阻塞，需要用户确认

## 交付摘要

- 分支：`feat/plugin-result-schema-v2`
- Base：`custom/main`
- 初始 Base SHA：`594d32ede96acd106b0256deaa8bb440ffcdff40`
- Draft PR：`#4 feat: 添加插件结构化结果 Schema V2`
- 应用代码校验 SHA：`a580319eefe7ec2cbdd2bc57f77fa8aa347563a7`
- GitHub Actions Run：`30433352938`，全部步骤通过
- 校验环境：Node.js 21、pnpm 9；仓库 Tauri CLI 依赖保持 `1.6.3`，未升级 Rust、Tauri 或其他依赖
- 未修改 `src/window/Config/pages/Service/PluginConfig/`
- 未修改 `package.json`、`pnpm-lock.yaml`

## T0：接手与基线确认

- [x] 按顺序读取 `README.md`、`AGENTS.md`、Plan、Task、Handoff。
- [x] 确认分支、Base、初始 Base SHA 和远端 HEAD。
- [x] 阅读 `TargetArea`、`invoke_plugin`、`setResult`、历史、复制、朗读、反向翻译、旧对象渲染与构建工作流。
- [x] 记录构建环境并确认不升级依赖。
- [x] 通过 CI 跟踪文件检查确认工作区无未提交修改。

## T1：定义结果 Schema V2

- [x] 严格使用数字 `schemaVersion: 2` 与数组 `sections` 识别 V2。
- [x] 定义顶层 `copyText`、六种 section、受控 `source`、受控 `severity`、折叠字段和单项复制文本。
- [x] 定义 sections、items、tokens、文本、copyText、ID 与 token 长度限制。

## T2：归一化纯函数

- [x] 新增 `src/utils/plugin_result_schema.js`。
- [x] 实现 `isPluginResultV2()`、`isLegacyPluginResult()`、`normalizePluginResultV2()`、`normalizePluginResultSection()` 与 `resolveResultCopyText()`。
- [x] 实现重复 ID 稳定后缀、未知 section 降级、错误形状安全忽略与异常属性访问隔离。
- [x] 采用字段白名单，忽略 HTML、CSS、className、组件、Markdown、图标、颜色和函数。

## T3：纯函数与安全测试

- [x] 使用 Node 内置 `node:test`，共 14 项测试。
- [x] 覆盖最小 V2、六种 section、错误版本号、未知 section、重复 ID、超长和超量数据。
- [x] 覆盖错误数组与对象、恶意 UI 字段、copyText 回退、V2 与旧字段共存、异常 Proxy 对象。
- [x] 覆盖字符串和四类旧对象识别、错误 V2 回退旧对象。

## T4：抽取旧结果渲染组件

- [x] 从 `TargetArea` 抽取统一结果入口与旧对象组件。
- [x] 保持 `pronunciations`、`explanations`、`associations`、`sentence` 的顺序和主要行为。
- [x] `dangerouslySetInnerHTML` 仅保留在旧版 `sentence` 兼容路径，不扩展到 V2。

## T5：建立结果组件入口

- [x] 新增 `TranslationResult`、`LegacyResult`、`StructuredResult` 与 `ResultSection`。
- [x] 渲染优先级为字符串 → 严格 V2 → 旧对象 → 安全纯文本兜底。
- [x] 不向插件暴露组件、样式或任意渲染入口。

## T6：核心释义和标识符信息

- [x] 实现 `summary`、`metadata`、来源标记、token Chip、换行和单项复制。
- [x] 核心释义采用更强字号和字重，形成第一视觉层级。

## T7：逐词解释

- [x] 实现 `dictionary` 一行一个 token、可选音标、来源标记、长内容换行与单项复制。

## T8：命名转换与 AI 补充

- [x] 实现紧凑 `code-list`、逐项复制、受控折叠。
- [x] 实现 `note`，支持 AI 补充默认折叠。
- [x] V2 不解析 Markdown 或 HTML。

## T9：诊断状态

- [x] 实现 `status` 与 `info/success/warning/error` 四种 Pot 固定状态。
- [x] 插件无法指定任意颜色、图标 URL、className 或布局。

## T10：完整复制、自动复制与历史

- [x] V2 完整复制、自动复制和历史记录统一使用归一化 `copyText`。
- [x] 不向剪贴板或 SQLite 直接传递 V2 对象，不显示内部 Schema JSON。
- [x] 字符串行为保持不变；旧对象顶部复制能力保持原状。

## T11：朗读与反向翻译

- [x] V2 使用 `copyText` 作为朗读和反向翻译输入。
- [x] V2 朗读超过 4000 字符时禁用，不逐 token 调用 TTS。
- [x] 未改变旧对象顶部朗读与反向翻译行为。

## T12：旧结果兼容回归

- [x] 覆盖字符串、`pronunciations`、`explanations`、`associations`、`sentence`。
- [x] V2 与旧字段共存时优先 V2；错误 V2 可回退旧字段。
- [x] 保持插件生词本和内置生词本对旧对象的既有参数语义。

## T13：视觉与交互验收

- [x] 实现方案二卡片分层、窄窗口换行、明暗主题语义色、折叠、单项复制和完整复制。
- [x] 长核心释义、长 token、长词义和多翻译服务采用 `min-w-0`、换行与弹性布局。
- [-] 等待本地 AI 在真实桌面窗口执行暗色、亮色、窄窗口、多服务并排、键盘聚焦和截图验收；本地 AI 禁止修改代码。

## T14：构建与审计

- [x] `node --test tests/plugin_result_schema.test.mjs`：14/14 通过。
- [x] `pnpm build`：通过。
- [x] `git diff --check origin/custom/main...HEAD`：通过。
- [x] 跟踪文件工作区检查：通过。
- [x] 未新增运行时依赖，未修改锁文件，未触碰设置页。
- [x] V2 无 `dangerouslySetInnerHTML`、插件 CSS、组件或样式注入。

## T15：文档与 Draft PR

- [x] 新增 `docs/PLUGIN_RESULT_SCHEMA_V2.md`，包含字段说明、限制、安全边界和完整 JSON 示例。
- [x] 提供未来插件双结构兼容示例。
- [x] 创建 Draft PR #4，Base 为 `custom/main`，标题符合约定。
- [x] PR 保持 Draft，未转 Ready、未合并。

## T16：本地 AI 只读验收交接

- [x] 已准备包含仓库链接、固定 SHA、只读边界和验收项目的交接 Prompt。
- [-] 等待本地 AI 拉取最终 SHA，执行构建与字符串、旧对象、V2 卡片、窄窗口和主题验收。
- [x] 本地 AI 禁止修改、格式化、commit、push、创建或合并 PR。
