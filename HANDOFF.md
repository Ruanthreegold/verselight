# 交接文档（HANDOFF）

> 给接手这个项目的 agent：先读这份，再读 [`README.dev.md`](README.dev.md)。
> 最后更新：2026-11-26 ｜ 对应提交：`dfefdad`

---

## 0. 一句话现状

VerseLight（LyricDisplay 的个人二创分支）已完成**改名 + 全中文界面 + 关闭自动更新/遥测 + 网易云与 QQ 音乐歌词源 + 原版优先排序 + 自有赞助页 + 透明输出**，已打包部署到用户机器，代码全部推到 `Ruanthreegold/verselight`。
下一步主要是**搜索体验补强（繁简转换、只看原唱）**和**界面易用性改造**。

---

## 1. 交付物在哪

| 东西 | 位置 |
|---|---|
| 源码仓库 | `C:\Users\Administrator\Documents\deepseek-harness\default-workspace\projects\verselight` |
| GitHub | https://github.com/Ruanthreegold/verselight （`master` = `dfefdad`） |
| 用户实际运行的程序 | `D:\Software\VerseLight\VerseLight.exe` |
| 打包产物（未入库） | `<repo>\release\win-unpacked\` |
| 用户原始安装（**不要改**） | `D:\Software\LyricDisplay\`，原始 asar 备份在 `resources\app.asar.original` |
| 用户数据 | `%APPDATA%\VerseLight`（旧数据在 `%APPDATA%\LyricDisplay`，未做迁移） |
| 上一轮汉化实验产物（历史资料） | `...\default-workspace\ld-zh\`（原版二进制补丁方案，已废弃，但 `zh.json` 词条可复用） |

> 用户的 LyricDisplay 原版必须保持原样，所有改动只在 VerseLight 目录和仓库里。

---

## 2. 已完成（按主题）

### 2.1 品牌与仓库
- 改名 **VerseLight / 词光**，`package.json`（name/productName/appId）、`main/appIdentity.js`（`APP_NAME='VerseLight'`）、图标、README
- 保留 `lyricdisplay://` 协议、保留 NDI 外部二进制名（`LyricDisplay NDI.exe`）——**刻意不改**
- 关闭自动更新：`main/updater.js` → `UPDATES_DISABLED = true`，三个入口都早退
- 关闭遥测：`main/telemetry.js` → `TELEMETRY_ENABLED = false`
- 关闭上游公告：`src/components/bridges/AppAnnouncementBridge.jsx` → `ANNOUNCEMENTS_ENABLED = false`

### 2.2 国际化
- 构建期注入方案：`scripts/i18n-vite-plugin.js` + `src/i18n/zh-CN.json`（**3828 条**）
- 默认中文，设置里可切 English，键缺失回退英文
- **主进程弹窗**（关闭确认等）在 `src/components/bridges/ElectronModalBridge.jsx` 统一过词典
- 已核实：关闭确认框显示「确认关闭 / 取消 / 关闭」

### 2.3 歌词源
- 网易云：`main/lyricsProviders/providers/netease.js`（走非加密 `/api/` 接口，`weapi` 需要登录不可用）
- QQ 音乐：`main/lyricsProviders/providers/qqmusic.js`（老搜索接口 + `nobase64=1` 明文 LRC，免 QRC 解密）
- 译文合并：`main/lyricsProviders/translationMerge.js`（解析器会去掉括号，显示纯译文）
- 排序：`searchAlgorithm.js` 里 **原版优先**（翻唱降权 ×0.45、歌手共识加权/扣分）+ **每源保底 2 条**
- 每个源都有单测：`tests/netease-provider.test.js`、`tests/qqmusic-provider.test.js`

### 2.4 赞助页
- `src/components/SupportDevelopmentModal.jsx` 改为显示用户自己的支付宝收款码（`public/support/alipay-qr.png`，收款人「阮三金」），自动弹出逻辑保留（7 天一次）
- 「关于」里的链接指向用户 GitHub，Donate 改为打开赞助弹窗

### 2.5 透明输出
- `main/windows.js`：投影窗口 `transparent: projection` + `#00000000`
- `src/pages/OutputPage.jsx`：未配置背景时输出透明；`html/body` 背景清空（OBS 浏览器源不出白底）

---

## 3. 待办（按优先级）

### 3.1 等用户确认（阻塞后续判断）
- [ ] **直接投屏模式下透明是否生效**。用户使用的是"直接投屏"，不是 NDI。已问过用途（第二屏 / OBS 捕获 / 浮在视频上）但**尚未回复**。
  - 若是 OBS 窗口捕获：BitBlt 捕获不出 alpha，需改「Windows 10 (1903+)」捕获方式或改用浏览器源
  - 若要浮在别的播放器上：还需要置顶 + 点击穿透

### 3.2 歌词检索体验（用户重点抱怨）
- [x] 原版优先排序（已做）
- [ ] **「只看原唱」开关**：搜索弹窗顶部加过滤，默认过滤带翻唱关键词的结果（`isCoverLikeResult()` 已导出可复用）
- [ ] **繁简转换（刚需）**：一键把繁体歌词转简体
  - 方案：用 OpenCC 的 T2S 表离线生成约 60KB JSON 内置（**不要**引入 6MB 的 `opencc-js` 依赖）
  - 三个生效点：取词后自动转（开关，默认开）、搜索词也转一次、编辑器里手动转换按钮
  - 只做繁→简
- [ ] 搜索框交互优化（最近搜索、按来源筛选、加载态）

### 3.3 界面易用性（用户说"不知道怎么投屏/发 NDI"）
- [ ] 顶部**输出状态条**：每路输出显示状态 + `打开窗口` / `复制 OBS 地址` / `NDI 发送`
- [ ] 空状态三步引导卡片（载入歌词 → 选择输出 → 点歌词行）
- [ ] 首次引导加"投屏"分支（现有 `FirstRunTour` 是介绍型）

### 3.4 其它已确认需求
- [ ] **歌词位置自定义**：现在只有 `upper/center/lower`（`src/components/output/LyricVisualFrame.jsx` 的 `positionJustifyMap`）；加 `lyricsPositionOffset`（±50%）滑杆，每路输出独立
- [ ] **切歌更方便**：已有快捷键 `Ctrl/Cmd+Shift+←/→`（`src/constants/shortcuts.js`）但无可见入口；加「‹ 上一首 / 当前歌名 ▾ / 下一首 ›」+ 快速列表

### 3.5 发布相关
- [ ] 打 NSIS 安装包 + GitHub Release，让 README 的下载按钮可用
- [ ] exe 内嵌图标（需要 winCodeSign/rcedit）
- [ ] `%APPDATA%\LyricDisplay` → `VerseLight` 的用户数据迁移（一次性）

---

## 4. 关键决策记录（别重复踩坑）

| 决策 | 原因 |
|---|---|
| 网易云不用 `weapi` | 加密接口现在要求登录，直接返回 `50000005`；`/api/` 非加密接口可用且无需登录 |
| QQ 用 `nobase64=1` | 返回明文 LRC，省掉 QRC(DES) 解密移植；`lyric_download.fcg` 才是加密的 |
| 翻唱降权用乘法 ×0.45 | 加减分压不住高分条目，原唱仍会被顶掉 |
| 歌手用"结果共识"推断 | 内置 1015 个艺人表里没有周杰伦等中文歌手，靠结果里出现的歌手名反推更可靠 |
| 投影窗口默认透明 | 用户明确要求透明通道；页面只在"配置了背景"时才铺黑底，保留可退回的行为 |
| 主进程弹窗在渲染层翻译 | 避免给主进程单独做一套 i18n；词典已有原文即可 |
| 赞助页本地化 | 用户提供了自己的支付宝码，且不希望流量导向上游 |

---

## 5. 环境坑（本机特有）

1. **不要裸跑 `npm install`**：没有 VS Build Tools，原生模块会编译失败。用
   `$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"; npm install --ignore-scripts`
2. **`keytar.node` 需要手动拷贝**：从 `D:\Software\LyricDisplay\resources\app.asar.unpacked\node_modules\keytar\build\Release\` 复制到仓库对应位置。
3. **Electron 二进制下载会失败**：必须设 `ELECTRON_MIRROR`。
4. **Git 推送**：代理开时用 `-c http.proxy=http://127.0.0.1:7897 ... -c http.sslBackend=openssl`；代理关了改 `-c http.proxy= -c https.proxy= -c http.sslBackend=schannel`（openssl 缺 CA 会报 "unable to get local issuer certificate"）。
5. **`npm run test:unit` 全量跑不完**（会卡住），请按文件跑。
6. **本项目 GUI 无法从会话里启动**（原版同样会立即退出），验证只能用：静态检查、构建、单测、`ELECTRON_RUN_AS_NODE=1` 跑脚本读 asar。
7. 写临时脚本后**立刻**用 `& VerseLight.exe script.cjs` 执行，偶尔会报 `MODULE_NOT_FOUND`（文件写入未落盘），加 `Start-Sleep -Milliseconds 300` 再执行。

---

## 6. 验证改动是否生效（可复制）

```powershell
# 1) 源码检查
npm run check:static

# 2) 单测（挑相关的）
node --test tests/lyrics-search-algorithm.test.js
node --test tests/netease-provider.test.js tests/qqmusic-provider.test.js

# 3) 构建
npm run build

# 4) 打包 + 确认 asar 里真的有改动
npx electron-builder --win --dir
#   用 ELECTRON_RUN_AS_NODE 读 asar 内 main/windows.js、dist/assets/*.js 检查关键字

# 5) 部署（先关掉客户端）
Copy-Item release/win-unpacked/resources/app.asar D:\Software\VerseLight\resources\app.asar -Force

# 6) 排序回归（真实网络，验证原版是否排第一）
node --test tests/lyrics-search-algorithm.test.js
```

真实搜索回归脚本可用：`mergeResults` + 三个 provider 的 `search()`，查 `不能说的秘密 周杰伦`、`晴天 周杰伦`、`孤勇者 陈奕迅`，原版应在第 1–2 位。

---

## 7. 不要做的事

- ❌ 不要启动开发服务器（`npm run dev` / `electron-dev`），除非用户明确要求
- ❌ 不要把翻译套到 `server/`、`shared/` 的协议字符串上（曾把 `Vary: Origin` 翻成中文导致后端崩溃）
- ❌ 不要改 `lyricdisplay://` 协议名、NDI 外部二进制文件名（会影响用户已有配置）
- ❌ 不要重新打开自动更新 / 遥测 / 上游公告
- ❌ 不要动 `D:\Software\LyricDisplay\`（用户原版）
- ❌ 不要把 `release/`、`node_modules/` 提交进仓库

---

## 8. 用户画像与偏好

- 中文简体用户，做**现场演出/聚会投屏**；界面默认必须中文
- 关注点排序：**歌词检索质量 > 界面直观 > 投屏透明/输出 > 自定义样式**
- 喜欢"先给方案再动手"，但确认后希望直接改完并部署（不要反复问细节）
- 每次改动后习惯：**重启程序验证**，所以部署路径固定为 `D:\Software\VerseLight`
- 对"翻唱压过原版""繁体字""找不到投屏入口"这三点明确不满，是本轮重点