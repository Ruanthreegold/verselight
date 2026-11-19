<p align="center">
  <img src="public/logos/VerseLight%20logo.png" alt="VerseLight" width="420">
</p>

<h1 align="center">VerseLight · 词光</h1>

<p align="center"><strong>面向现场演出与敬拜聚会的实时歌词投影控制台</strong><br>
歌词排版、多屏输出、舞台提示、OBS / vMix 集成，全部在你的电脑本地运行。</p>

<p align="center">
  <strong>简体中文</strong> ·
  <a href="README.en.md">English</a>
</p>

<p align="center">
  <img alt="release" src="https://img.shields.io/badge/release-v7.0.1-2563eb?style=flat-square">
  <img alt="platform" src="https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-0f172a?style=flat-square">
  <img alt="license" src="https://img.shields.io/badge/license-GPL--3.0--or--later-16a34a?style=flat-square">
  <img alt="ui" src="https://img.shields.io/badge/UI-%E4%B8%AD%E6%96%87%20%2F%20English-0ea5e9?style=flat-square">
  <img alt="updates" src="https://img.shields.io/badge/auto--update-%E5%B7%B2%E5%85%B3%E9%97%AD-94a3b8?style=flat-square">
</p>

<p align="center">
  <a href="#下载与安装"><img alt="Windows" src="https://img.shields.io/badge/%E4%B8%8B%E8%BD%BD-Windows%20x64-0078D4?style=for-the-badge&logo=windows&logoColor=white"></a>
  <a href="#从源码构建"><img alt="Source" src="https://img.shields.io/badge/%E4%BB%8E%E6%BA%90%E7%A0%81%E6%9E%84%E5%BB%BA-macOS%20%7C%20Linux-334155?style=for-the-badge&logo=github&logoColor=white"></a>
</p>

<p align="center">
  <a href="#主要功能">主要功能</a> ·
  <a href="#快速上手">快速上手</a> ·
  <a href="#开发">开发</a> ·
  <a href="#界面语言">界面语言</a> ·
  <a href="#常见问题">常见问题</a>
</p>

---

> **关于本仓库**：这是 [LyricDisplay](https://github.com/PeterAlaks/lyric-display-app) 的个人自用分支。
> 相比上游的改动只有三处：**界面汉化（中英双语，默认中文）**、**品牌更名为 VerseLight**、**关闭自动更新**。
> 其余功能与上游 7.0.1 完全一致。代码遵循 GPL-3.0-or-later，原始版权归原作者所有。

## 主要功能

| | |
|---|---|
| **多路输出** | 2 路默认歌词输出、最多 4 路自定义输出，另有舞台显示（Stage）与计时器显示 |
| **逐路样式** | 每路输出可独立设置字体、字号、位置、过渡动画、背景、媒体与全屏样式 |
| **结构化歌单** | `.ldsong` 结构化歌曲文件，段落/分页在任何电脑上显示一致；也保留经典文本画布 |
| **多种导入** | TXT、LRC、Markdown、RTF、DOCX；歌单 `.ldset`、日程 `.ldsch` |
| **本地文件管理** | 键盘优先的文件浏览器，支持索引文件夹搜索、歌词预览、最近文件 |
| **歌词工具** | 在线歌词源（LRCLIB / 网易云音乐 / QQ 音乐 / Lyrics.ovh / OpenHymnal）、翻译分组、时间戳、自动播放、歌词视频导出 |
| **现场控制** | 演示翻页器、`Shift + 字母` 段落跳转、直播态指示灯、当前/下一行状态栏 |
| **可复用段落** | 主歌/副歌/桥段只写一次，用标记反复引用；歌单可重复同一首歌 |
| **输出署名** | 每路输出显示歌名、作者、版权、CCLI 歌曲编号与授权号 |
| **制作软件集成** | OBS 浏览器源一键创建、OBS Dock 停靠模式、vMix / Wirecast 通用 URL |
| **日程与计时** | 日程导入、手动条目、过渡动画、预计结束时间跟踪 |
| **远程控制** | 加入码保护的手机/网页控制器、歌词草稿远程审批 |
| **可选 NDI** | 需单独安装 LyricDisplay NDI 配套程序（该配套程序仍使用上游原名） |

## 下载与安装

本分支**暂不提供预编译安装包**，可按下节从源码构建，或直接使用本机已构建的 `release\win-unpacked\VerseLight.exe`。

> 构建出的程序未签名，Windows 首次运行会提示 SmartScreen，选择「更多信息 → 仍要运行」即可。

## 从源码构建

环境要求：**Node.js 22+**、npm。仅在需要重新编译原生模块时才需要平台编译工具。

```bash
git clone https://github.com/Ruanthreegold/verselight.git
cd verselight
npm install
npm run build
npm run electron-pack      # 生成安装包，输出到 release/
```

本机快速调试：

```bash
npm run electron-dev       # 同时启动 Vite(5173) 与 Electron，后端固定在 4000
```

> **没有 Visual Studio 生成工具？** `npm install` 的原生模块重编译会失败，可改用
> `npm install --ignore-scripts`（`better-sqlite3` 自带 NAPI 预编译，可直接使用）。
> 打包时从已安装的官方版本复制 `keytar.node`，并在 `package.json` 的 `build` 中设置
> `"npmRebuild": false`。

## 快速上手

1. 启动 VerseLight，载入歌词文件（TXT / LRC / DOCX…），或直接在画布中新建歌曲。
2. 配置输出 1、输出 2、Stage 或自定义输出。
3. 打开 **输出 → 预览输出** 确认效果。
4. 打开「显示输出」，点击任意歌词行即可上屏。
5. 在 OBS 中添加浏览器源：

```text
http://localhost:4000/output1
```

使用浏览器源或远程控制器期间，VerseLight 必须保持运行。打包版默认端口 `4000`，
可在 **偏好设置 → 高级** 中修改，修改后需重启应用并更新所有输出 URL。

## 开发

| 命令 | 用途 |
|---|---|
| `npm run electron-dev` | 桌面端完整开发（Vite + Electron） |
| `npm run electron-dev:headless` | OBS Dock / 无头开发 |
| `npm run dev` | 仅渲染层（Vite） |
| `npm run server` | 仅后端服务 |
| `npm run build` | 生产构建渲染层 + 写入构建信息 |
| `npm run electron-pack` | 构建并打包桌面应用 |
| `npm run check:static` | 语法、冲突标记与接口契约检查 |
| `npm run test:unit` | 单元测试 |

目录结构：

```text
main/          Electron 主进程（窗口、IPC、更新、NDI、歌词源…）
server/        Express + Socket.IO 本地后端
shared/        主进程与渲染层共享的常量/契约
src/           渲染层（React）
  i18n/        中英词表与运行时
  components/  界面组件
scripts/       构建与维护脚本（含 i18n 插件）
tests/         Node 原生测试
build/         安装器脚本与资源
public/        图标、背景、图片等静态资源
```

## 界面语言

采用**构建期替换 + 运行时查表**，源文件保持英文，便于跟随上游更新：

- `scripts/i18n-vite-plugin.js`：用 oxc 解析源码，只把「展示位」的英文字面量改写成 `__t("Save")`
  - 覆盖 JSX 文本、`placeholder`/`title`/`label`/`message` 等属性、JSX 子表达式里的三元字符串、这些键的对象值
  - **不碰**比较运算、`includes()` 参数、对象键、类名、路径、事件回调内的字符串
- `src/i18n/index.js`：运行时按当前语言查表，**查不到自动回退英文**
- `src/i18n/zh-CN.json`：英文 → 中文对照表，当前 **3,700+ 条，覆盖率约 95%**
- 语言选择保存在 `localStorage`，默认 `zh-CN`；在 **偏好设置 → 常规 → Language / 界面语言** 中切换
- 每次构建会生成 `.i18n-keys.json`（所有待翻译原文），可与字典比对找出漏译项

新增翻译：直接编辑 `src/i18n/zh-CN.json`，键为界面英文原文。

## 常见问题

**Q：界面是英文？**
在「偏好设置 → 常规 → Language / 界面语言」中切换为中文，或检查 `localStorage.verselight.locale` 是否为 `zh-CN`。

**Q：为什么没有「检查更新」了？**
这是自用分支的刻意设置：`main/updater.js` 中 `UPDATES_DISABLED = true`。需要恢复时改为 `false`，并还原 `package.json` 的 `build.publish`。

**Q：歌词搜索提示「此歌曲无法从该提供商获取」？**
优先选择来源为 **LRCLIB** 的结果（约 300 万首，中文覆盖好且带同步时间轴）；Lyrics.ovh 曲库偏英文流行，中文/现场版常见 404。

**Q：Windows 提示找不到 Visual Studio / node-gyp 失败？**
见上文「从源码构建」的预编译原生模块说明。

## 许可证与致谢

本项目遵循 [GNU General Public License v3.0 or later](LICENSE)。

- 原始项目：**LyricDisplay**，作者 Peter Alakembi，贡献者 David Okaliwe 及社区
- 本分支：**VerseLight**（个人自用汉化分支），仅做界面本地化、品牌更名与更新开关调整
- 歌词等第三方内容的权利归各自权利人所有；NDI 是 Vizrt NDI AB 的商标，本项目与其无隶属关系

第三方组件与素材署名见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。