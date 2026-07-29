# 插件设置 Schema V2

插件设置 Schema V2 在现有 `info.json` 的 `needs` 数组上增加受控字段，用于设置分组、帮助文字、密码遮罩、多行输入和简单条件显示。旧版插件不需要迁移，原有 `key/display/type/options` 语义保持不变。

## 1. 完整示例

```json
{
    "needs": [
        {
            "key": "aiMode",
            "display": "AI 使用方式",
            "type": "select",
            "group": "basic",
            "groupDisplay": "基础使用",
            "options": {
                "off": "关闭",
                "unknown_only": "仅未识别时补充",
                "always": "始终使用"
            },
            "description": "控制插件何时调用 AI。"
        },
        {
            "key": "apiKeys",
            "display": "Gemini API Key",
            "type": "input",
            "group": "basic",
            "description": "支持多个 Key，每行一个。Key 仍保存在 Pot 当前本地配置中。",
            "placeholder": "主要=YOUR_KEY\n备用=YOUR_BACKUP_KEY",
            "secret": true,
            "multiline": true,
            "rows": 4,
            "visibleWhen": {
                "key": "aiMode",
                "operator": "notEquals",
                "value": "off"
            }
        },
        {
            "key": "modelPreset",
            "display": "Gemini 模型",
            "type": "select",
            "group": "advanced_ai",
            "groupDisplay": "高级 AI",
            "groupAdvanced": true,
            "options": {
                "default": "默认模型",
                "custom": "自定义模型"
            }
        },
        {
            "key": "customModel",
            "display": "自定义模型 ID",
            "type": "input",
            "group": "advanced_ai",
            "placeholder": "models/example-model",
            "visibleWhen": {
                "key": "modelPreset",
                "operator": "equals",
                "value": "custom"
            }
        }
    ]
}
```

## 2. 字段说明

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `key` | string | 配置键，沿用旧版语义；缺失或为空的设置项会被忽略。 |
| `display` | string | 设置项显示名称；缺失时回退为 `key`。 |
| `type` | `input` / `select` | 未声明或未知类型安全降级为普通输入框。 |
| `options` | object | 下拉选项；错误或空选项会降级为普通输入框。 |
| `group` | string | 分组标识。未声明时进入无标题兼容分组。 |
| `groupDisplay` | string | 分组标题；同一组采用第一次有效声明。 |
| `groupAdvanced` | boolean | 为 `true` 时该组默认折叠；同一组采用第一次有效声明。 |
| `description` | string | 字段下方的纯文本帮助说明。 |
| `placeholder` | string | 输入框或多行输入框占位符。 |
| `secret` | boolean | 默认遮罩，并提供当前弹窗内的显示/隐藏切换。 |
| `multiline` | boolean | 使用多行输入框。 |
| `rows` | number | 多行输入初始行数，限制在 2—8，错误值回退为 4。 |
| `visibleWhen` | object | 根据当前插件实例配置决定字段是否显示。 |

所有插件提供的标题、说明和占位符都按纯文本处理，不解析 HTML、CSS、JavaScript、函数或 React 组件。

## 3. 条件显示

第一阶段只支持以下四种运算符：

- `equals`
- `notEquals`
- `in`
- `notIn`

示例：

```json
{
    "visibleWhen": {
        "key": "mode",
        "operator": "in",
        "value": ["auto", "custom"]
    }
}
```

条件只读取同一插件实例的当前配置。条件格式错误、运算符未知、引用键不存在或配置不可读取时，字段会安全显示，避免用户失去配置入口。隐藏字段的原值不会被删除或重置。

## 4. 分组规则

- 分组按 `needs` 中第一次出现的顺序显示。
- 普通分组默认展开。
- `groupAdvanced: true` 的分组默认折叠，展开状态只存在于当前弹窗。
- 未声明 `group` 的旧插件使用无标题兼容分组，布局保持接近旧版。
- 插件不能提供自定义类名、颜色或 CSS。

## 5. 旧版兼容

以下旧配置继续按普通输入框显示：

```json
{
    "key": "requestPath",
    "display": "请求地址"
}
```

以下旧下拉配置继续按第一个选项作为未保存时的默认显示值：

```json
{
    "key": "mode",
    "display": "模式",
    "type": "select",
    "options": {
        "a": "A",
        "b": "B"
    }
}
```

保存时仍写回原插件实例配置对象，不改变配置键名、层级或存储格式，也不会因为字段暂时隐藏而删除旧键。

## 6. 安全边界与限制

- `secret` 只负责界面遮罩，不代表加密存储。
- API Key 仍使用 Pot 当前本地配置存储机制。
- 本阶段不提供 Key 有效性检查或网络请求按钮。
- 本阶段不支持条件逻辑树、正则表达式、脚本表达式或跨插件条件。
- 字段键、标题、说明、占位符、选项数量和文本长度均有安全上限；超出部分会截断或降级。
