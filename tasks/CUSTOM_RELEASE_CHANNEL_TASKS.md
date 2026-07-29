# Pot 社区维护版发布通道任务清单

## 状态说明

- `[ ]` 未开始
- `[-]` 进行中
- `[x]` 已完成
- `[!]` 外部阻塞或需要仓库所有者操作

## T0：基线与范围确认

- [x] PR #5 已 Squash 合并到 `custom/main`。
- [x] 新稳定基线为 `f9b4ef7bd46eff4010502f81d1b1135685be27c6`。
- [x] 从该 SHA 创建 `chore/custom-release-channel`。
- [x] 读取 README、AGENTS、发布政策、更新器审计和当前配置。
- [x] 确认当前版本、产品名、identifier 和历史 updater 仍是上游值。
- [x] 确认官方 updater 继续关闭且 Cargo feature 已移除。
- [x] 不在本分支处理 single-instance、Tauri 2、全局 UI 或 Schema V2。

## T1：规划与决策固化

- [x] 新增 `plans/CUSTOM_RELEASE_CHANNEL_PLAN.md`。
- [x] 定义 Windows x64、NSIS、GitHub Releases 和静态 `latest.json` 方案。
- [x] 定义两阶段启用：先构建发布链，后配置签名并启用 updater。
- [x] 定义真实私钥只能由仓库所有者本地生成并配置为 Secret。
- [x] 定义推荐应用身份和 artifact slug。
- [ ] 新增对应 Handoff。

## T2：独立应用身份

- [ ] 将 `package.json` 版本更新为 `3.1.0-elio.1`。
- [ ] 将 `src-tauri/tauri.conf.json` 版本更新为 `3.1.0-elio.1`。
- [ ] 评估并同步 `src-tauri/Cargo.toml` 版本与仓库元数据。
- [ ] 将 Tauri productName 更新为 `Pot 社区维护版`。
- [ ] 将 bundle identifier 更新为 `com.elio.potcommunity`。
- [ ] 设置 Windows publisher 为 `Elio Community`。
- [ ] 将 bundle targets 限制为 Windows 首阶段需要的目标或使用平台覆盖配置。
- [ ] 检查 identifier 变更对配置、缓存、数据库和 WebView 路径的影响。
- [ ] 记录与官方 Pot 并存和旧开发构建迁移策略。

## T3：版本与身份自检

- [ ] 新增 `scripts/check-community-release-config.mjs`。
- [ ] 校验 package、Tauri 和必要 Cargo 版本一致。
- [ ] 校验版本精确为有效维护版 semver。
- [ ] 校验 productName、identifier、publisher 和仓库 URL。
- [ ] 校验正式发布目标仅包含 Windows x64。
- [ ] 校验 updater 未完成前仍处于完整关闭状态。
- [ ] 为自检增加 Node 测试或 fixture。

## T4：历史 updater 入口整理

- [ ] 审计 `package.json` 中 `updater` 与 `updater:fixRuntime`。
- [ ] 避免维护者误把上游脚本用于社区版发布。
- [ ] 选择删除脚本入口、重命名为 `upstream:*` 或增加显式拒绝包装器。
- [ ] 不直接把官方 URL 替换为维护版 URL后投入使用。
- [ ] 保留必要的上游历史来源说明。

## T5：维护版 updater manifest 生成器

- [ ] 新增 `scripts/generate-community-updater-manifest.mjs`。
- [ ] 只支持 `windows-x86_64`。
- [ ] 读取版本、tag、artifact URL 和 `.sig` 内容。
- [ ] 生成 Tauri v1 静态 `latest.json`。
- [ ] 强制 URL 属于 `elio-zwd/pot-desktop` GitHub Release。
- [ ] 校验 semver、HTTPS、签名和必需字段。
- [ ] 禁止请求官方 Pot API。
- [ ] 禁止在日志中输出 Secret。
- [ ] 增加成功、缺签名、错误 URL、错误版本等 fixture 测试。

## T6：发布说明与校验文件

- [ ] 新增 Release note 模板。
- [ ] 模板包含非官方身份、GPL、支持平台、精确 SHA 和已知问题。
- [ ] 生成 Windows 安装包 SHA-256 文件。
- [ ] 定义 artifact ASCII 文件名：`pot-community_<version>_windows-x64-*`。
- [ ] 发布说明明确 updater 是否启用。
- [ ] 定义回滚版本和 SHA 记录格式。

## T7：非发布检查工作流

- [ ] 新增 `.github/workflows/custom-release-check.yml`。
- [ ] 触发指向 `custom/main` 的 PR 和手动运行。
- [ ] 使用最小 `contents: read` 权限。
- [ ] 运行 frozen install、两组 Schema、前端 build 和 Cargo check。
- [ ] 运行版本/身份自检和 manifest fixture。
- [ ] 校验 YAML、JSON、Markdown 和补丁格式。
- [ ] 检查构建后工作区未变化。
- [ ] 不读取发布 Secret，不创建 Release。

## T8：Windows x64 发布工作流

- [ ] 新增 `.github/workflows/custom-release-windows.yml`。
- [ ] 仅允许 `workflow_dispatch`。
- [ ] 输入 `release_tag`、`publish=false`、`prerelease=true`。
- [ ] 校验运行 SHA 来自 `custom/main`。
- [ ] 校验 tag 与仓库版本一致。
- [ ] 使用 Windows x64 runner。
- [ ] 只构建 NSIS 和 updater bundle。
- [ ] `publish=false` 时仅上传临时 Actions Artifact。
- [ ] `publish=true` 时才使用 `contents: write`。
- [ ] 缺少签名 Secret 时发布 job 明确失败。
- [ ] 未经明确授权不得执行 `publish=true`。
- [ ] 不使用 `pull_request_target`。

## T9：签名材料外部准备

- [!] 仓库所有者在本地生成独立 Tauri v1 updater 密钥。
- [!] 仓库所有者离线备份私钥与密码。
- [!] 仓库所有者配置 `TAURI_PRIVATE_KEY` Secret。
- [!] 仓库所有者配置 `TAURI_KEY_PASSWORD` Secret。
- [!] 仓库所有者提供并核对可公开的 updater 公钥。
- [ ] 远端代码只引用 Secret 名称，不包含真实值。

## T10：Updater 激活

只有 T9 完成后才能执行：

- [ ] 恢复 `tauri/updater` Cargo feature。
- [ ] 将 `tauri.updater.active` 改为 `true`。
- [ ] 配置维护版 GitHub Release `latest.json` endpoint。
- [ ] 配置维护版 updater 公钥。
- [ ] 恢复自有 `check_update` 网络调用。
- [ ] 不使用上游端点、公钥和脚本。
- [ ] 更新一致性自检，确保配置、feature 和 Rust 调用同步。

## T11：远端静态与轻量验证

- [ ] 设置 Schema V2：13/13。
- [ ] 结果 Schema V2：14/14。
- [ ] `pnpm build`。
- [ ] `cargo check --locked --manifest-path src-tauri/Cargo.toml`。
- [ ] 版本与 identity 自检。
- [ ] updater manifest fixture。
- [ ] YAML 基础解析。
- [ ] `git diff --check`。
- [ ] 构建后工作区干净。

## T12：Windows 本地只读验收

- [ ] 拉取精确 HEAD。
- [ ] Windows x64 NSIS 构建通过。
- [ ] 安装包文件名、版本、publisher 和应用名称正确。
- [ ] 可与官方 Pot 并存安装。
- [ ] 首次启动、设置存储、插件安装和基本翻译入口可用。
- [ ] 卸载维护版不删除官方 Pot 数据。
- [ ] updater 关闭阶段不访问任何更新端点。
- [ ] 激活阶段测试无更新、有效升级和错误签名拒绝。
- [ ] 验收前后工作区干净。

## T13：文档与 README

- [ ] 更新 README 当前发布状态。
- [ ] 增加维护版 Release 下载入口时确保 Release 已真实存在。
- [ ] 增加 SHA-256 校验说明。
- [ ] 更新发布政策和 updater 审计的最终实现。
- [ ] 明确 Windows x64 正式支持，其他平台仍不承诺。
- [ ] 不把未发布或未启用功能写成已可用。

## T14：Draft PR

- [ ] 创建 Draft PR。
- [ ] Base：`custom/main`。
- [ ] Head：`chore/custom-release-channel`。
- [ ] 标题：`chore: 建立 Pot 社区维护版发布通道`。
- [ ] PR 正文区分已实现、需仓库所有者配置和未验证事项。
- [ ] 在签名与 Windows 本地验收完成前保持 Draft。
- [ ] 未经明确授权不得发布 Release、转 Ready 或合并。