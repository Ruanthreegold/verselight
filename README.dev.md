# VerseLight 开发者说明（个人分支）

> 本文面向**接手开发的人 / agent**，说明这个分支怎么装、怎么改、怎么打包、怎么部署。
> 交接状态、待办清单和踩过的坑见 [`HANDOFF.md`](HANDOFF.md)。
> 上游架构地图见 [`docs/PROJECT_STRUCTURE.md`](docs/PROJECT_STRUCTURE.md)（仍然适用）。

---

## 1. 这是什么

VerseLight（词光）是 [LyricDisplay](https://github.com/Ruanthreegold/lyric-display-app) 的**个人二创分支**（GPL-3.0-or-later），面向现场演出 / 敬拜聚会的歌词投屏控制台。

相对上游的主要差异：

| 类别 | 差异 |
|---|---|
| 品牌 | 改名 VerseLight / 词光，新图标，中文首页 README |
| 更新 | 自动更新完全关闭（`main/updater.js` 中 `UPDATES_DISABLED = true`） |
| 遥测 | 关闭向原作者服务器的匿名统计（`main/telemetry.js` 的 `TELEMETRY_ENABLED = false`） |
| 公告 | 关闭上游公告拉取（`AppAnnouncementBridge.jsx` 的 `ANNOUNCEMENTS_ENABLED = false`） |
| 语言 | 中文优先（默认 `zh-CN`，可切 English），覆盖渲染层 + 主进程弹窗 |
| 歌词源 | 新增**网易云音乐**、**QQ 音乐**，带译文合并与原版优先排序 |
| 赞助 | 换成作者本人的支付宝收款码 |
| 输出 | 投影窗口透明化，支持 OBS / vMix 叠加 |

---

## 2. 环境与安装

### 2.1 依赖环境

- **Windows 10/11 x64**（当前只在 Windows 上构建验证过）
- **Node.js 22+**（开发机使用 v24）
- 本机**没有** Visual Studio Build Tools，因此：

```powershell
# 不要在仓库里跑裸的 npm install，会因 better-sqlite3 / keytar 的原生编译失败
$env:ELECTRON_MIRROR = "https://npmmirror.com/mirrors/electron/"
npm install --ignore-scripts
```

- `keytar.node` 需要从已安装的 LyricDisplay 拷贝（见 HANDOFF 的"坑"章节）。
- 打包时需要 electron-builder 的二进制镜像：

```powershell
$env:ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/"
$env:ELECTRON_BUILDER_BINARIES_MIRROR="https://npmmirror.com/mirrors/electron-builder-binaries/"
$env:CSC_IDENTITY_AUTO_DISCOVERY="false"
```

### 2.2 常用命令

| 命令 | 用途 |
|---|---|
| `npm run build` | 构建渲染层到 `dist/`（含 i18n 提取） |
| `npx electron-builder --win --dir` | 打免安装版到 `release/win-unpacked/` |
| `npm run check:static` | 语法 + 合并冲突标记静态检查（快，必跑） |
| `node --test tests/<name>.test.js` | 跑单个测试文件（推荐） |
| `npm run test:unit` | 全量单测（本机**跑不完**，见坑） |

> ⚠️ **不要启动开发服务器**（`npm run dev` / `electron-dev`），除非用户明确要求。验证一律用静态检查、构建、单测和非交互脚本。

### 2.3 本机构建 → 部署

```powershell
cd <repo>
npm run build
npx electron-builder --win --dir
# 先关掉正在运行的客户端，再覆盖
Copy-Item release/win-unpacked/resources/app.asar D:\Software\VerseLight\resources\app.asar -Force
Copy-Item release/win-unpacked/VerseLight.exe        D:\Software\VerseLight\VerseLight.exe -Force
```

用户实际使用的程序：`D:\Software\VerseLight\VerseLight.exe`
用户数据目录：`%APPDATA%\VerseLight`（由 `main/appIdentity.js` 的 `APP_NAME` 决定）

---

## 3. 代码地图（本分支相关部分）

```
main.js                     主进程入口、关闭确认、窗口生命周期
main/
  windows.js                窗口创建（**投影窗口透明**在这里）
  updater.js                自动更新（本分支已禁用）
  telemetry.js              匿名统计（本分支已禁用）
  appIdentity.js            APP_NAME / 产品名
  modalBridge.js            主进程 → 渲染层的通用弹窗桥
  lyricsProviders/
    index.js                provider 注册表 + searchAllProviders
    searchAlgorithm.js      打分、去重、合并、**原版优先重排**
    providerReliability.js  每个源各自的超时
    translationMerge.js     LRC 译文合并（两个中文源共用）
    providers/
      netease.js            网易云音乐
      qqmusic.js            QQ 音乐
src/
  i18n/index.js             词典 + t() + 语言切换（localStorage: verselight.locale）
  i18n/zh-CN.json           词条表（key = 英文原文，value = 中文）
  components/bridges/ElectronModalBridge.jsx   主进程弹窗文案在这里过词典
  components/SupportDevelopmentModal.jsx       赞助弹窗（支付宝码）
  pages/OutputPage.jsx      输出页底色逻辑（**透明背景在这里**）
public/
  support/alipay-qr.png     赞助收款码
  logos/netease-*.png       网易云来源图标
  logos/qqmusic-*.png       QQ 音乐来源图标
scripts/i18n-vite-plugin.js 构建期翻译注入插件
tests/*.test.js             单测（新增源要补测试）
```

---

## 4. 国际化（i18n）

### 机制

不使用运行时正则替换，而是**构建期注入**：

1. `scripts/i18n-vite-plugin.js` 用 `rolldown/parseAst` 扫描 `src/**` 的 JSX 文本、可显示属性（`title` / `placeholder` / `aria-label` 等）和部分 JSX 表达式字面量；
2. 把字面量改写成 `__t("English source")`；
3. 运行时 `__t` 查 `src/i18n/zh-CN.json`：有词条返回中文，没有则**回退英文原文**；
4. 当前语言存 `localStorage['verselight.locale']`，默认 `zh-CN`。

**只翻译"显示上下文"**——绝不能碰 `server/`、`shared/` 里参与协议/头部的字符串（历史上把 `res.setHeader('Vary', 'Origin')` 里的 `Origin` 翻成中文，直接导致后端启动崩溃）。

### 主进程弹窗

主进程发来的弹窗（关闭确认等）在渲染层由 `ElectronModalBridge.jsx` 统一过一遍 `t()`，因此**主进程不需要单独做 i18n**；只要词典里有对应英文原文即可。

### 新增词条

直接编辑 `src/i18n/zh-CN.json`：

```json
{
  "Load next song in setlist": "加载歌单中的下一首"
}
```

---

## 5. 在线歌词源开发

### Provider 接口

每个源导出 `definition`、`search`、`getLyrics`：

```js
export const definition = {
  id: 'qqmusic',
  displayName: 'QQ 音乐',
  description: '……',
  requiresKey: false,
  homepage: 'https://y.qq.com',
  supportedFeatures: { suggestions: true, search: true, lyrics: true, syncedLyrics: true },
};

export async function search(query, { limit, signal, timeoutMs, fetchImpl }) { /* → { results, errors } */ }
export async function getLyrics({ payload }, { signal, fetchImpl, timeoutMs }) { /* → { provider, title, artist, content, sourceUrl, metadata } */ }
```

`search` 返回的每条结果需要 `id / provider / title / artist / album / snippet / payload`，`payload` 是 `getLyrics` 的输入。

### 接入步骤

1. 新建 `main/lyricsProviders/providers/<id>.js`
2. `main/lyricsProviders/index.js` 里 import 并加入 `providers` 数组
3. `providerReliability.js` 加超时（`suggestions` / `full` 各一条）
4. `src/components/OnlineLyricsSearchModal/ProviderAdvancedPanel.jsx` 加 `providerLogoMap` / `providerIconMap`
5. 图标放 `public/logos/<id>-logo.png`、`<id>-icon.png`
6. 补单测 `tests/<id>-provider.test.js`（用假的 `fetchImpl`，不要打真实网络）

### 排序要点（`searchAlgorithm.js`）

- `mergeResults` 里先算分，再做「**原版优先**」调整：
  - 翻唱 / 钢琴版 / 女声版 / 伴奏 / DJ 版等关键词 → 分数 × 0.45（查询本身在找版本时不降）
  - 歌手命中 → +0.2；歌手不同 → −0.25
  - 标题精确命中 → +0.06
- 歌手识别：先看 `analyzeQuery` 的推断；推断不出时用**结果共识**——哪个歌手名出现在查询里，就当作目标歌手
- 合并时每个源保底 2 条（`minPerProvider`），避免一个高分源占满列表

### 已知接口事实

| 源 | 接口 | 备注 |
|---|---|---|
| 网易云 | `POST /api/search/get/web`、`GET /api/song/lyric` | `weapi` 加密接口需要登录（返回 `50000005`），**不要用** |
| QQ 音乐 | `GET /soso/fcgi-bin/search_for_qq_cp`、`GET /lyric/fcgi-bin/fcg_query_lyric_new.fcg` | 两个接口都必须带 `Referer: y.qq.com`；歌词加 `nobase64=1` 直接拿明文 LRC，**不需要 QRC 解密** |

---

## 6. 输出与透明通道

- `main/windows.js`：`transparent: projection`，投影窗口背景 `#00000000`
- `src/pages/OutputPage.jsx`：`hasConfiguredOutputBackground()` 判断——配置了背景（不透明度 > 0 或背景图/视频）才铺黑底，否则透明
- 同时把 `html/body` 背景置空，保证 OBS 浏览器源不出白底

> 测试"是否真透明"：把桌面壁纸换成亮的，打开输出窗口，看歌词周围是不是壁纸。

---

## 7. 测试与检查

```powershell
npm run check:static                       # 每次改完必跑
node --test tests/lyrics-search-algorithm.test.js
node --test tests/netease-provider.test.js tests/qqmusic-provider.test.js
npm run build                              # 渲染层能编译
```

已知上游遗留问题（**不是本分支引入的**）：

- `tests/windows-uninstaller.test.js` 的防火墙用例在原始上游同样失败
- `npm run test:unit` 全量在本机会卡住不结束，请分文件跑
- 新增/修改行为**优先扩展已有测试文件**，不要轻易新建文件（见 `AGENTS.md`）

---

## 8. Git

```powershell
# 仓库
git remote -v      # origin = https://github.com/Ruanthreegold/verselight.git

# 本机推送（代理开着时）
git -c http.proxy=http://127.0.0.1:7897 -c https.proxy=http://127.0.0.1:7897 -c http.sslBackend=openssl push origin master

# 代理关掉时走直连 + schannel
git -c http.proxy= -c https.proxy= -c http.sslBackend=schannel push origin master
```

`gh` CLI 已登录 `Ruanthreegold`，可以用 `gh api` 查仓库状态（它走的是 Go 的证书链，不受 git 的 schannel/openssl 问题影响）。