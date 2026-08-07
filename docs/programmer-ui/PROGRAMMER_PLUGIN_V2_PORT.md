# 程序员插件迁移到社区 Schema V2 契约

## 1. 文档定位

本文冻结 `MIN-CUSTOM-00` 的跨仓库长期契约和实施边界。本文只用于规划，不实现运行时代码，不授权直接合并任何方案分支，也不改变现有 Schema V2。

- 社区维护仓库：`elio-zwd/pot-desktop`
- 稳定主线：`custom/main`
- 协调 Base SHA：`85d2ec8ec138c4f5aa685e872864f9ca4c451d39`
- 协调分支：`docs/programmer-plugin-v2-port-contract`
- 桌面端固定验收 Commit：`a062a868064a5b7c781ccb8dbe310608dda26925`
- 插件固定验收 Commit：`3862162e01396b39edb9a3634a2067707ea0689f`
- 固定插件 Run ID：`31079192633`
- 固定插件 Artifact ID：`8958748240`
- 固定 Artifact Digest：`sha256:efe8d60a7eed12b57acc0c645fe57398bc1bffd4be7676b612cac65668fd19a9`
- 固定组合验收结论：`FINAL PASS`

固定组合验收中的 74/74 桌面端测试、115/115 插件测试、Vite 构建、Cargo check、Release 安装包构建和真实插件安装等结论，只适用于上述固定双 Commit 组合。迁移到 `custom/main` 后必须重新执行跨仓库组合验收。

## 2. 不可变边界

1. `custom/main` 继续以通用插件结果 Schema V2 为唯一新增结构化结果协议，不引入程序员插件专用渲染器。
2. 不复制旧 `ProgrammerMinimalResult` 到 `custom/main`。
3. 不重写、删除或弱化现有 `src/utils/plugin_result_schema.js`、`TranslationResult` 与设置 Schema V2。
4. 旧字符串、旧 Pot 原生对象和既有插件设置必须继续兼容。
5. 复制、自动复制、历史、朗读与反向翻译只消费可信纯文本，不把对象或 Schema JSON 写入剪贴板或历史。
6. 初始翻译、重试、流式更新、最终 resolve、reject 和反向翻译必须共享统一的请求生命周期保护。
7. `host` 是每次调用的运行时能力声明，不是用户配置，不持久化，不进入日志、历史、Gemini 请求或插件产物。
8. 本文中的旧方案代码只作为已经验收的行为证据，不能作为可直接合并到 `custom/main` 的代码来源。

## 3. 真实源码结论

### 3.1 社区主线已具备的通用能力

`custom/main@85d2ec8ec138c4f5aa685e872864f9ca4c451d39` 已具备：

- 严格数字 `schemaVersion: 2`；
- 顶层 `copyText`；
- `summary`、`metadata`、`dictionary`、`code-list`、`note`、`status` 六类受控 section；
- `local | ai | mixed | unknown` 来源；
- `info | success | warning | error` 状态严重度；
- 字符串、V2、旧对象和安全纯文本回退的统一 `TranslationResult`；
- V2 完整复制、自动复制、历史、朗读与反向翻译的 `copyText` 路径；
- 设置分组、帮助文字、密码遮罩、多行输入、有限条件显示和高级分组折叠。

因此，程序员插件的数据可以由现有通用 Schema V2 表达，不需要复制旧专用组件。

### 3.2 社区主线仍缺少的能力

当前 `TargetArea` 尚未冻结以下行为：

- 插件调用顶层没有声明 Schema V2 能力；
- 反向翻译未与初始翻译共享同一请求 ID；
- 反向翻译的流式、resolve 和 reject 可能覆盖后发请求；
- 请求级最终副作用尚未完全复用固定方案三的“仅当前最终结果”规则。

这些缺口属于后续桌面端任务，不属于本协调任务。

### 3.3 固定方案三可复用的行为证据

固定桌面端 Commit 已验证：

- `options.host` 位于每次插件调用顶层；
- `setResult` 不是结构化协议能力；
- 初始与反向翻译共享请求 ID；
- stale 流式、resolve 和 reject 均被忽略；
- 仅当前请求的最终可信全文触发历史和自动复制；
- 新请求重置折叠，同一请求更新保留当前显示；
- 全文复制严格使用 `plainText`，命名逐项复制严格使用命名值。

固定插件 Commit 已验证：

- `resultSchemas` 必须精确包含协议标识；
- `minimal` 和 `report` 在支持 v1 的宿主返回 v1；
- 不支持 v1但有 `setResult` 时返回旧 Pot 原生对象；
- 不支持 v1且没有 `setResult` 时返回完整纯文本；
- 直接命名输出模式继续返回字符串；
- AI 失败回退本地，诊断脱敏，API Key 不进入结果。

## 4. 架构比较与决定

| 维度 | 方案 A：桌面端增加 v1 适配器 | 方案 B：插件原生输出 Schema V2 |
|---|---|---|
| 社区主线协议 | 同时长期维护通用 V2 与程序员专用 v1 | 只长期维护通用 V2 |
| 桌面端改动 | 增加 v1 判定、映射与业务特判 | 只增加能力声明和请求生命周期补强 |
| 插件改动 | 较少 | 增加 V2 serializer 和多 Schema 路由 |
| 通用性 | v1 仅服务程序员插件 | 其他插件可复用 V2 |
| 安全边界 | 需要维护第二套输入校验 | 复用已存在的 V2 白名单归一化 |
| UI | 容易重新引入专用组件 | 复用 `TranslationResult` |
| 长期维护成本 | 较高 | 较低 |
| 组合验收 | 必须重新执行 | 必须重新执行 |

**决定采用方案 B：插件原生支持社区 Schema V2，同时保留 v1、旧 Pot 原生对象和完整纯文本回退。**

选择依据：

1. 六类现有 section 足以表达固定 v1 的全部业务语义；
2. `copyText` 已覆盖复制、历史、自动复制、朗读和反向翻译；
3. 现有 V2 归一化层已经实现字段白名单、限长和未知类型降级；
4. 方案 B 不在桌面端引入插件 ID、程序员业务字段或专用组件；
5. 插件现有路由已经是纯函数，适合在 v1 前增加 V2 优先级；
6. 插件改动虽增加 serializer，但边界可由固定 fixture 和兼容矩阵完整测试。

## 5. 宿主能力协议

### 5.1 Schema V2 能力标识

社区插件结果 Schema V2 的准确能力标识冻结为：

```text
pot.plugin-result.v2
```

命名依据：

- `pot` 表示 Pot 插件调用约定；
- `plugin-result` 表示通用插件结果，不绑定程序员插件；
- `v2` 与结果对象的数字 `schemaVersion: 2` 对应；
- 与程序员专用 `pot.programmer-result.v1` 明确区分。

该字符串只用于能力协商，不写入 V2 结果对象。V2 结果仍严格使用：

```json
{
  "schemaVersion": 2,
  "copyText": "完整纯文本",
  "sections": []
}
```

### 5.2 放置位置与形状

社区主线每次调用翻译插件时，在顶层传入：

```js
options.host = {
  name: 'pot-desktop',
  resultSchemas: ['pot.plugin-result.v2'],
  configSchemaVersion: 2
};
```

规则：

1. 初始翻译、重试和反向翻译使用同一个创建函数生成新的 `host` 对象。
2. `host` 不放入 `options.config`，不修改用户配置对象。
3. 不通过 `setResult`、宿主名称或返回对象的 `schemaVersion` 反推宿主能力。
4. `resultSchemas` 必须是数组并执行大小写敏感的精确匹配。
5. 未知能力标识一律忽略。
6. 每次调用重新声明，不依赖跨调用缓存。
7. `configSchemaVersion` 是设置 UI 能力提示，不参与结果 Schema 路由。
8. 社区主线不声明 `pot.programmer-result.v1`，避免把方案 B 误实现为桌面端 v1 适配器。

### 5.3 插件多 Schema 优先级

插件对 `minimal` 和 `report` 模式按以下固定优先级选择结果：

```text
pot.plugin-result.v2
→ pot.programmer-result.v1
→ 旧 Pot 原生对象
→ 完整纯文本
```

等价判断：

```js
if (resultSchemas.includes('pot.plugin-result.v2')) return createPluginResultV2(...);
if (resultSchemas.includes('pot.programmer-result.v1')) return createProgrammerResultV1(...);
if (typeof options.setResult === 'function') return createPotNativeReport(...);
return createCompletePlainTextReport(...);
```

若宿主同时声明 V2 和 v1，必须选择 V2。直接输出模式 `camel`、`pascal`、`snake`、`screaming`、`kebab`、`words`、`chinese` 继续遵循现有字符串语义，不包装为 V2 或 v1。

### 5.4 兼容矩阵

| 宿主条件 | `minimal` / `report` 返回 | 复制全文来源 |
|---|---|---|
| `resultSchemas` 包含 `pot.plugin-result.v2` | 社区 Schema V2 | 顶层 `copyText` |
| 不含 V2但包含 `pot.programmer-result.v1` | `pot.programmer-result.v1` | 顶层 `plainText` |
| 不含已知 Schema且有 `setResult` | 旧 Pot 原生对象 | 旧宿主既有行为 |
| 不含已知 Schema且无 `setResult` | 完整纯文本 | 返回字符串 |
| 同时包含 V2 与 v1 | 社区 Schema V2 | 顶层 `copyText` |
| 仅包含未知能力 | 根据 `setResult` 回退 | 旧对象或完整纯文本 |

## 6. v1 到 Schema V2 的字段映射

### 6.1 顶层

| v1 | Schema V2 | 冻结规则 |
|---|---|---|
| `plainText` | `copyText` | 原样使用，不从 sections 重新生成 |
| `schema` | `schemaVersion: 2` | 不复制 v1 字符串 |
| `presentation` | section 折叠提示 | 不参与有效性，不增加自定义字段 |

V2 serializer 必须先构造 sections，再使用社区主线的公开约束进行自校验。不得把 v1 对象嵌入 V2 扩展字段。

### 6.2 摘要

```js
{
  id: 'summary',
  type: 'summary',
  title: '核心释义',
  content: v1.summary.text,
  source: mappedSource,
  copyText: v1.summary.text
}
```

来源映射：

| v1 `summary.source` | V2 `source` |
|---|---|
| `local` | `local` |
| `local_ai` | `mixed` |
| `ai` | `ai` |
| `local_fallback` | `local` |

`local_fallback` 不映射为 `unknown`。其失败语义必须通过 `status` section 显式表达。

### 6.3 标识符

```js
{
  id: 'identifier',
  type: 'metadata',
  title: '标识符信息',
  collapsible: true,
  defaultCollapsed: true,
  items: [
    { label: '类型', value: v1.identifier.detectedType },
    { label: '原文', value: v1.identifier.original, copyText: v1.identifier.original },
    { label: '检测方式', value: v1.identifier.detectionMode }
  ],
  tokens: v1.identifier.tokens
}
```

`tokens` 按原顺序复制，不重新拆分、去重、大小写转换或合并。

### 6.4 逐词解释

```js
{
  id: 'token-meanings',
  type: 'dictionary',
  title: '逐词解释',
  collapsible: true,
  defaultCollapsed: true,
  items: []
}
```

每个 `tokenMeanings` 元素映射为一个 dictionary item：

| v1 `source` | V2 `source` | 可见语义 |
|---|---|---|
| `local` | `local` | 保留原 meaning |
| `ai` | `ai` | 保留原 meaning |
| `literal` | `unknown` | 明确显示“按原文保留” |

`literal` 的稳定规则：

- 若 `meaning` 已包含“保留原文”，原样使用；
- 否则显示为 `meaning + '（按原文保留）'`；
- 不依赖 `unknown` 标签或颜色传达该语义；
- item 的 `copyText` 使用最终可见的 token、音标和 meaning。

### 6.5 命名转换

```js
{
  id: 'naming',
  type: 'code-list',
  title: '命名转换',
  collapsible: true,
  defaultCollapsed: true,
  items: [
    { label: '小驼峰', value: naming.camelCase, copyText: naming.camelCase },
    { label: '大驼峰', value: naming.pascalCase, copyText: naming.pascalCase },
    { label: '下划线', value: naming.snakeCase, copyText: naming.snakeCase },
    { label: '大写下划线', value: naming.screamingSnakeCase, copyText: naming.screamingSnakeCase },
    { label: '短横线', value: naming.kebabCase, copyText: naming.kebabCase }
  ]
}
```

五项顺序固定。每项 `copyText` 只能是纯命名值，不包含标签、代码围栏或额外换行。空字符串项不生成 V2 item，但 v1 serializer 继续保留五个键。

### 6.6 diagnostics 与本地回退

每个 v1 diagnostic 必须映射为一个 `status` section：

```js
{
  id: stableDiagnosticId,
  type: 'status',
  title: `诊断 · ${diagnostic.code}`,
  content: `${diagnostic.message}\n可恢复：${diagnostic.recoverable ? '是' : '否'}`,
  severity: diagnostic.severity,
  collapsible: true,
  defaultCollapsed: true
}
```

规则：

- `message` 映射到 `content`；
- `info | warning | error` 原样映射；
- `code` 以纯文本保留在 title；
- `recoverable` 以“可恢复：是/否”显式保留，不通过颜色猜测；
- ID 由序号和经安全化的 code 生成，必须稳定且不冲突；
- 不写入底层异常、URL、请求头、Key、SQL、路径或堆栈。

当 `summary.fallback === true`：

1. 若存在 `code === 'ai.request_failed'` 的 diagnostic，该 diagnostic 使用稳定 ID `summary-fallback`，同时满足 diagnostic 与回退状态映射；
2. 若不存在该 diagnostic，额外生成 `summary-fallback` status，严重度 `warning`，内容为脱敏的本地回退说明；
3. 不生成两张内容相同的重复状态卡。

### 6.7 section 顺序

固定顺序：

```text
summary
identifier
token-meanings
naming
summary-fallback 或 diagnostics
```

同类 diagnostics 按 v1 原数组顺序排列。不得按严重度重新排序。

## 7. 折叠与请求生命周期

### 7.1 折叠

为保持固定方案三已验收的“新查询先看核心释义”行为：

- `summary` 不折叠；
- `identifier`、`token-meanings`、`naming` 和普通 diagnostics 默认折叠；
- `summary-fallback` 默认展开，确保本地回退可见；
- `presentation.preferredDensity` 和 `initiallyExpanded` 不作为协议有效性条件；
- V2 serializer 不向 section 注入社区 Schema 未定义的 density 字段。

同一请求的流式更新必须使用稳定 section ID，保留用户已展开状态。新请求必须先清空或按请求身份重建结果树，重置为上述默认状态。

### 7.2 stale 请求保护

后续桌面端实现必须复用以下决策：

1. 每次初始、重试或反向翻译创建新的局部请求 ID；
2. 流式 `setResult`、最终 resolve、reject 在写入任何状态前检查请求 ID；
3. stale 回调不得修改结果、错误、加载状态、折叠状态、剪贴板、通知或历史；
4. 流式结果只用于当前请求的显示，不触发最终副作用；
5. 只有当前请求的最终有效结果触发历史和自动复制；
6. 最终值不可显示但当前请求已有有效流式结果时，可以保留显示，但不得把流式结果当作最终结果写入历史或自动复制；
7. 反向翻译与初始翻译共用同一生命周期函数，不保留第二套无保护路径。

### 7.3 复制、历史和反向翻译

- V2 全文复制、自动复制、历史、朗读和反向翻译使用最终归一化 `copyText`；
- v1 旧宿主继续使用 `plainText`；
- 旧原生对象与纯文本继续使用既有兼容行为；
- 命名逐项复制使用对应 item 的纯值；
- 不从 section 标题和内容重新拼接顶层全文；
- 不对未知对象调用隐式 `toString()` 生成历史文本。

## 8. 插件设置 Schema V2 迁移

### 8.1 保留键和值

不得重命名、迁移、删除或改变以下现有保存键及值格式：

```text
outputStyle
dictionaryMode
identifierType
acronymStyle
showNamingConversions
showStatusMessages
aiMode
apiKeyPool
maxKeyAttempts
modelPreset
customModel
sendScope
```

现有字符串选项值保持不变，包括 `minimal`、`report`、`unknown_only`、`v1`、`v3`、`v5`、`v10`、`v20`、`custom` 和 `unknown_tokens`。

### 8.2 分组

建议分组与顺序冻结为：

1. `basic` / `基础设置`
   - 输出格式；
   - 本地词典显示；
   - 标识符类型；
   - AI 使用方式。
2. `result_display` / `结果与命名`
   - 缩写格式；
   - 显示命名转换；
   - 显示状态提示。
3. `ai_credentials` / `AI 凭据`
   - `apiKeyPool`。
4. `advanced_ai` / `高级 AI`
   - 最大 Key 尝试数；
   - 模型预设；
   - 自定义模型；
   - 发送范围。

`advanced_ai` 使用 `groupAdvanced: true`，默认折叠。

### 8.3 `apiKeyPool`

使用社区设置 Schema V2：

```json
{
  "key": "apiKeyPool",
  "display": "Gemini Key 池",
  "type": "input",
  "group": "ai_credentials",
  "groupDisplay": "AI 凭据",
  "description": "支持多个 Key，每行一个；# 前缀表示禁用。secret 仅提供界面遮罩，不代表加密存储。",
  "secret": true,
  "multiline": true,
  "rows": 4,
  "visibleWhen": {
    "key": "aiMode",
    "operator": "notEquals",
    "value": "off"
  }
}
```

规则：

- 默认遮罩；
- 多行编辑；
- 只在 `aiMode != off` 时显示；
- 不改变原字符串格式；
- 不删除已有值；
- 不发送网络请求校验 Key；
- 不记录 Key；
- 测试只使用明确标注的假 Key。

### 8.4 高级 AI 条件

- `maxKeyAttempts`、`modelPreset`、`sendScope` 使用 `visibleWhen.operator = notEquals`，条件为 `aiMode != off`；
- `customModel` 使用 `visibleWhen.operator = equals`，条件为 `modelPreset == custom`；
- 当前 Schema V2 只支持单个有限条件，不引入任意逻辑表达式；
- 隐藏字段保留原配置值；
- `secret` 是 UI 遮罩，不代表加密存储；
- 本迁移不实现 Key 加密、Key 有效性检查或配置数据库迁移。

### 8.5 禁止继续使用的旧临时字段

迁移后不得使用：

```text
type: secret
type: section
section
visibleWhen.equals
visibleWhen.notEquals
visibleWhen.oneOf
```

必须使用 `type: input` 加 `secret: true`，以及 `visibleWhen.operator` / `visibleWhen.value`。

## 9. 后续三个阶段

### 9.1 `MIN-CUSTOM-PLUGIN-01`

名称：**程序员插件接入社区 Schema V2 与配置 Schema V2**

基线：执行时最新 `backup/minimal-programmer-tool-ui`。该分支承载固定 v1 实现；不得以插件 `main` 创建发布 PR。

职责：

- 增加 V2 serializer；
- 实现 V2 → v1 → 旧对象 → 纯文本优先级；
- 保留直接字符串输出；
- 迁移 `info.json`；
- 增加固定 fixture、兼容矩阵和敏感信息测试；
- 生成并审计 `.potext` Artifact。

允许修改：

```text
info.json
src/runtime-05-pot-native-report.js
src/runtime-08-programmer-result-schema.js
src/runtime-09-output-style-compat.js
src/runtime-10-plugin-result-v2.js
main.js
tests/programmer-result-schema.test.cjs
tests/programmer-result-integration.test.cjs
tests/output-style-compat.test.cjs
tests/pot-native-report.test.cjs
tests/plugin-result-v2.test.cjs
tests/plugin-config-v2.test.cjs
```

禁止修改桌面端仓库、词典数据库、Key 状态存储、Gemini 请求协议、依赖和工作流。若构建脚本按 `runtime-*.js` 自动收集，无需修改 `scripts/build_runtime.py`。

### 9.2 `MIN-CUSTOM-DESKTOP-01`

名称：**社区主线宿主能力与请求生命周期补强**

职责：

- 从执行时最新 `custom/main` 创建独立分支；
- 为每次初始、重试和反向翻译传入 V2 host；
- 统一流式、resolve、reject 与反向翻译的请求 ID；
- 仅让当前最终 `copyText` 触发历史和自动复制；
- 继续复用 `TranslationResult`；
- 不实现 v1 适配器，不复制 `ProgrammerMinimalResult`。

允许修改：

```text
src/utils/plugin_host_capabilities.js
src/window/Translate/components/TargetArea/index.jsx
src/window/Translate/components/TargetArea/result_flow.js
tests/plugin_host_capabilities.test.mjs
tests/target_area_result_flow.test.mjs
```

现有 `src/utils/plugin_result_schema.js`、`TranslationResult/` 和 `PluginConfig/` 不在初始修改范围。若实现证明必须扩展范围，应停止写入并通过独立评审更新契约。

### 9.3 `MIN-CUSTOM-COMBO-01`

名称：**社区维护版 Schema V2 最终组合验收**

该阶段不开发新功能，只在插件和桌面端阶段完成后执行只读组合验收。至少覆盖：

- `NFC_WriteU16LE`；
- `getCustomxyzValue`；
- `RxBufLen`；
- `ST25DV_i2c_WriteData`；
- V2 sections、`copyText`、逐项复制；
- 自动复制和 History；
- 流式、resolve、reject、重试和反向翻译竞态；
- 配置分组、高级折叠、Key 遮罩、多行输入和条件显示；
- 320px、200% 缩放、键盘、亮暗主题；
- AI 无网络回退；
- v1 固定旧宿主；
- 旧 Pot 原生对象；
- 无结构化能力的完整纯文本宿主；
- Artifact 内容和敏感信息审计。

阶段 1 与阶段 2 可在本契约合并后并行；阶段 3 必须等待两个实现阶段各自完成并固定待验收 SHA。

## 10. 开放 PR、依赖和冲突

协调时确认的开放 PR：

### 桌面端

- PR #1：仅修改 `plugins/code-identifier/` 和相关工作流；
- PR #2：仅修改 `plugins/code-identifier/` 和相关工作流；
- PR #7：仅修改 `tools/ai/superpowers/`。

### 插件端

- PR #7：仅修改 `tools/ai/superpowers/`。

当前与本协调分支的四个 Markdown 文件无重叠。后续实现阶段开始前必须重新检查开放 PR 和最新基线；不得修改、关闭、合并或覆盖上述 PR。

依赖关系：

```text
MIN-CUSTOM-00 契约冻结
├─ MIN-CUSTOM-PLUGIN-01
└─ MIN-CUSTOM-DESKTOP-01
   └─ 两者固定待验收 SHA 后执行 MIN-CUSTOM-COMBO-01
```

## 11. 风险与回滚

### 风险

- 多 Schema 路由顺序实现错误会让新宿主收到 v1 或旧对象；
- `literal` 映射不完整会丢失“按原文保留”语义；
- 不稳定 section ID 会让同一请求更新重置折叠；
- 反向翻译若保留旧路径会重新引入 stale 覆盖；
- `copyText` 若由 sections 重建可能与固定 `plainText` 不一致；
- 设置迁移若改键或默认值可能造成现有用户配置失效；
- `secret` 容易被误解为加密存储；
- 新组合尚未经过真实 Windows x64 GUI 与安装包验收。

### 回滚

- 协调 PR 仅包含 Markdown，可直接回滚该文档 Commit；
- 插件实现可回退到固定 Commit `3862162e01396b39edb9a3634a2067707ea0689f`，继续提供 v1、旧对象和纯文本；
- 桌面端实现可回退到其实现前 `custom/main`，现有通用 V2 继续可用；
- 不通过回滚删除用户配置值；
- 不回滚或改写固定验收分支、Commit 和 Artifact。

## 12. 完成条件

本契约只有在以下条件同时满足后才能视为进入实现阶段：

- 方案 B 和能力标识 `pot.plugin-result.v2` 已通过协调 PR 评审；
- v1 → V2 映射无未定义字段；
- 插件和桌面端文件边界无重叠；
- 三个后续任务 Prompt 已固定；
- 开放 PR 冲突已记录；
- 未要求直接合并旧方案分支；
- 未要求重写或删除社区 Schema V2；
- 未把自动化测试描述为真实 GUI 验收；
- 协调 PR 保持 Draft，未经授权不转 Ready、不合并。
