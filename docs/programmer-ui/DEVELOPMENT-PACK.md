# 方案三：极简程序员工具方案——Pot Desktop 开发包

## 0. 分支与状态

- 仓库：`elio-zwd/pot-desktop`
- 本分支：`backup/programmer-minimal-tool-ui`
- 固定基线：`master@594d32ede96acd106b0256deaa8bb440ffcdff40`
- 对应插件分支：`elio-zwd/pot-app-translate-plugin-programmer-selection@backup/minimal-programmer-tool-ui`
- 状态：**备用冻结，不得开发，除非用户明确激活**
- 激活后的目标 PR Base：`master`

本方案将程序员查询做成高密度、低干扰工具：默认只显示核心释义和来源，用户点击后展开结构、逐词、命名和诊断。实现必须仍是通用 Schema Renderer，不硬编码插件 ID。

## 1. Plan

### 1.1 默认界面

折叠状态：

```text
RxBufLen
接收缓冲区长度                         AI 结果
                                    展开详情
```

展开状态：

1. 标识符结构；
2. 逐词解释；
3. 命名转换；
4. 异常诊断；
5. 收起详情。

正常时不显示：类型推断说明、网络请求状态、词典状态、空诊断区和全部设置摘要。

### 1.2 数据适配

复用 `pot.programmer-result.v1` 与统一标准化层：

- `summary` 用于折叠首屏；
- `plainText` 用于复制、自动复制和历史记录；
- `identifier/tokenMeanings/naming/diagnostics` 用于展开详情；
- 可选 `presentation.preferredDensity=minimal` 仅作为提示；
- 缺少 presentation 时仍可正常极简渲染。

未知 Schema 安全回退到 `plainText`，旧字符串和旧词典对象继续使用原渲染器。

### 1.3 交互原则

- 整张结果摘要可展开，但复制等按钮必须是独立可访问控件；
- 展开状态仅保存在当前结果组件，不持久化；
- 新查询默认恢复折叠；
- AI 失败回退时摘要仍显示本地结果，并保留一个醒目的异常图标/短文案；
- 详情区必须支持键盘操作和屏幕阅读器；
- 命名结果逐项复制，另提供复制全文；
- 320px 级窄窗口不得横向滚动。

### 1.4 设置页

默认只展示：

- AI 使用方式；
- Key 池；
- “更多设置”折叠入口。

更多设置中包含模型、发送范围、结果形式、词义内容、命名显示、诊断信息和 Key 尝试上限。

仍需支持旧插件 `input/select`。新控件通过通用配置 Schema 提供，不以插件 ID 分支实现。

### 1.5 四场景

- `NFC_WriteU16LE`：折叠卡只显示完整本地释义和“本地结果”。
- `getCustomxyzValue`：折叠卡显示补全释义和“本地 + AI”；详情标记具体 AI token。
- `RxBufLen`：折叠卡显示 AI 释义；详情保留固定本地 token 来源。
- `ST25DV_i2c_WriteData`：折叠卡显示本地回退释义和短警告；详情显示安全诊断。

## 2. Tasks

### 2.1 激活门禁

未看到用户明确“激活方案三”时，所有 AI 只能读取、评审和更新计划，禁止创建功能 task 分支、修改代码或创建 PR。

### 2.2 激活后的并行波次

#### Wave 0

- `MIN-DESKTOP-00`：协调者冻结标准化结果 API、极简组件 API、配置 Schema 与文件边界；检查开放 PR #1/#2 及其他同文件 PR。

#### Wave 1：三项可并行

- `MIN-DESKTOP-01 结果标准化层`
  - 分支：`task/min-desktop-result-normalizer`
  - 新增字符串、旧对象、新 Schema、未知 Schema 的统一适配与测试。
  - 不开发 UI，不修改 PluginConfig。

- `MIN-DESKTOP-02 极简结果组件`
  - 分支：`task/min-desktop-summary-details`
  - 只新增折叠摘要、详情区、逐项复制和无障碍测试组件；使用静态 fixture。
  - 不修改 TargetArea、历史和配置页。

- `MIN-DESKTOP-03 极简配置页`
  - 分支：`task/min-desktop-config-disclosure`
  - 扩展通用配置 Schema，默认展示核心设置并折叠高级设置；保持旧 input/select。
  - 不修改结果组件和 TargetArea。

#### Wave 2：串行接入

- `MIN-DESKTOP-04 TargetArea、复制与历史`
  - 分支：`task/min-desktop-result-integration`
  - 等前三项合并后接入标准化结果和极简组件；统一使用 `plainText`。
  - 新查询重置折叠状态，未知 Schema 回退，不改变旧服务行为。

#### Wave 3：组合验收

- `MIN-DESKTOP-05 体验与回归`
  - 固定插件 Commit，验证四场景、键盘、屏幕阅读器语义、浅色/深色、320px 窗口、复制全文和旧结果回归。

### 2.3 文件冲突规则

- Renderer AI 只新增组件目录和组件测试；
- Config AI 只修改 PluginConfig、配置组件及 i18n/测试；
- Normalizer AI 新增纯函数，不在 Wave 1 修改 TargetArea；
- 只有 Integration AI 可以在 Wave 2 修改 TargetArea、复制和历史主路径；
- 不修改或关闭旧 PR #1/#2。

## 3. Handoff

### 3.1 对插件的能力声明

```js
host: {
  name: 'pot-desktop',
  resultSchemas: ['pot.programmer-result.v1'],
  configSchemaVersion: 1,
  presentationCapabilities: ['summary-details', 'per-item-copy']
}
```

字段放置位置必须与插件协调者共同确认并记录双方 Commit，不得单边改变。

### 3.2 消费规则

- 首屏只读取 `summary`，但不能丢弃其余数据；
- 详情按稳定字段渲染，不解析插件中文 trait；
- `plainText` 是复制和历史的唯一可信全文；
- `presentation` 是提示，不是协议必需字段；
- `diagnostics=[]` 时不渲染诊断容器。

### 3.3 发布门禁

如果插件只返回极简摘要但桌面端详情组件未发布，禁止发布该组合。可回滚到插件 `report` 默认、方案一或方案二，不得让用户失去逐词与命名信息。

### 3.4 完成定义

- 默认折叠首屏清晰；
- 一次操作可展开完整详情，一次操作可收起；
- 复制全文和逐项复制正确；
- 新查询重置状态；
- 键盘和辅助技术可操作；
- 旧结果、未知 Schema、历史和自动复制无回归；
- 四场景和窄窗口完成真实组合验收。

## 4. AI Prompts

### 4.1 备用方案守门 Prompt

```text
你负责评审 elio-zwd/pot-desktop 的 backup/programmer-minimal-tool-ui。先读取本分支 docs/programmer-ui/DEVELOPMENT-PACK.md，并确认用户是否明确激活方案三。
未激活时只能检查最新 master、开放 PR、文件冲突、无障碍和发布风险，不得修改功能代码、创建 task 分支或 PR。已激活后先冻结标准化 API、组件 API 和文件边界。
```

### 4.2 标准化层任务 Prompt

```text
仅在方案三已激活后，从 backup/programmer-minimal-tool-ui 最新 Head 创建 task/min-desktop-result-normalizer。
实现 MIN-DESKTOP-01：新增 normalizePluginResult 纯函数和测试，统一字符串、旧词典对象、pot.programmer-result.v1 和未知 Schema，稳定提供 plainText、summary 和详情数据。
不要修改 TargetArea、PluginConfig 或开发 UI。创建 Draft PR，Base 为 backup/programmer-minimal-tool-ui。
```

### 4.3 极简组件任务 Prompt

```text
仅在方案三已激活后，从 backup/programmer-minimal-tool-ui 最新 Head 创建 task/min-desktop-summary-details。
实现 MIN-DESKTOP-02：只新增极简摘要/展开详情组件和静态 fixture 测试。覆盖本地、本地+AI、AI、AI失败本地回退四状态；实现键盘可操作、ARIA 状态、逐项复制 UI、窄窗口和浅深色适配。
不要修改 TargetArea、PluginConfig、历史或插件调用。创建 Draft PR，Base 为 backup/programmer-minimal-tool-ui。
```

### 4.4 极简配置任务 Prompt

```text
仅在方案三已激活后，从 backup/programmer-minimal-tool-ui 最新 Head 创建 task/min-desktop-config-disclosure。
实现 MIN-DESKTOP-03：扩展通用插件配置 Schema，默认显示核心设置，更多设置折叠；支持 secret、textarea、switch、help、visibleWhen，同时保持旧 input/select。
不要修改 TargetArea 或结果组件。创建 Draft PR，Base 为 backup/programmer-minimal-tool-ui。
```

### 4.5 集成任务 Prompt

```text
等待 normalizer、summary-details、config 三个任务合并后，从 backup/programmer-minimal-tool-ui 最新 Head 创建 task/min-desktop-result-integration。
接入标准化结果和极简组件；复制、自动复制和历史统一使用 plainText；新查询重置展开状态；旧对象和未知 Schema 安全回退。
固定对应插件 Commit，验证四个场景。创建 Draft PR，Base 为 backup/programmer-minimal-tool-ui，不自动合并到 master。
```

### 4.6 只读验收 AI Prompt

```text
检出协调者指定的方案三桌面端 Commit，只允许读取、构建、测试和 GUI/无障碍验收；禁止修改、提交、push 或合并。
记录环境、工具版本、命令、退出码、关键日志和截图。使用指定插件 Commit 验证四个输入、默认折叠、展开/收起、键盘操作、复制全文、逐项复制、历史、自动复制、浅色/深色和 320px 窗口；回归字符串和旧词典对象。失败项原样反馈，不自动修复。
```
