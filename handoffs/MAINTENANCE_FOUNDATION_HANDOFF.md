# Pot 社区维护版基础建设交接

## 1. 交付定位

本分支已把临时功能 Fork 整理为边界清晰的非官方社区维护版基础仓库。

- 仓库：`https://github.com/elio-zwd/pot-desktop`
- 分支：`chore/maintenance-foundation`
- Draft PR：`https://github.com/elio-zwd/pot-desktop/pull/5`
- PR Base：`custom/main`
- 稳定 Base SHA：`b535ac2b1f39fead9eb8d0e0a1f95f1e991ff823`
- 实现与任务状态基准 SHA：`72ea792b1932a3b3ff2c0569a9dfe9cdd8e77adb`
- 对外名称：`Pot 社区维护版`
- 初期正式支持：Windows x64
- 首个规划版本：`3.1.0-elio.1`

本文件提交之后的精确最终分支 HEAD 以 Draft PR #5 的 `head_sha` 和远端 `chore/maintenance-foundation` 为准；最终交付报告与本地 AI Prompt 必须填写该精确 SHA。

## 2. 必读顺序

后续接手必须按以下顺序读取：

1. `README.md`
2. `AGENTS.md`
3. 当前分支对应的 Plan
4. 当前分支对应的 Task
5. 当前分支对应的 Handoff
6. `docs/MAINTENANCE_FOUNDATION_DECISIONS.md`
7. `LICENSE`
8. 与任务直接相关的真实源码、配置、测试和工作流

不得根据旧对话或旧 Schema 功能分支猜测当前实现。

## 3. 已完成内容

### 项目身份与入口

- README 首屏改为“Pot 社区维护版”；
- 明确非官方身份、GPL-3.0、上游来源和反馈边界；
- 明确 Windows x64 正式支持、`custom/main` 稳定主线和规划版本；
- 明确当前没有维护版正式安装包或自有自动更新通道；
- 保留并整理原版功能、插件、接口、安装和编译说明；
- 对上游 Release、商店和跨平台说明增加维护版边界提示。

### 长期治理

- `AGENTS.md` 已改为长期规则，不再包含结束的双 Schema 临时分工；
- 新增 `docs/MAINTENANCE_SCOPE.md`；
- 新增 `docs/RELEASE_POLICY.md`；
- 新增 `docs/UPSTREAM_PORT_POLICY.md`；
- 新增根目录 `UPSTREAM_PORTS.md`；
- 新增 `SECURITY.md`；
- 新增最小 PR 模板和缺陷 Issue Form。

### 上游候选台账

已经记录但没有移植运行时代码：

- #1285 阿里翻译 HTTP → HTTPS：待优先审计；
- #1292 全局快捷键：待审计和 Windows 验证；
- #1290 多模块大 PR：拒绝整体移植，必须拆分；
- #1284 Markdown / LaTeX 结果渲染：与 Result Schema V2 重叠，暂缓；
- Windows `tauri_plugin_single_instance` 空指针：独立运行时候选。

## 4. 更新器审计结论

初始分支存在以下路径：

1. `src-tauri/tauri.conf.json` 启用 Tauri Updater；
2. 配置包含官方 `pot-app/pot-desktop` 更新端点和上游公钥；
3. `src-tauri/src/main.rs` 在启动 `setup` 阶段调用 `check_update`；
4. `src-tauri/src/updater.rs` 在配置缺失时默认写入 `check_update: true`；
5. 随后调用 `tauri::updater::builder(...).check()`；
6. `updater/*.mjs` 生成脚本也与官方 Release 和官方安装包强耦合。

这意味着定制构建默认可能连接并接受官方更新，存在版本来源混淆和维护版功能被覆盖的风险。

详细审计：`docs/UPDATER_AUDIT.md`。

## 5. 已实施的更新器隔离

本分支采用双层、可逆、不依赖伪服务的方案：

- `src-tauri/tauri.conf.json`：`tauri.updater.active` 改为 `false`；
- 运行时配置删除官方 updater `endpoints`；
- 运行时配置删除上游 updater `pubkey`；
- `src-tauri/src/updater.rs` 不再读取或写入 `check_update`；
- `src-tauri/src/updater.rs` 不再调用 `tauri::updater`；
- 启动时只记录“维护版尚未配置自有更新通道”，不发起更新网络请求；
- 未配置任何不存在的替代更新地址；
- 未修改 `main.rs` 的启动结构，便于后续独立发布分支恢复自有实现；
- 未删除历史 updater 生成脚本，但政策和 CI 均禁止将其用于维护版发布。

即使旧用户配置仍有 `check_update: true`，当前启动路径也不会访问官方 Updater。

## 6. 轻量 CI

新增 `.github/workflows/custom-ci.yml`：

- 触发：指向 `custom/main` 的 PR、手动触发；
- 权限：`contents: read`；
- 环境：Node 21、pnpm 9、Ubuntu；
- 安装：`pnpm install --frozen-lockfile`；
- YAML：Ruby 标准库解析 workflow 与 Issue Form；
- 治理自检：`node scripts/maintenance-foundation-check.mjs`；
- Schema：两组现有 Node 测试；
- 构建：`pnpm build`；
- 补丁：`git diff --check`；
- 工作区：`git diff --exit-code` 与空 `git status --short`。

该 CI 不打包、不上传 Artifact、不创建 Release、不读取签名密钥。

## 7. 已完成测试

GitHub Actions Run：`30454764291`

环境：

- Ubuntu 24.04；
- Node `v21.7.3`；
- pnpm `9.15.9`；
- Ruby `3.2.3`。

结果：

- `pnpm install --frozen-lockfile`：通过；
- YAML 基础解析：通过；
- 维护版配置、JSON、Markdown 本地链接和更新器隔离自检：通过；
- 设置 Schema V2：13/13 通过；
- 结果 Schema V2：14/14 通过；
- `pnpm build`：通过，17.14 秒；
- `git diff --check`：通过；
- 构建后 `git diff --exit-code`：通过；
- 构建后 `git status --short`：空，工作区干净。

后续 Task/Handoff 仅为文档收尾；最终分支 HEAD 仍需确认对应的最新维护版 CI 成功。

## 8. 未修改范围

本分支没有：

- 发布安装包或 GitHub Release；
- 配置真实签名、证书、私钥或更新服务器；
- 写入版本 `3.1.0-elio.1`；
- 全面替换应用图标、显示名称或安装器品牌；
- 迁移 Tauri 2；
- 整体升级依赖；
- 重做全局 UI；
- 修改设置 Schema V2 或结果 Schema V2 运行时代码、样式和语义；
- 修改程序员划词翻译插件；
- 移植任何具体上游 PR 运行时代码；
- 修复 Windows single-instance 空指针；
- 修改 `Cargo.lock`；
- 修改 `LICENSE`。

因此不重复完整桌面 Schema V2 人工 UI 验收。

## 9. 后续分支

`chore/custom-release-channel` 应独立完成：

- 写入 `3.1.0-elio.1`；
- 维护版产品名、安装包名和必要品牌标识；
- Windows x64 构建与安装验收；
- 自有 updater 清单、端点和公钥；
- 签名私钥的安全存储与最小权限；
- 替换或重构历史 updater 生成脚本；
- Release、升级、降级、失败恢复和回滚验收；
- 在完整通道通过前保持自动更新关闭。

不得在该后续分支顺手处理 single-instance 或上游业务 PR。

## 10. Draft PR 状态

- PR：#5；
- Base：`custom/main`；
- Head：`chore/maintenance-foundation`；
- 标题：`chore: 建立 Pot 社区维护版基础治理`；
- 状态：Draft；
- 未转 Ready；
- 未合并；
- 未修改 `custom/main`。

## 11. 本地 AI 验收边界

本地 AI 只允许：

- 拉取远端精确 HEAD；
- 检查 Base 和提交范围；
- 安装依赖并运行既定测试与构建；
- 只读检查 README、治理文档、模板、CI 和更新器隔离；
- 报告通过、失败、警告和可复现证据。

本地 AI 禁止：

- 修改任何文件；
- 自动修复或格式化；
- 创建提交、推送分支或改写历史；
- 转 Ready、合并或关闭 PR；
- 发布安装包或 Release；
- 配置密钥、证书或更新服务。
