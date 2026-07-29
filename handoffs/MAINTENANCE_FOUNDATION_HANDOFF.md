# Pot 社区维护版基础建设交接

## 1. 任务定位

你负责把当前 Pot 定制 Fork 建立为可长期维护的非官方社区维护版基础仓库。

- 仓库：`https://github.com/elio-zwd/pot-desktop`
- 分支：`chore/maintenance-foundation`
- PR Base：`custom/main`
- 稳定基线：`b535ac2b1f39fead9eb8d0e0a1f95f1e991ff823`
- 对外名称：`Pot 社区维护版`
- 初期正式支持：`Windows x64`
- 首个规划版本：`3.1.0-elio.1`

当前分支在交接时只包含规划、任务和交接文档，没有开始维护版基础代码或 README 改造。

## 2. 必读顺序

必须先通过 GitHub 插件读取：

1. `README.md`
2. `AGENTS.md`
3. `plans/MAINTENANCE_FOUNDATION_PLAN.md`
4. `tasks/MAINTENANCE_FOUNDATION_TASKS.md`
5. `handoffs/MAINTENANCE_FOUNDATION_HANDOFF.md`
6. 当前更新器、Tauri 配置、工作流和发布脚本
7. 当前 Schema V2 文档与测试入口
8. `LICENSE`

不要根据旧对话猜测当前代码和配置。

## 3. 已确认背景

`custom/main` 的当前稳定基线已经完成并通过：

- 设置 Schema V2：13/13；
- 结果 Schema V2：14/14；
- `pnpm build`；
- `git diff --check`；
- 设置分组、密码遮罩、条件显示；
- 六类结构化结果区块；
- 旧版字符串和对象结果兼容；
- 复制和历史记录；
- 明暗主题与 380px 窄窗口。

这两个 Schema 已经是正式基础能力。不要回到 PR #3、PR #4 或旧功能分支继续开发，也不要重复设计其协议。

`tauri_plugin_single_instance` 的 Windows 空指针问题继续作为独立上游运行时问题记录：

- 不属于 Schema V2 合并回归；
- 不阻塞本任务；
- 不在本分支顺手升级 Cargo.lock；
- 后续通过独立修复或上游移植 PR 处理。

## 4. 已确认产品与治理决定

以下决定已经由用户确认，不需要重新询问：

- 名称：`Pot 社区维护版`；
- 性质：非官方社区维护版；
- 初期正式支持：`Windows x64`；
- 版本号：`3.1.0-elio.1`；
- `master` 仅跟踪历史上游；
- `custom/main` 为定制稳定主线；
- 自有更新通道完成前关闭或隔离官方自动更新；
- 保留原作者、原项目与 GPL-3.0 声明；
- 不与 Manggo 竞争完整产品线；
- 当前重点是插件平台、Windows 稳定性、安全和构建发布基础；
- 不一次性接管所有上游 PR 和 Issue；
- 上游 PR 按独立分支审计、移植和验证。

## 5. 本分支负责范围

应完成：

- README 非官方维护版身份和项目入口；
- 长期版 `AGENTS.md`；
- 维护范围文档；
- 发布政策；
- 上游 PR 移植政策和台账；
- 安全政策；
- 当前更新器审计；
- 必要且安全的官方自动更新隔离；
- 指向 `custom/main` 的轻量 CI；
- 最小 PR/Issue 模板评估；
- Task、Handoff 和 Draft PR。

## 6. 不在本分支完成

严格排除：

- 实际发布 `3.1.0-elio.1` 安装包；
- 应用图标、产品显示名称和安装器品牌全面替换；
- 自有更新服务器；
- 自有签名和证书；
- Tauri 2 迁移；
- React、NextUI 或整套依赖升级；
- 全局 UI 重做；
- 上游 PR 的运行时代码移植；
- 修复 single-instance 空指针；
- 修改程序员划词翻译插件仓库；
- 重写 Schema V2。

上述发布通道相关工作应留给后续：

`chore/custom-release-channel`

## 7. README 要求

README 首屏必须让新用户立即知道：

- 这是 `Pot 社区维护版`；
- 不是官方 Pot，也不是 Manggo；
- 基于 Pot 3.0.7 和 GPL-3.0；
- 初期正式支持 Windows x64；
- 当前稳定主线为 `custom/main`；
- 已加入插件设置和结果 Schema V2；
- 尚未提供自有自动更新通道；
- 本维护版问题应在本 Fork 报告。

不得删除原版 Pot 的来源、作者和许可信息。原 README 的详细功能和使用说明可以保留在维护版声明之后。

## 8. 更新器审计要求

这是本任务唯一可能触及运行时配置的部分，必须先读真实代码再决定：

1. 找出 `tauri.conf` 或平台配置中的 updater 设置；
2. 找出更新端点和签名公钥；
3. 找出前端或后端触发检查的位置；
4. 判断定制构建是否可能安装官方 Pot 更新；
5. 记录风险；
6. 只有在简单、可逆且不涉及自有服务时才在本 PR 关闭或隔离；
7. 涉及签名、安装器、后端迁移或发布服务时，不实现，只记录到后续任务。

禁止填写不存在的更新 URL，也禁止使用官方签名材料。

## 9. 上游 PR 台账初始候选

`UPSTREAM_PORTS.md` 至少记录：

- `pot-app/pot-desktop#1285`：阿里翻译 HTTP → HTTPS；安全候选，优先审计；
- `#1292`：全局快捷键稳定性；待拆分审计和 Windows 验证；
- `#1290`：跨多个模块的大 PR，不允许整体移植；
- `#1284`：Markdown/LaTeX 结果渲染，与当前 Result Schema V2 重叠，暂缓；
- Windows `tauri_plugin_single_instance` 空指针问题：独立运行时候选。

本分支只建台账，不修改这些运行时代码。

## 10. CI 要求

新增 `.github/workflows/custom-ci.yml`，建议：

- 触发：指向 `custom/main` 的 PR，以及必要时手动触发；
- 权限：`contents: read`；
- Node 21；
- pnpm 9；
- `pnpm install --frozen-lockfile`；
- 运行当前设置 Schema 测试；
- 运行当前结果 Schema 测试；
- `pnpm build`；
- `git diff --check`；
- 检查构建后受跟踪工作区没有变化。

不得复制上游完整多平台打包工作流，不得在此工作流发布安装包或使用签名密钥。

## 11. 测试边界

必须执行本 PR 的定向门禁，但不需要重复完整桌面 Schema 人工验收，除非你实际修改了 Schema 运行时代码或样式。

至少报告：

- Node 和 pnpm 版本；
- 两组 Schema 测试命令和结果；
- `pnpm build`；
- YAML/文档检查；
- `git diff --check`；
- `git status --short`；
- 更新器审计结论；
- 是否修改了运行时代码。

## 12. 提交规范

所有提交使用：

`英文 Tag: 中文描述`

例如：

- `docs: 重写社区维护版项目说明`
- `docs: 添加上游 PR 移植政策`
- `ci: 添加 custom/main 轻量门禁`
- `chore: 隔离官方自动更新通道`

不要全仓库格式化，不要混入无关变更。

## 13. 需要暂停询问用户的情况

仅在以下情况暂停：

- 关闭官方自动更新必须修改较大范围 Rust/Tauri 运行时代码；
- 必须增加第三方依赖；
- 必须修改 LICENSE 或删除上游版权；
- 必须变更已确认名称、正式支持平台或版本规则；
- 必须实际配置签名、证书、自有更新服务器；
- 必须迁移 Tauri 2；
- 必须修改 Schema V2 语义；
- 需要在本分支移植具体上游运行时 PR。

普通文档结构、最小模板和 CI 文件组织由你自主完成。

## 14. 交付流程

完成后：

1. 更新 Task 状态；
2. 更新 Handoff 的最终 HEAD 和验证结果；
3. 创建 Draft PR：
   - Base：`custom/main`
   - Head：`chore/maintenance-foundation`
   - 标题：`chore: 建立 Pot 社区维护版基础治理`
4. 不得转 Ready；
5. 不得合并；
6. 输出供本地 AI 使用的只读验收 Prompt；
7. 本地 AI 只拉取、构建、检查文档和更新器行为，不修改代码。
