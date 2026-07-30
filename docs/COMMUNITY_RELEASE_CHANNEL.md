# Pot 社区维护版发布通道

## 1. 当前结论

维护版发布通道采用两阶段实施。

### 阶段 A：已实现的非发布能力

当前代码已经具备：

- 维护版版本与独立应用身份；
- Windows x64 NSIS 构建配置；
- 发布配置和 updater 隔离自检；
- 维护版 `latest.json` 生成器及 fixture 测试；
- Windows x64 手动非发布构建工作流；
- 安装包 SHA-256 生成与短期 Actions Artifact 上传；
- 固定 Node、pnpm 和 Rust 工具链的发布门禁。

阶段 A 不创建 tag、GitHub Release 或正式下载入口，也不启用自动更新。

### 阶段 B：尚未实施

以下条件完成前，Updater 必须保持关闭：

- 仓库所有者在本地生成独立 Tauri v1 updater 密钥；
- 私钥与密码完成离线备份；
- GitHub Actions Secrets 完成配置；
- 公开公钥完成核对；
- Windows x64 安装、卸载、并存和升级链路完成只读验收；
- 仓库所有者明确授权发布。

## 2. 版本与应用身份

| 项目 | 当前维护版值 |
| --- | --- |
| npm package name | `pot-community` |
| 规划版本 | `3.1.0-elio.1` |
| 产品名 | `Pot 社区维护版` |
| Bundle identifier | `com.elio.potcommunity` |
| Windows publisher | `Elio Community` |
| Bundle target | `nsis` |
| Artifact slug | `pot-community` |
| 规划 tag | `v3.1.0-elio.1` |

`src-tauri/Cargo.toml` 的内部包名和 `0.0.0` 版本继续保留上游兼容值。对外版本由 `src-tauri/tauri.conf.json` 读取根目录 `package.json`，避免多个对外版本源发生漂移。

## 3. 与官方 Pot 的并存边界

独立 identifier 不仅用于安装器身份，也被当前 Rust 代码用于配置与插件目录：

```text
<系统配置目录>/com.elio.potcommunity/config.json
<系统配置目录>/com.elio.potcommunity/plugins/
```

因此维护版不会主动读取官方 `com.pot-app.desktop` 目录中的配置和插件。

阶段 A 不提供自动数据迁移。首次安装维护版应按全新应用验收；在完成兼容性、凭据脱敏和回滚设计前，不建议直接复制官方 Pot 的整个配置目录。

仍需在 Windows 本地验证：

- 官方版与维护版能否同时安装和启动；
- WebView、日志、缓存、数据库及自启动项是否完全独立；
- 卸载维护版是否不会删除官方 Pot 数据；
- 两个应用的全局快捷键冲突如何提示和处理。

## 4. 工作流

### 发布配置门禁

`.github/workflows/custom-release-check.yml`：

- 面向指向 `custom/main` 的 Pull Request；
- `contents: read`；
- Node 21、pnpm 9、Rust 1.95.0；
- 运行发布配置自检、manifest fixture、两组 Schema 测试、前端构建和 Windows `cargo check --locked`；
- 不读取发布 Secret，不上传安装包，不创建 Release。

### Windows x64 非发布构建

`.github/workflows/custom-release-windows.yml`：

- 仅允许手动触发；
- 默认并固定使用 `publish=false`；
- 阶段 A 传入 `publish=true` 会明确失败；
- 构建 Windows x64 NSIS 安装包；
- 生成 ASCII 文件名和 SHA-256 文件；
- 仅上传保留 7 天的 Actions Artifact；
- 不创建 tag 或 GitHub Release。

正式发布能力必须在阶段 B 另行审查，不得通过放宽当前工作流绕过。

## 5. Updater manifest 生成器

`scripts/generate-community-updater-manifest.mjs` 只负责本地、确定性地生成 Tauri v1 静态清单。

它强制：

- 版本格式为 `x.y.z-elio.n`；
- tag 等于 `v` 加版本号；
- Artifact URL 使用 HTTPS；
- URL 必须属于 `elio-zwd/pot-desktop` 对应 tag 的 GitHub Release；
- 平台仅为 `windows-x86_64`；
- updater Artifact 必须为 `.nsis.zip`；
- 签名不能为空。

生成器不访问官方 Pot API，不读取私钥，也不会自动发布文件。

## 6. Cargo 锁文件同步

基础治理分支移除 `tauri/updater` feature 后，旧锁文件仍保留 updater 专用依赖。发布分支使用固定 Rust 1.95.0 显式同步 `src-tauri/Cargo.lock`：

- 锁文件格式由 v3 更新为 v4；
- 移除 `minisign-verify`；
- 移除旧 `zip 0.6.6`；
- 清理 Tauri updater 不再需要的依赖引用；
- 未新增或升级业务依赖。

同步后，发布门禁恢复为严格的 `cargo check --locked`。

## 7. 历史上游脚本

历史脚本仍保留在 `updater/`，但 package script 已改名为：

- `pnpm upstream:updater`；
- `pnpm upstream:updater:fixRuntime`。

命名用于阻止维护者把它们误认为社区版发布入口。它们仍与上游官方 Release 耦合，不得用于维护版构建或发布。

## 8. 后续外部操作

仓库所有者需要在本地安全环境完成：

1. 生成维护版独立 updater 密钥；
2. 离线保存私钥和密码；
3. 将私钥和密码分别配置为 `TAURI_PRIVATE_KEY`、`TAURI_KEY_PASSWORD`；
4. 只把可公开公钥提供给后续代码审查；
5. 对 Windows x64 非发布安装包执行只读验收。

任何聊天、Issue、PR、日志或仓库文件都不得包含真实私钥、密码或证书内容。

## 9. 当前禁止事项

在阶段 B 完成前，不得：

- 把 `tauri.updater.active` 改为 `true`；
- 恢复 `tauri/updater` Cargo feature；
- 写入 endpoint 或公钥占位符；
- 创建正式 tag 或 GitHub Release；
- 把 Actions Artifact 宣称为正式安装包；
- 从开发分支发布；
- 使用官方 Pot 的签名、端点或更新清单。
