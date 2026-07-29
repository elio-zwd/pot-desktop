# 插件结果 Schema V2 开发交接

## 1. 任务定位

你负责 Pot 桌面端的结构化翻译结果协议和卡片结果渲染，不负责插件设置页。

- 仓库：`https://github.com/elio-zwd/pot-desktop`
- 分支：`feat/plugin-result-schema-v2`
- Base：`custom/main`
- 初始 Base SHA：`594d32ede96acd106b0256deaa8bb440ffcdff40`
- 配套设置页分支：`feat/plugin-ui-schema-v2`

当前分支已经只写入规划文档，没有开始程序代码实现。请先确认远端最新 HEAD，再开始开发。

## 2. 必读顺序

1. `README.md`
2. `AGENTS.md`
3. `plans/PLUGIN_RESULT_SCHEMA_V2_PLAN.md`
4. `tasks/PLUGIN_RESULT_SCHEMA_V2_TASKS.md`
5. 本文档
6. `docs/assets/plugin-ui-schema-v2-card-layering-concept.svg`
7. 当前分支真实源码

## 3. 已确认方向

- 采用“卡片分层方案”。
- 默认信息层级：核心释义、标识符信息、逐词解释、命名转换、AI 补充、异常诊断。
- 新协议必须通用，不能只为程序员划词翻译插件写死。
- 字符串和旧版对象结果必须继续兼容。
- 新版 Pot 优先读取 V2；未来插件同时提供旧字段，官方旧版 Pot 仍可显示。
- 不开放插件自定义 HTML、CSS、JS、React 组件或任意图标 URL。
- 本分支不修改程序员划词翻译插件仓库。

## 4. 当前真实入口

重点阅读：

```text
src/window/Translate/components/TargetArea/index.jsx
```

当前组件同时承担：

- 翻译服务调用；
- `setResult` 和 Promise 结果更新；
- 加载、错误、重试；
- 历史数据库写入；
- 自动复制；
- 朗读和反向翻译；
- 字符串结果；
- 旧对象结果；
- 翻译服务卡片头尾。

不要在原文件中继续堆叠一整套 V2 section 分支。先梳理边界，再抽取结果组件。

当前旧对象字段包括：

```text
pronunciations
explanations
associations
sentence
```

这些都必须保留。

## 5. 推荐实现步骤

### 第一步：纯函数和夹具

先新增结果 Schema 归一化模块和 Node 内置测试，再写 JSX。

建议实现：

```text
isPluginResultV2()
normalizePluginResultV2()
normalizePluginResultSection()
resolveResultCopyText()
```

严格要求 `schemaVersion === 2`。

### 第二步：抽取现有结果渲染

建议组件：

```text
TranslationResult/index.jsx
TranslationResult/LegacyResult.jsx
TranslationResult/StructuredResult.jsx
TranslationResult/ResultSection.jsx
```

可以根据实际情况调整，但抽取后旧字符串和旧对象行为不能明显变化。

### 第三步：实现六种 section

```text
summary
metadata
dictionary
code-list
note
status
```

所有 section 均由 Pot 决定组件、颜色、图标和布局。插件只能提供受限数据。

### 第四步：处理复制和历史

V2 顶层使用：

```json
{
  "schemaVersion": 2,
  "copyText": "可复制纯文本",
  "sections": []
}
```

完整复制、自动复制、历史记录和必要时的反向翻译使用 `copyText`。不要把对象或 Schema JSON直接写入剪贴板或展示给用户。

### 第五步：窄窗口和主题

- 核心释义允许换行；
- token Chip 自动换行；
- 逐词解释不横向溢出；
- 命名转换在窄窗口下改为纵向；
- 状态颜色使用 NextUI/主题语义色；
- 多翻译服务并排时保持紧凑。

## 6. 推荐 V2 示例

```json
{
  "schemaVersion": 2,
  "copyText": "ST25DV I2C 写入数据\n函数名：ST25DV_i2c_WriteData",
  "sections": [
    {
      "id": "summary",
      "type": "summary",
      "title": "核心释义",
      "content": "ST25DV I2C 写入数据",
      "source": "local"
    },
    {
      "id": "identifier",
      "type": "metadata",
      "title": "标识符信息",
      "items": [
        { "label": "类型", "value": "函数名" },
        { "label": "原文", "value": "ST25DV_i2c_WriteData", "copyText": "ST25DV_i2c_WriteData" }
      ],
      "tokens": ["ST25DV", "I2C", "write", "data"]
    },
    {
      "id": "words",
      "type": "dictionary",
      "title": "逐词解释",
      "items": [
        { "token": "I2C", "meaning": "I²C 总线", "source": "local" },
        { "token": "write", "meaning": "写入", "source": "local" },
        { "token": "data", "meaning": "数据", "source": "local" }
      ]
    },
    {
      "id": "naming",
      "type": "code-list",
      "title": "命名转换",
      "items": [
        { "label": "小驼峰", "value": "st25dvI2cWriteData", "copyText": "st25dvI2cWriteData" },
        { "label": "下划线", "value": "st25dv_i2c_write_data", "copyText": "st25dv_i2c_write_data" }
      ]
    },
    {
      "id": "diagnostic",
      "type": "status",
      "title": "诊断",
      "severity": "warning",
      "content": "AI 请求未完成，已使用完整本地结果。"
    }
  ]
}
```

## 7. 与另一个 AI 的边界

另一个对话在：

```text
feat/plugin-ui-schema-v2
```

它负责设置分组、高级折叠、帮助文字、密码多行输入和条件显示。

本分支不要修改：

```text
src/window/Config/pages/Service/PluginConfig/
```

不要实现插件配置 Schema。

为了减少合并冲突：

- 不修改 `package.json`，除非确实无法完成且先向用户说明；
- 不升级依赖；
- 不全仓库格式化；
- 不修改设置页文件；
- 新增测试直接使用 `node --test <path>`。

## 8. 开发中需要询问用户的情况

遇到以下情况先暂停并询问：

- 必须新增第三方依赖；
- 必须改变旧插件结果字段语义；
- 必须移除或禁用旧对象的复制、朗读或反向翻译行为；
- 必须修改历史数据库结构；
- 需要插件动作按钮或网络回调；
- 需要 Markdown、HTML 或任意样式注入；
- 需要实现六种 section 之外的新布局；
- 需要修改设置页分支负责的文件。

普通组件拆分、纯函数命名和受控样式可根据 Plan 自主完成。

## 9. 提交与 PR

建议拆分提交：

```text
test: 添加插件结果 Schema V2 归一化测试
feat: 添加插件结果 Schema V2 归一化层
refactor: 抽取翻译结果渲染组件
feat: 添加结构化结果卡片与折叠
fix: 使用 copyText 统一对象结果复制与历史文本
docs: 更新插件结果 Schema V2 说明
```

不要为了匹配建议而制造无意义提交。

完成后创建 Draft PR：

```text
Base: custom/main
Head: feat/plugin-result-schema-v2
标题：feat: 添加插件结构化结果 Schema V2
```

未经用户明确授权不得转 Ready 或合并。

## 10. 完成汇报要求

最终汇报必须包含：

- 分支和 HEAD SHA；
- 修改文件清单；
- V2 顶层结构和 section 类型；
- 安全限制；
- 旧字符串和旧对象兼容策略；
- 完整复制、自动复制和历史处理；
- 自动测试命令和结果；
- `pnpm build` 结果；
- Draft PR 地址；
- 已知限制；
- 给本地 AI 的只读验收 Prompt；
- `git status --short` 是否为空。
