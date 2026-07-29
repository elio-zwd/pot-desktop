# 插件设置 Schema V2 开发交接

## 1. 任务定位

你负责 Pot 桌面端的插件设置页增强，不负责翻译结果卡片。

- 仓库：`https://github.com/elio-zwd/pot-desktop`
- 分支：`feat/plugin-ui-schema-v2`
- Base：`custom/main`
- 初始 Base SHA：`594d32ede96acd106b0256deaa8bb440ffcdff40`
- 配套结果页分支：`feat/plugin-result-schema-v2`

当前分支已经只写入规划文档，没有开始程序代码实现。请先确认远端最新 HEAD，再开始开发。

## 2. 必读顺序

1. `README.md`
2. `AGENTS.md`
3. `plans/PLUGIN_UI_SCHEMA_V2_PLAN.md`
4. `tasks/PLUGIN_UI_SCHEMA_V2_TASKS.md`
5. 本文档
6. `docs/assets/plugin-ui-schema-v2-card-layering-concept.svg`
7. 当前分支真实源码

## 3. 已确认方向

- 采用“卡片分层方案”作为设置页大致视觉方向。
- 设置项按“基础使用、结果显示、标识符规则、高级 AI”分组。
- “高级 AI”默认折叠。
- API Key 第一阶段只做遮罩、显示/隐藏、多行输入、占位符和帮助文字。
- API Key 继续保存在 Pot 当前本地配置中，本阶段不做加密。
- 不实现“检查 Key”按钮。
- 不开放插件自定义 CSS、HTML、JS 或 React 组件。
- 旧版插件必须继续工作。

## 4. 当前真实入口

重点先阅读：

```text
src/window/Config/pages/Service/PluginConfig/index.jsx
```

当前组件：

- 直接遍历 `pluginList[name].needs`；
- 没有 `type` 时按输入框处理；
- 只显式支持 `input` 和 `select`；
- 使用 `useConfig(instanceKey, {}, { sync: false })` 保存临时配置；
- 点击保存后调用 `setPluginConfig(pluginConfig, true)`；
- 同时负责主页按钮和服务实例名称。

不要破坏主页按钮、实例名称和保存流程。

继续追踪并确认：

- 插件 `info.json` 的读取和解析位置；
- `pluginList` 的构造方式；
- `useConfig` 的持久化语义；
- 配置窗口的宽度和父级滚动布局；
- 现有主题与 `config-item` 样式来源。

## 5. 推荐实现步骤

### 第一步：纯函数优先

先新增 Schema 归一化模块和 Node 内置测试，再改 UI。不要把条件判断和容错全部写在 JSX 中。

建议实现：

```text
normalizePluginNeeds()
evaluateVisibleWhen()
resolvePluginFieldValue()
clampTextareaRows()
```

### 第二步：拆分组件

建议：

```text
PluginConfig/index.jsx
PluginConfig/PluginConfigGroup.jsx
PluginConfig/PluginConfigField.jsx
```

可以根据真实代码结构调整命名，但必须保持职责清晰。

### 第三步：实现卡片分组和高级折叠

- 普通组默认展开；
- 高级组默认折叠；
- 折叠只影响 UI，不删除配置；
- 无分组的旧插件尽量保持当前布局。

### 第四步：实现字段增强

- `description`
- `placeholder`
- `secret`
- `multiline`
- `rows`
- `visibleWhen`

第一版条件只支持：

```text
equals
notEquals
in
notIn
```

无效条件默认显示字段。

### 第五步：兼容验证

至少验证：

- 单输入框旧插件；
- 下拉框旧插件；
- `needs: []`；
- V2 多分组；
- V2 高级折叠；
- V2 密码多行；
- V2 条件显示。

## 6. 与另一个 AI 的边界

另一个对话在：

```text
feat/plugin-result-schema-v2
```

它会处理结果 Schema、卡片结果组件和 `TargetArea` 结果渲染。

本分支不要修改：

```text
src/window/Translate/components/TargetArea/index.jsx
```

也不要创建结果 Schema、结果卡片组件或程序员划词翻译插件业务代码。

为了减少合并冲突：

- 不修改 `package.json`，除非确实无法完成且先向用户说明；
- 不升级依赖；
- 不全仓库格式化；
- 不修改结果页相关文件；
- 新增测试可直接使用 `node --test <path>` 运行。

## 7. 开发中需要询问用户的情况

遇到以下情况先暂停并询问：

- 必须新增第三方依赖；
- 必须改变旧插件配置保存格式；
- 密码多行控件在 NextUI 当前版本存在无法安全解决的限制；
- 条件显示需要超出四种简单运算符；
- 需要把高级折叠状态持久化；
- 需要修改 Tauri/Rust 后端；
- 需要引入 Key 加密或 Key 检查网络请求；
- 需要修改结果页分支负责的文件。

普通代码组织和组件拆分不需要反复询问，可根据 Plan 自主完成。

## 8. 提交与 PR

建议拆成小提交：

```text
test: 添加插件设置 Schema 归一化测试
feat: 添加插件设置 Schema V2 归一化层
refactor: 拆分插件设置字段与分组组件
feat: 添加设置分组和高级折叠
feat: 添加密码多行输入与条件显示
docs: 更新插件设置 Schema V2 说明
```

不要为了匹配建议而制造无意义提交，实际可以合并相近步骤。

完成后创建 Draft PR：

```text
Base: custom/main
Head: feat/plugin-ui-schema-v2
标题：feat: 添加插件设置 Schema V2 与分组界面
```

未经用户明确授权不得转 Ready 或合并。

## 9. 完成汇报要求

最终汇报必须包含：

- 分支和 HEAD SHA；
- 修改文件清单；
- 实现的 Schema 字段；
- 旧插件兼容策略；
- API Key 安全边界；
- 自动测试命令和结果；
- `pnpm build` 结果；
- Draft PR 地址；
- 已知限制；
- 给本地 AI 的只读验收 Prompt；
- `git status --short` 是否为空。
