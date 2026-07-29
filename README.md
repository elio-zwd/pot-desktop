<img width="200px" src="public/icon.svg" align="left"/>

# Pot 社区维护版

> [!IMPORTANT]
> 本仓库是基于 [Pot](https://github.com/pot-app/pot-desktop) 3.0.7 的**非官方社区维护版**，继续遵循 [GPL-3.0](LICENSE)。本项目不代表官方 Pot，也不是 Manggo 的组成部分或官方继任项目。

![License](https://img.shields.io/github/license/elio-zwd/pot-desktop.svg)
![Tauri](https://img.shields.io/badge/Tauri-1.6.8-blue?logo=tauri)
![Windows x64](https://img.shields.io/badge/正式支持-Windows%20x64-blue?logo=windows)
![Community maintained](https://img.shields.io/badge/维护方式-社区维护-orange)

## 当前状态

- 稳定主线：`custom/main`；
- 初期正式支持：Windows x64；
- 首个规划版本：`3.1.0-elio.1`，本仓库目前尚未发布该安装包；
- 已稳定合入插件设置 Schema V2：设置分组、密码遮罩、多行输入、条件显示和高级设置折叠；
- 已稳定合入插件结果 Schema V2：六类受控结果区块、统一复制文本、历史记录纯文本和旧版结果兼容；
- 自有更新通道完成前，官方自动更新已关闭并隔离；
- macOS 与 Linux 当前仅尽力兼容，不属于首阶段正式发布承诺。

## 项目来源与反馈边界

- 原项目与原作者来源：[pot-app/pot-desktop](https://github.com/pot-app/pot-desktop)；
- 社区维护仓库：[elio-zwd/pot-desktop](https://github.com/elio-zwd/pot-desktop)；
- 许可证：[GNU GPL v3](LICENSE)；
- 本维护版的问题请提交到本仓库，不要以维护版问题向官方 Pot、原作者或 Manggo 要求支持；
- 上游功能、文档和历史贡献继续保留来源与署名。

## 维护文档

- [维护范围](docs/MAINTENANCE_SCOPE.md)
- [发布政策](docs/RELEASE_POLICY.md)
- [上游 PR 移植政策](docs/UPSTREAM_PORT_POLICY.md)
- [上游移植台账](UPSTREAM_PORTS.md)
- [更新器审计](docs/UPDATER_AUDIT.md)
- [安全政策](SECURITY.md)

> [!CAUTION]
> 本维护仓库当前没有可供普通用户下载的自有正式安装包或自动更新通道。下方保留的原版安装、插件目录、商店和 Release 链接主要用于说明上游 Pot 的历史用法，不代表这些上游产物包含本维护版增强。

<br/>
<hr/>
<div align="center">

<h3>中文 | <a href='./README_EN.md'>English</a> | <a href='./README_KR.md'> 한글 </a></h3>

<table>
<tr>
    <td> <img src="asset/1.png">
    <td> <img src="asset/2.png">
    <td> <img src="asset/3.png">
</table>

# 目录

</div>

- [当前状态](#当前状态)
- [项目来源与反馈边界](#项目来源与反馈边界)
- [维护文档](#维护文档)
- [使用说明](#使用说明)
- [特色功能](#特色功能)
- [支持接口](#支持接口)
- [插件系统](#插件系统)
- [安装指南](#安装指南)
- [外部调用](#外部调用)
- [Wayland 支持](#wayland-支持)
- [国际化](#国际化weblate)
- [贡献者](#贡献者)
- [手动编译](#手动编译)
- [感谢](#感谢)

<div align="center">

# 使用说明

| 划词翻译                                             | 输入翻译                                                       | 外部调用                                                             |
| ---------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------- |
| 鼠标选中需要翻译的文本，按下设置的划词翻译快捷键即可 | 按下输入翻译快捷键呼出翻译窗口，输入待翻译文本后按下回车翻译 | 通过被其他软件调用实现更加方便高效的功能，详见 [外部调用](#外部调用) |
| <img src="asset/eg1.gif"/>                           | <img src="asset/eg2.gif"/>                                     | <img src="asset/eg3.gif"/>                                           |

| 剪贴板监听模式                                                         | 截图 OCR                                          | 截图翻译                                         |
| ---------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------ |
| 在任意翻译面板上点击左上角图标启动剪贴板监听，复制文字即可完成翻译 | 按下截图 OCR 快捷键后框选需要识别区域即可完成识别 | 按下截图翻译快捷键后框选需要翻译区域即可完成翻译 |
| <img src="asset/eg4.gif"/>                                             | <img src="asset/eg5.gif"/>                        | <img src="asset/eg6.gif"/>                       |

</div>

<div align="center">

# 特色功能

</div>

- [x] 多接口并行翻译（[支持接口](#支持接口)）
- [x] 多接口文字识别（[支持接口](#支持接口)）
- [x] 多接口语音合成（[支持接口](#支持接口)）
- [x] 导出到生词本（[支持接口](#支持接口)）
- [x] 外部调用（[详情](#外部调用)）
- [x] 支持插件系统（[插件系统](#插件系统)）
- [x] 上游代码支持 Windows、macOS、Linux
- [x] 上游代码支持 Wayland（曾在 KDE、Gnome 以及 Hyprland 测试）
- [x] 多语言支持

> 本维护版首阶段只正式支持 Windows x64；上述跨平台能力来自上游项目，不等于维护版已经对其他平台完成发布验收。

<div align="center">

# 支持接口

</div>

## 翻译

- [x] [OpenAI](https://platform.openai.com/)
- [x] [智谱 AI](https://www.zhipuai.cn/)
- [x] [Gemini Pro](https://gemini.google.com/)
- [x] [Ollama](https://www.ollama.com/)（离线）
- [x] [阿里翻译](https://www.aliyun.com/product/ai/alimt)
- [x] [百度翻译](https://fanyi.baidu.com/)
- [x] [彩云小译](https://fanyi.caiyunapp.com/)
- [x] [腾讯翻译君](https://fanyi.qq.com/)
- [x] [腾讯交互翻译](https://transmart.qq.com/)
- [x] [火山翻译](https://translate.volcengine.com/)
- [x] [小牛翻译](https://niutrans.com/)
- [x] [Google](https://translate.google.com)
- [x] [Bing](https://learn.microsoft.com/zh-cn/azure/cognitive-services/translator/)
- [x] [Bing 词典](https://www.bing.com/dict)
- [x] [DeepL](https://www.deepl.com/)
- [x] [有道翻译](https://ai.youdao.com/)
- [x] [剑桥词典](https://dictionary.cambridge.org/)
- [x] [Yandex](https://translate.yandex.com/)
- [x] [Lingva](https://github.com/TheDavidDelta/lingva-translate)（[插件](https://github.com/pot-app/pot-app-translate-plugin-template)）
- [x] [Tatoeba](https://tatoeba.org/)（[插件](https://github.com/pot-app/pot-app-translate-plugin-tatoeba)）
- [x] [ECDICT](https://github.com/skywind3000/ECDICT)（[插件](https://github.com/pot-app/pot-app-translate-plugin-ecdict)）

更多接口支持见 [插件系统](#插件系统)。

## 文字识别

- [x] 系统 OCR（离线）
  - [x] [Windows.Media.OCR](https://learn.microsoft.com/en-us/uwp/api/windows.media.ocr.ocrengine?view=winrt-22621) on Windows
  - [x] [Apple Vision Framework](https://developer.apple.com/documentation/vision/recognizing_text_in_images) on macOS
  - [x] [Tesseract OCR](https://github.com/tesseract-ocr) on Linux
- [x] [Tesseract.js](https://tesseract.projectnaptha.com/)（离线）
- [x] [百度](https://ai.baidu.com/tech/ocr/general)
- [x] [腾讯](https://cloud.tencent.com/product/ocr-catalog)
- [x] [火山](https://www.volcengine.com/product/OCR)
- [x] [讯飞](https://www.xfyun.cn/services/common-ocr)
- [x] [腾讯图片翻译](https://cloud.tencent.com/document/product/551/17232)
- [x] [百度图片翻译](https://fanyi-api.baidu.com/product/22)
- [x] [Simple LaTeX](https://simpletex.cn/)
- [x] [OCRSpace](https://ocr.space/)（[插件](https://github.com/pot-app/pot-app-recognize-plugin-template)）
- [x] [Rapid](https://github.com/RapidAI/RapidOcrOnnx)（离线 [插件](https://github.com/pot-app/pot-app-recognize-plugin-rapid)）
- [x] [Paddle](https://github.com/hiroi-sora/PaddleOCR-json)（离线 [插件](https://github.com/pot-app/pot-app-recognize-plugin-paddle)）

更多接口支持见 [插件系统](#插件系统)。

## 语音合成

- [x] [Lingva](https://github.com/thedaviddelta/lingva-translate)

更多接口支持见 [插件系统](#插件系统)。

## 生词本

- [x] [Anki](https://apps.ankiweb.net/)
- [x] [欧路词典](https://dict.eudic.net/)
- [x] [有道](https://www.youdao.com/)（[插件](https://github.com/pot-app/pot-app-collection-plugin-youdao)）
- [x] [扇贝](https://web.shanbay.com/web/main)（[插件](https://github.com/pot-app/pot-app-collection-plugin-shanbay)）

更多接口支持见 [插件系统](#插件系统)。

<div align="center">

# 插件系统

</div>

软件内置接口数量有限，但可以通过插件系统扩展软件功能。

## 插件安装

可以在上游 [Plugin List](https://pot-app.com/plugin.html) 查找插件，然后前往对应插件仓库下载。

Pot 插件扩展名为 `.potext`。下载后，在“偏好设置 → 服务设置 → 添加外部插件 → 安装外部插件”选择 `.potext` 文件，安装完成后加入服务列表即可使用。

### 故障排除

- **找不到指定的模块（Windows）**

  通常是系统缺少 C++ 运行库，可安装 [Microsoft Visual C++ Redistributable](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist?view=msvc-170#visual-studio-2015-2017-2019-and-2022)。

- **不是有效的 Win32 应用程序（Windows）**

  通常表示插件的系统或架构不匹配，请下载正确架构的插件。

## 插件开发

上游 [Plugin List](https://pot-app.com/plugin.html) 的模板章节提供了插件开发模板，具体开发文档请查看对应模板仓库。

<div align="center">

# 安装指南

</div>

> [!WARNING]
> 以下安装方式指向上游官方 Pot，不包含本维护版当前分支的增强。本维护版自有安装包将在后续独立发布流程完成后提供。

## Windows

### 通过 Winget 安装上游版本

```powershell
winget install Pylogmon.pot
```

### 手动安装上游版本

1. 在上游 [Release](https://github.com/pot-app/pot-desktop/releases/latest) 页面下载安装包。
2. 根据系统架构选择对应文件并安装。

### 故障排除

- 启动后没有界面、点击托盘图标没有反应：检查 WebView2 是否被卸载或禁用；必要时安装或恢复 WebView2。
- 企业版系统无法安装 WebView2 时，可参考上游带内置 WebView2 Runtime 的历史安装包。
- 仍有问题时，可尝试 Windows 7 兼容模式。

## macOS

### 通过 Brew 安装上游版本

```bash
brew tap pot-app/homebrew-tap
brew install --cask pot
brew upgrade --cask pot
```

### 手动安装上游版本

从上游 [Release](https://github.com/pot-app/pot-desktop/releases/latest) 下载对应架构的 `dmg`，将 Pot 拖入 Applications 文件夹。

### 故障排除

如果系统提示无法验证或文件损坏，可在确认来源后使用系统“隐私与安全性”中的“仍要打开”，或执行：

```bash
sudo xattr -d com.apple.quarantine /Applications/pot.app
```

若辅助功能权限反复提示，请在“设置 → 隐私与安全性 → 辅助功能”中移除 Pot 后重新添加。

## Linux

### Debian / Ubuntu

从上游 Release 下载对应架构的 `deb`：

```bash
sudo apt-get install ./pot_{version}_amd64.deb
```

### Arch / Manjaro

使用 AUR helper：

```bash
yay -S pot-translation # 或 pot-translation-bin
# paru -S pot-translation # 或 pot-translation-bin
```

使用 `archlinuxcn`：

```bash
sudo pacman -S pot-translation
```

### Flatpak

> Flatpak 上游版本可能缺失托盘图标。

<a href='https://flathub.org/apps/com.pot_app.pot'>
    <img width='240' alt='Download on Flathub' src='https://flathub.org/api/badge?locale=zh-Hans'/>
</a>

<div align="center">

# 外部调用

</div>

Pot 提供本地 HTTP 接口，可由其他软件调用。默认监听 `127.0.0.1:60828`，端口可以在设置中修改。

## API 文档

```text
POST "/" => 翻译请求体中的文本
GET "/config" => 打开设置
POST "/translate" => 翻译请求体中的文本
GET "/selection_translate" => 划词翻译
GET "/input_translate" => 输入翻译
GET "/ocr_recognize" => 截图 OCR
GET "/ocr_translate" => 截图翻译
GET "/ocr_recognize?screenshot=false" => 不使用软件内截图进行 OCR
GET "/ocr_translate?screenshot=false" => 不使用软件内截图进行翻译
GET "/ocr_recognize?screenshot=true" => 使用软件内截图进行 OCR
GET "/ocr_translate?screenshot=true" => 使用软件内截图进行翻译
```

## 示例

调用划词翻译：

```bash
curl "127.0.0.1:60828/selection_translate"
```

## 不使用软件内截图

1. 使用其他截图工具截图；
2. 将截图保存为 `$CACHE/com.pot-app.desktop/pot_screenshot_cut.png`；
3. 请求 `127.0.0.1:60828/ocr_recognize?screenshot=false` 或对应翻译接口。

Windows 示例路径：

`C:\Users\{用户名}\AppData\Local\com.pot-app.desktop\pot_screenshot_cut.png`

Linux 下使用 Flameshot：

```bash
rm ~/.cache/com.pot-app.desktop/pot_screenshot_cut.png && flameshot gui -s -p ~/.cache/com.pot-app.desktop/pot_screenshot_cut.png && curl "127.0.0.1:60828/ocr_recognize?screenshot=false"
```

## 现有外部集成

- SnipDo（Windows）：上游 Release 曾提供 `pot.pbar` 扩展；
- PopClip（macOS）：上游 Release 曾提供 `pot.popclipextz` 扩展；
- [Starry](https://github.com/ccslykx/Starry)（Linux）：需自行编译。

<div align="center">

# Wayland 支持

</div>

不同桌面环境对 Wayland 支持程度不同。Tauri 1.x 全局快捷键在 Wayland 下可能不可用，可通过系统快捷键调用本地 HTTP 接口。

如果内置截图不可用，可以使用其他截图工具并调用“不使用软件内截图”接口。

Hyprland 示例：

```conf
bind = ALT, X, exec, grim -g "$(slurp)" ~/.cache/com.pot-app.desktop/pot_screenshot_cut.png && curl "127.0.0.1:60828/ocr_recognize?screenshot=false"
bind = ALT, C, exec, grim -g "$(slurp)" ~/.cache/com.pot-app.desktop/pot_screenshot_cut.png && curl "127.0.0.1:60828/ocr_translate?screenshot=false"
```

窗口规则示例：

```conf
windowrulev2 = float, class:(pot), title:(Translator|OCR|PopClip|Screenshot Translate)
windowrulev2 = move cursor 0 0, class:(pot), title:(Translator|PopClip|Screenshot Translate)
```

<div align="center">

# 国际化（[Weblate](https://hosted.weblate.org/engage/pot-app/)）

[![](https://hosted.weblate.org/widget/pot-app/pot-desktop/svg-badge.svg)](https://hosted.weblate.org/engage/pot-app/)

[![](https://hosted.weblate.org/widget/pot-app/pot-desktop/zh_Hans/multi-auto.svg)](https://hosted.weblate.org/engage/pot-app/)

</div>

<div align="center">

# 贡献者

</div>

<img src="https://github.com/pot-app/.github/blob/master/pot-desktop-contributions.svg?raw=true" width="100%"/>

## 手动编译

### 环境要求

- Node.js >= 18.0.0
- pnpm >= 8.5.0
- Rust >= 1.80.0

维护版轻量 CI 使用 Node 21 与 pnpm 9。

### 开始编译

1. 克隆社区维护仓库：

   ```bash
   git clone https://github.com/elio-zwd/pot-desktop.git
   cd pot-desktop
   git switch custom/main
   ```

2. 安装依赖：

   ```bash
   pnpm install --frozen-lockfile
   ```

3. Linux 额外依赖：

   ```bash
   sudo apt-get install -y libgtk-3-dev libwebkit2gtk-4.0-dev libayatana-appindicator3-dev librsvg2-dev patchelf libxdo-dev libxcb1 libxrandr2 libdbus-1-3
   ```

4. 开发调试：

   ```bash
   pnpm tauri dev
   ```

5. 前端构建：

   ```bash
   pnpm build
   ```

6. 安装包构建仅用于本地验证；未经发布政策授权不得上传：

   ```bash
   pnpm tauri build
   ```

<div align="center">

# 感谢

</div>

- [Pot 原项目与贡献者](https://github.com/pot-app/pot-desktop)
- [Bob](https://github.com/ripperhe/Bob) 灵感来源
- [bob-plugin-openai-translator](https://github.com/yetone/bob-plugin-openai-translator) OpenAI 接口参考
- [@uiYzzi](https://github.com/uiYzzi) 实现思路
- [@Lichenkass](https://github.com/Lichenkass) 维护 Deepin 应用商店中的 Pot
- [Tauri](https://github.com/tauri-apps/tauri) GUI 框架
