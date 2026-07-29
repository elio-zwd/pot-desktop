# Pot 社区维护版基础建设任务清单

## 状态说明

- `[ ]` 未开始
- `[-]` 进行中
- `[x]` 已完成
- `[!]` 阻塞，需要用户确认

## T0：接手与基线确认

- [x] 按顺序读取 `README.md`、`AGENTS.md`、Plan、Task、Handoff、Decisions 和 `LICENSE`。
- [x] 确认仓库为 `https://github.com/elio-zwd/pot-desktop`。
- [x] 确认开发分支为 `chore/maintenance-foundation`，Base 为 `custom/main`。
- [x] 确认分支 Merge Base 为 `b535ac2b1f39fead9eb8d0e0a1f95f1e991ff823`，分支未落后。
- [x] 读取 Tauri 配置、更新器前后端、历史更新清单脚本、测试入口和可发现的工作流入口。
- [x] 未从旧 Schema 功能分支继续开发。

## T1：README 首屏身份

- [x] 标题改为“Pot 社区维护版”。
- [x] 明确非官方身份、GPL-3.0、上游来源和反馈边界。
- [x] 明确 `custom/main`、Windows x64、Schema V2 稳定能力和规划版本 `3.1.0-elio.1`。
- [x] 明确当前没有维护版正式安装包或自有自动更新通道。
- [x] 保留并整理仍适用的上游使用、插件、接口、安装和编译说明。
- [x] 对上游 Release、商店和跨平台说明增加维护版边界提示。

## T2：长期 AGENTS.md

- [x] 删除已经结束的双 Schema 临时分支规则。
- [x] 定义 `master`、`custom/main`、`feat/fix/chore` 和 `port/` 分支职责。
- [x] 固化必读顺序、中文沟通和 `英文 Tag: 中文描述` 提交格式。
- [x] 固化 Draft PR、禁止自动合并、禁止强推和本地 AI 只读验收规则。
- [x] 固化 Schema V2 兼容、安全、依赖、发布、签名和用户数据边界。
- [x] 增加上游 PR 审计、拆分、署名和验证规则。

## T3：维护范围

- [x] 新增 `docs/MAINTENANCE_SCOPE.md`。
- [x] 定义第一优先级、第二优先级和默认不承担范围。
- [x] 区分 Windows x64 正式支持与其他平台尽力兼容。
- [x] 定义问题接受、拒绝和暂缓依据。

## T4：发布政策

- [x] 新增 `docs/RELEASE_POLICY.md`。
- [x] 固化名称、Windows x64、版本格式和首个规划版本。
- [x] 要求 Release 基于 `custom/main` 精确 SHA，并明确非官方身份。
- [x] 禁止使用上游更新端点、公钥、签名材料和未验证开发分支。
- [x] 定义发布门禁、已知问题、回滚和历史 updater 脚本边界。
- [x] 将版本写入、自有签名、更新服务和安装器品牌化留给 `chore/custom-release-channel`。

## T5：上游 PR 移植政策

- [x] 新增 `docs/UPSTREAM_PORT_POLICY.md`。
- [x] 定义 `port/upstream-pr-<number>-<topic>` 命名。
- [x] 定义完整 diff、讨论、CI、依赖、安全、相关性、规模和维护成本审计。
- [x] 要求在最新 `custom/main` 上重新验证。
- [x] 要求保留原作者 commit、Authorship 或 `Co-Authored-By`。
- [x] 定义接受、拒绝、等待和替代实现四种结论。

## T6：UPSTREAM_PORTS 台账

- [x] 新增根目录 `UPSTREAM_PORTS.md` 和候选模板。
- [x] 记录 #1285 阿里翻译 HTTPS 修复为待优先审计。
- [x] 记录 #1292 全局快捷键修复为待审计。
- [x] 记录 #1290 为拒绝整体移植、必须拆分。
- [x] 记录 #1284 与 Result Schema V2 重叠并暂缓。
- [x] 记录 Windows single-instance 空指针为独立运行时候选。
- [x] 本分支未移植任何候选运行时代码。

## T7：安全政策

- [x] 新增 `SECURITY.md`。
- [x] 说明支持分支、报告范围、私密报告和脱敏复现要求。
- [x] 禁止公开提交凭据、证书、数据库和隐私文本。
- [x] 将凭据泄露、明文传输、任意代码执行、错误更新来源和数据破坏列为高优先级。
- [x] 说明非官方身份和暂不承诺固定 SLA。

## T8：更新器审计与隔离

- [x] 审计 `tauri.conf.json` 中官方端点、上游公钥和启用状态。
- [x] 审计 `main.rs` → `updater.rs` → Tauri Updater 的启动触发路径。
- [x] 审计 `package.json` 与两个历史 updater 清单生成脚本。
- [x] 新增 `docs/UPDATER_AUDIT.md`。
- [x] 将 `tauri.updater.active` 设为 `false`。
- [x] 从运行时配置删除官方 `endpoints` 和 `pubkey`。
- [x] 将启动检查改为本地日志，不发起官方更新网络请求。
- [x] 未配置伪更新地址、签名、证书或自有服务。
- [x] 未修改 `main.rs`、single-instance 或历史发布脚本。

## T9：轻量维护版 CI

- [x] 新增 `.github/workflows/custom-ci.yml`。
- [x] 覆盖指向 `custom/main` 的 PR 与手动触发。
- [x] 使用 Node 21、pnpm 9 和 `pnpm install --frozen-lockfile`。
- [x] 使用 `contents: read` 最小权限，不发布 Artifact 或 Release。
- [x] 运行 YAML、JSON、Markdown 链接和更新器隔离自检。
- [x] 运行设置 Schema V2、结果 Schema V2、`pnpm build`、`git diff --check` 和工作区检查。
- [x] 首次运行 `30454764291` 完整通过。

## T10：模板和仓库入口

- [x] 检查常见 PR 与 Bug 模板路径，当前分支不存在对应模板。
- [x] 新增最小 `.github/PULL_REQUEST_TEMPLATE.md`。
- [x] 新增 `.github/ISSUE_TEMPLATE/bug_report.yml`。
- [x] 未增加机器人、外部服务、复杂项目管理或新依赖。

## T11：文档一致性

- [x] README、AGENTS、维护范围、发布政策、移植政策、安全政策术语一致。
- [x] 文档统一使用中文并保留上游来源与 GPL-3.0。
- [x] 未把规划 Release、自有更新通道或其他平台支持写成已经可用。
- [x] 未声称官方项目永久停止维护。

## T12：定向测试

GitHub Actions Run `30454764291`，Ubuntu 24.04：

- [x] Node `v21.7.3`、pnpm `9.15.9`。
- [x] `pnpm install --frozen-lockfile`。
- [x] YAML 基础解析。
- [x] `node scripts/maintenance-foundation-check.mjs`。
- [x] `node --test tests/plugin_config_schema.test.js`：13/13。
- [x] `node --test tests/plugin_result_schema.test.mjs`：14/14。
- [x] `pnpm build`：成功。
- [x] `git diff --check`：成功。
- [x] 构建后 `git diff --exit-code` 和 `git status --short`：成功，工作区干净。
- [x] 未修改 Schema V2 运行时代码或样式，因此不重复完整桌面 UI 人工验收。

## T13：更新任务状态和交接

- [x] 更新本任务清单完成状态。
- [x] 在 Handoff 记录实现、测试、更新器结论和后续发布分支范围。
- [x] 准备本地 AI 精确 HEAD 只读验收 Prompt。

## T14：Draft PR

- [x] 创建 Draft PR #5。
- [x] Base：`custom/main`。
- [x] Head：`chore/maintenance-foundation`。
- [x] 标题：`chore: 建立 Pot 社区维护版基础治理`。
- [x] PR 正文说明文档、CI、更新器行为、严格排除和后续事项。
- [x] 保持 Draft，未转 Ready、未合并、未修改 `custom/main`。
