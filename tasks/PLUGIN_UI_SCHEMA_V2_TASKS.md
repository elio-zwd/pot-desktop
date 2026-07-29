# 插件设置 Schema V2 任务清单

## 状态说明

- `[ ]` 未开始
- `[-]` 进行中或等待本地只读验收
- `[x]` 已完成
- `[!]` 阻塞，需要用户确认

## 当前状态

- 远端 AI 开发、纯函数测试、Web 构建、文档和 Draft PR 已完成。
- Draft PR：`#3`，Base 为 `custom/main`，保持 Draft，未合并。
- 亮暗主题、窄窗口和真实桌面端交互仍等待本地 AI 在指定最终 SHA 上只读验收。

## T0：接手与基线确认

- [x] 按顺序读取 `README.md`、`AGENTS.md`、Plan、Task、Handoff。
- [x] 确认当前分支为 `feat/plugin-ui-schema-v2`。
- [x] 确认 Base 为 `custom/main`，基线祖先包含 `594d32ede96acd106b0256deaa8bb440ffcdff40`。
- [x] 通过 CI 检查构建后工作区干净。
- [x] 阅读真实文件：
  - `src/window/Config/pages/Service/PluginConfig/index.jsx`
  - 插件列表加载与 `info.json` 解析路径
  - `useConfig` 实现
  - 现有 `.github/workflows/package.yml`
- [-] CI 已记录 Node 21、pnpm 9 和项目 Tauri 1.x 依赖；本地 Rust/Tauri 运行环境等待只读验收回传。

## T1：定义安全 Schema V2

- [x] 新增纯函数模块 `src/utils/plugin_config_schema.js`。
- [x] 定义并记录以下可选字段：
  - `group`
  - `groupDisplay`
  - `groupAdvanced`
  - `description`
  - `placeholder`
  - `secret`
  - `multiline`
  - `rows`
  - `visibleWhen`
- [x] 保持 `key/display/type/options` 旧字段语义。
- [x] 限制字段字符串长度、选项规模、行数范围。
- [x] 未知数据安全降级，不抛出导致设置页白屏的异常。
- [x] 禁止解析 HTML、CSS、函数或 JavaScript 表达式。

## T2：归一化和条件判断纯函数

- [x] 实现 `normalizePluginNeeds(needs)`。
- [x] 实现稳定的分组顺序。
- [x] 实现无分组旧插件的兼容分组。
- [x] 实现 `evaluateVisibleWhen(condition, config)`。
- [x] 支持：`equals/notEquals/in/notIn`。
- [x] 条件无效时默认显示字段。
- [x] 实现 `resolvePluginFieldValue()`。
- [x] 实现多行行数边界函数。

## T3：补充纯函数测试

- [x] 使用 Node 内置 `node:test`，未引入测试框架。
- [x] 覆盖空 `needs`。
- [x] 覆盖旧版无 `type` 输入框。
- [x] 覆盖旧版 `input/select`。
- [x] 覆盖多分组和首次声明优先规则。
- [x] 覆盖高级组默认折叠元数据。
- [x] 覆盖全部四种条件运算符。
- [x] 覆盖错误条件、错误选项、未知类型。
- [x] 覆盖超长文本和 `rows` 边界。
- [x] 覆盖特殊选项键和异常文本对象容错。
- [x] 测试不读取真实用户配置，不包含真实 API Key。

## T4：拆分设置页组件

- [x] 保留现有首页链接。
- [x] 保留实例名称编辑。
- [x] 保留现有保存和关闭行为。
- [x] 从 `index.jsx` 抽出分组组件。
- [x] 从 `index.jsx` 抽出字段组件。
- [x] 未修改与插件设置无关的全局配置页。
- [x] 未格式化无关文件。

## T5：卡片式分组

- [x] 普通分组以轻量卡片呈现。
- [x] 使用插件声明的 `groupDisplay` 作为组标题。
- [x] 无标题兼容分组保持接近旧版布局。
- [x] 分组间距和字段布局提供窄窗口响应式规则。
- [x] 不使用插件提供的任意 className 或颜色值。
- [x] 使用 NextUI 现有主题变量适配亮暗主题。

## T6：高级设置折叠

- [x] `groupAdvanced: true` 默认折叠。
- [x] 提供明确的展开/收起按钮、`aria-expanded` 和 `aria-controls`。
- [x] 展开状态只保存在当前组件状态。
- [x] 折叠不删除、不重置任何配置值。
- [x] 多个高级分组可独立展开。

## T7：帮助文字和占位符

- [x] 在字段下方展示 `description`。
- [x] 为输入框和多行输入使用 `placeholder`。
- [x] 长帮助文字可换行，不挤压控件。
- [x] 所有内容按纯文本渲染。
- [x] 插件未提供时不产生空白占位。

## T8：密码遮罩与多行输入

- [x] `secret: true` 默认遮罩。
- [x] 显示/隐藏状态按字段独立管理。
- [x] 切换显示状态只修改组件状态，不修改配置值。
- [x] `multiline: true` 使用 NextUI `Textarea`。
- [x] `rows` 使用 2—8 安全范围。
- [x] 密码多行输入在隐藏状态下仍可编辑。
- [x] 未实现 Key 加密、检查按钮或网络请求。

## T9：条件显示

- [x] 根据当前 `pluginConfig` 实时判断可见性。
- [x] 隐藏字段时保留原配置值。
- [x] 文档提供 `modelPreset=custom` 时显示自定义模型的示例。
- [x] 引用不存在字段时安全显示。
- [x] 条件只读取当前插件实例配置。

## T10：旧插件兼容回归

- [x] 纯函数测试覆盖 Lingva 模板式单输入配置语义。
- [x] 纯函数测试覆盖旧版下拉配置。
- [x] 纯函数测试覆盖 `needs: []`。
- [x] 更新配置时保留旧 Key 和原对象层级，保存格式不变。
- [-] 实例名称、主页按钮和旧插件实际 UI 等待本地只读验收。
- [x] 未知字段和错误 Schema 已进行安全降级测试。

## T11：视觉与交互验收

- [-] 对照方案二概念图检查真实桌面端大方向。
- [-] 暗色主题检查。
- [-] 亮色主题检查。
- [-] 窄窗口检查。
- [-] 长中文标签检查。
- [-] 长下拉选项检查。
- [-] 键盘聚焦和基础可访问性检查。
- [-] 高级 AI 默认折叠检查。

以上项目由本地 AI 在最终 SHA 上只读验收并回传截图，不允许修改源码。

## T12：构建与审计

- [x] 运行全部新增 Node 测试。
- [x] 运行 `pnpm build`。
- [x] 未新增运行时依赖。
- [x] 未修改锁文件。
- [x] 未提交 API Key、证书或用户配置。
- [x] `git diff --check` 通过。
- [x] CI 构建后 `git status --short` 为空。

## T13：文档与 Draft PR

- [x] 新增 Schema V2 使用文档和示例。
- [x] 记录已实现字段、限制和兼容策略。
- [x] 给出程序员划词翻译插件后续接入示例，未修改其仓库。
- [x] 创建 Draft PR，Base 为 `custom/main`。
- [x] PR 标题为 `feat: 添加插件设置 Schema V2 与分组界面`。
- [x] PR 明确 Key 尚未加密、未实现检查按钮。
- [x] PR 保持 Draft，未转 Ready、未合并。

## T14：本地 AI 只读验收交接

- [-] 最终汇报输出包含仓库链接和指定 SHA 的本地验收 Prompt。
- [x] Prompt 仅允许 fetch、checkout/reset 指定 SHA、安装依赖、构建和 UI 验收。
- [x] Prompt 禁止修改、格式化、commit、push、创建或合并 PR。
- [x] Prompt 要求回传环境、构建结果、截图、异常和工作区状态。
