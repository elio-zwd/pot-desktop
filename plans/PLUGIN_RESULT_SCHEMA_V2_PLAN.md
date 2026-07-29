# 插件结果 Schema V2 开发计划

## 1. 仓库与基线

- 仓库：`https://github.com/elio-zwd/pot-desktop`
- 上游：`https://github.com/pot-app/pot-desktop`
- 功能分支：`feat/plugin-result-schema-v2`
- Base：`custom/main`
- Base SHA：`594d32ede96acd106b0256deaa8bb440ffcdff40`
- 配套设置页分支：`feat/plugin-ui-schema-v2`
- 视觉方向：`docs/assets/plugin-ui-schema-v2-card-layering-concept.svg`

概念图用于表达信息层级，不要求像素级复刻。真实实现必须适应 Pot 当前翻译窗口、多个翻译服务并排、窄窗口、明暗主题和旧插件结果。

## 2. 已确认决定

1. 采用“卡片分层方案”。
2. 设置页和结果页并行开发，但使用独立分支和独立 Draft PR。
3. 本分支只负责翻译结果 Schema V2 与结果渲染。
4. 旧版字符串、`pronunciations`、`explanations`、`associations` 和 `sentence` 必须继续工作。
5. 新协议必须声明式、安全且由 Pot 控制样式。
6. 不允许插件提供 HTML、CSS、React 组件或任意 JavaScript。
7. 程序员划词翻译插件将在后续独立分支接入，本分支先提供通用平台能力和测试夹具。

## 3. 当前问题

当前结果渲染集中在：

```text
src/window/Translate/components/TargetArea/index.jsx
```

现有分支：

- 字符串结果渲染为只读 `textarea`；
- 对象结果依次渲染 `pronunciations`、`explanations`、`associations`、`sentence`；
- 结果区块样式固定；
- 对象结果缺少统一复制文本；
- 当前复制、朗读、反向翻译按钮主要面向字符串结果；
- `TargetArea` 已承担服务调用、历史、自动复制、朗读、结果 UI 和错误处理，继续堆叠会增加回归风险。

## 4. 第一版目标

新增严格、可归一化的结果 Schema V2，并保留旧结果渲染。

推荐顶层结构：

```json
{
  "schemaVersion": 2,
  "copyText": "完整可复制纯文本",
  "sections": []
}
```

`schemaVersion` 必须严格等于数字 `2`，否则不进入 V2 渲染器。

### 4.1 核心释义 `summary`

```json
{
  "id": "summary",
  "type": "summary",
  "title": "核心释义",
  "content": "以小端序向 NFC 设备写入 16 位无符号整数",
  "source": "local"
}
```

允许 `source`：

```text
local
ai
mixed
unknown
```

来源只映射到受控徽标或文本，不允许插件指定颜色。

### 4.2 标识符信息 `metadata`

```json
{
  "id": "identifier",
  "type": "metadata",
  "title": "标识符信息",
  "items": [
    { "label": "类型", "value": "函数名" },
    { "label": "原文", "value": "NFC_WriteU16LE", "copyText": "NFC_WriteU16LE" }
  ],
  "tokens": ["NFC", "write", "U16", "LE"]
}
```

Token 作为纯文本 Chip 渲染，不允许插件声明任意 className。

### 4.3 逐词解释 `dictionary`

```json
{
  "id": "words",
  "type": "dictionary",
  "title": "逐词解释",
  "items": [
    {
      "token": "write",
      "phonetic": "/raɪt/",
      "meaning": "写入",
      "source": "local",
      "copyText": "write：写入"
    }
  ]
}
```

要求：

- 一行一个 token；
- 音标可选；
- `source` 使用受控值；
- 所有内容纯文本；
- 对超长内容截断或换行，不允许撑破卡片。

### 4.4 命名转换 `code-list`

```json
{
  "id": "naming",
  "type": "code-list",
  "title": "命名转换",
  "collapsible": true,
  "defaultCollapsed": false,
  "items": [
    { "label": "小驼峰", "value": "nfcWriteU16Le", "copyText": "nfcWriteU16Le" },
    { "label": "下划线", "value": "nfc_write_u16_le", "copyText": "nfc_write_u16_le" }
  ]
}
```

第一版允许插件请求折叠，但最终样式和行为由 Pot 控制。

### 4.5 AI 补充 `note`

```json
{
  "id": "ai-supplement",
  "type": "note",
  "title": "AI 补充",
  "content": "结合上下文的补充说明。",
  "source": "ai",
  "collapsible": true,
  "defaultCollapsed": true
}
```

### 4.6 诊断 `status`

```json
{
  "id": "diagnostic",
  "type": "status",
  "title": "诊断",
  "severity": "warning",
  "content": "AI 请求未完成，已使用完整本地结果。"
}
```

允许严重程度：

```text
info
success
warning
error
```

颜色和图标由 Pot 内置映射，插件不能传任意颜色。

## 5. 安全与限制

建议为纯函数归一化层设置边界：

- `sections` 最大数量；
- 每个 `items` 最大数量；
- 文本最大长度；
- Token 最大数量与长度；
- `id` 只接受有限字符并保证页面内稳定；
- 未知 section 类型跳过或降级为纯文本卡片；
- 重复 `id` 自动生成稳定后缀；
- 所有字段按字符串处理；
- 不使用 `dangerouslySetInnerHTML`；
- 不读取 section 中的 class、style、html、component 等字段。

错误 Schema 不得让整个翻译面板白屏。无法解析 V2 时，应安全回退旧对象渲染或通用纯文本。

## 6. 推荐架构

### 6.1 归一化层

建议新增：

```text
src/utils/plugin_result_schema.js
```

职责：

- 检测 V2；
- 归一化顶层对象；
- 归一化 section；
- 限制长度和数量；
- 生成安全的复制文本回退；
- 不依赖 React、Tauri 或 DOM。

建议导出：

```text
isPluginResultV2(result)
normalizePluginResultV2(result)
normalizePluginResultSection(section, index)
resolveResultCopyText(result)
```

### 6.2 结果组件层

建议新增：

```text
src/window/Translate/components/TranslationResult/
  index.jsx
  LegacyResult.jsx
  StructuredResult.jsx
  ResultSection.jsx
```

可以根据实际代码调整，但应将对象结果渲染从 `TargetArea` 抽离。

`TargetArea` 继续负责：

- 服务调用；
- 加载和错误状态；
- 卡片头部；
- 历史与自动复制协调；
- 结果组件选择。

`TranslationResult` 负责：

- 字符串结果；
- 旧对象结果；
- V2 结构化结果。

### 6.3 复制与历史

V2 顶层 `copyText` 建议作为完整结果的统一纯文本表示。

规则：

- 顶部复制按钮在 V2 对象存在有效 `copyText` 时启用；
- 自动复制使用 `copyText`，而不是把对象写入剪贴板；
- 历史记录优先保存 `copyText`，避免 SQLite 接收对象；
- 单项复制只使用受控 `copyText` 或 `value/content`；
- 不把内部 Schema JSON 直接暴露给用户。

若修改历史语义会影响旧行为，先写回归测试并在 PR 中说明。

### 6.4 朗读和反向翻译

第一版建议：

- V2 有 `copyText` 时，可将其作为反向翻译输入；
- 是否允许朗读完整 `copyText`，根据现有 TTS 行为和内容长度判断；
- 不为逐词卡片分别调用 TTS；
- 旧对象结果保持现有行为，避免无关回归。

如果实现过程中需要改变旧对象按钮行为，先向用户确认。

## 7. 兼容策略

渲染优先级：

```text
字符串
→ V2 严格对象
→ 旧版对象
→ 安全纯文本兜底
```

必须继续支持：

- 字符串；
- `pronunciations`；
- `explanations`；
- `associations`；
- `sentence`。

V2 对象可以同时携带旧字段，但新版 Pot 优先渲染 V2。旧版 Pot 会忽略 `schemaVersion/sections/copyText`，继续读取旧字段。这个双结构兼容由插件侧后续实现。

## 8. 第一版 section 类型

第一版只实现：

```text
summary
metadata
dictionary
code-list
note
status
```

不实现：

- 任意网格布局；
- 任意 Markdown；
- 表格 DSL；
- 插件按钮；
- 网络动作；
- 自定义 HTML；
- 自定义 CSS；
- 插件提供图标 URL；
- 任意嵌套 section；
- 拖拽布局。

## 9. 开发阶段

### 阶段 A：Schema 归一化与测试

- 定义 V2 边界；
- 实现纯函数；
- 构造有效和恶意夹具；
- 验证安全降级。

### 阶段 B：抽取旧结果组件

- 在不改变外观和行为的前提下抽取当前旧结果渲染；
- 确保字符串和旧对象视觉回归最小。

### 阶段 C：结构化结果组件

- 实现六种 section；
- 实现受控折叠；
- 实现 per-item copy；
- 实现窄窗口换行。

### 阶段 D：复制、历史与按钮协调

- 使用 `copyText`；
- 修正对象写入剪贴板或历史的风险；
- 保持旧结果兼容。

### 阶段 E：主题、构建和 Draft PR

- 亮暗主题；
- 多翻译卡片与窄窗口；
- Node 测试；
- `pnpm build`；
- Draft PR，Base 为 `custom/main`。

## 10. 测试要求

至少覆盖：

1. 非对象；
2. `schemaVersion` 缺失或错误；
3. 最小 V2；
4. 六种 section；
5. 未知 section；
6. 重复 ID；
7. 超长内容；
8. 超量 sections/items/tokens；
9. 错误数组和对象形状；
10. 恶意 `html/style/className/component` 字段被忽略；
11. `copyText` 回退；
12. 字符串旧结果；
13. `explanations/associations` 旧对象；
14. `pronunciations/sentence` 旧对象；
15. V2 与旧字段同时存在时优先 V2；
16. 错误 V2 安全回退。

UI 手工验收：

- 核心释义第一视觉焦点；
- 标识符信息可扫读；
- 逐词解释一行一个 token；
- 命名转换紧凑；
- AI 补充默认可折叠；
- 诊断严重程度清晰；
- 暗色和亮色主题；
- 窄窗口不横向溢出；
- 多翻译服务并排；
- 单项复制和完整复制；
- 字符串和旧对象外观不退化。

## 11. 与设置页分支的边界

本分支不要修改：

```text
src/window/Config/pages/Service/PluginConfig/
```

不要实现：

- 设置分组；
- 密码输入；
- 条件显示；
- 高级设置折叠；
- 插件配置 Schema。

为了减少冲突：

- 不修改 `package.json`，除非确有必要并先说明；
- 不升级依赖；
- 不全仓库格式化；
- 不修改设置页文件；
- 新增测试直接使用 `node --test <path>`。

## 12. 完成标准

- V2 结果可由任意插件声明；
- 六种 section 正常、安全渲染；
- 旧字符串和旧对象完全兼容；
- `copyText` 支持完整复制和历史存储；
- 不允许插件注入 UI 代码或样式；
- 无错误 Schema 白屏；
- 不新增运行时依赖；
- `pnpm build` 通过；
- Draft PR 已创建；
- 本地 AI 只读验收 Prompt 已提供；
- 未经用户授权不合并。
