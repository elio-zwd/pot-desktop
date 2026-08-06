# 方案三：极简程序员工具方案——Pot Desktop 契约开发包

## 0. 分支、基线与状态

- 仓库：`elio-zwd/pot-desktop`
- 固定原始基线：`master@594d32ede96acd106b0256deaa8bb440ffcdff40`
- 方案分支：`backup/programmer-minimal-tool-ui`
- 本协调任务分支：`task/min-desktop-contract`
- 协调基线：`backup/programmer-minimal-tool-ui@1a7b3297dfd5b9cc2244e33f6ab3b7ac78073f9b`
- 当前任务：`MIN-DESKTOP-00`
- 当前状态：**方案三已激活，桌面端契约冻结**
- Draft PR Base：`backup/programmer-minimal-tool-ui`
- 对应插件仓库：`elio-zwd/pot-app-translate-plugin-programmer-selection`
- 唯一插件契约来源：`8acd3146481c433a70d26f210dc2c07902645b2f`
- 插件契约提交信息：`docs: 冻结极简程序员工具跨仓库协议`
- 插件协议文档：`docs/programmer-ui/DEVELOPMENT-PACK.md`

本任务只冻结桌面端接口、消费规则、通用配置 Schema、验收标准和 Wave 1 文件边界，不实现结果组件、标准化函数、配置页或 `TargetArea` 集成。

### 0.1 固定来源规则

1. `pot.programmer-result.v1` 的字段、枚举、fixture 和宿主协商以插件 Commit `8acd3146481c433a70d26f210dc2c07902645b2f` 为唯一来源。
2. 不得根据旧讨论、本文件早期版本、分支最新内容或模型记忆增删、重命名协议字段。
3. `presentation` 只能作为展示提示，不参与协议有效性判断。
4. 桌面端不得硬编码程序员插件 ID，不得解析中文 trait 或 `plainText` 重建结构化详情。
5. 若后续实现发现固定契约矛盾，必须先在跨仓库协调 PR 中记录并重新冻结，任何单个任务不得自行漂移。

### 0.2 仓库现状与冲突检查

已读取：

- `README.md`
- `package.json`
- `pnpm-lock.yaml`
- `.github/workflows/package.yml`
- `src/utils/invoke_plugin.js`
- `src/utils/service_instance.ts`
- `src/window/Translate/components/TargetArea/index.jsx`
- `src/window/Config/pages/Service/PluginConfig/index.jsx`
- `src/window/Config/pages/History/index.jsx`
- 本文件旧版方案
- 开放 PR #1、#2、#7 的修改文件

当前结论：

- 根目录没有 `AGENTS.md` 或 `CONTRIBUTING.md`。
- PR #1、#2 只修改 `plugins/code-identifier/` 及其工作流。
- PR #7 只修改 `tools/ai/superpowers/`。
- 上述 PR 与本任务修改的 `docs/programmer-ui/DEVELOPMENT-PACK.md` 不重叠。
- 不修改、关闭、合并或覆盖 PR #1、#2、#7。
- 当前 `TargetArea` 同时承担插件调用、结果状态、旧对象渲染、复制、自动复制和历史写入，是 Wave 2 的高冲突集成点。
- 当前 `PluginConfig` 只支持旧 `input`、`select` 和省略 `type` 的输入框。
- 当前仓库没有 `test` 脚本，现有发布工作流只在 `master` 打包；Wave 1 测试优先使用 Node 内置 `node:test`，不得为本方案新增测试框架依赖。

## 1. 不可变兼容原则

1. 旧字符串继续显示、复制、自动复制和进入历史。
2. 旧 Pot 词典对象继续使用现有 `pronunciations`、`explanations`、`associations`、`sentence` 渲染路径。
3. 内置翻译服务继续使用现有路径，不接收插件宿主能力声明。
4. `pot.programmer-result.v1` 使用通用 Schema 分支，不根据插件名称、插件 ID、服务实例名或中文内容判断。
5. 未知 Schema 有有效 `plainText` 时安全回退纯文本。
6. 精确 v1 对象结构校验失败但仍有有效 `plainText` 时安全回退纯文本。
7. 不允许把对象隐式转换为 `[object Object]` 写入剪贴板、通知或历史。
8. `diagnostics=[]` 时不渲染诊断标题、空容器或占位文案。
9. `summary.text` 只用于首屏摘要，绝不替代完整复制或历史内容。
10. 新功能不得要求 PR #1/#2 合并，也不得读取其分支内插件代码作为桌面端运行时依赖。

## 2. `normalizePluginResult` 冻结接口

### 2.1 导出接口

Wave 1 标准化层固定导出：

```js
export const PROGRAMMER_RESULT_SCHEMA = 'pot.programmer-result.v1';

export function normalizePluginResult(input) {
    // 返回 NormalizedPluginResult
}

export function createPluginHostCapabilities() {
    return {
        name: 'pot-desktop',
        resultSchemas: ['pot.programmer-result.v1'],
        configSchemaVersion: 1,
        presentationCapabilities: ['summary-details', 'per-item-copy'],
    };
}
```

`createPluginHostCapabilities()` 每次调用返回新对象，避免插件修改后污染后续调用。该函数只描述本次宿主能力，不读取或写入用户配置。

### 2.2 标准化结果联合类型

```ts
type SummarySource = 'local' | 'local_ai' | 'ai' | 'local_fallback';
type DetectedType =
    | 'function'
    | 'variable'
    | 'boolean'
    | 'class'
    | 'constant'
    | 'file'
    | 'text'
    | 'unknown';
type DetectionMode = 'auto' | 'configured';
type TokenMeaningSource = 'local' | 'ai' | 'literal';
type DiagnosticSeverity = 'info' | 'warning' | 'error';

type ProgrammerNaming = {
    camelCase: string;
    pascalCase: string;
    snakeCase: string;
    screamingSnakeCase: string;
    kebabCase: string;
};

type ProgrammerDiagnostic = {
    code: string;
    severity: DiagnosticSeverity;
    message: string;
    recoverable: boolean;
};

type NormalizedProgrammerResult = {
    kind: 'programmer';
    render: 'programmer';
    raw: Record<string, unknown>;
    schema: 'pot.programmer-result.v1';
    plainText: string;
    summary: {
        text: string;
        source: SummarySource;
        fallback: boolean;
    };
    identifier: {
        original: string;
        detectedType: DetectedType;
        detectionMode: DetectionMode;
        tokens: string[];
    };
    tokenMeanings: Array<{
        index: number;
        token: string;
        meaning: string;
        source: TokenMeaningSource;
        phonetic?: string;
    }>;
    naming: ProgrammerNaming;
    diagnostics: ProgrammerDiagnostic[];
    presentation?: {
        preferredDensity?: 'minimal' | 'report';
        initiallyExpanded?: Array<
            'identifier' | 'tokenMeanings' | 'naming' | 'diagnostics'
        >;
    };
};

type NormalizedTextResult = {
    kind: 'text';
    render: 'text';
    raw: string;
    plainText: string;
};

type NormalizedLegacyObjectResult = {
    kind: 'legacy-object';
    render: 'legacy-object';
    raw: Record<string, unknown>;
    plainText: null;
};

type NormalizedPlainTextFallbackResult = {
    kind: 'plain-text-fallback';
    render: 'text';
    raw: Record<string, unknown>;
    schema: string | null;
    plainText: string;
    reason: 'unknown-schema' | 'invalid-programmer-schema';
};

type NormalizedUnsupportedResult = {
    kind: 'unsupported';
    render: 'unsupported';
    raw: unknown;
    plainText: null;
    reason: 'empty-string' | 'missing-plain-text' | 'unsupported-value';
};

type NormalizedPluginResult =
    | NormalizedProgrammerResult
    | NormalizedTextResult
    | NormalizedLegacyObjectResult
    | NormalizedPlainTextFallbackResult
    | NormalizedUnsupportedResult;
```

### 2.3 判定顺序

`normalizePluginResult(input)` 按固定顺序处理：

1. 字符串：
   - 使用现有兼容行为 `input.trim()`。
   - 非空返回 `kind='text'`。
   - 空字符串返回 `kind='unsupported'`、`reason='empty-string'`。
2. 精确 v1：
   - 仅当 `input.schema === 'pot.programmer-result.v1'` 时进入 v1 校验。
   - 校验通过返回 `kind='programmer'`。
   - 校验失败但 `plainText` 为非空字符串时返回纯文本回退，`reason='invalid-programmer-schema'`。
   - 校验失败且无有效 `plainText` 时返回 `kind='unsupported'`。
3. 旧词典对象：
   - 必须是普通对象。
   - 至少一个现有稳定字段是数组：`pronunciations`、`explanations`、`associations`、`sentence`。
   - 返回 `kind='legacy-object'`，保留原对象，不克隆、重命名或解析中文 trait。
4. 其他普通对象：
   - `plainText` 为非空字符串时返回 `kind='plain-text-fallback'`。
   - `schema` 为字符串则原样保留，否则设为 `null`。
   - `reason='unknown-schema'`。
5. 其他值返回 `kind='unsupported'`。

不得使用 `JSON.stringify`、模板字符串或 `String(input)` 为未知对象制造显示文本。

### 2.4 v1 必需校验

以下条件全部满足才返回 `kind='programmer'`：

- `schema` 精确等于 `pot.programmer-result.v1`。
- `plainText` 是去除首尾空白后仍非空的字符串；校验后保留原始字符串，不裁剪。
- `summary.text` 非空。
- `summary.source` 属于四个固定枚举。
- `summary.fallback` 是布尔值，且仅当 `source='local_fallback'` 时为 `true`。
- `identifier.original` 非空。
- `identifier.detectedType`、`identifier.detectionMode` 属于固定枚举。
- `identifier.tokens` 是非空字符串数组。
- `tokenMeanings` 与 `identifier.tokens` 数量相同，按 `index` 从 0 连续递增，且每项 `token` 精确对应同位置 token。
- `tokenMeanings.source` 属于 `local | ai | literal`。
- `phonetic` 若存在必须是非空字符串；桌面端只展示，不推断其来源。
- `naming` 五个固定键全部存在且值为字符串，允许空字符串。
- `diagnostics` 是数组；每项包含非空 ASCII 点分 `code`、固定 `severity`、非空 `message` 和布尔 `recoverable`。

`presentation` 整体可省略。其字段非法时只丢弃非法提示，不得因此拒绝有效核心结果。`initiallyExpanded` 只接受固定区块 ID 并去重，但桌面端极简组件不以它初始化展开状态。

## 3. `pot.programmer-result.v1` 桌面端消费规则

| 字段 | 桌面端用途 | 禁止行为 |
|---|---|---|
| `schema` | 精确选择通用 v1 渲染器 | 前缀匹配、模糊匹配、按插件 ID 选择 |
| `plainText` | 复制全文、自动复制、历史、渲染失败回退 | 用摘要替代、反向解析详情 |
| `summary` | 折叠首屏与来源状态 | 拼接长 diagnostic、决定复制内容 |
| `identifier` | 展开区原始输入、类型和 token | 重新拆分、改写 token |
| `tokenMeanings` | 逐词展示和来源标签 | 合并重复条目、用 AI 覆盖本地含义 |
| `naming` | 五种命名逐项展示与复制 | 桌面端重新计算命名 |
| `diagnostics` | 非空时展示脱敏诊断 | 按中文 message 决定业务逻辑 |
| `presentation` | 可选布局提示 | 作为有效性条件或持久化用户状态 |

### 3.1 未知 Schema 与渲染异常

- 未知 Schema 且有有效 `plainText`：显示纯文本，复制、自动复制和历史均使用该 `plainText`。
- 精确 v1 校验失败且有有效 `plainText`：同样显示纯文本，并允许开发日志记录稳定原因；日志不得包含结果全文、Key 或敏感 diagnostic。
- `plainText` 也无效：交给现有错误/空结果路径，不显示空结构卡片。
- 结构化组件运行时异常：错误边界显示已经标准化的 `plainText`，不重试插件、不调用 Gemini、不修改结果对象。

## 4. `plainText` 统一规则

### 4.1 可信全文选择

```js
function getTrustedPlainText(normalized) {
    return typeof normalized.plainText === 'string'
        ? normalized.plainText
        : null;
}
```

- `text`：使用裁剪后的字符串，与当前行为一致。
- `programmer`：使用插件原始 `plainText`，只用 `trim()` 检查非空，不改变内容。
- `plain-text-fallback`：使用对象原始 `plainText`，不重新格式化。
- `legacy-object`：`plainText=null`，继续现有旧对象渲染路径；本方案不得把对象隐式写成字符串。
- `unsupported`：`plainText=null`。

### 4.2 复制、自动复制与历史

对于 `plainText !== null` 的标准化结果，以下位置必须读取同一个值：

1. 结果区“复制全文”。
2. `translate_auto_copy='target'`。
3. `translate_auto_copy='source_target'` 中目标部分。
4. 隐藏窗口后的剪贴板通知正文。
5. `history.result`。
6. 从历史记录发送到收藏服务时的目标文本。

禁止使用：

- `summary.text`
- React 渲染文本拼接
- `JSON.stringify(raw)`
- `String(raw)`
- 当前展开区的可见文本

流式 `setResult` 可以更新屏幕，但自动复制与历史只处理当前请求最终成功 resolve 且仍匹配请求 ID 的标准化结果。

旧词典对象继续走旧兼容路径；若后续需要统一序列化，必须另立契约任务，不在本方案中猜测纯文本格式。

## 5. `ProgrammerMinimalResult` 组件契约

### 5.1 Props

```ts
type ProgrammerMinimalResultLabels = {
    expandDetails: string;
    collapseDetails: string;
    copyFull: string;
    copyItem: string;
    copied: string;
    identifier: string;
    tokenMeanings: string;
    naming: string;
    diagnostics: string;
    source: Record<SummarySource, string>;
    namingKeys: Record<keyof ProgrammerNaming, string>;
};

type CopyMeta =
    | { scope: 'full' }
    | { scope: 'naming'; key: keyof ProgrammerNaming };

type ProgrammerMinimalResultProps = {
    result: NormalizedProgrammerResult;
    idPrefix: string;
    labels: ProgrammerMinimalResultLabels;
    onCopy: (text: string, meta: CopyMeta) => void | Promise<void>;
};
```

组件不得接收插件 ID、服务名、用户配置或历史数据库句柄。

### 5.2 组件职责

- 折叠首屏显示 `identifier.original`、`summary.text` 和可读来源标签。
- `summary.source='local_fallback'` 时显示短警告语义，但完整 diagnostic 只在非空详情区呈现。
- 展开区按顺序显示：
  1. `identifier`
  2. `tokenMeanings`
  3. `naming`
  4. 非空 `diagnostics`
- “复制全文”调用 `onCopy(result.plainText, { scope: 'full' })`。
- 命名逐项复制调用原始命名值，不复制标签。
- `diagnostics=[]` 时完全不创建诊断区。
- 不修改 `result`，不执行标准化，不访问剪贴板 API，不写历史。
- 可忽略 `presentation.preferredDensity`；不得使用 `presentation.initiallyExpanded` 覆盖本节生命周期。

### 5.3 展开状态生命周期

1. 组件内部只保存一个当前挂载实例的 `expanded` 布尔值，初始固定为 `false`。
2. 用户可在当前结果内展开、收起。
3. `TargetArea` 集成时必须用当前查询或最终结果的稳定 ID 作为 React `key`，新查询重新挂载组件并恢复折叠。
4. 展开状态不得写入 `useConfig`、数据库、Local Storage、插件配置或全局 atom。
5. 切换服务、源文本、源语言、目标语言或新请求 ID 均视为新查询。
6. 展开/收起不得改变复制全文、自动复制和历史值。

## 6. 通用插件配置 Schema

### 6.1 兼容入口

继续读取插件 `info.json` 的 `needs` 数组。旧格式保持：

- 省略 `type`：等价 `input`
- `type='input'`
- `type='select'`

不得要求插件迁移旧配置，也不得改变现有已保存值。

### 6.2 公共字段

```ts
type ConfigScalar = string | number | boolean;

type VisibleWhen =
    | { key: string; equals: ConfigScalar }
    | { key: string; notEquals: ConfigScalar }
    | { key: string; oneOf: ConfigScalar[] };

type ConfigItemCommon = {
    key: string;
    display?: string;
    description?: string;
    section?: string;
    visibleWhen?: VisibleWhen;
};
```

`visibleWhen` 必须且只能有一个比较器。有效条件按“已保存值优先，否则字段 `default`”求值：

- 条件合法但源字段和值都不存在：隐藏。
- 条件格式非法：忽略条件并显示，保证旧插件不因新增未知数据消失。
- 比较使用严格相等，不做字符串、数字或布尔自动转换。
- 条件只控制显示，不删除已保存配置。

### 6.3 固定控件

```ts
type SectionItem = {
    type: 'section';
    key: string;
    display: string;
    description?: string;
    defaultExpanded?: boolean;
};

type SelectItem = ConfigItemCommon & {
    type: 'select';
    display: string;
    options: Record<string, string>;
    default?: string;
};

type InputItem = ConfigItemCommon & {
    type?: 'input';
    display: string;
    default?: string;
    placeholder?: string;
};

type SecretItem = ConfigItemCommon & {
    type: 'secret';
    display: string;
    default?: string;
    placeholder?: string;
};

type TextareaItem = ConfigItemCommon & {
    type: 'textarea';
    display: string;
    default?: string;
    placeholder?: string;
    rows?: number;
};

type SwitchItem = ConfigItemCommon & {
    type: 'switch';
    display: string;
    default?: string;
    onValue?: string;
    offValue?: string;
};

type HelpItem = ConfigItemCommon & {
    type: 'help';
    text: string;
    href?: string;
};

type PluginConfigItem =
    | SectionItem
    | SelectItem
    | InputItem
    | SecretItem
    | TextareaItem
    | SwitchItem
    | HelpItem;
```

规则：

- `section`：只控制 UI 分组与披露，不持久化。
- 普通字段不指定 `section` 时在根级显示。
- 字段引用不存在的 section 时按根级显示，避免配置丢失。
- `select`：持久化 option key，不持久化显示文字。
- `input`、`secret`、`textarea`：持久化字符串。
- `secret`：使用密码控件，默认遮罩，不在日志、错误、DOM 属性或帮助文本中回显；允许用户显式切换可见性。
- `switch`：继续持久化字符串；`onValue` 默认 `"true"`，`offValue` 默认 `"false"`。
- `help`：不持久化；`href` 只通过现有安全外部打开能力处理。
- 未知显式 `type`：跳过该项并记录不含配置值的开发告警；不得退化为输入框。
- section 折叠状态仅属于当前配置页，不持久化。
- 插件可以把核心设置放在根级，把高级设置引用到 `defaultExpanded=false` 的 section，实现渐进披露。

## 7. 宿主能力声明位置

每一次**翻译插件**调用的顶层 `options` 必须包含：

```js
{
    config: instanceConfig,
    detect: detectLanguage,
    setResult,
    utils,
    host: createPluginHostCapabilities(),
}
```

固定要求：

1. 初始翻译调用和“反向翻译”插件调用都必须传入。
2. 不放在 `options.config`、插件持久化设置、`info.json`、`utils`、全局状态或数据库。
3. 不修改 `src/utils/invoke_plugin.js` 注入能力；能力由调用者按本次上下文显式传递。
4. 不向内置翻译、TTS、OCR 或收藏插件误传。
5. 桌面端声明能力不依赖 `setResult` 是否存在。
6. 插件只应通过 `options.host.resultSchemas` 精确包含协议名判断 v1 支持；桌面端不得声明尚未实现的 Schema。

## 8. 四个固定 fixture

以下 JSON 逐字段继承插件 Commit `8acd3146481c433a70d26f210dc2c07902645b2f`。Wave 1 测试可以从本节提取或复制为测试常量，但不得修改语义。

### 8.1 `NFC_WriteU16LE`

```json
{
  "schema": "pot.programmer-result.v1",
  "plainText": "函数名：NFC_WriteU16LE\n词语拆分：NFC · write · U16 · LE\n核心释义：以小端序向 NFC 设备写入 16 位无符号整数\n词义：\n- NFC：近场通信\n- write：写入\n- U16：16 位无符号整数\n- LE：小端序\n命名：\n- camelCase：nfcWriteU16Le\n- PascalCase：NfcWriteU16Le\n- snake_case：nfc_write_u16_le\n- SCREAMING_SNAKE_CASE：NFC_WRITE_U16_LE\n- kebab-case：nfc-write-u16-le",
  "summary": {
    "text": "以小端序向 NFC 设备写入 16 位无符号整数",
    "source": "local",
    "fallback": false
  },
  "identifier": {
    "original": "NFC_WriteU16LE",
    "detectedType": "function",
    "detectionMode": "auto",
    "tokens": [
      "NFC",
      "write",
      "U16",
      "LE"
    ]
  },
  "tokenMeanings": [
    {
      "index": 0,
      "token": "NFC",
      "meaning": "近场通信",
      "source": "local"
    },
    {
      "index": 1,
      "token": "write",
      "meaning": "写入",
      "source": "local"
    },
    {
      "index": 2,
      "token": "U16",
      "meaning": "16 位无符号整数",
      "source": "local"
    },
    {
      "index": 3,
      "token": "LE",
      "meaning": "小端序",
      "source": "local"
    }
  ],
  "naming": {
    "camelCase": "nfcWriteU16Le",
    "pascalCase": "NfcWriteU16Le",
    "snakeCase": "nfc_write_u16_le",
    "screamingSnakeCase": "NFC_WRITE_U16_LE",
    "kebabCase": "nfc-write-u16-le"
  },
  "diagnostics": [],
  "presentation": {
    "preferredDensity": "minimal",
    "initiallyExpanded": []
  }
}
```

### 8.2 `getCustomxyzValue`

```json
{
  "schema": "pot.programmer-result.v1",
  "plainText": "函数名：getCustomxyzValue\n词语拆分：get · Customxyz · Value\n核心释义：获取自定义 XYZ 值\n词义：\n- get：获取\n- Customxyz：自定义 XYZ〔AI〕\n- Value：值\n命名：\n- camelCase：getCustomxyzValue\n- PascalCase：GetCustomxyzValue\n- snake_case：get_customxyz_value\n- SCREAMING_SNAKE_CASE：GET_CUSTOMXYZ_VALUE\n- kebab-case：get-customxyz-value",
  "summary": {
    "text": "获取自定义 XYZ 值",
    "source": "local_ai",
    "fallback": false
  },
  "identifier": {
    "original": "getCustomxyzValue",
    "detectedType": "function",
    "detectionMode": "auto",
    "tokens": [
      "get",
      "Customxyz",
      "Value"
    ]
  },
  "tokenMeanings": [
    {
      "index": 0,
      "token": "get",
      "meaning": "获取",
      "source": "local"
    },
    {
      "index": 1,
      "token": "Customxyz",
      "meaning": "自定义 XYZ",
      "source": "ai"
    },
    {
      "index": 2,
      "token": "Value",
      "meaning": "值",
      "source": "local"
    }
  ],
  "naming": {
    "camelCase": "getCustomxyzValue",
    "pascalCase": "GetCustomxyzValue",
    "snakeCase": "get_customxyz_value",
    "screamingSnakeCase": "GET_CUSTOMXYZ_VALUE",
    "kebabCase": "get-customxyz-value"
  },
  "diagnostics": [],
  "presentation": {
    "preferredDensity": "minimal",
    "initiallyExpanded": []
  }
}
```

### 8.3 `RxBufLen`

```json
{
  "schema": "pot.programmer-result.v1",
  "plainText": "类名：RxBufLen\n词语拆分：Rx · Buf · Len\nAI 释义：接收缓冲区的长度\n词义：\n- Rx：接收\n- Buf：缓冲区\n- Len：长度\n命名：\n- camelCase：rxBufLen\n- PascalCase：RxBufLen\n- snake_case：rx_buf_len\n- SCREAMING_SNAKE_CASE：RX_BUF_LEN\n- kebab-case：rx-buf-len",
  "summary": {
    "text": "接收缓冲区的长度",
    "source": "ai",
    "fallback": false
  },
  "identifier": {
    "original": "RxBufLen",
    "detectedType": "class",
    "detectionMode": "auto",
    "tokens": [
      "Rx",
      "Buf",
      "Len"
    ]
  },
  "tokenMeanings": [
    {
      "index": 0,
      "token": "Rx",
      "meaning": "接收",
      "source": "local"
    },
    {
      "index": 1,
      "token": "Buf",
      "meaning": "缓冲区",
      "source": "local"
    },
    {
      "index": 2,
      "token": "Len",
      "meaning": "长度",
      "source": "local"
    }
  ],
  "naming": {
    "camelCase": "rxBufLen",
    "pascalCase": "RxBufLen",
    "snakeCase": "rx_buf_len",
    "screamingSnakeCase": "RX_BUF_LEN",
    "kebabCase": "rx-buf-len"
  },
  "diagnostics": [],
  "presentation": {
    "preferredDensity": "minimal",
    "initiallyExpanded": []
  }
}
```

### 8.4 `ST25DV_i2c_WriteData`

```json
{
  "schema": "pot.programmer-result.v1",
  "plainText": "函数名：ST25DV_i2c_WriteData\n词语拆分：ST25DV · I2C · write · data\n核心释义：ST25DV I2C 写入数据\n词义：\n- ST25DV：技术缩写或数字，保留原文\n- I2C：I²C 总线\n- write：写入\n- data：数据\n命名：\n- camelCase：st25dvI2cWriteData\n- PascalCase：St25dvI2cWriteData\n- snake_case：st25dv_i2c_write_data\n- SCREAMING_SNAKE_CASE：ST25DV_I2C_WRITE_DATA\n- kebab-case：st25dv-i2c-write-data\n诊断：AI 请求未完成，已使用完整本地结果。",
  "summary": {
    "text": "ST25DV I2C 写入数据",
    "source": "local_fallback",
    "fallback": true
  },
  "identifier": {
    "original": "ST25DV_i2c_WriteData",
    "detectedType": "function",
    "detectionMode": "auto",
    "tokens": [
      "ST25DV",
      "I2C",
      "write",
      "data"
    ]
  },
  "tokenMeanings": [
    {
      "index": 0,
      "token": "ST25DV",
      "meaning": "技术缩写或数字，保留原文",
      "source": "literal"
    },
    {
      "index": 1,
      "token": "I2C",
      "meaning": "I²C 总线",
      "source": "local"
    },
    {
      "index": 2,
      "token": "write",
      "meaning": "写入",
      "source": "local"
    },
    {
      "index": 3,
      "token": "data",
      "meaning": "数据",
      "source": "local"
    }
  ],
  "naming": {
    "camelCase": "st25dvI2cWriteData",
    "pascalCase": "St25dvI2cWriteData",
    "snakeCase": "st25dv_i2c_write_data",
    "screamingSnakeCase": "ST25DV_I2C_WRITE_DATA",
    "kebabCase": "st25dv-i2c-write-data"
  },
  "diagnostics": [
    {
      "code": "ai.request_failed",
      "severity": "warning",
      "message": "AI 请求未完成，已使用完整本地结果。",
      "recoverable": true
    }
  ],
  "presentation": {
    "preferredDensity": "minimal",
    "initiallyExpanded": [
      "diagnostics"
    ]
  }
}
```

## 9. Wave 1 文件边界

三个任务必须分别从本协调契约 Commit 创建独立分支，不能依赖另一个未合并任务的提交。

### 9.1 `MIN-DESKTOP-01 结果标准化层`

分支：

```text
task/min-desktop-result-normalizer
```

只允许创建：

- `src/utils/plugin_result.js`
- `tests/programmer-ui/plugin_result.test.mjs`

负责：

- 本文件第 2、3、4、7 节纯函数与数据校验。
- 字符串、旧词典对象、精确 v1、未知 Schema、无效 v1 的标准化测试。
- 四个固定 fixture、`plainText` 不变量、枚举和安全回退测试。
- `createPluginHostCapabilities()` 新对象与精确字段测试。

禁止修改：

- `TargetArea`
- `PluginConfig`
- `History`
- `invoke_plugin.js`
- 结果组件
- `package.json`
- `pnpm-lock.yaml`
- i18n
- Tauri/Rust
- PR #1/#2 文件

### 9.2 `MIN-DESKTOP-02 极简结果组件`

分支：

```text
task/min-desktop-summary-details
```

只允许创建：

- `src/window/Translate/components/ProgrammerMinimalResult/index.jsx`
- `src/window/Translate/components/ProgrammerMinimalResult/model.js`
- `tests/programmer-ui/programmer_minimal_result_model.test.mjs`

负责：

- 本文件第 5、11 节组件与无障碍契约。
- 使用静态 fixture 或符合 `NormalizedProgrammerResult` 的静态数据。
- 折叠/展开模型、非空 section 判定、来源标签、复制参数的纯函数测试。
- React 组件只消费已标准化数据。

禁止修改：

- `TargetArea`
- `PluginConfig`
- `History`
- `src/utils/plugin_result.js`
- `package.json`
- `pnpm-lock.yaml`
- i18n
- 插件调用
- PR #1/#2 文件

不得为 UI 测试新增依赖；可执行的自动验证使用 `node --test` 覆盖纯模型，并由 Vite 构建与 Wave 3 GUI/辅助技术验收补足。

### 9.3 `MIN-DESKTOP-03 极简配置页`

分支：

```text
task/min-desktop-config-disclosure
```

允许修改：

- `src/window/Config/pages/Service/PluginConfig/index.jsx`

只允许创建：

- `src/window/Config/pages/Service/PluginConfig/schema.js`
- `tests/programmer-ui/plugin_config_schema.test.mjs`

负责：

- 本文件第 6 节通用 Schema。
- 保持旧 input/select/无 type 行为。
- section、secret、textarea、switch、help、visibleWhen。
- 可见性、默认值、switch 字符串值、未知 section 和未知 type 的纯函数测试。

禁止修改：

- `TargetArea`
- 结果组件
- `History`
- `src/utils/plugin_result.js`
- `package.json`
- `pnpm-lock.yaml`
- 插件运行时
- PR #1/#2 文件

## 10. Wave 2 独占高冲突文件

`MIN-DESKTOP-04 TargetArea、复制与历史集成` 只有在三个 Wave 1 任务合并到方案分支后开始。

分支：

```text
task/min-desktop-result-integration
```

只有该任务可以修改：

- `src/window/Translate/components/TargetArea/index.jsx`
- `src/window/Translate/index.jsx`（仅在需要提升查询 ID 时）
- `src/window/Config/pages/History/index.jsx`（仅在确需兼容迁移时）

集成职责：

1. 初始与反向翻译插件调用加入顶层 `options.host`。
2. `setResult` 和最终 resolve 均经过 `normalizePluginResult`，但自动复制和历史只使用最终、未过期请求结果。
3. `kind='programmer'` 使用 `ProgrammerMinimalResult`。
4. `kind='legacy-object'` 继续现有旧对象渲染。
5. `kind='text'` 与 `plain-text-fallback` 使用文本渲染。
6. `plainText` 非空时，复制全文、自动复制和历史统一读取同一值。
7. 新查询使用新 `key`，重置组件展开状态。
8. 不改变内置服务、TTS、收藏、旧字符串和旧对象行为。
9. 不在 `invoke_plugin.js` 注入宿主能力，不把能力持久化。
10. 集成后再决定是否需要修改 History；若 `TargetArea` 已写入纯文本，History 保持不变优先。

## 11. 320px、键盘与 ARIA 验收标准

### 11.1 320px 与缩放

- 在结果内容可用宽度 320px 时，页面和卡片不得产生水平滚动条。
- 标识符、token、诊断和命名值允许换行，使用等价于 `min-width: 0` 与 `overflow-wrap: anywhere` 的约束。
- 操作按钮不得被文本挤出可视区；必要时允许按钮组换行。
- 200% 浏览器缩放下仍满足相同操作可达性。
- 不通过固定像素宽度截断完整 `plainText` 或详情。

### 11.2 键盘

- 展开/收起必须是原生 button 或等价可访问控件。
- Tab 可到达展开、复制全文和每个可复制命名项。
- Enter 与 Space 均能切换展开状态。
- 切换后焦点保留在触发按钮，不自动跳入详情。
- 收起后隐藏区不可继续获得焦点。
- 焦点顺序与视觉顺序一致，不使用正 tabindex。

### 11.3 ARIA

- 展开按钮提供 `aria-expanded`。
- 展开按钮提供 `aria-controls`，值与详情容器稳定 ID 一致。
- 详情容器使用匹配 ID，并以 region 或等价语义关联可读标题。
- 图标按钮必须有可读 `aria-label`；Tooltip 不能是唯一名称来源。
- 复制反馈和本地回退短警告使用 `aria-live='polite'`，不得抢焦点。
- 来源状态和 diagnostic severity 不能只靠颜色表达。
- `diagnostics=[]` 时 DOM 中不存在诊断标题、region 或空列表。
- 装饰图标对辅助技术隐藏；有信息含义的图标同时提供文本。

## 12. 验证门禁与风险

### 12.1 本契约任务验证范围

本任务只修改 Markdown，可完成：

- 固定 Commit、分支和文件边界复读。
- 与插件契约逐字段静态核对。
- 四个 JSON fixture 的语法检查。
- Base/Head 差异与开放 PR 冲突检查。
- GitHub CI 状态读取。

本任务不声称以下内容已通过：

- Vite 构建。
- Tauri 构建。
- Node 单元测试。
- GUI、键盘、屏幕阅读器或 320px 验收。
- 插件与桌面端组合测试。
- 自动复制、历史和剪贴板真实行为。

### 12.2 重点风险

- 当前 `TargetArea` 职责集中，Wave 2 同时改动插件调用、渲染与持久化时容易产生回归。
- 旧词典对象没有可信统一 `plainText`；不得为追求统一而制造 `[object Object]` 或猜测序列化格式。
- 当前仓库没有现成前端测试框架；Wave 1 必须保持纯函数可测，不得顺带引入依赖。
- `presentation.initiallyExpanded` 与“新查询默认折叠”存在策略选择；本桌面端明确忽略该提示来保证固定生命周期。
- 配置值历史上主要是字符串；switch 必须继续存字符串，避免插件读取行为变化。
- `minimal` 插件默认发布必须等待宿主能力、结果组件、`plainText` 集成和组合验收全部完成。

## 13. Wave 1 交接 Prompt

### 13.1 标准化层

```text
你负责 elio-zwd/pot-desktop 的 MIN-DESKTOP-01。
从 backup/programmer-minimal-tool-ui 在协调者提供的 MIN-DESKTOP-00 最终 Commit SHA 上创建 task/min-desktop-result-normalizer。
先读取 docs/programmer-ui/DEVELOPMENT-PACK.md 和固定插件契约 8acd3146481c433a70d26f210dc2c07902645b2f。
只创建 src/utils/plugin_result.js 与 tests/programmer-ui/plugin_result.test.mjs。
实现 normalizePluginResult、PROGRAMMER_RESULT_SCHEMA、createPluginHostCapabilities 及测试。
不得修改 TargetArea、PluginConfig、History、invoke_plugin.js、结果组件、依赖或 PR #1/#2。
创建 Draft PR，Base 为 backup/programmer-minimal-tool-ui；未经授权不得合并。
```

### 13.2 极简结果组件

```text
你负责 elio-zwd/pot-desktop 的 MIN-DESKTOP-02。
从 backup/programmer-minimal-tool-ui 在协调者提供的 MIN-DESKTOP-00 最终 Commit SHA 上创建 task/min-desktop-summary-details。
先读取 docs/programmer-ui/DEVELOPMENT-PACK.md，并只消费其中冻结的 NormalizedProgrammerResult 和组件 props。
只创建 ProgrammerMinimalResult/index.jsx、model.js 与 tests/programmer-ui/programmer_minimal_result_model.test.mjs。
使用静态 fixture，实现默认折叠、当前结果内展开、复制参数、空诊断隐藏、320px、键盘和 ARIA。
不得修改 TargetArea、PluginConfig、History、标准化层、依赖、i18n 或 PR #1/#2。
创建 Draft PR，Base 为 backup/programmer-minimal-tool-ui；未经授权不得合并。
```

### 13.3 通用配置页

```text
你负责 elio-zwd/pot-desktop 的 MIN-DESKTOP-03。
从 backup/programmer-minimal-tool-ui 在协调者提供的 MIN-DESKTOP-00 最终 Commit SHA 上创建 task/min-desktop-config-disclosure。
先读取 docs/programmer-ui/DEVELOPMENT-PACK.md 和现有 PluginConfig。
只修改 PluginConfig/index.jsx，并创建 PluginConfig/schema.js 与 tests/programmer-ui/plugin_config_schema.test.mjs。
实现 section、select、input、secret、textarea、switch、help、visibleWhen，同时保持旧 input/select/省略 type。
不得修改 TargetArea、结果组件、History、标准化层、依赖或 PR #1/#2。
创建 Draft PR，Base 为 backup/programmer-minimal-tool-ui；未经授权不得合并。
```

## 14. 本地 AI 只读验收 Prompt

```text
仓库：https://github.com/elio-zwd/pot-desktop
任务：只读验收 MIN-DESKTOP-00 桌面端契约。
先 git fetch origin，检出 task/min-desktop-contract，并 reset 到远端协调者提供的最终 Commit SHA。
只允许读取、比较、构建、测试和验收；禁止修改、格式化、自动修复、提交、push、创建或更新 PR、合并、删除分支。
记录操作系统、Git、Node.js、pnpm、Rust、Cargo 版本，记录每条命令、退出码、测试数量和关键日志。
核对 Base 为 backup/programmer-minimal-tool-ui，Base SHA 为 1a7b3297dfd5b9cc2244e33f6ab3b7ac78073f9b，差异只包含 docs/programmer-ui/DEVELOPMENT-PACK.md。
核对固定插件契约 Commit 为 8acd3146481c433a70d26f210dc2c07902645b2f。
提取本文件四个 json 代码块并执行 JSON.parse，核对四种 summary.source 和 fixture 名称。
逐项核对 normalizePluginResult 联合类型、v1 校验、未知 Schema 回退、plainText 规则、组件 props、展开生命周期、配置 Schema、options.host 放置、Wave 1 文件边界和 320px/键盘/ARIA 验收标准。
可选执行 pnpm install --frozen-lockfile 与 pnpm build；本任务是纯文档，构建结果只用于确认没有仓库级回归。
不得调用真实网络翻译或 Gemini API。
把失败项、实际输出、复现步骤和可能原因原样反馈给远端开发对话，不自动修复。
```
