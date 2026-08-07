# 程序员插件 Schema V2 迁移交接

## 1. 协调结论

- 长期架构：方案 B，插件原生输出社区 Schema V2。
- 社区 V2 能力标识：`pot.plugin-result.v2`。
- 旧方案 v1：`pot.programmer-result.v1`。
- 插件路由：V2 → v1 → 旧 Pot 原生对象 → 完整纯文本。
- 桌面端：复用现有 `TranslationResult`，不复制 `ProgrammerMinimalResult`。
- 请求生命周期：初始、重试、流式、resolve、reject 和反向翻译统一使用请求 ID。
- 最终副作用：仅当前请求的最终可信 `copyText` 可进入历史和自动复制。
- 设置：保留所有现有键和值，迁移到社区设置 Schema V2。

完整契约见：

```text
docs/programmer-ui/PROGRAMMER_PLUGIN_V2_PORT.md
plans/PROGRAMMER_PLUGIN_V2_PORT_PLAN.md
tasks/PROGRAMMER_PLUGIN_V2_PORT_TASKS.md
```

## 2. 固定参考

### 桌面端

- 仓库：`elio-zwd/pot-desktop`
- 固定 Commit：`a062a868064a5b7c781ccb8dbe310608dda26925`
- 固定功能 Head：`f948d37eb385f4a2679d9e5ec2d8b5d728f779bb`
- 固定 PR：`#12`

### 插件

- 仓库：`elio-zwd/pot-app-translate-plugin-programmer-selection`
- 固定 Commit：`3862162e01396b39edb9a3634a2067707ea0689f`
- 固定功能 Head：`688792b1c5af98bf5dc03577cff5bc185ecdc8ea`
- 固定 PR：`#11`
- Run ID：`31079192633`
- Artifact ID：`8958748240`
- Digest：`sha256:efe8d60a7eed12b57acc0c645fe57398bc1bffd4be7676b612cac65668fd19a9`

上述版本只作为行为和 fixture 参考，不允许直接合并到 `custom/main` 或插件稳定主线。

## 3. 任务 Prompt：MIN-CUSTOM-PLUGIN-01

### 名称

`MIN-CUSTOM-PLUGIN-01 程序员插件接入社区 Schema V2 与配置 Schema V2`

### 可复制 Prompt

```text
你只负责 MIN-CUSTOM-PLUGIN-01：程序员插件接入社区 Schema V2 与配置 Schema V2。

仓库：
elio-zwd/pot-app-translate-plugin-programmer-selection

开始前：
1. 检查 GitHub 与 Superpowers 实际能力；
2. 读取仓库规则、最新目标基线、开放 PR；
3. 读取 pot-desktop 的 PROGRAMMER_PLUGIN_V2_PORT.md、PLAN、TASKS、HANDOFF；
4. 读取固定插件 Commit 3862162e01396b39edb9a3634a2067707ea0689f 和固定桌面端 Commit a062a868064a5b7c781ccb8dbe310608dda26925；
5. 从执行时最新 backup/minimal-programmer-tool-ui 创建独立分支，不向插件 main 创建发布 PR，不合并旧方案分支。

必须实现：
- 能力标识 pot.plugin-result.v2；
- V2 → pot.programmer-result.v1 → 旧对象 → 完整纯文本优先级；
- V2 serializer，顶层 schemaVersion: 2、copyText、sections；
- 按契约逐字段映射 summary、identifier、tokenMeanings、naming、diagnostics；
- literal 明确显示按原文保留；
- 保留现有 v1、旧 Pot 对象、完整纯文本和直接字符串模式；
- info.json 使用社区设置 Schema V2；
- 保留所有现有配置键和值格式；
- apiKeyPool 使用 secret: true、multiline: true、rows 和 visibleWhen.operator；
- 不进行网络 Key 校验，不记录真实 Key；
- 自动化测试和 Artifact 敏感信息审计。

只允许修改：
info.json
src/runtime-05-pot-native-report.js
src/runtime-08-programmer-result-schema.js
src/runtime-09-output-style-compat.js
src/runtime-10-plugin-result-v2.js
main.js
tests/programmer-result-schema.test.cjs
tests/programmer-result-integration.test.cjs
tests/output-style-compat.test.cjs
tests/pot-native-report.test.cjs
tests/plugin-result-v2.test.cjs
tests/plugin-config-v2.test.cjs

禁止修改：
dictionary.db、dictionary.meta.json、词典构建器、package.json、工作流、依赖、桌面端仓库、tools/ai/superpowers/。

验证：
- python scripts/build_runtime.py
- node --test tests/*.test.cjs
- npm test
- Artifact 构建和根目录审计
- Key、请求头、URL、SQL、路径、堆栈泄漏扫描
- git diff --check "$(git merge-base HEAD origin/backup/minimal-programmer-tool-ui)"...HEAD
- git diff --name-status "$(git merge-base HEAD origin/backup/minimal-programmer-tool-ui)"...HEAD
- git status --short

不得把自动化测试写成真实 Pot GUI 验收。创建 Draft PR，不转 Ready、不合并。最终输出精确 Base、Head、Commit、PR、Artifact、验证证据、风险和本地只读验收 Prompt。
```

## 4. 任务 Prompt：MIN-CUSTOM-DESKTOP-01

### 名称

`MIN-CUSTOM-DESKTOP-01 社区主线宿主能力与请求生命周期补强`

### 可复制 Prompt

```text
你只负责 MIN-CUSTOM-DESKTOP-01：社区主线宿主能力与请求生命周期补强。

仓库：
elio-zwd/pot-desktop

Base：
执行时最新 custom/main。开始时重新读取远端，不得回退到 85d2ec8ec138c4f5aa685e872864f9ca4c451d39。

开始前：
1. 检查 GitHub 与 Superpowers 实际能力；
2. 按 AGENTS.md 顺序读取最新源码、测试、开放 PR；
3. 读取 PROGRAMMER_PLUGIN_V2_PORT.md、PLAN、TASKS、HANDOFF；
4. 读取固定桌面端 Commit a062a868064a5b7c781ccb8dbe310608dda26925 的 result_flow 和 TargetArea，只复用行为，不复制专用组件；
5. 从最新 custom/main 创建独立分支。

必须实现：
- options.host 顶层声明 pot.plugin-result.v2；
- 每次调用返回新的 host 对象；
- host 不写入 config；
- 初始翻译、重试和反向翻译均传入同一能力；
- 初始、流式、最终 resolve、reject、重试和反向翻译统一请求 ID；
- stale 回调不得修改显示、错误、加载、剪贴板、通知或历史；
- 只有当前最终有效 copyText 触发历史和自动复制；
- 当前有效流式结果可以显示，但不作为最终副作用输入；
- 复用现有 TranslationResult；
- 保持字符串和旧对象兼容；
- 不实现 v1 适配器；
- 不复制 ProgrammerMinimalResult；
- 不重写 Schema V2。

只允许修改：
src/utils/plugin_host_capabilities.js
src/window/Translate/components/TargetArea/index.jsx
src/window/Translate/components/TargetArea/result_flow.js
tests/plugin_host_capabilities.test.mjs
tests/target_area_result_flow.test.mjs

禁止修改：
src/utils/plugin_result_schema.js
src/window/Translate/components/TranslationResult/
src/window/Config/pages/Service/PluginConfig/
package.json
pnpm-lock.yaml
src-tauri/
工作流
README.md
AGENTS.md

验证：
- node --test tests/plugin_host_capabilities.test.mjs tests/target_area_result_flow.test.mjs tests/plugin_result_schema.test.mjs
- corepack pnpm build
- git diff --check "$(git merge-base HEAD origin/custom/main)"...HEAD
- git diff --name-status "$(git merge-base HEAD origin/custom/main)"...HEAD
- git status --short

真实窗口、缩放、键盘和主题交给本地只读验收。创建 Draft PR，不转 Ready、不合并。最终输出精确 Base、Head、Commit、PR、验证证据、风险和本地只读验收 Prompt。
```

## 5. 任务 Prompt：MIN-CUSTOM-COMBO-01

### 名称

`MIN-CUSTOM-COMBO-01 社区维护版 Schema V2 最终组合验收`

### 可复制 Prompt

```text
你只负责 MIN-CUSTOM-COMBO-01：社区维护版 Schema V2 最终组合验收。

这是严格只读验收，不开发、不修改、不提交、不推送、不创建或更新 PR、不合并。

开始前由协调方提供：
- 桌面端仓库、分支和固定待验收 SHA；
- 插件仓库、分支和固定待验收 SHA；
- 插件 GitHub Actions Run、Artifact ID 和 Digest；
- 两个实现 PR；
- PROGRAMMER_PLUGIN_V2_PORT.md 契约。

必须：
1. 记录操作系统、架构、Git、Node、npm、pnpm、Python、Rust、Cargo 和 Pot 版本；
2. 拉取远端最新引用；
3. 分别 detached checkout 精确 SHA；
4. 确认工作区起始为空；
5. 插件执行构建、全部测试、Artifact 下载、Digest 和根目录审计；
6. 桌面端执行定向测试、pnpm build、Cargo check 和可用的 Release 构建；
7. 安装指定 Artifact 到指定桌面端构建；
8. 验证四个固定输入：
   NFC_WriteU16LE
   getCustomxyzValue
   RxBufLen
   ST25DV_i2c_WriteData
9. 验证 Schema V2 sections、copyText、全文和五种命名单项复制；
10. 验证自动复制、source_target 和 History 只使用当前最终 copyText；
11. 使用可控延迟夹具验证流式、resolve、reject、重试和反向翻译竞态；
12. 验证新请求默认折叠，同一请求更新保留展开状态；
13. 验证设置分组、高级 AI 默认折叠、apiKeyPool 默认遮罩、多行编辑、visibleWhen 和保存值；
14. 验证 320px、200% 缩放、键盘、亮色、暗色和多服务；
15. 验证 AI 无网络回退和脱敏；
16. 分别验证 pot.programmer-result.v1 旧宿主、旧 Pot 原生对象和完整纯文本宿主；
17. 验收结束后清理构建产物并确认两个工作区为空。

禁止：
- 修改任何源文件或配置；
- 使用真实 API Key；
- 把自动化测试代替真实 GUI 验收；
- 使用其他 Artifact；
- 合并或转 Ready；
- 只报告“通过”而不附命令、退出码、截图或关键日志。

输出：
- 环境；
- 精确双 SHA、Artifact ID、Digest；
- 每条命令和退出码；
- 自动化结果；
- GUI 验收表；
- 截图索引；
- 失败项、复现步骤和可能原因；
- 最终工作区状态；
- FINAL PASS 或 FINAL FAIL。
```

## 6. 冲突与依赖

- 桌面端 PR #1、#2、#7 不得修改、关闭或合并；
- 插件 PR #7 不得修改、关闭或合并；
- 两个实现任务开始时必须重新检查新增开放 PR；
- 插件与桌面端实现仅在本契约合并后可并行；
- 组合验收等待两个实现分支固定待验收 SHA；
- 任一实现需要扩大文件范围时，先更新协调契约，不擅自越界。

## 7. 本协调 PR 的本地只读验收 Prompt

```text
你负责对 MIN-CUSTOM-00 文档协调 PR 执行严格只读验收。

仓库：
https://github.com/elio-zwd/pot-desktop

Base：
custom/main@85d2ec8ec138c4f5aa685e872864f9ca4c451d39

目标分支：
docs/programmer-plugin-v2-port-contract

规则：
- 只允许 fetch、detached checkout、读取、diff 和文档检查；
- 不修改文件；
- 不格式化；
- 不 commit；
- 不 push；
- 不创建、更新、转 Ready 或合并 PR；
- 不删除分支。

步骤：
1. 记录操作系统、Git、Node、Python 版本；
2. git fetch origin --prune；
3. detached checkout 远端目标分支精确 HEAD；
4. 记录 git rev-parse HEAD；
5. 确认 85d2ec8ec138c4f5aa685e872864f9ca4c451d39 是 HEAD 的祖先；
6. 执行：
   git diff --check 85d2ec8ec138c4f5aa685e872864f9ca4c451d39...HEAD
   git diff --name-status 85d2ec8ec138c4f5aa685e872864f9ca4c451d39...HEAD
   git status --short
7. 确认差异仅有：
   docs/programmer-ui/PROGRAMMER_PLUGIN_V2_PORT.md
   plans/PROGRAMMER_PLUGIN_V2_PORT_PLAN.md
   tasks/PROGRAMMER_PLUGIN_V2_PORT_TASKS.md
   handoffs/PROGRAMMER_PLUGIN_V2_PORT_HANDOFF.md
8. 检查 Markdown 代码块闭合；
9. 检查所有固定 SHA、Run ID、Artifact ID 和 Digest；
10. 检查能力标识统一为 pot.plugin-result.v2；
11. 检查 V2 → v1 → 旧对象 → 纯文本优先级；
12. 检查 v1 → V2 映射、literal、recoverable 和 local_fallback 无语义丢失；
13. 检查设置迁移使用 group、groupDisplay、groupAdvanced、secret、multiline、rows、visibleWhen.operator/value；
14. 检查三个后续任务文件边界无重叠；
15. 搜索待补写标记、未定义占位符、直接合并旧方案分支、重写 Schema V2、复制 ProgrammerMinimalResult 等禁止内容；
16. 确认没有把自动化测试写成真实 GUI 验收；
17. 最终再次执行 git status --short，必须为空。

回传：
- 环境和工具版本；
- 精确 HEAD；
- 每条命令和退出码；
- 四文件清单；
- 每项文档检查结果；
- 发现的问题及路径/行号；
- 最终工作区状态；
- PASS 或 FAIL。
```
