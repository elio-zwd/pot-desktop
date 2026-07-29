# Pot 社区维护版发布通道任务清单

## 状态说明

- `[ ]` 未完成
- `[-]` 进行中
- `[x]` 已完成
- `[!]` 需要仓库所有者或本地环境完成

## T0：基线与范围

- [x] PR #5 已 Squash 合并到 `custom/main`。
- [x] 新稳定基线为 `f9b4ef7bd46eff4010502f81d1b1135685be27c6`。
- [x] 从该 SHA 创建 `chore/custom-release-channel`。
- [x] 已读取 README、AGENTS、发布政策、更新器审计、Tauri/Cargo 配置、历史脚本和 Actions。
- [x] 本分支不处理 single-instance、Tauri 2、全局 UI、Schema V2 语义或上游业务 PR。

## T1：规划与交接

- [x] 新增 `plans/CUSTOM_RELEASE_CHANNEL_PLAN.md`。
- [x] 新增 `handoffs/CUSTOM_RELEASE_CHANNEL_HANDOFF.md`。
- [x] 采用“阶段 A 非发布构建基础 + 阶段 B 签名与 Updater 激活”方案。
- [x] 明确真实私钥只能由仓库所有者本地生成并通过 Secret 使用。

## T2：独立应用身份

- [x] `package.json` 写入 `3.1.0-elio.1`。
- [x] Tauri 对外版本统一读取根目录 `package.json`。
- [x] Cargo 内部包名和 `0.0.0` 版本保持上游兼容，不作为安装包版本源。
- [x] productName 改为 `Pot 社区维护版`。
- [x] identifier 改为 `com.elio.potcommunity`。
- [x] Windows publisher 元数据改为 `Elio Community`。
- [x] bundle targets 限制为 `nsis`。
- [x] 静态确认配置和插件目录按 identifier 隔离。
- [x] 文档明确阶段 A 不自动迁移上游配置。
- [!] Windows 本地验证 WebView、缓存、数据库、日志、自启动项和卸载边界。

## T3：版本与身份自检

- [x] 新增 `scripts/check-community-release-config.mjs`。
- [x] 校验维护版 semver、package 名称、productName、identifier、publisher 和 NSIS target。
- [x] 校验 updater 关闭、无 endpoint/pubkey、Cargo 无 updater feature、Rust 无网络调用。
- [x] 校验发布 Plan、Task、Handoff、发布说明模板和工作流存在。
- [x] 自检已进入发布配置 CI。

## T4：历史 Updater 入口

- [x] 审计上游两个 updater 脚本。
- [x] package script 重命名为 `upstream:updater` 与 `upstream:updater:fixRuntime`。
- [x] 不把官方 URL 直接替换后作为维护版实现。
- [x] 文档保留上游来源与禁用边界。

## T5：维护版 Updater manifest

- [x] 新增 `scripts/generate-community-updater-manifest.mjs`。
- [x] 只生成 `windows-x86_64` 平台。
- [x] 强制版本、tag、HTTPS、维护仓库 Release URL、`.nsis.zip` 和非空签名。
- [x] 不访问官方 Pot API，不读取或输出私钥。
- [x] 新增 6 类 fixture 测试。

## T6：发布说明与校验文件

- [x] 新增 `docs/RELEASE_NOTES_TEMPLATE.md`。
- [x] 定义非官方身份、GPL、精确 SHA、已知问题、Updater 状态和回滚字段。
- [x] 定义 ASCII 安装包文件名和 SHA-256 文件。
- [x] 新增 `docs/COMMUNITY_RELEASE_CHANNEL.md`。

## T7：非发布检查工作流

- [x] 新增 `.github/workflows/custom-release-check.yml`。
- [x] 触发指向 `custom/main` 的 PR 和手动运行。
- [x] 权限为 `contents: read`，不读取发布 Secret，不创建 Release。
- [x] 固定 Node 21、pnpm 9、Rust 1.95.0。
- [x] 覆盖 frozen install、治理自检、发布自检、manifest、两组 Schema、前端 build、Windows `cargo check --locked` 和工作区检查。
- [-] 等待最终 HEAD 的整套工作流稳定通过。

## T8：Windows x64 阶段 A 工作流

- [x] 新增 `.github/workflows/custom-release-windows.yml`。
- [x] 仅允许 `workflow_dispatch`。
- [x] 默认 `publish=false`；阶段 A 的 `publish=true` 会明确失败。
- [x] 固定 Windows runner、Node/pnpm/Rust 版本。
- [x] 只构建 NSIS。
- [x] 生成安装包 SHA-256。
- [x] 仅上传保留 7 天的 Actions Artifact。
- [x] 不使用 `pull_request_target`，不创建 tag 或 GitHub Release。
- [!] `publish=true`、签名和正式 Release job 留给阶段 B。

## T9：Cargo 锁文件

- [x] CI 先生成并打印精确锁文件差异。
- [x] 确认差异只包含 v3 → v4 和关闭 updater 后的无用依赖清理。
- [x] 没有新增或升级业务依赖，没有 Git 依赖提交漂移。
- [x] 通过受限一次性工作流提交 `a66a1544f250e0dd4cd5ac1910618812cbf81b31`。
- [x] 一次性写权限工作流已删除。
- [x] 常规门禁恢复严格 `cargo check --locked`。

## T10：签名材料

- [!] 仓库所有者本地生成独立 Tauri v1 updater 密钥。
- [!] 离线备份私钥和密码。
- [!] 配置 `TAURI_PRIVATE_KEY` Secret。
- [!] 配置 `TAURI_KEY_PASSWORD` Secret。
- [!] 只提供并核对可公开公钥。
- [x] 当前代码、日志和 Artifact 不包含真实签名材料。

## T11：Updater 激活

只有 T10 和 Windows 本地验收完成后才能执行：

- [!] 恢复 `tauri/updater` Cargo feature。
- [!] 启用 `tauri.updater.active`。
- [!] 配置维护版 endpoint 与公开公钥。
- [!] 恢复经过审计的维护版网络检查。
- [!] 验证无更新、有效升级、错误签名拒绝、网络失败和回滚。

## T12：远端验证

- [x] 设置 Schema V2：13/13。
- [x] 结果 Schema V2：14/14。
- [x] updater manifest fixture：通过。
- [x] 发布配置自检：通过。
- [x] `pnpm build`：通过。
- [x] 固定 Rust 1.95.0 的 `cargo check --locked`：通过。
- [x] Windows x64 NSIS Release 构建：已实际成功。
- [x] 验证 Artifact 已生成安装包和 SHA-256。
- [-] 精确定位并修复安装包构建后的工作区清洁检查。
- [-] 等待最终 HEAD 的 CI 全部通过。

## T13：Windows 本地只读验收

- [!] 拉取最终精确 HEAD。
- [!] 本地重新构建 NSIS 并核对版本、产品名、identifier、publisher 元数据和 SHA-256。
- [!] 安装并启动维护版。
- [!] 与官方 Pot 并存安装和运行。
- [!] 验证配置、插件、缓存、数据库、日志和 WebView 数据隔离。
- [!] 验证卸载维护版不删除官方 Pot 数据。
- [!] 验证基本翻译、插件安装、快捷键和首次启动。
- [!] 验证 Updater 关闭阶段不访问更新端点。
- [!] 阶段 A 未签名安装包可能显示“未知发布者”，不得误报为代码签名完成。

## T14：文档与 PR

- [x] README 继续明确尚无正式安装包和自动更新通道。
- [x] 更新 `docs/RELEASE_POLICY.md`。
- [x] 更新 `docs/UPDATER_AUDIT.md`。
- [x] 新增发布通道阶段说明和 Release note 模板。
- [x] 创建 Draft PR #6，Base 为 `custom/main`，Head 为 `chore/custom-release-channel`。
- [x] PR 正文区分阶段 A、阶段 B、未验证项和安全边界。
- [x] 保持 Draft，未发布、未转 Ready、未合并。
