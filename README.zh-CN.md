# VerseLight（词光）

> 实时歌词投影控制台，用于现场演出、敬拜聚会、直播与节目制作。
>
> 本项目是 [LyricDisplay](https://github.com/PeterAlaks/lyric-display-app) 的**个人自用分支**：界面已汉化（中英双语、默认中文），并关闭了自动更新。

**版本**：7.0.1 · **许可证**：GPL-3.0-or-later

---

## 一、这个分支做了什么

| 改动 | 说明 |
|---|---|
| 品牌更名 | `LyricDisplay` → `VerseLight`（`appId: com.verselight`） |
| 中文界面 | 内置 3,500+ 条中英对照，**默认中文**，可在「偏好设置 → 常规」切换 English |
| 关闭自动更新 | `main/updater.js` 中的 `UPDATES_DISABLED` 开关；`package.json` 已移除 `build.publish`，不会生成更新元数据 |
| 数据目录隔离 | 使用 `%APPDATA%\VerseLight`、`文档\VerseLight`，与原版 `LyricDisplay` 互不影响 |
| 后续计划 | 接入 QQ 音乐 / 网易云音乐的歌词检索（仅本地自用） |

除以上改动外，功能与上游 7.0.1 保持一致。

## 二、主要功能

- **多路输出**：2 路默认歌词输出、最多 4 路自定义输出、舞台显示（Stage）、计时器显示。
- **逐路样式**：每路输出可独立设置字体、字号、位置、过渡动画、背景、媒体与全屏样式。
- **结构化歌曲编辑器**：保存为 VerseLight Song（`.ldsong`），段落与分页在任何电脑上显示一致；同时保留经典文本画布。
- **导入格式**：TXT、LRC、Markdown、RTF、DOCX；歌单 `.ldset`、日程 `.ldsch`。
- **本地文件浏览器**：键盘优先操作，支持索引文件夹的文件名/路径搜索、TXT/LRC 歌词预览、最近文件。
- **歌词工具**：在线歌词源（LRCLIB、Lyrics.ovh、OpenHymnal）、翻译分组、时间戳、搜索、自动播放、歌词视频导出。
- **现场控制**：演示翻页器与键盘优先控制、`Shift + 字母` 段落跳转、直播态指示灯、当前/下一行状态栏。
- **可复用段落**：主歌/副歌/桥段等只写一次，用标记反复引用；歌单可重复同一首歌。
- **输出署名**：每路输出可显示歌名、作者、版权、CCLI 歌曲编号与授权号。
- **OBS / vMix / Wirecast**：一键创建 OBS 浏览器源、OBS Dock 停靠模式、通用浏览器 URL。
- **日程与计时**：日程导入、手动条目、过渡、预计结束时间跟踪。
- **远程控制**：加入码保护的手机/网页控制器、歌词草稿远程审批。
- **可选 NDI 输出**：需单独安装 LyricDisplay NDI 配套程序（该配套程序仍使用原名）。
- **其它**：MIDI/OSC 控制、生产就绪检查、诊断日志。

## 三、安装与运行

当前分支**未发布安装包**，推荐从源码构建（Windows x64）：

```bash
git clone https://github.com/Ruanthreegold/verselight.git
cd verselight
npm install
npm run build
npm run electron-pack     # 生成安装包，输出到 release/
```

若只需本地开发调试：

```bash
npm run electron-dev      # 同时启动 Vite(5173) 与 Electron，后端固定在 4000
```

> ⚠️ 本机若无 Visual Studio 生成工具，`npm install` 的原生模块重编译会失败。可用
> `npm install --ignore-scripts`（`better-sqlite3` 自带 NAPI 预编译，可直接用），
> 打包时从已安装的官方版本复制 `keytar.node` 并关闭 `npmRebuild`。

安装包为自签名/未签名，Windows 首次运行会出现 SmartScreen 提示，选择「更多信息 → 仍要运行」即可。

## 四、快速上手

1. 启动 VerseLight，载入歌词文件（TXT / LRC / DOCX…），或直接在画布中新建歌曲。
2. 配置输出 1、输出 2、Stage 或自定义输出。
3. 打开 **输出 → 预览输出** 确认效果。
4. 打开「显示输出」，点击任意歌词行即可上屏。
5. 在 OBS 中添加浏览器源：

```text
http://localhost:4000/output1
```

使用浏览器源或远程控制器期间，VerseLight 必须保持运行。打包版默认端口 `4000`，可在
**偏好设置 → 高级** 中修改，修改后需重启应用并更新所有输出 URL。

## 五、开发

### 环境要求

- Node.js 22+
- npm
- 平台编译工具（仅在需要重新编译原生模块时）

### 常用命令

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

### 界面语言（i18n）机制

本项目采用**构建期替换 + 运行时查表**的方式，源文件保持英文，便于跟随上游更新：

- 构建插件：`scripts/i18n-vite-plugin.js`
  - 处理 JSX 文本、展示型属性（`placeholder`/`title`/`label`/`message`…）、JSX 子表达式里的字符串、以及这些键的对象属性值
  - 把 `"Save"` 改写为 `__t("Save")`，**不碰**比较运算、`includes()` 参数、对象键、类名、路径、事件回调内的字符串
- 运行时：`src/i18n/index.js`
  - `src/i18n/zh-CN.json` 存放英文 → 中文对照；查不到时**自动回退英文**
  - 语言保存在 `localStorage['verselight.locale']`，默认 `zh-CN`
- 覆盖率统计：每次构建会生成 `.i18n-keys.json`（所有待翻译原文），可与字典比对找出漏译项

**新增/修改翻译**：直接编辑 `src/i18n/zh-CN.json`，键为界面英文原文（空格会被归一化），值为中文。

## 六、目录结构

```text
main/          Electron 主进程（窗口、IPC、更新、NDI、歌词源…）
server/        Express + Socket.IO 本地后端
shared/        主进程与渲染层共享的常量/契约
src/           渲染层（React）
  i18n/        中英词表与运行时
  components/  界面组件
  hooks/       自定义 Hook
scripts/       构建与维护脚本（含 i18n 插件）
tests/         Node 原生测试
build/         安装器脚本与资源
public/        图标、背景、图片等静态资源
```

## 七、常见问题

**Q：界面是英文？**
检查 `localStorage.verselight.locale` 是否为 `zh-CN`，或在「偏好设置 → 常规 → Language / 界面语言」中切换。

**Q：为什么没有「检查更新」了？**
这是自用分支的刻意设置：`main/updater.js` 里 `UPDATES_DISABLED = true`。需要恢复时改为 `false` 并还原 `package.json` 的 `build.publish`。

**Q：歌词搜索提示「此歌曲无法从该提供商获取」？**
优先选择来源为 **LRCLIB** 的结果（约 300 万首，中文覆盖好且带同步时间轴）；Lyrics.ovh 曲库偏英文流行，中文/现场版常见 404。

**Q：Windows 提示找不到 Visual Studio / node-gyp 失败？**
见上文「安装与运行」中的说明，使用预编译原生模块即可，不需要编译环境。

## 八、许可证与致谢

本项目遵循 [GNU General Public License v3.0 or later](LICENSE)，与上游一致。

- 原始项目：**LyricDisplay**，作者 Peter Alakembi，贡献者 David Okaliwe 及社区
- 本分支：VerseLight（个人自用汉化分支），仅做界面本地化与更新开关调整
- 歌词等第三方内容的权利归各自权利人所有；NDI 是 Vizrt NDI AB 的商标，本项目与其无隶属关系

第三方组件与素材署名见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。