# Pot 社区维护版基础建设计划

## 1. 项目定位

本分支负责把 `elio-zwd/pot-desktop` 从临时功能 Fork 整理为可长期维护、可清晰发布、不会冒充官方 Pot 的社区维护版基础仓库。

- 仓库：`https://github.com/elio-zwd/pot-desktop`
- 分支：`chore/maintenance-foundation`
- Base：`custom/main`
- Base SHA：`b535ac2b1f39fead9eb8d0e0a1f95f1e991ff823`
- 对外名称：`Pot 社区维护版`
- 初期正式支持：`Windows x64`
- 首个维护版版本号：`3.1.0-elio.1`
- 自有更新通道完成前：关闭或隔离官方自动更新

当前 Base 已包含并完成验收：

- 插件设置 Schema V2：13/13；
- 插件结果 Schema V2：14/14；
- `pnpm build`；
- 明暗主题与 380px 窄窗口；
- 旧版插件兼容、复制和历史记录。

本分支不得重复开发或重新设计两个 Schema，也不要求重新执行其完整人工验收。新修改仍需通过自身定向门禁。

## 2. 目标

### 2.1 身份与法律边界

- README 首屏明确说明这是非官方社区维护版。
- 明确保留 Pot 原作者、原仓库与 GPL-3.0 许可。
- 不暗示与原作者、Manggo 或官方 Pot 存在官方隶属关系。
- 保留 LICENSE，不删除或弱化上游版权信息。

### 2.2 分支治理

- `master`：只用于跟踪历史上游或必要的上游同步，不承载定制开发。
- `custom/main`：社区维护版稳定主线。
- `feat/*`、`fix/*`、`chore/*`：独立功能或维护分支。
- `port/upstream-pr-<number>-<topic>`：上游 PR 移植分支。
- 所有开发分支从当时最新的 `custom/main` 明确 SHA 创建。
- 所有变更先进入 Draft PR，未经用户明确授权不得转 Ready 或合并。

### 2.3 维护范围

第一优先级：

- 插件平台；
- Windows x64 稳定运行；
- 安全修复；
- 启动、快捷键、剪贴板、插件安装和执行；
- 构建链与发布链；
- 主要 AI 接口失效。

第二优先级：

- macOS、Linux 的已复现关键问题；
- 常用内置服务修复；
- 性能和可访问性改进。

默认不承担：

- 所有上游遗留 Issue；
- 所有冷门翻译服务；
- 与 Manggo 的完整功能竞争；
- 本阶段迁移 Tauri 2；
- 本阶段整体升级 React、NextUI 或依赖栈；
- 大规模全局视觉重做。

### 2.4 上游 PR 移植制度

建立 `UPSTREAM_PORTS.md`，每个候选记录：

- 上游 PR 编号与链接；
- 风险类别；
- 是否影响维护版目标用户；
- 原始提交 SHA 和作者；
- 审计结论；
- 接受、拒绝、等待或已移植状态；
- 本地验证结果；
- 对应维护版 PR。

移植原则：

1. 先审计完整 diff、讨论和依赖；
2. 每个不相关问题拆成独立分支；
3. 优先保留原作者提交和署名；
4. 必须在当前 `custom/main` 上重新验证；
5. 不整体吸收跨多个模块的大杂烩 PR；
6. 不因上游 PR 关闭或长时间未响应就默认其正确。

### 2.5 CI 基础

新增轻量维护版 CI，目标是快速、稳定、低成本：

- 使用 Node 21、pnpm 9，与现有项目门禁保持一致；
- `pnpm install --frozen-lockfile`；
- 设置 Schema V2 测试；
- 结果 Schema V2 测试；
- `pnpm build`；
- `git diff --check`；
- 检查受跟踪工作区没有被构建修改。

本阶段不复制上游全平台打包矩阵，也不发布安装包。

## 3. 本分支应修改的文件

计划新增或更新：

- `README.md`
- `AGENTS.md`
- `docs/MAINTENANCE_SCOPE.md`
- `docs/RELEASE_POLICY.md`
- `docs/UPSTREAM_PORT_POLICY.md`
- `UPSTREAM_PORTS.md`
- `SECURITY.md`
- `.github/workflows/custom-ci.yml`

可以根据真实仓库结构增加：

- PR 模板；
- Issue 模板；
- 维护版变更说明入口。

增加额外文件前应确保其直接服务于本计划，不进行无关仓库整理。

## 4. README 设计

README 顶部应优先说明：

1. 项目名称：Pot 社区维护版；
2. 非官方身份；
3. 基于 Pot 3.0.7 和 GPL-3.0；
4. 当前稳定主线和主要增强；
5. 初期正式支持 Windows x64；
6. 原版 Pot 仓库和原作者链接；
7. 当前版本暂未提供自有自动更新通道；
8. 用户不得使用官方 Pot 或 Manggo 名义反馈本维护版问题。

原版详细使用说明可以保留，但应放在维护版声明之后，避免仓库首屏继续呈现为官方项目。

## 5. AGENTS.md 设计

删除或重写已经结束的双 Schema 临时协作规则，改为长期规则：

- 必读顺序；
- 分支与 Draft PR 规则；
- 中文沟通和提交格式；
- 兼容、安全与测试要求；
- 上游移植规则；
- 发布、签名和密钥边界；
- 本地 AI 只读验收边界；
- 禁止直接修改 `master/custom/main`；
- 禁止自动合并、强推、全仓库格式化和无关依赖升级。

保留已经成为稳定能力的 Schema V2 兼容要求，但不再把旧功能分支写成“当前分支”。

## 6. 发布政策设计

`docs/RELEASE_POLICY.md` 只定义政策，不在本 PR 实际发布：

- 版本格式：`上游版本-elio.维护序号`；
- 首个规划版本：`3.1.0-elio.1`；
- Release 必须基于已验证的 `custom/main` 精确 SHA；
- 初期只承诺 Windows x64；
- 发布产物必须标记非官方；
- 不使用上游签名密钥或更新通道；
- 自有更新通道、签名和安装包品牌化必须在独立 PR 完成；
- 发布说明列出已知问题和上游来源。

## 7. 更新器策略

本分支需要审计而不是盲改：

- 找出当前更新器配置、更新地址、签名公钥和触发路径；
- 确认定制版是否可能连接官方更新服务；
- 在不引入自有服务的前提下，设计关闭或隔离方案；
- 若简单配置即可安全关闭，可在本 PR 实施；
- 若涉及 Tauri 后端、签名、安装器或兼容迁移，应记录并移至 `chore/custom-release-channel`。

禁止把官方更新 URL 替换成尚不存在的占位服务。

## 8. 安全政策

`SECURITY.md` 至少说明：

- 支持的维护版分支；
- 安全问题的提交方式；
- 禁止在公开 Issue 粘贴 API Key、证书、用户数据库或完整隐私文本；
- 接口凭据和翻译内容泄露视为高优先级；
- 本项目不是官方 Pot/Manggo，不能向原作者要求本维护版支持；
- 暂不承诺固定 SLA。

## 9. 已知问题

`tauri_plugin_single_instance` 的 Windows 空指针问题继续作为独立上游运行时问题记录：

- 不归因于 Schema V2；
- 不阻塞维护版基础建设；
- 不在本分支顺手升级 Cargo.lock；
- 后续通过独立 `fix/` 或 `port/` 分支审计和修复。

## 10. 测试策略

本分支的门禁：

- 两组 Schema Node 测试；
- `pnpm build`；
- README、YAML、JSON 和 Markdown 基础有效性检查；
- `git diff --check`；
- 确认没有修改 LICENSE；
- 确认没有引入密钥、证书、个人配置或数据库；
- 确认工作区干净。

不要求重复执行 Schema V2 的完整桌面人工验收，除非本分支实际修改了其运行时代码或样式。

## 11. PR 与交付

完成后创建 Draft PR：

- Base：`custom/main`
- Head：`chore/maintenance-foundation`
- 标题：`chore: 建立 Pot 社区维护版基础治理`

PR 必须明确：

- 哪些只是文档政策；
- 是否实际改动更新器行为；
- 没有发布安装包；
- 没有迁移 Tauri 2；
- 没有重新设计 Schema V2；
- 后续 `chore/custom-release-channel` 的剩余事项。

未经用户明确授权不得转 Ready 或合并。