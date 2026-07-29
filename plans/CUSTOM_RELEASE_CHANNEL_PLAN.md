# Pot 社区维护版发布通道实施计划

## 1. 任务定位

本分支负责在维护版治理基础上建立 **Windows x64 可重复构建、可审计发布和自有更新通道**，但未经仓库所有者明确授权不得实际发布 Release。

- 仓库：`https://github.com/elio-zwd/pot-desktop`
- 分支：`chore/custom-release-channel`
- Base：`custom/main`
- Base SHA：`f9b4ef7bd46eff4010502f81d1b1135685be27c6`
- 规划版本：`3.1.0-elio.1`
- 正式支持目标：Windows x64
- 对外名称：`Pot 社区维护版`

本计划不迁移 Tauri 2，不整体升级依赖，不修复 single-instance，不重做全局 UI，也不移植上游业务 PR。

## 2. 当前基线

当前仓库仍保留上游发布身份：

- `package.json` 版本：`3.0.7`；
- `src-tauri/tauri.conf.json` productName：`pot`；
- Bundle identifier：`com.pot-app.desktop`；
- Bundle targets：`all`；
- `src-tauri/Cargo.toml` 包名和仓库元数据仍指向上游；
- 历史 updater 脚本仍读取官方 Pot Release；
- 官方 updater 已完整关闭，Cargo feature 也已移除。

这意味着当前代码可以安全开发，但还不能作为独立维护版正式发布。

## 3. 核心设计

### 3.1 独立应用身份

推荐并按以下值实施，除非仓库所有者在写入前明确更改：

- 对外名称：`Pot 社区维护版`；
- Tauri `productName`：`Pot 社区维护版`；
- Bundle identifier：`com.elio.potcommunity`；
- Windows publisher：`Elio Community`；
- Release/文件 slug：`pot-community`；
- GitHub Release 标题：`Pot 社区维护版 3.1.0-elio.1`；
- Git tag：`v3.1.0-elio.1`。

使用独立 identifier 的目标是避免与官方 Pot 共用 WebView 数据目录、安装器身份和系统配置。由于维护版尚未正式发布，此时切换身份比发布后迁移风险更低。

### 3.2 版本唯一来源

需要同步以下版本字段：

- `package.json`；
- `src-tauri/tauri.conf.json`；
- 必要时 `src-tauri/Cargo.toml`；
- 发布校验脚本与工作流输入。

新增只读校验脚本，确保三处版本一致且符合：

`3.1.0-elio.1`

不得由 workflow 自动修改并提交版本文件。

### 3.3 Windows x64 构建范围

首阶段只构建：

- Windows x64；
- NSIS 安装包；
- Tauri updater 使用的 NSIS ZIP 与 `.sig`；
- SHA-256 校验文件；
- 静态 `latest.json`。

不构建 macOS、Linux、x86 或 ARM64，不复制上游完整矩阵。

### 3.4 发布托管

推荐使用本仓库 GitHub Releases：

- 安装包与 updater bundle 上传到对应版本 Release；
- 静态更新清单文件名固定为 `latest.json`；
- 计划 endpoint：

`https://github.com/elio-zwd/pot-desktop/releases/latest/download/latest.json`

正式启用前必须验证 GitHub `latest` 跳转、版本比较、签名和安装行为。

### 3.5 Updater 签名

Tauri v1 updater 必须使用独立签名密钥：

- 公钥可进入发布配置或由构建流程注入；
- 私钥只能保存在仓库所有者的安全备份和 GitHub Actions Secret；
- Secret 名称：`TAURI_PRIVATE_KEY`；
- 密码 Secret：`TAURI_KEY_PASSWORD`；
- 不得使用上游 Pot 的公钥或私钥；
- 不得把私钥、密码或完整 secret 输出到日志；
- 丢失私钥会导致已安装客户端无法验证后续更新，因此必须在首次发布前完成离线备份。

远端 AI 不负责生成、接收、存储或上传真实私钥。密钥必须由仓库所有者在本地生成，并自行配置 GitHub Actions Secret。

### 3.6 两阶段启用策略

#### 阶段 A：发布链准备与无发布验证

完成：

- 独立产品身份与版本；
- Windows x64 构建 workflow；
- 版本/身份/工作流静态检查；
- artifact 命名与 SHA-256；
- Release note 模板；
- updater 清单生成脚本和测试；
- workflow 缺少签名 Secret 时明确失败或只执行非发布检查；
- 自动更新继续保持关闭。

#### 阶段 B：签名与 updater 激活

只有在以下条件全部满足时执行：

1. 本地生成维护版 updater 密钥；
2. 私钥和密码已安全写入 Actions Secret；
3. 公钥来源已核对；
4. Windows x64 安装包和 updater bundle 已在本地验证；
5. `latest.json` 签名、URL 和 semver 校验通过；
6. 仓库所有者明确授权启用 updater。

随后才恢复：

- `tauri/updater` Cargo feature；
- `tauri.updater.active: true`；
- 自有 endpoint 与维护版公钥；
- 启动更新检查逻辑。

不得只恢复其中一部分，必须由一致性检查保证四处同步。

## 4. Workflow 设计

新增两个独立工作流。

### 4.1 `custom-release-check.yml`

触发：

- 指向 `custom/main` 的 PR；
- `workflow_dispatch`。

职责：

- Node、pnpm、Rust 版本记录；
- 冻结依赖安装；
- 两组 Schema 测试；
- `pnpm build`；
- `cargo check --locked`；
- 发布身份和版本一致性检查；
- updater 清单生成器 fixture 测试；
- YAML/JSON/Markdown 校验；
- `git diff --check` 与工作区检查。

不读取发布 Secret，不打包，不上传 Release。

### 4.2 `custom-release-windows.yml`

触发：仅 `workflow_dispatch`，输入至少包括：

- `release_tag`；
- `publish`，默认 `false`；
- `prerelease`，首版默认 `true`。

门禁：

- 必须从 `custom/main` 精确 SHA 运行；
- tag 必须等于仓库版本的 `v` 前缀形式；
- `publish=true` 时必须存在签名 Secret；
- 未经明确授权不得由远端 AI 触发 `publish=true`；
- 使用 Windows x64 runner；
- 只构建 NSIS；
- 构建后校验安装包、 updater ZIP、签名和 SHA-256；
- 生成 `latest.json`；
- `publish=false` 时只上传临时 Actions Artifact；
- `publish=true` 时创建或更新 GitHub Release。

## 5. 更新清单生成器

废弃历史 updater 脚本作为维护版入口，新增维护版专用脚本，例如：

`scripts/generate-community-updater-manifest.mjs`

要求：

- 不请求官方 Pot API；
- 输入版本、Release tag、artifact URL、签名文件；
- 只生成 `windows-x86_64`；
- 输出固定结构 `latest.json`；
- 版本必须为有效 semver；
- URL 必须是 `https://github.com/elio-zwd/pot-desktop/` 下的 Release URL；
- 缺少签名、文件或字段时失败；
- 具有 Node fixture 测试；
- 输出不得包含 Secret。

历史 `updater/updater.mjs` 与 `updater/updater-for-fix-runtime.mjs` 可以保留为上游历史文件，但 package scripts 必须避免让维护者误执行它们，或明确重命名为 `upstream:*`。

## 6. README 与发布说明

README 在阶段 A 完成后更新为：

- 已具备 Windows x64 构建链；
- 尚未正式发布时不得提供虚假下载入口；
- 实际 Release 发布后再增加维护版下载链接；
- 明确 updater 当前启用或关闭状态；
- 提供 SHA-256 校验说明；
- 保留非官方身份、GPL 和反馈边界。

新增 Release note 模板，至少包含：

- 版本与精确 SHA；
- 非官方身份；
- Windows x64 支持；
- 主要变更；
- 已知问题；
- updater 状态；
- SHA-256；
- 上游来源和 GPL；
- 回滚目标。

## 7. 安全边界

- 不提交任何真实密钥或凭据；
- workflow 权限默认 `contents: read`，发布 job 才临时使用 `contents: write`；
- 不允许 `pull_request_target`；
- Fork PR 不读取 Secret；
- 不执行 PR 提供的任意发布参数；
- 发布 workflow 必须手动触发；
- 日志不得打印签名私钥和密码；
- Release 产物必须来自同一次锁定 SHA 构建；
- 不从开发分支直接发布。

## 8. 测试与验收

至少执行：

- 设置 Schema V2：13/13；
- 结果 Schema V2：14/14；
- `pnpm build`；
- `cargo check --locked --manifest-path src-tauri/Cargo.toml`；
- 版本与 identity 自检；
- updater manifest fixture 测试；
- YAML 解析；
- `git diff --check`；
- 构建后工作区干净；
- Windows x64 NSIS 构建；
- 安装、启动、卸载与官方 Pot 并存验收；
- updater 保持关闭时不请求网络；
- updater 激活阶段执行签名成功、错误签名拒绝、升级、无更新和回滚演练。

## 9. 严格排除

本分支不得：

- 自动发布首个 Release；
- 生成或提交真实私钥；
- 使用上游签名材料；
- 修复 single-instance；
- 迁移 Tauri 2；
- 整体升级依赖；
- 重做全局 UI；
- 修改 Schema V2 语义；
- 构建或承诺 macOS/Linux；
- 将开发分支标记为正式发布来源。

## 10. 交付形式

完成开发后创建 Draft PR：

- Base：`custom/main`；
- Head：`chore/custom-release-channel`；
- 建议标题：`chore: 建立 Pot 社区维护版发布通道`。

在真实签名 Secret 未配置、Windows 本地安装验收未完成前，PR 保持 Draft，不发布 Release。