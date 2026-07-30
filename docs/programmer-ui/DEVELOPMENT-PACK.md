# 方案一：稳妥优化方案——Pot Desktop 开发包

## 0. 分支与状态

- 仓库：`elio-zwd/pot-desktop`
- 本分支：`backup/programmer-safe-ui-optimization`
- 固定基线：`master@594d32ede96acd106b0256deaa8bb440ffcdff40`
- 对应插件分支：`elio-zwd/pot-app-translate-plugin-programmer-selection@backup/safe-ui-optimization`
- 状态：**备用冻结，不得开发，除非用户明确激活**
- 激活后的目标 PR Base：`master`

本方案只做通用旧结果渲染与配置页的小幅优化，不引入新的程序员结果 Schema，不把程序员插件硬编码进桌面端。

## 1. Plan

### 1.1 目标

1. 保持字符串与旧词典对象渲染逻辑；
2. 改善 explanation 行距、长文本换行和窄窗口表现；
3. 为旧对象提供统一纯文本提取，使复制和历史记录不再只支持字符串；
4. 配置页继续使用 `input/select`，仅改善布局和长字段显示；
5. 不实现内部卡片、token 来源标签、逐项命名复制或动态设置分区。

### 1.2 最小改动边界

建议新增 `legacyResultToPlainText(result)` 纯函数，并在以下路径复用：

- 复制；
- 自动复制；
- 历史记录；
- 未支持对象的文本回退。

旧词典对象渲染保持现有字段：

- `pronunciations`；
- `explanations`；
- `associations`；
- `sentence`。

不得执行插件返回 HTML，不改变内置服务数据结构。

### 1.3 设置页

仅允许：

- 改善长 label 和输入框比例；
- Key 池输入字段在窄窗口不溢出；
- 下拉菜单长文本换行；
- 保持未知 type 的当前安全回退。

不得增加只服务单个插件的特殊判断。

### 1.4 四场景

桌面端只负责忠实展示插件已优化顺序：

- `NFC_WriteU16LE`：首行核心本地释义；
- `getCustomxyzValue`：AI 补全标记可读；
- `RxBufLen`：AI 核心释义可读；
- `ST25DV_i2c_WriteData`：本地回退和异常提示可见。

## 2. Tasks

### 2.1 激活门禁

没有用户明确“激活方案一”时，所有 AI 只能读取和评审本开发包，禁止创建功能 task 分支、修改代码或创建 PR。

### 2.2 激活后的任务

#### Wave 0

- `SAFE-DESKTOP-00`：协调者检查最新 master、开放 PR #1/#2 和其他同文件 PR，冻结最小文件边界。

#### Wave 1：可并行

- `SAFE-DESKTOP-01 旧结果纯文本适配`
  - 分支：`task/safe-desktop-legacy-plain-text`
  - 新增纯函数和测试；在最终集成前不修改 PluginConfig。

- `SAFE-DESKTOP-02 配置页响应式微调`
  - 分支：`task/safe-desktop-plugin-config-layout`
  - 只修改 PluginConfig 的通用布局和对应测试；不修改 TargetArea。

- `SAFE-DESKTOP-03 旧词典结果排版`
  - 分支：`task/safe-desktop-legacy-result-layout`
  - 只处理旧对象渲染的换行、间距和窄窗口；不修改复制、历史或配置页。

#### Wave 2：串行

- `SAFE-DESKTOP-04 集成复制与历史`
  - 等前三项合并后，统一接入 `legacyResultToPlainText`；不得重写插件输出。

### 2.3 并行冲突规则

- 只有集成任务可以修改复制、自动复制和历史写入主路径；
- PluginConfig AI 不修改 TargetArea；
- 排版 AI 不修改 plain-text 适配器；
- 不关闭或修改旧 PR #1/#2。

## 3. Handoff

### 3.1 插件契约

继续消费旧 Pot 结果，不提供 `host.resultSchemas` 强依赖。插件决定 explanation 顺序和状态文案，桌面端不解析 trait 的中文含义。

### 3.2 完成定义

- 旧字符串和旧词典对象无回归；
- 对象复制与历史记录得到稳定纯文本；
- 长 token、长 Key 池和 320px 级窗口不横向溢出；
- 四场景在 fork Pot 可读；
- 原版 Pot 的行为由插件侧单独验证；
- 构建和测试证据真实存在。

### 3.3 风险

- 方案能力有限，不能实现真正卡片和折叠；
- TargetArea 是高冲突文件，必须最后串行接入；
- 旧对象转文本规则必须稳定，否则历史内容可能变化。

## 4. AI Prompts

### 4.1 备用方案守门 Prompt

```text
你负责评审 elio-zwd/pot-desktop 的 backup/programmer-safe-ui-optimization。先读取本分支 docs/programmer-ui/DEVELOPMENT-PACK.md，并确认用户是否已明确激活方案一。
未激活时只能检查最新 master、开放 PR、文件冲突和风险，不得修改代码、创建 task 分支或 PR。已激活后才按任务边界开发，所有 task PR Base 指向 backup/programmer-safe-ui-optimization。
```

### 4.2 旧结果适配任务 Prompt

```text
仅在方案一已激活后，从 backup/programmer-safe-ui-optimization 最新 Head 创建 task/safe-desktop-legacy-plain-text。
实现旧字符串/旧词典对象到 plainText 的纯函数和测试，覆盖 explanations、associations、pronunciations、sentence 和非法对象。不要开发新 Schema Renderer，不修改 PluginConfig，也不要在本任务接入 TargetArea 主路径。
创建 Draft PR，Base 为 backup/programmer-safe-ui-optimization。
```

### 4.3 配置布局任务 Prompt

```text
仅在方案一已激活后，从 backup/programmer-safe-ui-optimization 最新 Head 创建 task/safe-desktop-plugin-config-layout。
只做 PluginConfig 通用响应式微调，确保长 label、Key 池和下拉文本在窄窗口可用；保持旧 input/select 行为，不增加程序员插件 ID 特判。
不要修改 TargetArea 或历史/复制代码。创建 Draft PR，Base 为 backup/programmer-safe-ui-optimization。
```

### 4.4 旧结果排版任务 Prompt

```text
仅在方案一已激活后，从 backup/programmer-safe-ui-optimization 最新 Head 创建 task/safe-desktop-legacy-result-layout。
只改善旧 pronunciations/explanations/associations/sentence 渲染的间距、换行和窄窗口表现，不改变字段语义，不执行插件 HTML，不修改复制、历史和 PluginConfig。
创建 Draft PR，Base 为 backup/programmer-safe-ui-optimization。
```

### 4.5 只读验收 AI Prompt

```text
检出协调者指定的方案一桌面端 Commit，只允许读取、构建、测试和 GUI 验收；禁止修改、提交、push 或合并。
记录环境、命令和日志。使用指定插件版本验证四个输入，并回归字符串翻译、旧词典对象、复制、自动复制、历史记录、浅色/深色和窄窗口。失败项原样反馈，不自动修复。
```
