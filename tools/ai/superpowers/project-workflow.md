# Pot Desktop 项目工作流

本文件把 Superpowers 工作流映射到 `pot-desktop`。用户要求、安全规则、仓库说明、任务计划及更具体目录规则优先于本文件和任何通用 Skill。

## 推荐顺序

1. 新功能、架构和交互设计：使用 `brainstorming`，先确认目标、旧插件兼容、宿主协议和验收标准。
2. 编写实施方案：使用 `writing-plans`，计划必须指向真实 React 组件、Tauri 桥接、配置、历史记录、测试和构建路径。
3. 按批准计划开发：使用 `executing-plans`；每个 AI 对话只负责一个任务分支和一个 Draft PR。
4. Bug、测试失败或行为异常：使用 `systematic-debugging`，先建立复现、数据流证据和根因链。
5. 适合 TDD 的实现：使用 `test-driven-development`，遵循仓库现有 JavaScript/React/Tauri/Rust 测试与静态检查能力。
6. 完成前验证：使用 `verification-before-completion`，区分实际执行、GitHub CI、静态核对和尚未验证。
7. 请求代码审查：使用 `requesting-code-review`，优先通过独立只读 AI 对话或 GitHub PR 审查。
8. 处理审查意见：使用 `receiving-code-review`，逐条核对代码、兼容性和测试，不盲目照改。
9. 准备 PR 与收尾：使用 `finishing-a-development-branch`；未经用户授权不得合并、标记 Ready、关闭 PR 或删除分支。

## 上游指令覆盖

| 上游 Skill 指令 | 本仓库替代行为 |
|---|---|
| 使用 `using-git-worktrees` | 仅在真实本地 Git 工作区且确有需要时使用；远端 GitHub 工作流使用独立分支。 |
| 使用 `subagent-driven-development` | 不模拟或控制其他 ChatGPT 对话；通过 task 分支、Commit、PR 和交接文档协作。 |
| 使用 `dispatching-parallel-agents` | 不调用；仅在用户分别启动独立对话后，按文件边界并行。 |
| 分派 reviewer subagent | 使用独立只读审查对话或 GitHub PR Review。 |
| 启动 Visual Companion | 当前能力不存在时跳过，不视为流程失败。 |
| 使用 Forge CLI | CLI 不可用时使用 GitHub 插件。 |
| 自动合并或清理分支 | 必须等待用户明确授权。 |

## 本仓库不可变边界

- 开始前读取 README、package.json、目标源码、调用链、相关测试、构建配置、开放 PR 和最新 Base/Head SHA。
- 不修改、关闭或覆盖现有 PR #1、#2；发现同文件冲突时先报告。
- 新能力应使用通用、版本化的插件协议，不硬编码程序员插件 ID。
- 字符串结果、旧词典对象、未知 Schema 和内置翻译服务必须保持兼容。
- 结构化结果必须提供安全纯文本回退；复制、自动复制和历史记录统一使用可信 `plainText`。
- 插件配置扩展必须保留旧 `input/select`，新增控件不能破坏已有插件。
- 不执行插件返回内容，不把不可信 HTML 当作 UI 模板。
- 不顺带升级 React、NextUI、Tailwind、Tauri、Vite 或其他依赖。
- 无法运行命令时明确写“未执行”及原因，不得声称测试或构建通过。
- 只在实际读取到 CI 或命令输出后声明相应结果。
- 本目录不是运行时资源，不得被导入 React/Tauri 代码或添加到构建依赖。

## 多对话协作

- 一个对话只负责一个明确 Task、一个独立分支和一个 Draft PR。
- 开始前检查开放 PR 和同文件冲突。
- Normalizer、Renderer、Config 等文件边界清晰的任务可并行；`TargetArea`、复制与历史主路径仅由集成任务串行修改。
- 跨仓库依赖必须固定插件 Commit SHA，不依赖口头总结。
- 方案分支是任务 PR 的 Base；未经用户授权不合并到 `master`。

## 能力降级

当 Superpowers 插件接口不可调用但本目录可读时，直接阅读对应 `SKILL.md` 并执行等价人工流程，同时明确说明接口不可调用。仓库内 Skill 是参考资料，不会自动注册成 ChatGPT 插件。
