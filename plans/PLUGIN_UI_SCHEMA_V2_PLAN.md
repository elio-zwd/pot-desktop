# 插件设置 Schema V2 开发计划

## 1. 仓库与基线

- 仓库：`https://github.com/elio-zwd/pot-desktop`
- 上游：`https://github.com/pot-app/pot-desktop`
- 功能分支：`feat/plugin-ui-schema-v2`
- Base：`custom/main`
- Base SHA：`594d32ede96acd106b0256deaa8bb440ffcdff40`
- 配套结果页分支：`feat/plugin-result-schema-v2`
- 视觉方向：`docs/assets/plugin-ui-schema-v2-card-layering-concept.svg`

概念图只定义大致方向，不要求像素级复刻。真实实现必须服从 Pot 当前窗口尺寸、NextUI 组件行为、主题适配和旧插件兼容性。

## 2. 已确认决定

1. 设置页与结果页同时推进，但拆成两个独立分支和两个 Draft PR。
2. 本分支只负责插件设置页与设置 Schema V2。
3. API Key 第一阶段只实现：
   - 密码遮罩；
   - 显示/隐藏；
   - 多行输入；
   - 占位符与帮助说明。
4. API Key 继续沿用 Pot 当前本地配置存储；本阶段不实现加密存储和配置迁移。
5. 第一阶段不实现“检查 Key”按钮，也不设计插件主动动作协议。
6. “高级 AI”默认折叠。
7. 不允许插件注入自定义 CSS、HTML、JS 或 React 组件。

## 3. 当前问题

当前 `src/window/Config/pages/Service/PluginConfig/index.jsx` 直接遍历 `pluginList[name].needs`，只处理普通输入框和下拉框。设置项全部处于同一层级，缺少：

- 分组与分组说明；
- 高级设置折叠；
- 字段帮助文字；
- 占位符；
- 密码遮罩；
- 多行输入；
- 条件显示；
- 对未知或错误 Schema 的安全降级。

同时，旧插件已经依赖当前 `needs` 数组顺序与 `input/select` 行为，因此不能替换旧协议，只能向后兼容扩展。

## 4. 第一版目标

### 4.1 设置分组

允许插件在 `needs` 项中声明分组。推荐字段：

```json
{
  "key": "aiMode",
  "display": "AI 使用方式",
  "type": "select",
  "group": "basic",
  "groupDisplay": "基础使用",
  "options": {
    "off": "关闭",
    "unknown_only": "智能补全",
    "always": "始终使用"
  }
}
```

分组按 `needs` 首次出现顺序渲染，不允许插件提供任意排序表达式。

### 4.2 高级分组折叠

推荐字段：

```json
{
  "group": "advanced_ai",
  "groupDisplay": "高级 AI",
  "groupAdvanced": true
}
```

规则：

- 高级分组默认折叠；
- 展开状态只属于当前设置弹窗 UI，不要求跨会话持久化；
- 普通分组默认展开；
- 同一分组的 `groupDisplay` 与 `groupAdvanced` 以第一次有效声明为准。

### 4.3 帮助文字与占位符

推荐字段：

```json
{
  "description": "支持多个 Key，每行一个。Key 仅保存在当前 Pot 本地配置中。",
  "placeholder": "主要=AIza...\n备用=AIza..."
}
```

要求：

- `description` 只作为纯文本显示；
- `placeholder` 只作为控件占位符；
- 两者都必须限制长度并安全转成字符串；
- 不使用 `dangerouslySetInnerHTML`。

### 4.4 密码遮罩与多行输入

为了兼容旧版 Pot，继续使用 `type: "input"`，增加可选字段：

```json
{
  "type": "input",
  "secret": true,
  "multiline": true,
  "rows": 4
}
```

规则：

- `secret: true` 时默认遮罩；
- 用户可在当前弹窗内切换显示/隐藏；
- 切换显示状态不得修改实际配置值；
- 多行输入使用 NextUI `Textarea`；
- `rows` 使用安全范围，例如 2—8；
- 旧 Pot 忽略新增字段后仍将其显示为普通输入框。

### 4.5 简单条件显示

第一版只支持有限、声明式条件：

```json
{
  "visibleWhen": {
    "key": "modelPreset",
    "operator": "equals",
    "value": "custom"
  }
}
```

允许：

- `equals`
- `notEquals`
- `in`
- `notIn`

不允许：

- JavaScript 表达式；
- 正则表达式；
- 函数；
- 嵌套任意逻辑树；
- 读取其他插件或全局配置。

条件无效时采用安全降级：显示字段，而不是让用户失去配置入口。

## 5. 推荐架构

### 5.1 Schema 归一化层

新增纯函数模块，建议路径：

```text
src/utils/plugin_config_schema.js
```

职责：

- 将旧版和 V2 `needs` 统一归一化；
- 生成稳定分组结构；
- 安全处理未知类型和异常字段；
- 计算默认值；
- 判断 `visibleWhen`；
- 限制字符串、行数和选项规模；
- 不依赖 React、Tauri 或浏览器 API。

建议导出：

```text
normalizePluginNeeds(needs)
evaluateVisibleWhen(condition, config)
resolvePluginFieldValue(field, config)
clampTextareaRows(value)
```

### 5.2 UI 组件层

建议在：

```text
src/window/Config/pages/Service/PluginConfig/
```

拆分：

```text
index.jsx
PluginConfigGroup.jsx
PluginConfigField.jsx
```

职责：

- `index.jsx`：读取配置、保存配置、渲染归一化分组；
- `PluginConfigGroup.jsx`：普通卡片、高级折叠和组标题；
- `PluginConfigField.jsx`：输入框、密码框、多行文本和下拉框。

不要在一个 JSX 文件中继续堆积所有 Schema 分支。

### 5.3 旧版兼容策略

以下旧配置必须保持：

```json
{ "key": "requestPath", "display": "请求地址" }
```

```json
{
  "key": "mode",
  "display": "模式",
  "type": "select",
  "options": { "a": "A", "b": "B" }
}
```

兼容要求：

- 没有 `type` 的字段继续按普通输入框处理；
- `type: input/select` 行为不变；
- 没有分组信息时，渲染为一个无标题的兼容分组；
- 默认选项仍为 `Object.keys(options)[0]` 对应值；
- 未识别的新字段不影响保存；
- 未识别的 `type` 安全降级为普通输入框或只读提示，不得让设置页崩溃。

## 6. 程序员划词翻译插件目标结构

后续配套插件可以声明四组：

```text
基础使用
结果显示
标识符规则
高级 AI（默认折叠）
```

建议顺序：

```text
基础使用
  输出方式
  AI 使用方式
  Gemini API Key

结果显示
  本地词义范围
  命名转换
  状态提示

标识符规则
  标识符类型
  缩写大小写

高级 AI
  Gemini 模型
  自定义模型 ID（仅自定义模型时显示）
  Gemini 发送内容
  单次 Key 尝试上限
```

本分支只提供平台能力，不修改程序员划词翻译插件仓库。

## 7. 开发阶段

### 阶段 A：Schema 归一化

- 定义字段与分组的安全数据结构；
- 实现旧版 `needs` 兼容；
- 实现条件判断；
- 添加 Node 内置测试。

### 阶段 B：设置分组 UI

- 抽取字段组件；
- 增加卡片式分组；
- 增加高级折叠；
- 保持现有首页链接、实例名称和保存流程。

### 阶段 C：增强字段

- 帮助文字；
- 占位符；
- 密码遮罩与显示切换；
- 多行输入；
- 条件显示。

### 阶段 D：兼容和窄窗口优化

- 旧插件真实配置验证；
- 长标签、长选项和窄窗口换行；
- 明暗主题；
- 键盘与可访问性基础检查。

### 阶段 E：测试与 Draft PR

- 运行纯函数测试；
- 运行 `pnpm build`；
- 创建 Draft PR，Base 为 `custom/main`；
- 未经授权不得转 Ready 或合并。

## 8. 测试要求

至少覆盖：

1. 空 `needs`；
2. 旧版无 `type` 输入框；
3. 旧版 `input`；
4. 旧版 `select`；
5. 多分组顺序；
6. 高级分组默认折叠元数据；
7. 密码字段不改变原始值；
8. 多行行数边界；
9. `equals/notEquals/in/notIn`；
10. 条件字段引用不存在 Key；
11. 错误 `options`；
12. 未识别字段类型安全降级；
13. 超长描述与占位符限制；
14. 配置保存后旧 Key 不丢失。

UI 手工验收至少包括：

- 亮色与暗色主题；
- 窄窗口；
- 高级 AI 默认折叠；
- 密码默认遮罩；
- 显示/隐藏不改变 Key；
- 多行 Key 不被单行压缩；
- `modelPreset != custom` 时隐藏自定义模型；
- 保存、关闭、重新打开后配置值正确。

## 9. 不在本分支实现

- 结果卡片 Schema；
- 程序员划词翻译插件业务改造；
- Key 加密存储；
- Key 有效性检查；
- 插件按钮或动作协议；
- 标签页；
- 任意插件 CSS；
- Tauri 2 或 NextUI 大版本迁移；
- 全局设置页重构。

## 10. 完成标准

- V2 设置能力可以由任意插件声明；
- 所有旧插件设置仍可正常显示和保存；
- 高级 AI 默认折叠；
- API Key 默认遮罩并支持多行；
- 条件显示安全、有限、可测试；
- 不新增运行时依赖；
- `pnpm build` 通过；
- Draft PR 已创建；
- 本地 AI 只读安装验收 Prompt 已提供；
- 未经用户明确授权不合并。
