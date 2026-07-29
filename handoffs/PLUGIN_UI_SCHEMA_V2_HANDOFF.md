# 插件设置 Schema V2 开发交接

## 1. 仓库与状态

- 仓库：`https://github.com/elio-zwd/pot-desktop`
- 分支：`feat/plugin-ui-schema-v2`
- Base：`custom/main`
- 初始 Base SHA：`594d32ede96acd106b0256deaa8bb440ffcdff40`
- Draft PR：`https://github.com/elio-zwd/pot-desktop/pull/3`
- PR 标题：`feat: 添加插件设置 Schema V2 与分组界面`
- PR 状态：Draft，未转 Ready，未合并
- 配套结果页分支：`feat/plugin-result-schema-v2`

远端 AI 已完成代码开发、纯函数测试、Web 构建、Schema 文档和 Draft PR。最终 HEAD 以分支和 PR 当前最新提交为准；本地 AI 只负责拉取最终指定 SHA 后进行只读构建与桌面端 UI 验收。

## 2. 已实现能力

### Schema 归一化

文件：

```text
src/utils/plugin_config_schema.js
```

导出：

```text
normalizePluginNeeds(needs)
evaluateVisibleWhen(condition, config)
resolvePluginFieldValue(field, config)
clampTextareaRows(value)
```

支持字段：

- `group`
- `groupDisplay`
- `groupAdvanced`
- `description`
- `placeholder`
- `secret`
- `multiline`
- `rows`
- `visibleWhen`

保留旧字段：

- `key`
- `display`
- `type`
- `options`

安全规则：

- 未声明 `type` 时按普通输入框处理；
- 只明确支持 `input` 和 `select`，未知类型降级为输入框；
- 错误或空 `options` 降级为输入框；
- 字段键、标题、帮助文字、占位符、选项数量和选项文字均有限制；
- `rows` 限制在 2—8，错误值回退为 4；
- 特殊选项键不会污染对象原型；
- 异常文本对象不会导致归一化抛错；
- 不解析 HTML、CSS、JavaScript、函数或 React 组件。

### 条件显示

仅支持：

```text
equals
notEquals
in
notIn
```

条件只读取当前插件实例配置。条件无效、引用键不存在或配置不可读取时，字段安全显示。字段隐藏只影响 UI，不删除或重置配置值。

### 设置界面

文件：

```text
src/window/Config/pages/Service/PluginConfig/index.jsx
src/window/Config/pages/Service/PluginConfig/PluginConfigGroup.jsx
src/window/Config/pages/Service/PluginConfig/PluginConfigField.jsx
```

实现：

- 普通分组使用 NextUI 轻量卡片；
- 无分组旧插件使用无标题兼容布局；
- `groupAdvanced: true` 默认折叠；
- 多个高级组独立展开；
- `description` 纯文本换行显示；
- 输入框和多行输入支持 `placeholder`；
- `secret` 默认遮罩并支持字段独立显示/隐藏；
- `multiline` 使用 NextUI `Textarea`；
- 长标签、长选项和窄窗口使用受控响应式布局；
- 保留主页按钮、实例名称、保存、更新服务列表和关闭弹窗流程。

## 3. 旧插件兼容

已保持以下行为：

- 旧版无 `type` 字段继续作为输入框；
- 旧版 `type: input` 行为不变；
- 旧版 `type: select` 保持选项顺序，第一个选项仍作为未保存时的默认显示值；
- `needs: []` 继续显示无需配置提示；
- 保存时继续写回原插件实例配置对象；
- 隐藏字段、未知 Schema 和新增字段不会删除旧 Key；
- 未修改旧插件配置存储格式。

`info.json` 仍由原配置页读取并 `JSON.parse` 后构造 `pluginList`；`useConfig(instanceKey, {}, { sync: false })` 仍只在点击保存时通过 `setPluginConfig(pluginConfig, true)` 强制持久化。

## 4. API Key 安全边界

- `secret` 只提供界面遮罩，不代表加密；
- API Key 继续使用 Pot 当前本地配置存储；
- 未实现 Key 加密；
- 未实现“检查 Key”按钮；
- 未新增 Key 网络请求；
- 测试只使用明确标注的假值，不包含真实 API Key。

## 5. 测试与构建

测试文件：

```text
tests/plugin_config_schema.test.js
```

执行命令：

```bash
node --test tests/plugin_config_schema.test.js
pnpm build
git diff --check
git status --short
```

专用工作流：

```text
.github/workflows/plugin-ui-schema-v2-check.yml
```

工作流使用 Node 21、pnpm 9，冻结锁文件安装依赖，执行纯函数测试、Web 构建、空白错误检查和构建后工作区干净检查。

## 6. 文档

Schema 使用说明：

```text
docs/plugin-ui-schema-v2.md
```

内容包括完整 `needs` 示例、字段定义、四种条件运算符、分组规则、旧版兼容和安全限制。程序员划词翻译插件可按该文档接入，但本分支未修改插件仓库。

## 7. 严格边界确认

本分支未修改：

```text
src/window/Translate/components/TargetArea/index.jsx
package.json
pnpm-lock.yaml
src-tauri/**
```

也未实现：

- 插件结果 Schema；
- 结果卡片组件；
- 程序员划词翻译插件业务逻辑；
- Key 加密或 Key 检查；
- 插件自定义 CSS、HTML、JavaScript 或 React 组件。

## 8. 待本地 AI 只读验收

本地 AI 不得修改源码、格式化、提交、推送、创建或合并 PR。只需在最终指定 SHA 上验证：

- Node 测试与 `pnpm build`；
- 亮色和暗色主题；
- 窄窗口；
- 长中文标签与长下拉选项；
- 高级组默认折叠和独立展开；
- 密码默认遮罩，显示/隐藏不改变值；
- 密码多行输入可编辑；
- `visibleWhen` 实时显示/隐藏且不丢值；
- 旧版输入框、下拉框和 `needs: []`；
- 保存、关闭、重新打开后的配置值；
- 实例名称和主页按钮；
- 验收前后 `git status --short` 为空。

验收结果需回传环境版本、命令输出、截图、异常和最终工作区状态。
