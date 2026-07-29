# Pot 社区维护版发布政策

## 1. 身份与许可

- 发布名称统一使用 `Pot 社区维护版`。
- 所有发布页面、安装包说明和更新提示必须明确标注“非官方社区维护版”。
- 项目继续遵循 GPL-3.0，并保留原作者、原仓库与许可证声明。
- 不得使用官方 Pot 或 Manggo 的身份发布、宣传或接受反馈。

当前独立应用身份：

- productName：`Pot 社区维护版`；
- bundle identifier：`com.elio.potcommunity`；
- Windows publisher：`Elio Community`；
- artifact slug：`pot-community`。

## 2. 支持平台

首阶段正式发布目标仅为 Windows x64，bundle target 固定为 `nsis`。

macOS 和 Linux 可以接受已复现的关键修复，但在建立独立构建、签名和验收能力前，不承诺正式发布产物。

## 3. 版本规则

维护版版本格式为：

`上游版本-elio.维护序号`

首个规划版本：`3.1.0-elio.1`。

对外版本由根目录 `package.json` 统一提供，Tauri 配置读取该文件。`src-tauri/Cargo.toml` 的内部 `0.0.0` 仅用于保持现有 Cargo 锁文件和项目结构兼容，不作为安装包版本来源。

版本号必须明显区别于上游 Pot 3.0.7，不得让用户把维护版安装包误认为官方包。

## 4. 发布来源

- Release 必须基于已验证的 `custom/main` 精确 SHA。
- 发布说明必须记录 Base SHA、最终 SHA、测试结果和已知问题。
- 开发分支不得直接发布。
- Draft PR 未完成验收、未获得仓库所有者明确授权时不得发布。
- 回滚必须指向上一个已验证的 `custom/main` 发布 SHA，不得通过强推改写历史。

阶段 A 的 Actions Artifact 只用于测试，不是正式发布物，不得对外宣称为稳定安装包。

## 5. 发布门禁

正式发布前至少需要：

1. 设置 Schema V2 测试通过；
2. 结果 Schema V2 测试通过；
3. updater manifest fixture 通过；
4. 发布版本与应用身份自检通过；
5. `pnpm build` 通过；
6. 固定 Rust 工具链下的 `cargo check --locked` 通过；
7. Windows x64 NSIS 安装包构建与基础启动验收通过；
8. YAML、JSON、Markdown 和 `git diff --check` 通过；
9. 构建前后受跟踪工作区保持干净；
10. 确认构建产物不包含 API Key、令牌、证书、用户配置或数据库；
11. 确认自动更新只使用维护版自有端点与自有签名材料，或保持明确关闭。

## 6. 安装包与发布说明

发布物必须：

- 在文件名、Release 标题或说明中标注社区维护版身份；
- 说明正式支持平台和架构；
- 列出上游来源、许可证、主要改动和已知问题；
- 说明是否提供自动更新；
- 说明本维护版问题应反馈到 `elio-zwd/pot-desktop`；
- 不声称官方 Pot 或 Manggo 为本维护版提供支持；
- 同时提供 SHA-256 文件。

Windows x64 文件名采用 ASCII：

- `pot-community_<version>_windows-x64-setup.exe`；
- `pot-community_<version>_windows-x64-setup.exe.sha256`。

## 7. 当前非发布构建能力

`.github/workflows/custom-release-windows.yml` 只允许手动触发，并在阶段 A 执行以下限制：

- 默认 `publish=false`；
- 传入 `publish=true` 会明确失败；
- 只构建 Windows x64 NSIS；
- 只上传保留 7 天的 Actions Artifact；
- 不创建 tag、GitHub Release 或正式下载入口；
- 不读取 updater 私钥或密码。

该工作流不能作为绕过签名和本地验收的正式发布入口。

## 8. 更新器与签名边界

当前官方 Tauri Updater 已关闭并隔离：

- 不连接 `pot-app/pot-desktop` 的官方更新清单；
- 不使用上游 updater 公钥；
- `Cargo.toml` 不启用 `tauri/updater` feature；
- 启动阶段只记录“维护版更新通道未配置”，不发起网络请求；
- 不配置不存在的占位端点。

阶段 A 已增加维护版 `latest.json` 生成器，但生成器只处理经过输入校验的公开元数据和签名文本，不读取私钥、不联网、不发布文件。

正式启用 updater 前，仓库所有者必须在本地生成独立 Tauri v1 updater 密钥，离线保存私钥与密码，并将其配置为受保护的 GitHub Actions Secrets。远端开发不得接收、保存或提交真实私钥。

详细实现状态见：

- `docs/UPDATER_AUDIT.md`；
- `docs/COMMUNITY_RELEASE_CHANNEL.md`。

## 9. 历史发布脚本

仓库现有 `updater/updater.mjs` 和 `updater/updater-for-fix-runtime.mjs` 来自上游发布链，仍指向官方仓库与官方产物。

package script 已重命名为：

- `pnpm upstream:updater`；
- `pnpm upstream:updater:fixRuntime`。

这些脚本：

- 只作为历史上游实现保留；
- 不得用于生成维护版更新清单；
- 不得在维护版 CI 或 Release 中自动执行；
- 不得只替换 URL 后直接投入维护版发布。

## 10. 已知问题、并存与回滚

每个 Release 必须列出：

- 已知运行时问题；
- 未正式支持的平台；
- 更新器状态；
- 与上游版本的差异；
- 回滚目标版本和精确 SHA。

独立 identifier 会使维护版使用独立配置与插件目录。正式发布前必须验证：

- 与官方 Pot 并存安装和启动；
- 配置、缓存、数据库、日志和 WebView 数据隔离；
- 卸载维护版不删除官方数据；
- 全局快捷键冲突的行为与提示。

Windows `tauri_plugin_single_instance` 空指针问题属于独立运行时问题，不在本发布通道 PR 处理。

## 11. 禁止事项

未经明确授权，不得：

- 发布安装包或 GitHub Release；
- 使用上游签名密钥、证书或更新端点；
- 把私钥或真实凭据提交到仓库或 Actions Secret 之外的文件；
- 把开发分支、未验证 SHA 或未通过门禁的产物标记为正式版；
- 将 Draft PR 自动转 Ready 或自动合并；
- 在阶段 B 完成前重新启用 updater。
