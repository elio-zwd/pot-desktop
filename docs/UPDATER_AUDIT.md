# Pot 社区维护版更新器审计

## 1. 审计范围

本次审计基于分支 `chore/maintenance-foundation` 的初始 HEAD：

`eae5e94d4203c4ac1ec3e8415e490faa357ca488`

检查范围：

- `src-tauri/tauri.conf.json`；
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
- 继续携带上游端点与公钥会违反维护版独立发布边界。

## 5. 本分支处理

采用最小、可逆、无需自有服务的隔离方案：

1. 将 `src-tauri/tauri.conf.json` 的 `tauri.updater.active` 设为 `false`；
2. 从运行时配置删除上游 `endpoints` 和 `pubkey`；
3. 保留 `dialog: false`，但不配置任何不存在的替代端点；
4. 将 `src-tauri/src/updater.rs` 的启动检查改为本地日志说明，不发起网络请求；
5. 保留 `main.rs` 的调用位置，减少启动结构改动，后续自有更新通道可在独立 PR 恢复实现；
6. 不修改上游历史 updater 生成脚本，只在政策中标记为不可用于维护版发布。

隔离后，即使用户旧配置中仍保存 `check_update: true`，启动路径也不会调用 Tauri Updater 或访问官方更新端点。

## 6. 未在本分支处理

以下内容留给 `chore/custom-release-channel`：

- 写入版本 `3.1.0-elio.1`；
- 自有更新服务器和更新清单；
- 维护版 updater 公钥与签名私钥管理；
- Windows x64 安装包命名和品牌标识；
- GitHub Release、签名、回滚和更新端到端验收；
- 重构或替换历史 updater 生成脚本。

在上述工作完成并通过独立验收前，不得重新启用 `tauri.updater.active`。

## 7. 验收检查

本分支验收应确认：

- `tauri.updater.active` 为 `false`；
- 运行时 Tauri 配置中不存在官方 updater `endpoints` 和 `pubkey`；
- `src-tauri/src/updater.rs` 不调用 `tauri::updater`；
- 启动日志明确说明维护版更新通道未配置；
- 历史生成脚本仍可能出现官方 URL，但不会由运行时或新增 CI 执行；
- 未配置伪造或不存在的更新地址；
- 未加入证书、密钥或发布凭据。
