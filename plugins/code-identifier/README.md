# Pot 代码标识符助手

一个完全本地运行的 Pot 翻译插件，用于拆分、解释和转换函数名、变量名、类名、常量与文件名。

## 当前版本

`0.1.0`：第一版本地规则引擎，不调用网络接口，不上传选中的代码或文本。

## 支持能力

- 拆分 `camelCase`、`PascalCase`、`snake_case`、`SCREAMING_SNAKE_CASE`、`kebab-case`。
- 正确处理连续大写缩写，例如 `HTTPRequestCode`。
- 保护常见编程和嵌入式缩写，例如 `HTTP`、`JSON`、`MCU`、`I2C`、`NFC`、`ST25DV`、`FreeRTOS` 相关术语。
- 将一个标识符同时输出为多种命名风格。
- 给出常见英文编程词的中文含义。
- 将常见中文命名描述转换为英文标识符。
- 支持函数名、变量名、布尔变量、类名、常量/宏和文件名模式。

## 示例

输入：

```text
ST25DV_i2c_WriteData
```

完整分析输出：

```text
原文：ST25DV_i2c_WriteData
识别类型：函数名
拆分：ST25DV | I2C | write | data
中文含义：ST25DVI2C写入数据

camelCase：st25dvI2cWriteData
PascalCase：St25dvI2cWriteData
snake_case：st25dv_i2c_write_data
SCREAMING_SNAKE_CASE：ST25DV_I2C_WRITE_DATA
kebab-case：st25dv-i2c-write-data
```

输入中文：

```text
读取用户配置
```

选择“函数名 + camelCase”后输出：

```text
readUserConfig
```

输入中文：

```text
连接成功
```

选择“布尔变量 + camelCase”后输出：

```text
isConnectionSuccessful
```

## 安装

### 从 GitHub Actions 下载

1. 打开仓库的 **Actions** 页面。
2. 进入 `Code Identifier Plugin` 工作流。
3. 下载 `pot-code-identifier-plugin` Artifact。
4. 解压后得到 `plugin.com.elio.code-identifier.potext`。
5. 在 Pot 中打开：`偏好设置 → 服务设置 → 添加外部插件 → 安装外部插件`。
6. 把“代码标识符助手”加入翻译服务列表。

### Windows 手动打包

在本目录执行：

```powershell
Compress-Archive -Path main.js,info.json,icon.svg -DestinationPath plugin.com.elio.code-identifier.zip -Force
Rename-Item plugin.com.elio.code-identifier.zip plugin.com.elio.code-identifier.potext
```

注意：压缩包根目录必须直接包含 `main.js`、`info.json` 和 `icon.svg`，不能再套一层文件夹。

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

### 标识符类型

- 自动判断
- 函数名
- 变量名
- 布尔变量
- 类名
- 常量/宏
- 文件名

布尔变量模式会在必要时自动添加 `is` 前缀。

### 缩写格式

- 标准驼峰：`getHTTPResponse` 转成 `getHttpResponse`
- 保留大写：`getHTTPResponse` 保持 `getHTTPResponse`

## 本地开发与测试

要求 Node.js 18 或更高版本。

```bash
cd plugins/code-identifier
npm test
```

插件入口必须保持单文件、无 import。Pot 会读取 `main.js` 后通过 `eval()` 获取 `translate` 函数，因此不要把运行时逻辑拆成需要模块加载的多个文件。

## 已知限制

- 第一版中文转英文使用本地词典，未收录词语会在完整分析中提示。
- 第一版定位于单个标识符或简短命名描述，不处理完整源代码重构。
- 自动类型判断是启发式规则；C 风格带硬件前缀的函数名建议手动选择“函数名”。
- 当前没有 AI 增强模式，复杂语义命名后续再加入可选的 OpenAI 兼容接口。

## 后续计划

1. 扩充 MCU、Android、机器人和通信协议词典。
2. 支持用户自定义缩写与中英文词条。
3. 增加多候选命名及命名质量提示。
4. 增加可选 AI 语义增强，但仍由本地规则负责最终格式校验。
5. 根据实际使用情况评估是否需要修改 Pot 主程序，增加一键复制不同命名风格的专用界面。

## 许可证

本插件随当前仓库使用 GPL-3.0-only。
