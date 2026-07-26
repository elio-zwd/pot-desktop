# Pot 代码标识符助手

一个本地优先的 Pot 翻译插件，用于拆分、解释和转换函数名、变量名、类名、常量、文件名，也可以查询普通英文单词的中文释义。

## 当前版本

`0.2.0`：增加双层本地词典。

1. **编程术语层**：内置软件开发、Android、嵌入式、通信与机器人常用词的上下文译法。
2. **普通英语层**：构建时从 ECDICT 精简词库生成 `dictionary.db`，运行时通过 SQLite 完全离线查询。

本版本不接入 Gemini，不包含 API Key 配置，也不会发送选中的代码或文本。

## 支持能力

- 拆分 `camelCase`、`PascalCase`、`snake_case`、`SCREAMING_SNAKE_CASE`、`kebab-case`。
- 处理连续大写、数字缩写和厂商前缀，例如 `HTTPServer`、`getIPv6Address`、`ST25DVConfig`。
- 保护 `MCU`、`I2C`、`NFC`、`UART`、`CAN`、`RTOS`、`ST25DV` 等术语。
- 将一个标识符转换成多种命名风格。
- 编程术语优先翻译，并使用普通词典补齐未内置的英文词。
- 可只显示普通英语词典结果，支持音标、词形原型和多行释义。
- 未收录单词会明确标记，不再把英文原样冒充为中文含义。
- 常见中文命名描述可生成英文函数名、变量名和布尔变量名。

## 本地词典显示模式

### 编程术语 + 普通词义（默认）

输入：

```text
translate_service_list
```

输出重点：

```text
编程含义：翻译服务列表
普通词义：
- translate /.../：v. 翻译；转化；解释
- service /.../：n. 服务；服役；公共事业
- list /.../：n. 清单；目录；列表
```

### 仅编程术语优先

适合快速理解代码：

```text
requestTimeout → 请求超时
serviceInstanceList → 服务实例列表
ST25DV_i2c_WriteData → ST25DV I2C 写入数据
```

编程词典未命中的词会使用 ECDICT 的首个简明中文释义兜底。

### 仅普通英语词典

输入普通英文单词或由多个词组成的标识符时，逐词显示词典释义：

```text
apple
services
helloWorld
```

词形条目会尽量显示原形，例如：

```text
services（原形：service）
```

## 安装

### 从 GitHub Actions 下载

1. 打开仓库的 **Actions** 页面。
2. 进入 `Code Identifier Plugin` 工作流。
3. 下载 `pot-code-identifier-plugin` Artifact。
4. 解压外层 ZIP，得到 `plugin.com.elio.code-identifier.potext`。
5. 在 Pot 中打开：`偏好设置 → 服务设置 → 翻译 → 添加外部插件 → 安装外部插件`。
6. 点击“代码标识符助手”，保存配置，把它加入翻译服务列表。

使用旧版插件时，直接安装同 ID 的新版即可；若 Pot 没有刷新配置项，先删除旧插件，再安装新版。

## 配置项

### 输出格式

- 完整分析
- `camelCase`
- `PascalCase`
- `snake_case`
- `SCREAMING_SNAKE_CASE`
- `kebab-case`
- 拆分词组
- 仅中文含义

只有“完整分析”和“仅中文含义”需要读取普通英语数据库。单纯转换命名风格不会打开数据库。

### 本地词典显示

- 编程术语 + 普通词义
- 仅编程术语优先
- 仅普通英语词典

### 标识符类型

- 自动判断
- 函数名
- 变量名
- 布尔变量
- 类名
- 常量/宏
- 文件名

### 缩写格式

- 标准驼峰：`getHTTPResponse` 转成 `getHttpResponse`
- 保留大写：`getHTTPResponse` 保持 `getHTTPResponse`

## 数据来源与隐私

普通英语数据来自 MIT 许可的 [ECDICT](https://github.com/skywind3000/ECDICT)，构建固定使用提交：

```text
bc015ed2e24a7abef49fc6dbbb7fe32c1dadaf8b
```

构建脚本只保留带中文释义的单词条目，并把词形变化写成离线查询别名。完整许可和转换说明见 `THIRD_PARTY_NOTICES.md`。

运行时：

- 不访问 ECDICT 网站；
- 不请求网络；
- 不上传代码、标识符或词典查询记录；
- 只读取插件目录内的 `dictionary.db`。

## 本地开发与测试

要求 Node.js 18+ 和 Python 3.10+。

```bash
cd plugins/code-identifier
npm test
python scripts/test_dictionary_build.py
```

`npm test` 会先把 `src/runtime-*.js` 合成为 Pot 要求的单文件 `main.js`。

构建完整普通英语数据库：

```bash
curl -L --fail \
  -o /tmp/ecdict.mini.csv \
  https://raw.githubusercontent.com/skywind3000/ECDICT/bc015ed2e24a7abef49fc6dbbb7fe32c1dadaf8b/ecdict.mini.csv

python scripts/build_dictionary.py \
  --input /tmp/ecdict.mini.csv \
  --output dictionary.db \
  --meta dictionary.meta.json \
  --source-commit bc015ed2e24a7abef49fc6dbbb7fe32c1dadaf8b
```

打包时 `.potext` 根目录必须直接包含：

```text
main.js
info.json
icon.svg
dictionary.db
dictionary.meta.json
THIRD_PARTY_NOTICES.md
```

## 已知限制

- 标识符中文组合仍采用本地规则，不等同于完整句子机器翻译。
- 一个英文词可能有多种含义；普通模式展示 ECDICT 的前两行释义，编程模式优先选编程上下文含义。
- 自动类型判断是启发式规则；特殊 C 函数可手动选择“函数名”。
- 第一层只处理单个标识符、短词组或单词，不重构完整源代码。
- Gemini 语义增强留给下一阶段，交接约束见 `GEMINI-HANDOFF.md`。

## 许可证

插件代码使用 GPL-3.0-only；ECDICT 衍生数据库遵循其 MIT 许可与归属要求。
