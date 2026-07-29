# Pot 社区维护版发布通道交接

## 1. 当前状态

- 仓库：`https://github.com/elio-zwd/pot-desktop`
- 稳定分支：`custom/main`
- 基础治理合并提交：`f9b4ef7bd46eff4010502f81d1b1135685be27c6`
- 当前开发分支：`chore/custom-release-channel`
- PR：尚未创建
- 规划版本：`3.1.0-elio.1`
- 正式支持目标：Windows x64

PR #5 已完成完整远端 CI 和本地 Rust 只读验收，并通过 Squash 合并。当前分支从合并后的精确 SHA 创建，不依赖旧开发分支。

## 2. 必读顺序

接手时必须依次读取：

1. `README.md`
2. `AGENTS.md`
3. `plans/CUSTOM_RELEASE_CHANNEL_PLAN.md`
4. `tasks/CUSTOM_RELEASE_CHANNEL_TASKS.md`
5. `handoffs/CUSTOM_RELEASE_CHANNEL_HANDOFF.md`
6. `docs/RELEASE_POLICY.md`
7. `docs/UPDATER_AUDIT.md`
8. `SECURITY.md`
9. `src-tauri/tauri.conf.json`
10. `src-tauri/Cargo.toml`
11. `package.json`
12. 当前更新脚本和 GitHub Actions

不得从旧 PR、旧 HEAD 或上游发布脚本猜测维护版发布实现。

## 3. 已确认目标

- 对外名称：`Pot 社区维护版`；
- 非官方社区维护版；
- GPL-3.0；
- 首阶段正式支持 Windows x64；
- 规划版本：`3.1.0-elio.1`；
- Release 必须来自已验证的 `custom/main` 精确 SHA；
- 不使用官方 Pot 的 endpoint、公钥、私钥或发布凭据；
- 不发布 macOS/Linux；
- 不迁移 Tauri 2；
- 不整体升级依赖；
- 不处理 single-instance；
- 不重做 UI 或 Schema V2。

## 4. 推荐独立身份

计划默认采用：

- Tauri productName：`Pot 社区维护版`；
- Bundle identifier：`com.elio.potcommunity`；
- Windows publisher：`Elio Community`；
- artifact slug：`pot-community`；
- tag：`v3.1.0-elio.1`；
- Release 标题：`Pot 社区维护版 3.1.0-elio.1`。

独立 identifier 用于避免与官方 Pot 共用安装器身份、WebView 数据目录和系统配置。写入后必须进行官方版与维护版并存验收。

## 5. 当前真实配置

当前仍是上游发布元数据：

- `package.json`：`3.0.7`；
- Tauri productName：`pot`；
- Tauri version：`3.0.7`；
- identifier：`com.pot-app.desktop`；
- bundle targets：`all`；
- Cargo package/repository 仍是上游值；
- package scripts 中仍有上游 updater 生成入口。

当前 updater 隔离状态正确：

- `tauri.updater.active: false`；
- 没有 endpoint 和 pubkey；
- Cargo 没有 `tauri/updater` feature；
- Rust `check_update` 不访问网络；
- 配置自检会检查上述一致性。

## 6. 两阶段实施

### 阶段 A：无真实密钥的发布链准备

远端 AI 可以直接完成：

- 版本与独立身份；
- 版本/身份自检；
- 维护版 updater manifest 生成器和 fixture；
- Windows x64 非发布构建 workflow；
- Release note 模板；
- SHA-256 与 artifact 命名；
- 历史 updater 入口隔离；
- Draft PR；
- 轻量 CI。

阶段 A 期间 updater 必须保持关闭。

### 阶段 B：签名与 updater 激活

需要仓库所有者完成外部操作：

1. 本地生成独立 Tauri v1 updater 密钥；
2. 安全离线备份私钥与密码；
3. GitHub Actions Secret：`TAURI_PRIVATE_KEY`；
4. GitHub Actions Secret：`TAURI_KEY_PASSWORD`；
5. 向远端开发提供并核对可公开的 updater 公钥。

远端 AI 不得生成、接收、保存或提交真实私钥。

只有密钥、Windows 构建和 updater 验收全部完成后，才能同时恢复：

- Cargo updater feature；
- Tauri updater active；
- 自有 endpoint；
- 维护版公钥；
- Rust 更新检查。

## 7. 发布工作流边界

计划新增：

- `custom-release-check.yml`：PR 与手动检查，不读取 Secret，不打包发布；
- `custom-release-windows.yml`：仅手动触发，默认 `publish=false`。

远端 AI 不得触发 `publish=true`。真实 Release、tag 和安装包发布必须由仓库所有者明确授权。

## 8. 安全要求

- 不使用 `pull_request_target`；
- Fork PR 不读取 Secret；
- 默认权限 `contents: read`；
- 只有发布 job 才可使用 `contents: write`；
- 不输出私钥和密码；
- 不从开发分支直接发布；
- 不使用官方 URL、签名材料或 updater JSON；
- 不提交用户配置、数据库、Token 或证书。

## 9. 测试要求

远端至少完成：

- 两组 Schema 测试；
- `pnpm build`；
- `cargo check --locked`；
- release config 自检；
- manifest fixture；
- YAML/JSON/Markdown 校验；
- `git diff --check`；
- 工作区干净。

本地 AI 最终只读验收：

- Windows x64 NSIS 构建；
- 安装、启动和卸载；
- 与官方 Pot 并存；
- 配置/数据库路径独立；
- artifact 名称、版本、publisher 和 SHA-256；
- updater 关闭阶段无更新请求；
- 阶段 B 的有效签名升级和错误签名拒绝。

## 10. 当前下一步

按 Task 从 T2 开始：

1. 修改版本与应用身份；
2. 增加 release config 自检；
3. 整理历史 updater 脚本入口；
4. 实现 manifest 生成器和测试；
5. 添加非发布检查 workflow；
6. 创建 Draft PR；
7. 保持 updater 关闭，等待仓库所有者准备密钥。