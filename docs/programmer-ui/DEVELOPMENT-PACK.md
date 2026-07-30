# 方案二：卡片分层方案——Pot Desktop 开发包

## 0. 分支与状态

- 仓库：`elio-zwd/pot-desktop`
- 本分支：`feat/programmer-card-layered-ui`
- 固定基线：`master@594d32ede96acd106b0256deaa8bb440ffcdff40`
- 对应插件分支：`elio-zwd/pot-app-translate-plugin-programmer-selection@feat/card-layered-ui`
- 状态：**主方案，可启动开发**
- 目标 PR Base：`master`

本分支实现通用、版本化的插件配置和结构化结果承载能力，不把程序员插件 ID 硬编码进主流程。旧插件和内置翻译服务必须保持兼容。

## 1. Plan

### 1.1 目标界面

对 `schema=pot.programmer-result.v1` 渲染以下层级：

1. 核心释义：首屏突出，显示来源标签；
2. 标识符结构：原文、识别类型、拆分 token；
3. 逐词解释：默认展开或按内容长度折叠，显示本地/AI/未知来源；
4. 命名转换：按格式分组，每项有复制按钮；
5. 诊断：正常不显示，仅异常时显示。

设置页支持：

- 分区：结果、AI、显示、高级；
- `switch`、`secret`、`textarea`、`select`、普通输入；
- 帮助文本；
- `visibleWhen` 条件显示；
- 高级设置折叠；
- 旧 `input/select` 插件保持原样。

### 1.2 通用结果架构

新增结果适配层，而不是继续在 `TargetArea` 中堆叠条件：

```text
插件原始结果
  -> normalizePluginResult(result)
     -> kind=string：旧文本渲染
     -> kind=legacy-dictionary：旧词典渲染
     -> kind=structured + schema：Schema Renderer Registry
          -> pot.programmer-result.v1：ProgrammerResultCard
```

统一导出：

```js
{
  raw,
  kind,
  schema,
  plainText,
  canSpeak,
  renderData
}
```

复制、自动复制、历史记录一律使用 `plainText`。TTS 只在结果明确提供可朗读文本时启用，不能对对象直接调用字符串方法。

### 1.3 兼容边界

- 字符串结果继续使用现有文本区域；
- 旧 `pronunciations/explanations/associations/sentence` 对象继续使用旧渲染器；
- 未识别 `schema` 必须安全降级到 `plainText`，不能白屏；
- 插件配置缺少新元数据时继续按当前 `input/select` 逻辑渲染；
- 历史数据库仍写 TEXT，结构化对象不能直接写入；
- 不执行插件返回 HTML，不使用 `dangerouslySetInnerHTML` 渲染结构化字段；
- 样式必须适配浅色、深色和窄窗口。

### 1.4 卡片行为

- 核心释义永远在最上方；
- 来源标签由枚举映射，不依赖插件中文文案；
- token 使用换行/自动换列，禁止横向溢出；
- 命名值使用等宽显示并允许逐项复制；
- 展开状态只保存在当前组件内，不写入全局配置；
- 正常 diagnostics 为空时不留空白区域；
- AI 失败回退使用警告样式，但核心本地结果仍正常显示。

### 1.5 四个组合验收场景

- `NFC_WriteU16LE`：绿色/本地来源，核心释义完整，无诊断。
- `getCustomxyzValue`：本地 token 与 AI token 来源可区分，核心释义为补全结果。
- `RxBufLen`：整体 AI 释义标签可见，固定本地 token 仍标记本地技术规则。
- `ST25DV_i2c_WriteData`：本地回退核心释义正常，单条 AI 失败诊断醒目但不抢占主内容。

## 2. Tasks

### 2.1 多 AI 并行原则

每个 AI 对话只能负责一个任务分支和一个 Draft PR。任务分支从本方案分支当时固定 Head 创建，PR Base 为 `feat/programmer-card-layered-ui`。开始前检查开放 PR，禁止覆盖其他对话修改。

#### Wave 0：协调者

- `CARD-DESKTOP-00`：冻结 Schema 映射、目录结构、组件 API 和测试策略；不写功能代码。

#### Wave 1：三项可并行

- `CARD-DESKTOP-01 结果标准化层`
  - 建议分支：`task/card-desktop-result-normalizer`
  - 新增纯函数适配器及测试；负责 `plainText`、未知 Schema 回退、copy/history/TTS 能力判定。
  - 允许最小修改 `TargetArea` 接入点；不得修改插件设置页。

- `CARD-DESKTOP-02 程序员结果卡片`
  - 建议分支：`task/card-desktop-programmer-renderer`
  - 只新增 Schema Renderer Registry、程序员卡片组件及组件测试/Story fixture。
  - 不修改历史数据库、自动复制或 PluginConfig。

- `CARD-DESKTOP-03 插件配置 Schema UI`
  - 建议分支：`task/card-desktop-plugin-config-schema`
  - 扩展 `PluginConfig` 支持 section/control/help/visibleWhen/sensitive/rows；保持旧 input/select。
  - 不修改 TargetArea 和结果渲染组件。

#### Wave 2：依赖 Wave 1

- `CARD-DESKTOP-04 TargetArea 与历史/复制接入`
  - 建议分支：`task/card-desktop-result-integration`
  - 使用标准化结果统一复制、自动复制、历史存储和 TTS；接入 Schema Renderer。
  - 不重新实现卡片内部布局。

#### Wave 3：串行集成

- `CARD-DESKTOP-05 组合验收与回归`
  - 合并各 task PR 到本方案分支；固定插件 Commit；验证四场景、旧插件、内置服务、窄窗口和深色模式。
  - 仅在证据齐全后创建面向 `master` 的 Draft PR，不自动合并。

### 2.2 文件边界建议

为降低并行冲突：

- Normalizer AI：新增 `src/utils` 或翻译组件附近独立适配器与独立测试；只在最终接入阶段修改 `TargetArea`。
- Renderer AI：只新增 `StructuredResult` 目录，不碰 `PluginConfig`。
- Config AI：只修改 `PluginConfig` 和对应测试/i18n；不碰翻译结果区域。
- Integration AI：在前三项合并后串行修改 `TargetArea`、历史和复制路径。

不得让多个 AI 同时修改 `TargetArea`。

## 3. Handoff

### 3.1 对插件的能力声明

调用插件时提供：

```js
host: {
  name: 'pot-desktop',
  resultSchemas: ['pot.programmer-result.v1'],
  configSchemaVersion: 1
}
```

若实际调用 API 需要不同放置位置，必须先与插件协调者更新双方开发包，不得单方面猜测。

### 3.2 插件结果消费规则

- `plainText`：复制、自动复制、历史记录和未知 Schema 回退；
- `summary`：核心释义；
- `identifier`：结构卡；
- `tokenMeanings`：逐词解释；
- `naming`：仅展示和复制，不在桌面端重新计算；
- `diagnostics`：仅异常信息。

主程序不能依赖 token 固定数量、固定中文标签或 Gemini 原始响应。

### 3.3 冲突与旧 PR

仓库已有旧的程序员插件迁移 PR #1/#2。它们不作为本方案代码基线。本方案不复制、关闭、覆盖或合并这些 PR；若修改相同核心文件，必须在新 PR 描述中明确潜在冲突和处理顺序。

### 3.4 完成定义

- 前端构建与可用测试真实通过；
- 旧字符串和旧词典对象渲染无回归；
- 结构化对象的复制、自动复制和历史记录使用 `plainText`；
- 未知 Schema 安全回退；
- 插件配置旧格式兼容；
- 四个组合场景、浅色/深色、320px 级窄窗口完成验收；
- 没有把插件内容作为任意 HTML 执行。

## 4. AI Prompts

### 4.1 桌面端协调者 Prompt

```text
你负责 elio-zwd/pot-desktop 的程序员插件卡片分层方案协调工作。
先读取 master 的 README、package.json、插件调用桥接、PluginConfig、TargetArea，以及 feat/programmer-card-layered-ui 上的 docs/programmer-ui/DEVELOPMENT-PACK.md；检查开放 PR #1/#2 和其他同文件 PR。
先冻结目录、Schema Renderer API、normalizePluginResult API 和各任务文件边界，再允许 task PR 开发。一个对话只负责一个分支和一个 PR，不得并行修改 TargetArea。
所有 PR Base 指向 feat/programmer-card-layered-ui。未经用户授权不得合并到 master、关闭旧 PR 或强制更新分支。汇报必须区分实际测试、CI、静态检查和未验证项。
```

### 4.2 结果标准化任务 Prompt

```text
从 feat/programmer-card-layered-ui 最新固定 Head 创建 task/card-desktop-result-normalizer。
只实现 CARD-DESKTOP-01：新增 normalizePluginResult 纯函数和测试，统一字符串、旧词典对象、pot.programmer-result.v1、未知 Schema 的 plainText 与能力判定。
不要开发卡片 UI，不要修改 PluginConfig，不要直接写历史数据库迁移。若必须接触 TargetArea，只保留最小可审查接入并提前报告文件冲突。
创建 Draft PR，Base 为 feat/programmer-card-layered-ui，提供真实测试命令和输出。
```

### 4.3 卡片渲染任务 Prompt

```text
从 feat/programmer-card-layered-ui 最新固定 Head 创建 task/card-desktop-programmer-renderer。
只实现 CARD-DESKTOP-02：新增通用 Schema Renderer Registry 和 pot.programmer-result.v1 卡片组件。实现核心释义、标识符结构、逐词折叠、命名逐项复制 UI、异常诊断；适配浅色、深色和窄窗口。
使用静态 fixture，不调用真实插件或 Gemini。不修改 TargetArea、PluginConfig、历史和自动复制代码。创建 Draft PR，Base 为 feat/programmer-card-layered-ui。
```

### 4.4 配置 UI 任务 Prompt

```text
从 feat/programmer-card-layered-ui 最新固定 Head 创建 task/card-desktop-plugin-config-schema。
只实现 CARD-DESKTOP-03：让 PluginConfig 在兼容旧 input/select 的同时支持 section、switch、secret、textarea、help、visibleWhen、sensitive 和高级折叠。实现无效元数据安全回退和必要 i18n/测试。
不要修改 TargetArea 或结构化结果组件。创建 Draft PR，Base 为 feat/programmer-card-layered-ui，列出旧插件兼容验证。
```

### 4.5 集成任务 Prompt

```text
等待 normalizer、renderer、config 三个任务合并后，从 feat/programmer-card-layered-ui 最新 Head 创建 task/card-desktop-result-integration。
接入 normalizePluginResult 和 Schema Renderer；让复制、自动复制、历史记录统一使用 plainText，TTS 根据能力判定启用。验证未知 Schema 和旧对象回退。
不要重写卡片内部实现或配置 Schema。创建 Draft PR，Base 为 feat/programmer-card-layered-ui，并固定对应插件 Commit SHA 做四场景组合验证。
```

### 4.6 只读验收 AI Prompt

```text
拉取 elio-zwd/pot-desktop，检出协调者指定分支和 Commit。只允许读取、安装依赖、构建、测试和 GUI 验收；禁止修改、格式化、提交、push、创建或合并 PR。
记录操作系统、Node/npm 或 pnpm 版本、命令、退出码和关键日志。使用协调者指定的插件 .potext/Commit，验证 NFC_WriteU16LE、getCustomxyzValue、RxBufLen、ST25DV_i2c_WriteData；同时回归字符串翻译、旧词典对象、复制、自动复制、历史记录、TTS 禁用状态、浅色/深色和窄窗口。
将失败项、截图、复现步骤与可能原因反馈给远端开发对话，不进行自动修复。
```
