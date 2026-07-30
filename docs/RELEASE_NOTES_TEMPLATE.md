# Pot 社区维护版 <版本>

> [!IMPORTANT]
> 这是基于 Pot 的**非官方社区维护版**，不代表官方 Pot，也不是 Manggo 的组成部分或官方继任项目。本版本继续遵循 GPL-3.0。

## 发布信息

- 版本：`<版本>`
- Tag：`<tag>`
- 发布提交：`<custom/main 精确 SHA>`
- 上一个可回滚版本：`<版本或无>`
- 上一个可回滚 SHA：`<SHA 或无>`
- 正式支持：Windows x64
- 自动更新：`已启用 / 未启用`

## 主要变更

- <变更 1>
- <变更 2>

## 下载文件

| 文件 | 用途 | SHA-256 |
| --- | --- | --- |
| `pot-community_<版本>_windows-x64-setup.exe` | Windows x64 NSIS 安装包 | `<sha256>` |
| `pot-community_<版本>_windows-x64-setup.nsis.zip` | Tauri updater bundle，仅在自动更新启用时提供 | `<sha256>` |
| `latest.json` | Tauri v1 静态更新清单，仅在自动更新启用时提供 | `<sha256>` |

下载后请核对 SHA-256。PowerShell 示例：

```powershell
Get-FileHash .\pot-community_<版本>_windows-x64-setup.exe -Algorithm SHA256
```

## 验证情况

- 设置 Schema V2：`<结果>`
- 结果 Schema V2：`<结果>`
- `pnpm build`：`<结果>`
- `cargo check --locked`：`<结果>`
- Windows x64 NSIS 构建：`<结果>`
- 安装、启动和卸载：`<结果>`
- 与官方 Pot 并存：`<结果>`
- updater 升级与错误签名拒绝：`<结果或未启用>`

## 已知问题

- Windows `tauri_plugin_single_instance` 空指针问题仍作为独立运行时问题处理，不属于本发布通道任务。
- macOS、Linux、Windows x86 和 Windows ARM64 不属于本阶段正式支持范围。
- <其他已知问题>

## 来源与反馈

- 上游项目：`https://github.com/pot-app/pot-desktop`
- 社区维护仓库：`https://github.com/elio-zwd/pot-desktop`
- 许可证：GNU GPL v3
- 本维护版问题请反馈到社区维护仓库，不要以维护版问题向官方 Pot、原作者或 Manggo 要求支持。
