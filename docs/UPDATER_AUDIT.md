# Pot 社区维护版更新器审计

## 1. 审计范围

本次审计基于分支 `chore/maintenance-foundation` 的初始 HEAD：

`eae5e94d4203c4ac1ec3e8415e490faa357ca488`

检查范围：

- `src-tauri/tauri.conf.json`；
- `src-tauri/Cargo.toml`；
- `src-tauri/src/main.rs`；
- `src-tauri/src/updater.rs`；
- `package.json`；
- `updater/updater.mjs`；
- `updater/updater-for-fix-runtime.mjs`；
- 可发现的发布与工作流入口。

## 2. 原始配置

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

因此，定制构建在默认配置下可能主动连接官方 Pot 更新清单，并按照上游端点和公钥判断更新。这会混淆社区维护版与官方发布边界。

## 3. 发布脚本耦合

`package.json` 保留两个上游 updater 脚本入口：

- `pnpm updater`；
- `pnpm updater:fixRuntime`。

对应脚本会读取 `pot-app/pot-desktop` 的最新 Release，拼接官方安装包 URL 和签名，并生成上游格式的更新清单。

这些脚本属于历史上游发布链，不适合作为维护版发布实现。本基础分支不删除脚本，以避免无关发布链重构；但发布政策明确禁止在维护版 CI 或 Release 中执行它们。

## 4. 风险结论

风险等级：高优先级治理风险，但不属于远程代码执行漏洞结论。

主要风险：

- 社区维护版可能提示或安装官方版本，丢失维护版功能；
- 用户无法清楚区分维护版和官方更新来源；
- 后续若版本关系变化，可能产生错误的升级或降级判断；
- 继续携带上游端点与公钥会违反维护版独立发布边界；
- 只关闭 `tauri.conf.json` 而保留 `tauri/updater` feature，会触发 Tauri 1.x 配置与 Cargo feature 一致性检查失败。

## 5. 本分支处理

采用最小、可逆、无需自有服务的隔离方案：

1. 将 `src-tauri/tauri.conf.json` 的 `tauri.updater.active` 设为 `false`；
2. 从运行时配置删除上游 `endpoints` 和 `pubkey`；
3. 从 `src-tauri/Cargo.toml` 的 `tauri` features 移除 `updater`；
4. 保留 `dialog: false`，但不配置任何不存在的替代端点；
5. 将 `src-tauri/src/updater.rs` 的启动检查改为本地日志说明，不发起网络请求；
6. 保留 `main.rs` 的调用位置，减少启动结构改动，后续自有更新通道可在独立 PR 恢复实现；
7. 不修改上游历史 updater 生成脚本，只在政策中标记为不可用于维护版发布；
8. 在 `scripts/maintenance-foundation-check.mjs` 增加配置与 Cargo feature 一致性检查。

隔离后，即使用户旧配置中仍保存 `check_update: true`，启动路径也不会调用 Tauri Updater 或访问官方更新端点。

## 6. 本地验收发现与修复

本地 AI 在初始只读验收中执行：

```text
cargo check --manifest-path src-tauri/Cargo.toml
```

Tauri 1.x 构建脚本报告 `tauri.conf.json` 已关闭 updater，但 `Cargo.toml` 仍启用 `updater` feature。该问题属于真实的配置不一致，不应作为永久警告接受。

本分支已通过以下提交修复：

- `65ff19ffb970534468ccd6156c666b0ee67fc5b7`：移除 `tauri/updater` feature；
- `7389b85a3419e6711608350a920f6e1d26b8e3f0`：增加 updater feature 一致性自检。

修复后 GitHub Actions Run `30457537318` 的治理自检、两组 Schema 测试、前端构建和工作区检查全部通过。仍需本地 AI 在最新 HEAD 上重新执行 `cargo check --locked --manifest-path src-tauri/Cargo.toml`，确认 Rust 配置检查无误且工作区保持干净。

## 7. 未在本分支处理

以下内容留给 `chore/custom-release-channel`：

- 写入版本 `3.1.0-elio.1`；
- 自有更新服务器和更新清单；
- 维护版 updater 公钥与签名私钥管理；
- Windows x64 安装包命名和品牌标识；
- GitHub Release、签名、回滚和更新端到端验收；
- 重构或替换历史 updater 生成脚本。

在上述工作完成并通过独立验收前，不得重新启用 `tauri.updater.active` 或 `tauri/updater` feature。

## 8. 验收检查

本分支验收应确认：

- `tauri.updater.active` 为 `false`；
- 运行时 Tauri 配置中不存在官方 updater `endpoints` 和 `pubkey`；
- `Cargo.toml` 的 `tauri` features 不包含 `updater`；
- `src-tauri/src/updater.rs` 不调用 `tauri::updater`；
- 启动日志明确说明维护版更新通道未配置；
- `cargo check --locked --manifest-path src-tauri/Cargo.toml` 通过；
- 历史生成脚本仍可能出现官方 URL，但不会由运行时或新增 CI 执行；
- 未配置伪造或不存在的更新地址；
- 未加入证书、密钥或发布凭据。
