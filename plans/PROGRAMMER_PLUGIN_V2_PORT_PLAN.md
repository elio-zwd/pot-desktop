# 程序员插件迁移到社区 Schema V2 实施计划

## 1. 目标与基线

本计划把已经完成固定双 Commit 组合验收的程序员极简工具，以通用 Schema V2 方式迁移到 Pot 社区维护版。计划本身不实现运行时代码。

- 桌面端协调 Base：`custom/main@85d2ec8ec138c4f5aa685e872864f9ca4c451d39`
- 固定桌面端行为证据：`a062a868064a5b7c781ccb8dbe310608dda26925`
- 固定插件行为证据：`3862162e01396b39edb9a3634a2067707ea0689f`
- 长期架构：插件原生输出 Schema V2，保留 v1、旧对象和纯文本回退
- V2 能力标识：`pot.plugin-result.v2`
- 契约文档：`docs/programmer-ui/PROGRAMMER_PLUGIN_V2_PORT.md`

## 2. 完成标准

1. 社区主线只消费既有通用 Schema V2。
2. 插件精确协商 V2、v1、旧对象和纯文本。
3. 初始、重试和反向翻译共享 stale 请求保护。
4. 复制、自动复制和历史只使用当前最终可信全文。
5. 现有配置键和值格式不变，设置 UI 使用社区 Schema V2。
6. 固定四个输入在新组合中通过自动化和真实 GUI 验收。
7. 旧 v1 宿主、旧 Pot 对象和纯文本宿主均通过回归。
8. 两个实现 PR 均独立、可回滚，不直接合并旧方案分支。

## 3. 实施顺序

### 步骤 0：开始前重新核对

两个实现任务分别执行：

1. 读取最新目标仓库 `AGENTS.md` 和任务文档；
2. 获取执行时最新基线 SHA；
3. 检查开放 PR 和近期提交；
4. 确认没有其他任务修改同一文件；
5. 从最新目标基线创建独立分支；
6. 记录固定方案双 Commit仅作为参考，不 cherry-pick 整个方案分支。

### 步骤 1：插件 V2 serializer

任务：`MIN-CUSTOM-PLUGIN-01`

基线：执行时最新 `backup/minimal-programmer-tool-ui`，不向插件 `main` 创建发布 PR。

实施顺序：

1. 在新纯函数模块定义 `pot.plugin-result.v2` 常量和 V2 serializer；
2. 使用固定四个 v1 fixture 先编写 V2 预期测试；
3. 冻结顶层 `copyText === v1.plainText`；
4. 实现 summary、metadata、dictionary、code-list 和 status 映射；
5. 实现 `literal` 的可见“按原文保留”语义；
6. 实现 diagnostic code、severity、recoverable 显式映射；
7. 扩展路由纯函数，优先级为 V2 → v1 → legacy → text；
8. 在 translate 入口接入，不重复词典或 Gemini 计算；
9. 迁移 `info.json` 到社区设置 Schema V2；
10. 构建 `main.js`；
11. 运行全部插件测试和敏感信息扫描；
12. 构建 Artifact 并记录 ID、Digest、内容清单。

### 步骤 2：桌面端 host 与生命周期

任务：`MIN-CUSTOM-DESKTOP-01`

实施顺序：

1. 先为 host helper 和请求提交决策写纯函数测试；
2. 新增每次返回新对象的 host helper；
3. 在插件初始和反向翻译调用顶层加入 host；
4. 用组件局部请求 ID 替代模块级或分叉式竞态保护；
5. 统一流式、最终 resolve、reject、重试与反向翻译；
6. 只在当前最终有效结果上执行历史和自动复制；
7. 最终不可用但已有当前流式结果时保留显示，不产生最终副作用；
8. 保持 `TranslationResult`、Schema V2 和设置页不变；
9. 运行定向 Node 测试和 `pnpm build`；
10. 执行只读桌面端交互验收。

### 步骤 3：组合验收

任务：`MIN-CUSTOM-COMBO-01`

1. 固定插件和桌面端待验收 SHA；
2. 从插件 CI 下载指定 Artifact；
3. 校验 Artifact ID、Digest 和根目录文件；
4. 在指定桌面端构建中真实安装插件；
5. 执行四个固定输入；
6. 验证 V2、复制、历史、自动复制、折叠和竞态；
7. 验证设置 Schema V2；
8. 切换到 v1、旧对象和纯文本宿主夹具回归；
9. 验证 320px、200% 缩放、键盘、亮暗主题和无网络 AI 回退；
10. 输出只读验收报告，不修改源码。

## 4. 插件任务详细边界

### 4.1 允许修改

```text
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
```

### 4.2 禁止修改

```text
dictionary.db
dictionary.meta.json
scripts/build_dictionary.py
scripts/test_dictionary_build.py
package.json
工作流文件
锁文件
tools/ai/superpowers/
桌面端仓库
```

`scripts/build_runtime.py` 已按 `runtime-*.js` 排序收集源片段，新增 `runtime-10-plugin-result-v2.js` 不需要修改构建脚本。

### 4.3 插件测试矩阵

- V2 精确能力；
- v1 精确能力；
- 同时声明 V2 与 v1；
- 未知能力；
- 缺失 host；
- `resultSchemas` 非数组；
- `setResult` 有/无；
- 七个直接字符串模式；
- 四个固定输入；
- AI off、unknown_only、always、失败回退；
- dictionary warning；
- literal 可见语义；
- 五种命名逐项 copyText；
- diagnostic recoverable；
- `copyText === v1.plainText`；
- 不修改 config、host、model、sections；
- 不包含真实 Key、请求头、URL、SQL、路径和堆栈；
- `info.json` 分组、遮罩、多行与条件字段。

## 5. 桌面端任务详细边界

### 5.1 允许修改

```text
src/utils/plugin_host_capabilities.js
src/window/Translate/components/TargetArea/index.jsx
src/window/Translate/components/TargetArea/result_flow.js
tests/plugin_host_capabilities.test.mjs
tests/target_area_result_flow.test.mjs
```

### 5.2 禁止修改

```text
src/utils/plugin_result_schema.js
src/window/Translate/components/TranslationResult/
src/window/Config/pages/Service/PluginConfig/
package.json
pnpm-lock.yaml
src-tauri/
工作流文件
README.md
AGENTS.md
```

### 5.3 桌面端测试矩阵

- host 对象每次调用独立；
- host 不写入 config；
- 初始与反向翻译均传入 `pot.plugin-result.v2`；
- 内置服务不接收插件 host；
- stale 流式、resolve 和 reject；
- 重试覆盖旧请求；
- 反向翻译覆盖旧请求；
- 当前流式可显示但不写历史；
- 当前最终 V2 只写一次历史和自动复制；
- stale 最终不写剪贴板、通知和历史；
- 最终无效时保留当前流式显示但不产生最终副作用；
- 新请求重置结果树；
- 同一请求稳定 section ID；
- 字符串和旧对象兼容；
- V2 使用现有 `TranslationResult`；
- 无 `ProgrammerMinimalResult` 或 v1 判断。

## 6. 组合验收矩阵

| 类别 | 验收项 |
|---|---|
| 固定输入 | `NFC_WriteU16LE`、`getCustomxyzValue`、`RxBufLen`、`ST25DV_i2c_WriteData` |
| V2 | 顶层版本、copyText、section 顺序、来源、状态、折叠 |
| 复制 | 全文、五种命名单项、自动复制、source_target |
| 历史 | 仅最终当前请求、内容等于 copyText |
| 竞态 | 初始、流式、resolve、reject、重试、反向翻译 |
| 设置 | 分组、高级折叠、Key 遮罩、多行、visibleWhen、保存值 |
| 兼容 | v1、旧对象、完整纯文本、直接字符串模式 |
| UI | 320px、200% 缩放、键盘、亮暗主题、多服务 |
| AI | off、成功、部分补全、无网络回退、脱敏 |
| 产物 | Artifact Digest、文件清单、无 tools/、无真实 Key |

## 7. 验证证据分级

每个实现任务必须把验证结果标为以下之一：

- **已实际执行并通过**：附命令、退出码和关键输出；
- **GitHub CI 已通过**：附 Run、Job 和结论；
- **仅完成静态检查**：说明检查文件和结论；
- **尚未验证**：交给本地只读验收。

自动化 DOM 或纯函数测试不得写成真实 GUI 验收。真实安装、窗口、缩放、键盘和主题只由本地组合验收报告确认。

## 8. Commit 与 PR

### 插件

建议分支：

```text
feat/custom-plugin-result-v2
```

建议 Commit：

```text
feat: 接入社区插件结果与设置 Schema V2
```

### 桌面端

建议分支：

```text
feat/programmer-plugin-v2-host
```

建议 Commit：

```text
feat: 补强插件结果能力与请求生命周期
```

两个 PR 均先创建 Draft，未经用户明确授权不得转 Ready、合并、自动合并、强推或删除分支。

## 9. 回滚顺序

1. 组合验收失败时不合并实现 PR；
2. 插件问题回退插件实现 Commit，保留固定 v1 行为；
3. 桌面端问题回退 host/lifecycle Commit，不改变现有 Schema V2；
4. 不删除或迁移用户配置；
5. 不修改固定方案分支和 Artifact；
6. 修复后重新固定双 SHA 并完整执行组合验收。
