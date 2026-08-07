# 程序员插件迁移到社区 Schema V2 任务清单

## 状态说明

- `[ ]` 未开始
- `[-]` 进行中或等待验证
- `[x]` 已完成
- `[!]` 阻塞，需要更新契约或用户决定

## 协调任务元数据

- 任务：`MIN-CUSTOM-00`
- 仓库：`elio-zwd/pot-desktop`
- Base：`custom/main`
- 实际 Base SHA：`85d2ec8ec138c4f5aa685e872864f9ca4c451d39`
- 分支：`docs/programmer-plugin-v2-port-contract`
- 修改范围：仅四个 Markdown 文件
- 架构决定：方案 B
- V2 能力标识：`pot.plugin-result.v2`

## C0：能力与基线核对

- [x] 确认 GitHub 具备读取、分支、写文件、Commit 和 Draft PR 能力。
- [x] 确认当前会话未安装可调用的 Superpowers 插件。
- [x] 读取 `AI-Skill-Roundtable@b46bb9e...` 的 brainstorming、writing-plans、verification-before-completion 和 requesting-code-review 技能并执行等价人工流程。
- [x] 重新读取 `custom/main`，实际 Base 为 `85d2ec8ec138c4f5aa685e872864f9ca4c451d39`。
- [x] 确认 Base 未从任务开始时观测 SHA 前进。
- [x] 按指定顺序读取社区主线文档、源码、测试和开放 PR。
- [x] 读取固定桌面端 Commit `a062a868064a5b7c781ccb8dbe310608dda26925` 的契约、结果模型、请求流和四个测试。
- [x] 读取固定插件 Commit `3862162e01396b39edb9a3634a2067707ea0689f` 的契约、配置、运行时和四个测试。
- [x] 通过 GitHub Actions API 核对固定 Artifact ID 与 Digest。

## C1：架构与协议

- [x] 比较方案 A 与方案 B。
- [x] 选择方案 B。
- [x] 明确不复制 `ProgrammerMinimalResult`。
- [x] 明确不向 `custom/main` 增加 v1 适配器。
- [x] 冻结能力标识 `pot.plugin-result.v2`。
- [x] 冻结能力放置位置为每次插件调用顶层 `options.host`。
- [x] 冻结 V2 → v1 → 旧对象 → 纯文本优先级。
- [x] 冻结未知能力忽略和 `setResult` 非能力规则。

## C2：v1 → V2 映射

- [x] 冻结 `plainText` → `copyText`。
- [x] 冻结四种 summary source 映射。
- [x] 冻结 identifier metadata 与 tokens。
- [x] 冻结 tokenMeanings dictionary 映射。
- [x] 冻结 `literal` 的可见“按原文保留”规则。
- [x] 冻结五种 naming 顺序和纯值 copyText。
- [x] 冻结 diagnostic code、severity、message 和 recoverable。
- [x] 冻结 `local_fallback` status 去重规则。
- [x] 冻结 section 顺序和稳定 ID。
- [x] 冻结新请求重置、同一请求保留展开状态。

## C3：设置迁移

- [x] 核对现有保存键和值格式。
- [x] 冻结基础、结果与命名、AI 凭据、高级 AI 四组。
- [x] 冻结 `apiKeyPool` 的遮罩、多行、行数和显示条件。
- [x] 冻结高级组默认折叠。
- [x] 冻结 `customModel` 的 `modelPreset == custom` 条件。
- [x] 明确 `secret` 不代表加密。
- [x] 明确不删除已有值、不记录 Key、不进行网络 Key 校验。
- [x] 明确不使用旧临时 section/secret/比较器格式。

## C4：后续边界

- [x] 冻结 `MIN-CUSTOM-PLUGIN-01` 名称、职责、允许文件和禁止范围。
- [x] 冻结 `MIN-CUSTOM-DESKTOP-01` 名称、职责、允许文件和禁止范围。
- [x] 冻结 `MIN-CUSTOM-COMBO-01` 名称和只读验收矩阵。
- [x] 明确插件与桌面端可在契约合并后并行。
- [x] 明确组合验收必须等待两个固定待验收 SHA。
- [x] 明确三个任务不得合并旧方案分支。

## C5：开放 PR 与冲突

- [x] 核对桌面端开放 PR #1、#2、#7。
- [x] 核对插件开放 PR #7。
- [x] 确认当前开放 PR 不修改本协调任务四个 Markdown 文件。
- [x] 记录后续实现开始前必须重新检查开放 PR。
- [x] 不修改、关闭、合并或覆盖上述 PR。

## C6：文档交付

- [x] 创建 `docs/programmer-ui/PROGRAMMER_PLUGIN_V2_PORT.md`。
- [x] 创建 `plans/PROGRAMMER_PLUGIN_V2_PORT_PLAN.md`。
- [x] 创建 `tasks/PROGRAMMER_PLUGIN_V2_PORT_TASKS.md`。
- [x] 创建 `handoffs/PROGRAMMER_PLUGIN_V2_PORT_HANDOFF.md`。
- [x] 文档不包含运行时代码修改。
- [x] 文档不包含未定义占位符或待补写标记。
- [x] 文档不要求重写或删除 Schema V2。
- [x] 文档不把自动化测试写成 GUI 验收。

## C7：远端验证

- [x] 通过 GitHub compare 核对相对 Base 只新增四个 Markdown 文件。
- [x] 检查 Markdown 代码块闭合。
- [x] 检查固定 SHA、路径、能力标识和 section 名称。
- [x] 检查三个后续任务文件边界不重叠。
- [x] 检查没有待补写标记或未定义占位符。
- [x] 通过 PR changed files 再次核对范围。
- [ ] 本地执行 `git diff --check`。
- [ ] 本地执行 `git diff --name-status 85d2ec8ec138c4f5aa685e872864f9ca4c451d39...HEAD`。
- [ ] 本地执行 `git status --short`。

最后三项需要真实 Git 工作区，由本地 AI 严格只读执行；远端 GitHub connector 不提供本地工作区，不能伪造命令结果。

## C8：Commit 与 Draft PR

- [x] 创建单一 Commit：`docs: 规划程序员插件迁移到社区 Schema V2`。
- [x] 创建 Draft PR，Base 为 `custom/main`。
- [x] PR 标题：`docs: 冻结程序员插件 Schema V2 移植方案`。
- [x] PR 描述包含固定双 Commit、实际 Base、架构、映射、能力、设置迁移、阶段、边界、矩阵、风险、未验证和回滚。
- [x] 未转 Ready。
- [x] 未合并。
- [x] 未删除分支。
- [x] 未修改插件仓库。
