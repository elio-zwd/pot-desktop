# Pot 社区维护版基础建设任务清单

## 状态说明

- `[ ]` 未开始
- `[-]` 进行中
- `[x]` 已完成
- `[!]` 阻塞，需要用户确认

## T0：接手与基线确认

- [ ] 按顺序读取 `README.md`、`AGENTS.md`、Plan、Task、Handoff。
- [ ] 确认仓库为 `https://github.com/elio-zwd/pot-desktop`。
- [ ] 确认当前分支为 `chore/maintenance-foundation`。
- [ ] 确认 Base 为 `custom/main`。
- [ ] 确认分支祖先包含 `b535ac2b1f39fead9eb8d0e0a1f95f1e991ff823`。
- [ ] 确认工作区干净。
- [ ] 读取当前更新器、Tauri 配置、工作流和发布脚本真实实现。
- [ ] 不从旧的 Schema 功能分支继续开发。

## T1：重写 README 首屏身份

- [ ] 将标题和首屏定位调整为“Pot 社区维护版”。
- [ ] 明确标注“非官方社区维护版”。
- [ ] 说明基于 Pot 3.0.7 与 GPL-3.0。
- [ ] 保留原版 Pot 仓库、原作者和许可链接。
- [ ] 说明初期正式支持 Windows x64。
- [ ] 说明当前稳定主线为 `custom/main`。
- [ ] 简要列出已稳定合入的设置 Schema V2 和结果 Schema V2。
- [ ] 说明暂未提供自有自动更新通道。
- [ ] 明确本维护版问题不要反馈给 Manggo 或官方 Pot。
- [ ] 保留仍适用的原版功能和使用说明，避免无关删减。

## T2：更新长期 AGENTS.md

- [ ] 删除已经完成的双 Schema 临时分支描述。
- [ ] 定义 `master`、`custom/main`、功能分支和上游移植分支职责。
- [ ] 保留 README → AGENTS → Plan → Task → Handoff → 源码的读取顺序。
- [ ] 保留中文沟通和 `英文 Tag: 中文描述` 提交格式。
- [ ] 定义 Draft PR、禁止自动合并和禁止强推规则。
- [ ] 定义远端 AI 开发、本地 AI 只读验收规则。
- [ ] 固化 Schema V2 向后兼容和安全边界。
- [ ] 增加上游 PR 审计、署名和移植规则。
- [ ] 增加发布、签名、密钥和用户数据禁止事项。
- [ ] 不把临时任务写成永久全局要求。

## T3：维护范围文档

- [ ] 新建 `docs/MAINTENANCE_SCOPE.md`。
- [ ] 说明第一优先级：插件平台、Windows x64、安全、稳定性、构建链。
- [ ] 说明第二优先级：其他平台已复现关键问题和常用服务修复。
- [ ] 说明默认不承担全部上游 Issue、冷门服务和与 Manggo 全面竞争。
- [ ] 说明本阶段不迁移 Tauri 2、不整体升级依赖。
- [ ] 定义问题接受和拒绝依据。
- [ ] 定义“正式支持”和“尽力兼容”的区别。

## T4：发布政策文档

- [ ] 新建 `docs/RELEASE_POLICY.md`。
- [ ] 固化名称“Pot 社区维护版”。
- [ ] 固化初期正式平台“Windows x64”。
- [ ] 固化版本格式和首个规划版本 `3.1.0-elio.1`。
- [ ] 要求发布基于 `custom/main` 精确 SHA。
- [ ] 要求安装包和 Release 页面明确非官方身份。
- [ ] 禁止使用上游签名密钥和更新通道。
- [ ] 说明自有签名、更新地址、安装包品牌化属于后续独立 PR。
- [ ] 定义发布说明、已知问题和回滚要求。

## T5：上游 PR 移植政策

- [ ] 新建 `docs/UPSTREAM_PORT_POLICY.md`。
- [ ] 定义 `port/upstream-pr-<number>-<topic>` 命名。
- [ ] 定义安全、稳定性、相关性、规模和维护成本评估。
- [ ] 要求读取完整 diff、讨论、CI 和依赖。
- [ ] 要求在最新 `custom/main` 上重放和验证。
- [ ] 优先保留原作者 commit、Authorship 和 Co-Authored-By。
- [ ] 禁止整体移植多个不相关模块的大杂烩 PR。
- [ ] 定义接受、拒绝、等待、替代实现四种结论。

## T6：建立 UPSTREAM_PORTS 台账

- [ ] 新建仓库根目录 `UPSTREAM_PORTS.md`。
- [ ] 提供候选记录模板。
- [ ] 加入已知候选 #1285 阿里翻译 HTTPS 修复。
- [ ] 加入已知候选 #1292 全局快捷键修复，状态设为待审计。
- [ ] 加入 #1290，标记为不可整体移植、需拆分审计。
- [ ] 加入 #1284，标记为与 Result Schema V2 重叠、暂缓。
- [ ] 加入 Windows single-instance 空指针问题，记录为独立运行时候选。
- [ ] 不在本任务中直接移植任何运行时代码。

## T7：安全政策

- [ ] 新建 `SECURITY.md`。
- [ ] 明确支持分支和报告范围。
- [ ] 禁止公开粘贴 API Key、证书、签名密钥、数据库和隐私文本。
- [ ] 将凭据泄露、明文传输、任意代码执行和用户数据破坏列为高优先级。
- [ ] 说明本项目不是官方 Pot 或 Manggo。
- [ ] 说明暂不承诺固定响应 SLA。
- [ ] 提供不依赖真实密钥的复现要求。

## T8：审计当前更新器

- [ ] 查找 Tauri 更新器配置、签名公钥和端点。
- [ ] 查找前端或后端触发更新检查的位置。
- [ ] 查找官方 Release、下载和版本检查的耦合。
- [ ] 判断定制版是否可能误接收官方更新。
- [ ] 将审计结果写入发布政策或独立说明。
- [ ] 简单配置即可安全关闭时，在本 PR 实施。
- [ ] 涉及签名、安装器、后端迁移或自有服务时，留给 `chore/custom-release-channel`。
- [ ] 禁止配置尚不存在的伪更新地址。

## T9：轻量维护版 CI

- [ ] 新建 `.github/workflows/custom-ci.yml`。
- [ ] 触发范围至少覆盖指向 `custom/main` 的 PR。
- [ ] 使用 Node 21 和 pnpm 9。
- [ ] 使用 `pnpm install --frozen-lockfile`。
- [ ] 运行设置 Schema V2 测试。
- [ ] 运行结果 Schema V2 测试。
- [ ] 运行 `pnpm build`。
- [ ] 运行 `git diff --check`。
- [ ] 检查构建后受跟踪工作区未变化。
- [ ] 权限使用只读最小权限。
- [ ] 不复制全平台打包矩阵。
- [ ] 不发布 artifact 或 Release。

## T10：模板和仓库入口评估

- [ ] 检查现有 PR/Issue 模板。
- [ ] 缺失时增加最小 PR 模板，要求 Base SHA、测试、兼容和上游来源。
- [ ] 缺失时增加 Bug 模板，要求平台、版本、日志和最小复现。
- [ ] 不增加复杂项目管理系统。
- [ ] 不引入机器人、外部服务或新依赖。

## T11：文档一致性检查

- [ ] README、AGENTS、维护范围、发布政策和移植政策术语一致。
- [ ] 所有文档统一使用中文。
- [ ] 所有仓库链接正确。
- [ ] 不把尚未实现的 Release 或更新通道写成已经可用。
- [ ] 不声称 macOS/Linux 已获正式支持。
- [ ] 不删除 GPL、上游作者或原项目来源。
- [ ] 不声称官方完全永久停止维护等无法保证的事实。

## T12：定向测试

- [ ] 运行 `node --test tests/plugin_config_schema.test.js` 或仓库当前等价命令。
- [ ] 运行 `node --test tests/plugin_result_schema.test.mjs` 或仓库当前等价命令。
- [ ] 运行 `pnpm build`。
- [ ] 校验新增 YAML 能被解析。
- [ ] 校验 README 和 Markdown 链接无明显错误。
- [ ] 运行 `git diff --check`。
- [ ] 检查没有 API Key、证书、用户配置或数据库进入提交。
- [ ] 检查工作区干净。
- [ ] 若未修改 Schema 运行时代码，不重复完整桌面 UI 人工验收。

## T13：更新任务状态和交接

- [ ] 更新本任务清单完成状态。
- [ ] 在 Handoff 记录最终 HEAD、测试命令和结果。
- [ ] 记录更新器审计结论和遗留风险。
- [ ] 记录后续 `chore/custom-release-channel` 的明确范围。
- [ ] 生成本地 AI 只读验收 Prompt。

## T14：Draft PR

- [ ] 创建 Draft PR。
- [ ] Base：`custom/main`。
- [ ] Head：`chore/maintenance-foundation`。
- [ ] 标题：`chore: 建立 Pot 社区维护版基础治理`。
- [ ] PR 正文说明文档、CI、更新器行为和未完成事项。
- [ ] 不得转 Ready。
- [ ] 不得合并。
- [ ] 未经用户授权不得修改 `custom/main`。
