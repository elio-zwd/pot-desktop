# Gemini 第二层开发交接

本文档定义 Gemini API 层的边界。第一层本地词典已经完成，后续开发不得破坏离线模式。源码位于 `src/runtime-*.js`，运行前由 `scripts/build_runtime.py` 合成为 Pot 要求的单文件 `main.js`；不要直接提交生成的 `main.js`。

## 已完成的第一层

- `prepareIdentifier(text, config)`：输入校验、标识符拆分和类型识别。
- `lookupGeneralDictionary(words, options)`：读取本地 `dictionary.db`。
- `programmingPhraseParts(words, entries)`：编程术语优先、ECDICT 兜底的组合含义。
- `buildDictionarySections(model, options)`：生成编程含义、普通词义、未知词和词典错误。
- `translate(...)`：仅在完整分析或中文输出时读取数据库；其他命名格式保持纯本地快速路径。

## Gemini 层应该解决什么

只处理本地层无法可靠解决的语义：

1. `unknownWords` 非空；
2. 多义词需要结合完整标识符选择含义；
3. 中文自然语言描述超出 `CHINESE_PHRASES`；
4. 用户明确选择“AI 增强”。

不要让 Gemini 负责驼峰拆分、缩写保护或最终命名格式。这些结果必须继续由本地规则生成和校验。

## 建议配置

```text
aiMode: off | unknown_only | always
apiKey: 用户自行填写
model: Gemini 模型名
endpoint: Gemini API 地址
sendScope: unknown_tokens | identifier
```

默认必须是 `off`。未配置 Key、请求失败、超时或返回格式不合法时，立即回退到第一层结果。

## 安全注意

Pot 当前通用外部插件配置页只公开 `input` 和 `select` 控件，普通 `input` 不会像密码框一样遮挡 API Key。实现前应明确选择：

- 修改 Pot 主程序，让插件配置支持 `password` 类型；或
- 接受 Key 在设置页可见，并在说明中明确风险；或
- 使用操作系统安全存储方案，但这需要主程序支持。

禁止把 API Key 写进仓库、日志、错误消息、测试快照或打包文件。

## 数据最小化

- `unknown_only` 模式只发送拆分后的未知 token 和必要的相邻词。
- 只有用户显式选择 `identifier` 时才发送完整标识符。
- 不发送所在源码行、文件路径、项目名或其他上下文。
- 输出日志不得包含请求正文和 Key。

## 推荐接口边界

新增独立函数，避免把网络逻辑散落到解析代码中：

```javascript
async function resolveGeminiSemantics({
  input,
  words,
  unknownWords,
  localProgrammingText,
  config,
  utils
})
```

返回结构建议：

```javascript
{
  translatedWords: { unknownToken: '中文释义' },
  semanticDescription: '结合上下文后的中文含义',
  source: 'gemini'
}
```

返回值必须经过以下本地校验：

- 只接受 JSON；
- key 必须属于请求 token；
- 长度受限；
- 不允许 Markdown 代码围栏；
- AI 不得直接覆盖 camelCase、snake_case 等命名结果。

## 必补测试

- `aiMode=off` 时零网络调用；
- 本地全部命中且 `unknown_only` 时零网络调用；
- 未知词触发一次请求；
- 超时、HTTP 错误、非法 JSON、空响应全部回退本地结果；
- API Key 不出现在错误文本和日志；
- 中文转英文后仍由本地格式化函数生成命名；
- Pot `eval()` 加载契约继续通过；
- 现有第一层测试全部保持通过。

## 不在 Gemini PR 中顺手修改的内容

- ECDICT 构建脚本和固定提交；
- SQLite 表结构；
- 缩写拆分算法；
- 编程词典已有译法；
- GitHub Actions 的本地词典构建与包结构校验。
