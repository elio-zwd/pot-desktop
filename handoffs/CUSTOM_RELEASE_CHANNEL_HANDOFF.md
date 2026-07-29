# Pot 社区维护版发布通道交接

## 1. 项目与分支

- 仓库：`https://github.com/elio-zwd/pot-desktop`
- 稳定分支：`custom/main`
- 开发分支：`chore/custom-release-channel`
- Draft PR：`https://github.com/elio-zwd/pot-desktop/pull/6`
- Base SHA：`f9b4ef7bd46eff4010502f81d1b1135685be27c6`
- 规划版本：`3.1.0-elio.1`
- 正式支持目标：Windows x64

PR #5 已通过远端 CI 和本地 Rust 只读验收，并以 Squash 方式合并。当前分支从该合并提交创建，不依赖已结束的维护基础开发分支。

本文件提交后的精确最终 HEAD 以 Draft PR #6 的 `head_sha` 为准。最终交付报告和本地 AI 验收 Prompt 必须填写该精确 SHA。

## 2. 必读顺序

后续接手必须依次读取：

1. `README.md`
2. `AGENTS.md`
3. `plans/CUSTOM_RELEASE_CHANNEL_PLAN.md`
4. `tasks/CUSTOM_RELEASE_CHANNEL_TASKS.md`
5. `handoffs/CUSTOM_RELEASE_CHANNEL_HANDOFF.md`
6. `docs/COMMUNITY_RELEASE_CHANNEL.md`
7. `docs/RELEASE_POLICY.md`
8. `docs/UPDATER_AUDIT.md`
9. `SECURITY.md`
10. `src-tauri/tauri.conf.json`
11. `src-tauri/Cargo.toml`
12. `package.json`
13. 发布脚本、测试和 GitHub Actions

不得从旧 PR、旧 HEAD、上游发布脚本或聊天摘要猜测当前实现。

## 3. 两阶段结论

### 阶段 A：当前 PR 实现

阶段 A 建立不含真实签名材料的 Windows x64 发布基础：

- 维护版版本和独立应用身份；
- Windows x64 NSIS 配置；
- 发布配置与 Updater 隔离自检；
- Tauri v1 静态 `latest.json` 生成器和测试；
- Windows x64 非发布构建工作流；
- SHA-256 和短期 Actions Artifact；
- Release note 模板和发布政策；
- 固定版本的 Node、pnpm、Rust 门禁。

阶段 A 不创建 tag、GitHub Release 或正式下载入口，也不启用自动更新。

### 阶段 B：仓库所有者外部准备后实施

只有以下条件满足后才能继续：

1. 仓库所有者在本地生成独立 Tauri v1 updater 密钥；
2. 私钥和密码完成离线备份；
3. GitHub Actions Secrets 配置完成；
4. 可公开公钥完成核对；
5. Windows 安装、并存、卸载和升级链路通过验收；
6. 仓库所有者明确授权发布。

远端开发不得生成、接收、保存或提交真实私钥、密码或证书。

## 4. 当前应用身份

| 项目 | 值 |
| --- | --- |
| package name | `pot-community` |
| 对外版本 | `3.1.0-elio.1` |
| productName | `Pot 社区维护版` |
| identifier | `com.elio.potcommunity` |
| publisher 元数据 | `Elio Community` |
| bundle target | `nsis` |
| artifact slug | `pot-community` |
| 规划 tag | `v3.1.0-elio.1` |

Tauri 对外版本读取根目录 `package.json`。Cargo 内部包名 `pot` 和版本 `0.0.0` 保持上游兼容，不是安装包版本来源。

阶段 A 没有 Windows 代码签名证书。安装器中的 publisher 配置只是元数据，Windows 安全界面仍可能显示“未知发布者”，不得表述为已完成代码签名。

## 5. 与官方 Pot 的数据边界

当前 Rust 配置代码使用 bundle identifier 构建配置和插件路径，因此维护版使用：

```text
<系统配置目录>/com.elio.potcommunity/config.json
<系统配置目录>/com.elio.potcommunity/plugins/
```

它不会主动读取官方 `com.pot-app.desktop` 的对应目录。

阶段 A 不做自动迁移。正式发布前必须在 Windows 本地验证：

- 官方版与维护版能否同时安装和启动；
- 配置、插件、缓存、数据库、日志和 WebView 数据是否完全隔离；
- 自启动项和全局快捷键是否冲突；
- 卸载维护版是否不删除官方 Pot 数据。

## 6. Updater 当前状态

当前仍完整关闭：

- `tauri.updater.active: false`；
- 无 endpoint；
- 无 pubkey；
- Cargo 无 `tauri/updater` feature；
- Rust 不调用 `tauri::updater`；
- 启动只记录“尚未配置自有更新通道”；
- 工作流不读取签名 Secret；
- 阶段 A的 `publish=true` 会明确失败。

新增 manifest 生成器不代表运行时自动更新已经可用。

## 7. Manifest 生成器

`scripts/generate-community-updater-manifest.mjs` 强制：

- 版本为 `x.y.z-elio.n`；
- tag 等于 `v` 加版本；
- URL 使用 HTTPS；
- URL 属于 `elio-zwd/pot-desktop` 对应 tag 的 GitHub Release；
- Artifact 为 `.nsis.zip`；
- 平台仅 `windows-x86_64`；
- 签名文本非空。

生成器不访问官方 Pot API、不读取私钥、不创建 Release。测试覆盖有效输入、错误版本、错误 tag、错误仓库、HTTP URL、空签名和错误 Artifact 类型。

## 8. 历史上游脚本

源码仍保留：

- `updater/updater.mjs`；
- `updater/updater-for-fix-runtime.mjs`。

package 入口已改名：

- `pnpm upstream:updater`；
- `pnpm upstream:updater:fixRuntime`。

这些脚本仍与上游官方 Release 耦合，只用于历史审计，不得用于维护版发布。

## 9. Cargo 锁文件处理

移除 updater feature 后，旧锁文件仍携带 updater 专用依赖。Windows CI 先生成并展示精确差异，确认没有新增或升级业务依赖，也没有 Git 依赖提交漂移。

受限一次性工作流只修改并提交了 `src-tauri/Cargo.lock`：

- Commit：`a66a1544f250e0dd4cd5ac1910618812cbf81b31`；
- v3 更新为 v4；
- 删除 `minisign-verify 0.2.2`；
- 删除旧 `zip 0.6.6`；
- 清理 Tauri updater 不再需要的依赖引用。

一次性写权限工作流已经删除。最终常规门禁只使用 `contents: read` 和严格 `cargo check --locked`。

## 10. 工作流

### `.github/workflows/custom-release-check.yml`

- PR 指向 `custom/main` 或手动运行；
- `contents: read`；
- Node 21、pnpm 9、Rust 1.95.0；
- frozen install；
- 治理与发布配置自检；
- manifest fixture；
- 设置 Schema 13/13；
- 结果 Schema 14/14；
- `pnpm build`；
- Windows `cargo check --locked`；
- 补丁和工作区检查。

### `.github/workflows/custom-release-windows.yml`

- 仅 `workflow_dispatch`；
- 默认 `publish=false`；
- 阶段 A 的 `publish=true` 明确失败；
- 构建 Windows x64 NSIS；
- 生成 ASCII 安装包名称和 SHA-256；
- 只上传保留 7 天的 Artifact；
- 不创建 tag 或 Release；
- 通过环境变量读取 `release_tag`，避免把用户输入直接插入 PowerShell 源码；
- 先使用 `git diff --exit-code` 拒绝任何受跟踪文件变化；
- Artifact 上传后记录并清理未跟踪/忽略的 Cargo、Vite、Tauri 构建输出；
- 清理后再次确认受跟踪差异为空且 `git status --short` 为空。

## 11. 已取得的远端构建证据

一次性 Windows 验证 Run `30469891504` 已真实完成：

- 发布前门禁通过；
- `pnpm tauri build --bundles nsis` 通过；
- Tauri 输出 `Pot 社区维护版_3.1.0-elio.1_x64-setup.exe`；
- 安装包整理通过；
- SHA-256 生成通过；
- Artifact 上传通过。

Artifact：

- ID：`8731609226`；
- 名称：`pot-community-v3.1.0-elio.1-windows-x64-validation`；
- ZIP 大小：`33,808,837` 字节；
- 过期时间：`2026-08-05T16:30:11Z`；
- 仅为短期验证产物，不是 Release。

ZIP 内文件：

- `pot-community_3.1.0-elio.1_windows-x64-setup.exe`：`33,819,100` 字节；
- `pot-community_3.1.0-elio.1_windows-x64-setup.exe.sha256`。

安装包 SHA-256：

```text
943bc5d97f2995393868738ae8d6ec31b58483317d871eda1b8336c5e17a4ef7
```

文件内 SHA-256 记录与实际安装包一致。

该 Run 最终状态为 failure，但唯一失败步骤发生在 Artifact 上传后的旧工作区检查。此前 `git diff --exit-code` 已成功，因此没有受跟踪源码或锁文件变化；失败来自未跟踪构建输出。永久工作流已改为在拒绝受跟踪差异后清理一次性输出，并再次验证工作区为空。

用于生成和诊断安装包的临时 PR 工作流均已从分支删除，防止继续消耗 Actions 或进入长期发布链。

## 12. 远端完成状态

已完成：

- 发布配置自检；
- manifest fixture；
- 设置 Schema V2 13/13；
- 结果 Schema V2 14/14；
- 前端构建；
- 固定 Rust 1.95.0 的 Windows `cargo check --locked`；
- Windows x64 NSIS 安装包实际构建；
- 安装包与 SHA-256 Artifact 核对；
- 临时写权限和临时 NSIS 工作流清理。

最终精确 HEAD 的 GitHub Actions 结果必须从 Draft PR #6 读取，不得沿用本文件提交前的旧 run。

## 13. 尚未验证

- Windows 本地 NSIS 重建；
- 安装、启动和卸载；
- 与官方 Pot 并存；
- 配置、插件、缓存、数据库、日志、WebView 和自启动隔离；
- 基本翻译和插件安装；
- 全局快捷键冲突；
- Updater 关闭阶段的网络观察；
- 阶段 B 签名、升级、错误签名拒绝和回滚；
- 永久手动 Windows 工作流在最终 HEAD 上由仓库所有者再次触发后的完整清理结果。

## 14. 严格未做

- 未创建 tag、GitHub Release 或正式安装包发布；
- 未启用 Updater；
- 未配置 endpoint、公钥、私钥、密码或证书；
- 未迁移 Tauri 2；
- 未整体升级依赖；
- 未处理 single-instance；
- 未重做 UI；
- 未改变 Schema V2 语义；
- 未直接修改 `custom/main`；
- PR #6 未转 Ready、未合并。
