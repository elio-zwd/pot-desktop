# Pot 社区维护版更新器审计

## 1. 审计范围

首次审计基于维护基础分支初始 HEAD：

`eae5e94d4203c4ac1ec3e8415e490faa357ca488`

当前阶段继续审计：

- `src-tauri/tauri.conf.json`；
- `src-tauri/Cargo.toml` 与 `src-tauri/Cargo.lock`；
- `src-tauri/src/main.rs`；
- `src-tauri/src/updater.rs`；
- `package.json`；
- `updater/updater.mjs`；
- `updater/updater-for-fix-runtime.mjs`；
- `scripts/generate-community-updater-manifest.mjs`；
- 发布检查与 Windows 非发布构建工作流。

## 2. 原始上游配置

初始 Tauri 配置中 Updater 处于启用状态：

- `tauri.updater.active` 为 `true`；
- 更新端点直接指向 `pot-app/pot-desktop` 的官方 `update.json`；
- 配置包含上游 updater 公钥；
- `Cargo.toml` 的 `tauri` features 包含 `updater`；
- `dialog` 为 `false`，但这不代表停止检查。

初始启动路径：

1. `src-tauri/src/main.rs` 在 `setup` 阶段调用 `check_update(app.handle())`；
2. `src-tauri/src/updater.rs` 读取本地 `check_update` 配置；
3. 配置缺失时写入并默认启用；
4. 启用时调用 `tauri::updater::builder(app_handle).check().await`；
5. 检测到新版本时打开更新窗口。

这会让定制构建主动连接官方 Pot 更新清单，存在维护版功能被官方版本覆盖、更新来源混淆和版本判断错误的风险。

## 3. 历史发布脚本耦合

原 `package.json` 暴露：

- `pnpm updater`；
- `pnpm updater:fixRuntime`。

对应脚本会读取 `pot-app/pot-desktop` 的 Release，拼接官方安装包 URL 和签名，并生成上游格式更新清单。

发布通道分支没有删除历史源码，而是将入口重命名为：

- `pnpm upstream:updater`；
- `pnpm upstream:updater:fixRuntime`。

这能降低误执行风险，同时保留上游来源供审计。两个脚本仍不得用于维护版发布。

## 4. 基础隔离方案

维护基础分支采用可逆、无需自有服务的隔离：

1. `tauri.updater.active` 设为 `false`；
2. 删除上游 `endpoints` 和 `pubkey`；
3. 从 `tauri` features 移除 `updater`；
4. `src-tauri/src/updater.rs` 改为只记录本地日志；
5. 保留 `main.rs` 调用位置，便于后续在同一入口恢复经过审计的维护版实现；
6. 治理自检校验配置、Cargo feature 和 Rust 调用保持一致。

即使旧用户配置仍保存 `check_update: true`，当前启动路径也不会访问官方 Updater。

## 5. 基础验收发现

本地只读验收最初发现：`tauri.conf.json` 已关闭 updater，但 `Cargo.toml` 仍启用 updater feature，触发 Tauri 1.x 配置一致性错误。

修复提交：

- `65ff19ffb970534468ccd6156c666b0ee67fc5b7`：移除 `tauri/updater` feature；
- `7389b85a3419e6711608350a920f6e1d26b8e3f0`：增加一致性自检。

最终基础分支本地复验确认 `cargo check` 通过且工作区干净，随后 PR #5 Squash 合并为：

`f9b4ef7bd46eff4010502f81d1b1135685be27c6`

## 6. 发布分支锁文件审计

发布分支第一次在 Windows CI 中执行固定 Rust 1.95.0 的 `cargo check --locked` 时，发现旧 `Cargo.lock` 需要同步。

CI 先执行不带 `--locked` 的诊断检查，并打印精确差异。结果表明：

- 锁文件格式由 v3 更新为 v4；
- 移除 `minisign-verify 0.2.2`；
- 移除 `zip 0.6.6`；
- 从 Tauri 依赖列表移除 updater 已不再需要的 `base64`、`infer`、`minisign-verify`、`time` 和旧 zip 引用；
- 没有新增或升级业务依赖；
- 没有 Git 依赖提交漂移。

锁文件由一次性、只允许修改 `src-tauri/Cargo.lock` 的 GitHub Actions 任务生成并提交：

`a66a1544f250e0dd4cd5ac1910618812cbf81b31`

一次性工作流随后删除，最终门禁恢复为严格的：

```text
cargo check --locked --manifest-path src-tauri/Cargo.toml
```

## 7. 阶段 A 的维护版 manifest 生成器

`scripts/generate-community-updater-manifest.mjs` 已实现确定性的 Tauri v1 静态清单生成，但当前不连接运行时 Updater。

输入限制：

- 版本必须为 `x.y.z-elio.n`；
- tag 必须为 `v` 加版本；
- URL 必须使用 HTTPS；
- URL 必须属于 `elio-zwd/pot-desktop` 的对应 GitHub Release；
- updater Artifact 必须以 `.nsis.zip` 结尾；
- 平台固定为 `windows-x86_64`；
- 签名文本不能为空。

生成器不会：

- 访问官方 Pot API；
- 读取或生成私钥；
- 创建 tag 或 Release；
- 上传 Artifact；
- 修改 Tauri updater 配置。

fixture 覆盖有效清单、错误版本、错误 tag、错误仓库、HTTP URL 和空签名。

## 8. 阶段 A 的运行时状态

当前仍保持完整关闭：

- `tauri.updater.active: false`；
- 无 updater endpoint；
- 无 updater pubkey；
- 无 `tauri/updater` Cargo feature；
- Rust 不调用 `tauri::updater`；
- Windows 工作流不读取 `TAURI_PRIVATE_KEY` 或 `TAURI_KEY_PASSWORD`；
- `publish=true` 会被明确拒绝。

因此，新增 manifest 生成能力不等于自动更新已经可用。

## 9. 阶段 B 的前置条件

恢复 updater 必须同时满足：

1. 仓库所有者本地生成维护版独立 Tauri v1 updater 密钥；
2. 私钥和密码完成离线备份；
3. `TAURI_PRIVATE_KEY` 与 `TAURI_KEY_PASSWORD` Secret 完成配置；
4. 可公开公钥完成核对；
5. Windows x64 签名构建成功；
6. 无更新、有效升级、错误签名拒绝、网络失败和回滚验收完成；
7. Release 来自已验证的 `custom/main` 精确 SHA；
8. 仓库所有者明确授权发布。

只有这些条件同时满足，才能在同一 PR 中恢复 Cargo feature、Tauri active、维护版 endpoint、公钥和 Rust 网络调用。不得只启用其中一层。

## 10. 验收检查

阶段 A 当前应确认：

- `tauri.updater.active` 为 `false`；
- 运行时配置不存在官方或占位 `endpoints`、`pubkey`；
- Cargo 不包含 updater feature；
- Rust 不调用 Tauri updater；
- 历史上游脚本只通过 `upstream:*` 名称暴露；
- manifest fixture 通过；
- `cargo check --locked` 通过；
- Windows 非发布构建只上传短期 Artifact；
- 没有证书、密钥或发布凭据；
- 没有创建 tag 或 Release。

详细阶段状态见 `docs/COMMUNITY_RELEASE_CHANNEL.md`。
