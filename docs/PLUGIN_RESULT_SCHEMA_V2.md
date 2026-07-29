# 插件结构化结果 Schema V2

## 1. 目标

Schema V2 允许翻译插件返回由 Pot 桌面端统一渲染的结构化结果。插件只声明纯数据，卡片、颜色、图标、折叠和复制交互均由 Pot 控制。

字符串结果和旧版对象结果仍保持兼容。新版渲染优先级为：

```text
字符串
→ 严格 Schema V2
→ 旧版 pronunciations / explanations / associations / sentence
→ 安全纯文本兜底
```

## 2. 顶层结构

```json
{
  "schemaVersion": 2,
  "copyText": "完整可复制纯文本",
  "sections": []
}
```

字段说明：

- `schemaVersion`：必须严格为数字 `2`；字符串 `"2"` 不会被识别为 V2。
- `copyText`：可选。用于完整复制、自动复制、历史记录、朗读和必要时的反向翻译。
- `sections`：必须为数组。无效 section 会被忽略，未知 section 会在具有纯文本 `content` 时降级为 `note`。

当 `copyText` 缺失或为空时，Pot 会根据归一化后的 section 生成纯文本回退。插件仍应优先提供明确的 `copyText`，以保证顺序和格式符合业务预期。

## 3. 通用 section 字段

```json
{
  "id": "summary",
  "type": "summary",
  "title": "核心释义",
  "collapsible": false,
  "defaultCollapsed": false
}
```

- `id`：只保留字母、数字、下划线和短横线；重复 ID 会稳定追加 `-2`、`-3`。
- `type`：第一版只支持六种受控类型。
- `title`：纯文本，可选。
- `collapsible`：仅严格布尔值 `true` 开启折叠。
- `defaultCollapsed`：仅在 `collapsible: true` 时生效。

## 4. section 类型

### 4.1 `summary`

```json
{
  "id": "summary",
  "type": "summary",
  "title": "核心释义",
  "content": "以小端序向 NFC 设备写入 16 位无符号整数",
  "source": "local",
  "copyText": "以小端序向 NFC 设备写入 16 位无符号整数"
}
```

`source` 允许：`local`、`ai`、`mixed`、`unknown`。

### 4.2 `metadata`

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

每个 `items` 元素必须同时具有非空 `label` 和 `value`。`tokens` 只作为普通文本 Chip 渲染。

### 4.3 `dictionary`

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

`token` 必填；`phonetic` 和 `meaning` 至少一个非空。每个 token 独立成行并支持单项复制。

### 4.4 `code-list`

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

### 4.5 `note`

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

### 4.6 `status`

```json
{
  "id": "diagnostic",
  "type": "status",
  "title": "诊断",
  "severity": "warning",
  "content": "AI 请求未完成，已使用完整本地结果。"
}
```

`severity` 允许：`info`、`success`、`warning`、`error`。颜色和样式由 Pot 固定映射。

## 5. 数量与长度限制

第一版限制：

| 项目 | 上限 |
| --- | ---: |
| sections | 24 |
| 每个 section 的 items | 48 |
| metadata tokens | 32 |
| 普通文本 | 4000 字符 |
| 顶层或单项 copyText | 12000 字符 |
| section id | 64 字符 |
| token / phonetic | 128 字符 |

超出上限的内容会被稳定截断，不会继续构造任意嵌套 UI。

## 6. 安全边界

V2 采用字段白名单归一化。以下插件字段不会进入渲染结果：

- `html`；
- `style`；
- `className`；
- `component`；
- JavaScript 函数；
- 任意图标或图标 URL；
- 自定义 Tailwind 类；
- 任意颜色；
- Markdown；
- 嵌套组件树。

V2 内容只通过 React 普通文本节点渲染，不使用 `dangerouslySetInnerHTML`。文本中的 `<b>`、`<script>` 或 Markdown 标记只会作为普通字符显示。

旧版 `sentence` 为保持历史兼容，仍沿用原有 HTML 渲染路径；该行为不扩展到 V2。

## 7. 完整示例

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
        { "label": "小驼峰", "value": "st25dvI2cWriteData" },
        { "label": "下划线", "value": "st25dv_i2c_write_data" }
      ]
    },
    {
      "id": "ai-supplement",
      "type": "note",
      "title": "AI 补充",
      "content": "结合当前标识符上下文的补充说明。",
      "source": "ai",
      "collapsible": true,
      "defaultCollapsed": true
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

## 8. 旧版 Pot 双结构兼容示例

程序员划词翻译插件后续接入时，可以同时返回 V2 字段和旧字段：

```json
{
  "schemaVersion": 2,
  "copyText": "完整纯文本",
  "sections": [
    { "id": "summary", "type": "summary", "content": "核心释义" }
  ],
  "explanations": [
    { "trait": "释义", "explains": ["核心释义"] }
  ],
  "associations": ["补充信息"]
}
```

新版 Pot 优先渲染 V2；不认识 V2 的旧版 Pot 仍可读取 `explanations` 和 `associations`。

## 9. 复制、历史、朗读与反向翻译

- 字符串结果继续直接使用字符串。
- 严格 V2 结果统一使用归一化后的 `copyText`。
- 自动复制不再把对象直接传给剪贴板。
- 历史数据库结构不变，只写入纯文本 `copyText`。
- V2 完整复制和反向翻译使用 `copyText`。
- V2 朗读使用 `copyText`，超过 4000 字符时禁用，避免一次提交超长 TTS 文本。
- 旧对象仍按旧版卡片渲染；其顶部复制、朗读和反向翻译按钮继续保持不可用。
