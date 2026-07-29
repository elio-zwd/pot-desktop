# Pot 社区维护版上游移植台账

本台账记录上游 `pot-app/pot-desktop` 的候选修复及其审计状态。建立记录不代表已经接受或移植运行时代码。

移植政策见：`docs/UPSTREAM_PORT_POLICY.md`。

## 状态说明

- **待审计**：尚未完成完整 diff、讨论、CI、依赖和当前主线比较。
- **接受**：确认进入独立移植分支。
- **等待**：问题有效，但缺少复现、验证资源或前置条件。
- **拒绝**：不符合维护范围，或原 PR 风险和维护成本不可接受。
- **替代实现**：问题有效，但不直接采用原 PR，实现更小或更安全的方案。
- **已移植**：已经通过维护版独立 PR 合入 `custom/main`。

## 候选记录

| 候选 | 类别 | 当前结论 | 维护版相关性 | 后续动作 |
| --- | --- | --- | --- | --- |
| [pot-app/pot-desktop#1285](https://github.com/pot-app/pot-desktop/pull/1285) 阿里翻译 HTTP → HTTPS | 安全 / 网络 | 待优先审计 | 明文传输修复可能直接改善常用服务安全性 | 读取完整 diff、讨论和接口现状；若仍适用，建立独立 `port/` 分支 |
| [pot-app/pot-desktop#1292](https://github.com/pot-app/pot-desktop/pull/1292) 全局快捷键修复 | Windows 稳定性 | 待审计 | 与 Windows x64 正式支持目标相关 | 拆分真实故障点并完成 Windows 验证，不整体假定原实现正确 |
| [pot-app/pot-desktop#1290](https://github.com/pot-app/pot-desktop/pull/1290) 跨多个模块的大型变更 | 多模块 | 拒绝整体移植 | 可能包含个别有价值修复，但范围过大 | 按独立问题重新审计；每个问题单独分支和 PR |
| [pot-app/pot-desktop#1284](https://github.com/pot-app/pot-desktop/pull/1284) Markdown / LaTeX 结果渲染 | 结果 UI / 协议 | 等待 | 与当前 Result Schema V2 的受控结果渲染存在重叠 | 先比较语义、安全边界和兼容性；本阶段暂缓，不覆盖现有 Schema V2 |
| Windows `tauri_plugin_single_instance` 空指针 | Windows 运行时 | 等待独立复现与审计 | 影响启动稳定性，但不属于 Schema V2 回归 | 建立独立 `fix/` 或 `port/` 分支；本基础分支不升级 `Cargo.lock`、不顺手修复 |

## 记录模板

复制以下模板新增候选：

```markdown
### <候选标题>

- 上游 PR / Issue：
- 上游链接：
- 风险类别：安全 / 稳定性 / 兼容性 / 平台 / 发布 / 其他
- 影响用户：
- 原始提交 SHA：
- 原作者：
- 当前结论：待审计 / 接受 / 等待 / 拒绝 / 替代实现 / 已移植
- 审计摘要：
- 与当前 `custom/main` 的重叠：
- 依赖和权限变化：
- 验证计划与结果：
- 维护版分支：
- 维护版 PR：
- 署名保留方式：原提交 / Authorship / Co-Authored-By
- 后续动作：
```

## 台账规则

- 任何运行时代码移植前先更新本台账；
- 一个候选可以拆成多个独立记录，但不得把无关问题重新合并成大 PR；
- 上游 PR 已关闭、长期未响应或 CI 通过都不能替代维护版审计；
- 结论变化时必须记录原因、验证结果和对应维护版 PR；
- 已移植项目仍保留上游来源、原始提交和作者信息。
