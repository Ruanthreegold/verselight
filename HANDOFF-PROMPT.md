# 交接提示词（复制给接手的 agent）

> 用法：把下面「---」之间的全部内容，作为新会话的第一条消息发给接手开发的 agent。

---

你接手的是一个已经完成**第一阶段开发、可正常运行**的桌面应用项目，接下来的目标是把它**做成一款可以对外销售的自有产品**。请先完整读完本文，再动手。

## 一、项目是什么

**VerseLight（词光）**：面向现场演出 / 敬拜聚会的歌词投屏控制台（Electron + React + Express/Socket.IO）。当前状态：中文界面完整、可打包、已部署在用户机器上运行。

它的代码基线来自开源项目 LyricDisplay（GPL-3.0-or-later），已经完成了改名、中文化、关闭自动更新/遥测、接入网易云与 QQ 音乐歌词源等改造。**我们现在要做的是把它产品化**：品牌、安装包、发布渠道、商业模式都由我们自己决定，但**必须遵守下面的许可证红线**。

## 二、先读这些文件（按顺序）

工作目录：`C:\Users\Administrator\Documents\deepseek-harness\default-workspace\projects\verselight`

1. `HANDOFF.md` —— 当前进度、待办、关键决策、环境坑（**最重要**）
2. `README.dev.md` —— 构建/打包/i18n/歌词源开发指南
3. `docs/TASK-search-experience.md` —— **你的第一个任务**（繁简转换 + 只看原唱），含验收标准
4. `AGENTS.md` —— 仓库开发规范（测试优先、不要起开发服务器等）
5. `docs/PROJECT_STRUCTURE.md` —— 上游架构地图

## 三、你的第一个任务

按 `docs/TASK-search-experience.md` 执行：

- **任务 A**：繁→简转换（离线映射表 + 取词/搜索/编辑器三处生效 + 开关）
- **任务 B**：「只看原唱」过滤开关

完成标准、验收清单、涉及文件都在那份文档里。做完先自测（`check:static` → 相关单测 → `build`），再打包部署到 `D:\Software\VerseLight`，提交并推送，然后向我汇报结果（附实测数据，不要只说"已完成"）。

## 四、产品化方向（第二阶段，任务 A/B 之后）

目标：让用户拿到的是一款**独立品牌的产品**，不是"某开源项目的分支"。具体要做的：

1. **品牌彻底自有**：应用名、图标、安装包名称、发布者、关于页、官网/下载页文案；移除所有指向上游的链接与文案
2. **安装包**：NSIS 安装程序（带图标、许可协议页、安装目录选择），有条件的做代码签名
3. **版本与发布**：自有的版本号体系（如从 `1.0.0` 起）、GitHub Releases（或自有下载页）承载安装包与更新说明
4. **首次启动体验**：欢迎页 / 三步引导（载入歌词 → 选择输出 → 投屏），让新用户 3 分钟内出画面
5. **授权与收费**（可选，需先与我确认模式）：激活码 / 许可证文件 / 订阅校验等；**任何授权机制都不得限制用户对 GPL 源码的再分发权利**（见下）
6. **数据与迁移**：老用户从旧目录（`%APPDATA%\LyricDisplay`）平滑迁移

## 五、许可证红线（必须遵守，不能绕）

本项目是 GPL-3.0-or-later 的衍生作品。**可以卖钱**，但：

- ✅ 允许：卖安装包、卖服务、卖支持；收费下载
- ✅ 必须：随分发提供**完整对应源码**（或 GPL 要求的书面要约）；保留原始版权声明与 `LICENSE`；衍生作品继续以 GPL-3.0-or-later 发布
- ❌ 不允许：闭源分发、把代码改成私有许可、移除原作者版权声明、用技术手段阻止用户获取/修改源码
- ⚠️ 需核实：**NDI**（Vizrt NDI AB 的商标与 SDK 有其自己的授权条款，商用分发前要确认）；当前 NDI 伴侣程序是从上游仓库 `PeterAlaks/lyricdisplay-ndi` 下载的第三方二进制，商用前要么自建、要么确认其许可允许
- ⚠️ 需核实：字体、图标、可视化预设等第三方素材的商用授权

如果我的某个要求与上述红线冲突，**先指出冲突并给替代方案**，不要默默照做。

## 六、环境与命令（本机实测可用）

```powershell
# 安装（本机没有 VS Build Tools，必须跳过原生编译）
$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
npm install --ignore-scripts

# 日常验证
npm run check:static
node --test tests/<相关测试>.test.js

# 构建 + 打包 + 部署
npm run build
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
$env:ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
$env:CSC_IDENTITY_AUTO_DISCOVERY="false"
npx electron-builder --win --dir
# 关闭客户端后覆盖
Copy-Item release/win-unpacked/resources/app.asar D:\Software\VerseLight\resources\app.asar -Force
Copy-Item release/win-unpacked/VerseLight.exe        D:\Software\VerseLight\VerseLight.exe -Force

# 推送（代理开着 / 关着两种）
git -c http.proxy=http://127.0.0.1:7897 -c https.proxy=http://127.0.0.1:7897 -c http.sslBackend=openssl push origin master
git -c http.proxy= -c https.proxy= -c http.sslBackend=schannel push origin master
```

## 七、工作方式约定

- **不要启动开发服务器**（`npm run dev` / `electron-dev`），除非我明确要求；用静态检查、构建、单测验证
- 改动**优先扩展已有测试文件**；新增行为要有测试
- 每次改完：`check:static` → 相关单测 → `build` → 打包 → 部署 → **重启程序实测** → 提交推送
- 提交信息说明"改了什么、为什么"，一次改动一个 commit
- 汇报时给**实测证据**（命令输出、搜索结果列表、截图描述），不要只给结论
- 遇到需要产品决策的点（收费模式、品牌名、发布渠道），**先给 2–3 个方案 + 建议**，等我确认再动手

## 八、我的偏好

- 中文交流，结论先行，少寒暄
- 先给方案再动手；确认后希望一次做完并部署好，不要反复确认细节
- 界面默认简体中文，面向不懂技术的现场操作人员
- 我关心：**歌词检索准不准** > 界面好不好懂 > 输出稳定/透明 > 花哨功能

现在开始：先读文件，然后告诉我你对第一个任务的理解和执行计划（不超过 15 行），我确认后你直接开工。

---