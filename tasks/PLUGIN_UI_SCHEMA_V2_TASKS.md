# 插件设置 Schema V2 任务清单

## 状态说明

- `[ ]` 未开始
- `[-]` 进行中
- `[x]` 已完成
- `[!]` 阻塞，需要用户确认

## T0：接手与基线确认

- [ ] 按顺序读取 `README.md`、`AGENTS.md`、Plan、Task、Handoff。
- [ ] 确认当前分支为 `feat/plugin-ui-schema-v2`。
- [ ] 确认 Base 为 `custom/main`，基线祖先包含 `594d32ede96acd106b0256deaa8bb440ffcdff40`。
- [ ] 确认工作区干净。
- [ ] 阅读真实文件：
  - `src/window/Config/pages/Service/PluginConfig/index.jsx`
  - 插件列表加载与 `info.json` 解析路径
  - `useConfig` 实现
  - 现有 `.github/workflows/package.yml`
- [ ] 记录当前 Node、pnpm、Rust 和 Tauri 环境，不升级依赖。

## T1：定义安全 Schema V2

- [ ] 新增纯函数模块 `src/utils/plugin_config_schema.js` 或等价路径。
- [ ] 定义并注释以下可选字段：
  - `group`
  - `groupDisplay`
  - `groupAdvanced`
  - `description`
  - `placeholder`
  - `secret`
  - `multiline`
  - `rows`
  - `visibleWhen`
- [ ] 保持 `key/display/type/options` 旧字段语义。
- [ ] 限制字段字符串长度、选项规模、行数范围。
- [ ] 未知数据必须安全降级，不抛出导致设置页白屏的异常。
- [ ] 禁止解析 HTML、CSS、函数或 JavaScript 表达式。

## T2：归一化和条件判断纯函数

- [ ] 实现 `normalizePluginNeeds(needs)`。
- [ ] 实现稳定的分组顺序。
- [ ] 实现无分组旧插件的兼容分组。
- [ ] 实现 `evaluateVisibleWhen(condition, config)`。
- [ ] 支持：`equals/notEquals/in/notIn`。
- [ ] 条件无效时默认显示字段。
- [ ] 实现 `resolvePluginFieldValue()` 或等价函数。
- [ ] 实现多行行数边界函数。

## T3：补充纯函数测试

- [ ] 使用 Node 内置 `node:test`，不引入大型测试框架。
- [ ] 覆盖空 `needs`。
- [ ] 覆盖旧版无 `type` 输入框。
- [ ] 覆盖旧版 `input/select`。
- [ ] 覆盖多分组和首次声明优先规则。
- [ ] 覆盖高级组默认折叠元数据。
- [ ] 覆盖全部四种条件运算符。
- [ ] 覆盖错误条件、错误选项、未知类型。
- [ ] 覆盖超长文本和 `rows` 边界。
- [ ] 确认测试不读取真实用户配置。

## T4：拆分设置页组件

- [ ] 保留现有首页链接。
- [ ] 保留实例名称编辑。
- [ ] 保留现有保存和关闭行为。
- [ ] 从 `index.jsx` 抽出分组组件。
- [ ] 从 `index.jsx` 抽出字段组件。
- [ ] 避免修改与插件设置无关的全局配置页。
- [ ] 不格式化无关文件。

## T5：卡片式分组

- [ ] 普通分组以轻量卡片或分区呈现。
- [ ] 使用插件声明的 `groupDisplay` 作为组标题。
- [ ] 无标题兼容分组保持接近旧版布局。
- [ ] 分组间距适配窄窗口。
- [ ] 不使用插件提供的任意 className 或颜色值。
- [ ] 亮色、暗色主题均使用现有主题变量。

## T6：高级设置折叠

- [ ] `groupAdvanced: true` 默认折叠。
- [ ] 提供明确的展开/收起按钮和可访问名称。
- [ ] 展开状态只保存在当前组件状态。
- [ ] 折叠不删除、不重置任何配置值。
- [ ] 多个高级分组可以独立展开。

## T7：帮助文字和占位符

- [ ] 在字段下方展示 `description`。
- [ ] 为输入框和多行输入使用 `placeholder`。
- [ ] 长帮助文字可换行，不挤压控件。
- [ ] 所有内容按纯文本渲染。
- [ ] 插件未提供时不产生空白占位。

## T8：密码遮罩与多行输入

- [ ] `secret: true` 默认遮罩。
- [ ] 显示/隐藏状态按字段独立管理。
- [ ] 切换显示不修改配置值。
- [ ] `multiline: true` 使用 NextUI `Textarea`。
- [ ] `rows` 使用安全范围。
- [ ] 密码多行输入在隐藏状态下仍可编辑。
- [ ] 不实现 Key 加密、检查按钮或网络请求。

## T9：条件显示

- [ ] 根据当前 `pluginConfig` 实时判断可见性。
- [ ] 隐藏字段时保留原配置值。
- [ ] 自定义模型示例：仅 `modelPreset=custom` 时显示。
- [ ] 引用不存在字段时安全显示。
- [ ] 不允许条件跨插件读取数据。

## T10：旧插件兼容回归

- [ ] 使用 Lingva 模板式单输入配置测试。
- [ ] 使用至少一个旧版下拉配置测试。
- [ ] 使用 `needs: []` 插件测试。
- [ ] 确认旧插件保存后的配置结构不变。
- [ ] 确认实例名称和主页按钮正常。
- [ ] 确认未知字段不会导致设置页崩溃。

## T11：视觉与交互验收

- [ ] 对照方案二概念图检查大方向，不做像素级复刻。
- [ ] 暗色主题检查。
- [ ] 亮色主题检查。
- [ ] 窄窗口检查。
- [ ] 长中文标签检查。
- [ ] 长下拉选项检查。
- [ ] 键盘聚焦和基础可访问性检查。
- [ ] 高级 AI 默认折叠检查。

## T12：构建与审计

- [ ] 运行全部新增 Node 测试。
- [ ] 运行 `pnpm build`。
- [ ] 检查没有新增运行时依赖。
- [ ] 检查没有修改锁文件，除非确有必要且已说明。
- [ ] 检查没有 API Key、证书或用户配置进入提交。
- [ ] `git diff --check` 通过。
- [ ] `git status --short` 干净。

## T13：文档与 Draft PR

- [ ] 更新 Schema V2 开发文档和示例。
- [ ] 记录已实现字段、限制和兼容策略。
- [ ] 给出程序员划词翻译插件后续接入示例，但不修改其仓库。
- [ ] 创建 Draft PR，Base 为 `custom/main`。
- [ ] PR 标题建议：`feat: 添加插件设置 Schema V2 与分组界面`。
- [ ] PR 中明确：Key 尚未加密、未实现检查按钮。
- [ ] 未经用户授权不得转 Ready 或合并。

## T14：本地 AI 只读验收交接

- [ ] 输出包含仓库链接的本地验收 Prompt。
- [ ] 本地 AI 只允许 fetch、checkout/reset 指定 SHA、安装依赖、构建和 UI 验收。
- [ ] 本地 AI 禁止修改、格式化、commit、push、创建或合并 PR。
- [ ] 要求回传环境、构建结果、截图、异常和工作区状态。
