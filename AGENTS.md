# Pot 定制分支开发规则

## 1. 仓库与分支

- 上游仓库：`https://github.com/pot-app/pot-desktop`
- 用户 Fork：`https://github.com/elio-zwd/pot-desktop`
- 上游同步分支：`master`
- 定制稳定分支：`custom/main`
- 当前设置页功能分支：`feat/plugin-ui-schema-v2`
- 当前结果页功能分支：`feat/plugin-result-schema-v2`

禁止直接在 `master` 或 `custom/main` 上开发。功能分支完成后只能创建 Draft PR，未经用户明确授权不得转 Ready 或合并。

## 2. 必读顺序

每次接手任务必须先读：

1. `README.md`
2. `AGENTS.md`
3. 当前分支对应的 `plans/` 文档
4. 当前分支对应的 `tasks/` 文档
5. 当前分支对应的 `handoffs/` 文档
6. 与任务直接相关的真实源码与工作流

不得根据旧对话猜测当前实现。

## 3. 语言与提交规范

- 报告、分析、文档和代码注释统一使用中文。
- Git Commit 必须采用 `英文 Tag: 中文描述`。
- 示例：`feat: 添加插件设置分组与条件显示`
- 示例：`test: 补充旧版 needs 配置兼容测试`
- 不允许无意义提交、自动格式化全仓库或混入无关修改。

## 4. 总体技术边界

- 当前基线为 Pot 3.0.7、React 18、NextUI 2、Tauri 1.x。
- 本阶段不迁移 Tauri 2，不升级整套依赖，不重做 Pot 全局视觉系统。
- 不增加运行时第三方依赖，除非先说明必要性并获得用户确认。
- 插件扩展协议必须保持向后兼容：旧插件的 `needs`、字符串结果和 `explanations/associations` 对象结果必须继续工作。
- 插件只能声明结构化配置和结果，不允许注入 React 组件、任意 HTML、JavaScript 或自定义 CSS。
- 所有样式必须使用 Pot 现有主题变量、NextUI 组件和受控样式。

## 5. 双分支协作边界

### `feat/plugin-ui-schema-v2`

只负责：

- 插件设置 Schema V2；
- 设置分组；
- 帮助文字与占位符；
- 密码遮罩及显示切换；
- 多行输入；
- 简单条件显示；
- 高级设置默认折叠；
- 旧版 `needs` 兼容。

不得修改翻译结果卡片、结果 Schema 或程序员划词翻译插件业务逻辑。

### `feat/plugin-result-schema-v2`

只负责：

- 插件结果 Schema V2；
- 核心释义、标识符信息、逐词解释、命名转换、AI 补充和诊断区块；
- 区块折叠与受控复制；
- 旧版字符串和 `explanations/associations` 兼容。

不得修改插件设置页 Schema 或 `PluginConfig` 的功能。

## 6. 已确认产品决定

- 总体采用“卡片分层方案”作为大致视觉方向，后续根据真实运行效果调整。
- 设置页和结果页可并行开发，但必须使用两个独立分支和两个独立 Draft PR。
- API Key 第一阶段只实现遮罩、显示/隐藏、多行输入和说明；仍沿用 Pot 当前本地配置存储，不在本阶段开发加密存储。
- 第一阶段不实现“检查 Key”按钮，不设计通用插件动作协议。
- “高级 AI”默认折叠。
- 不开放插件自定义 CSS。

## 7. 测试与验收

每个功能分支至少需要：

- 纯函数或 Schema 归一化测试；
- 旧版插件兼容测试；
- `pnpm build`；
- 与本分支相关的手工 UI 验收清单；
- 工作区干净检查。

避免为了测试引入大型测试框架。优先将解析和归一化逻辑提取为可由 Node 内置测试执行的纯函数。

远端 AI 负责规划、编写代码和轻量化测试。完成后给出 Prompt，让本地 AI 拉取远端并执行只读构建与桌面端验收；本地 AI 不修改代码。

## 8. 禁止事项

- 不修改或删除上游版权与 GPL-3.0 许可文件。
- 不把定制版本冒充为官方 Pot。
- 不提交 API Key、证书、签名密钥、用户配置或数据库。
- 不使用 `dangerouslySetInnerHTML` 渲染插件提供的新 Schema 内容。
- 不让插件 Schema 控制任意 Tailwind 类名或 CSS 字符串。
- 不强制推送，不删除远端分支，不自动合并。
