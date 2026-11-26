# 任务说明：歌词检索体验补强（繁简转换 + 只看原唱）

> 优先级：**高**（用户明确抱怨过两次）
> 预计工时：繁简转换 4–6 小时，只看原唱 2–3 小时
> 前置阅读：[`HANDOFF.md`](../HANDOFF.md)、[`README.dev.md`](../README.dev.md)

---

## 背景

用户是简体中文用户，用 VerseLight 做现场演出投屏。当前两个具体痛点：

1. **繁体字**：LRCLIB / 部分来源返回的中文歌词多为繁体（`周杰倫`、`時間`），投屏给简体观众时观感差，用户希望"一键转简体"。
2. **翻唱太多**：搜索《晴天》会混入"女声版/钢琴版/翻唱版"。目前只做了排序层面的降权（`searchAlgorithm.js` 的 `applyOriginalPreference`），没有给用户显式开关。

---

## 任务 A：繁简转换（繁 → 简）

### 目标

- 在线取词结果**默认自动**转成简体
- 用户输入繁体搜索词时也能命中简体结果
- 编辑器里可手动对当前歌词做一次「繁→简」
- 偏好设置里可关闭自动转换（默认开）

### 实现要求

1. **不要引入 `opencc-js` 依赖**（解包 6MB）。用 OpenCC 的 `TSCharacters.txt` 离线生成一份**约 60KB 的 JSON 映射表**，提交进仓库，例如：
   - 数据：`shared/zhConvertTable.json`（`{"臺":"台","灣":"湾", ...}`）
   - 逻辑：`shared/zhConvert.js`，导出 `toSimplified(text)`
   - 生成脚本可留在 `scripts/` 便于以后更新表

2. **转换位置**（三处）：
   - `main/lyricsProviders/index.js` 的 `fetchLyricsByProvider` 出口：拿到 `content` 后按偏好转换（一处改，全来源生效）
   - `main/lyricsProviders/index.js` 的搜索入口：查询词若含繁体，额外用简体查一次（或先转再查），结果去重合并
   - 渲染层编辑器：加「繁→简」按钮，调用同一份 `toSimplified`（共享模块，渲染层可直接 import `shared/`）

3. **只做繁 → 简**，不做简 → 繁（避免误转）。

### 验收标准

- [ ] 搜索「周杰倫 晴天」能命中简体条目；取词后正文是简体
- [ ] 搜索「周杰伦 晴天」结果不变（不能把简体转坏）
- [ ] 多音/多形字不误转，至少覆盖：`乾/干`、`後/后`、`裡/里`、`著/着`、`隻/只`、`髮/发`、`鬥/斗`
- [ ] 关闭开关后，正文保持原始繁体
- [ ] 转换不改动时间戳、`[ti:]`/`[ar:]` 等标签格式
- [ ] 单测：≥20 组繁→简对照（含歌词整句），放进现有 `tests/lyrics-parsing.test.js` 或新建 `tests/zh-convert.test.js`（若新建需说明理由）
- [ ] `npm run check:static`、`npm run build` 通过

### 风险

- 映射表体积：控制在 100KB 内；不要加载整本 OpenCC 词典
- 形近字误转：只做一对一的字符映射，不做词组级替换（词组级容易把「乾隆」转成「干隆」）
- 性能：歌词通常 < 10KB，逐字符 map 足够，不需要 worker

---

## 任务 B：「只看原唱」开关

### 目标

搜索弹窗顶部加一个开关，打开时过滤掉翻唱/伴奏/版本演绎结果；关掉看全部。

### 实现要求

1. 复用已导出的 `isCoverLikeResult(item)`（`main/lyricsProviders/searchAlgorithm.js`），**不要重复写关键词表**
2. UI 位置：`src/components/OnlineLyricsSearchModal.jsx` 的结果区顶部（与来源筛选并列），用现有 `Switch` 组件
3. 默认值：**开**（用户主诉就是"翻唱太多"）
4. 持久化：`localStorage`（参考 `src/i18n/index.js` 的存储方式）
5. **兜底**：如果过滤后结果 < 3 条，自动放开过滤并在列表上方提示「只找到 N 条原唱，已显示全部结果」
6. 过滤要在**渲染前**做，并同步影响「完整结果」和「建议列表」两处

### 验收标准

- [ ] 搜「晴天 周杰伦」，开启时结果不含 `女声版` / `钢琴版` / `翻唱` / `伴奏` / `DJ版`
- [ ] 关闭开关后这些结果重新出现
- [ ] 过滤后不足 3 条时有提示且自动放开
- [ ] 切换开关不触发重新请求网络（纯前端过滤）
- [ ] 单测：给定固定结果集，断言过滤前后条数（可用纯函数 `filterOriginals(results)`）
- [ ] 刷新应用后开关状态保持

---

## 交付要求

1. 两个任务分别一个 commit（`feat(lyrics): ...`），提交信息用中文/英文均可，说明"改了什么、为什么"
2. 改完执行：`npm run check:static` → 相关单测 → `npm run build` → `npx electron-builder --win --dir`
3. 部署到 `D:\Software\VerseLight`（先关闭客户端），提醒用户重启验收
4. 推送：`git -c http.proxy= -c https.proxy= -c http.sslBackend=schannel push origin master`
5. 完成后更新 `HANDOFF.md` 的待办勾选状态

---

## 参考

- 现有排序逻辑：`main/lyricsProviders/searchAlgorithm.js` 的 `applyOriginalPreference` / `isCoverLikeResult` / `resolveTargetArtist`
- 现有译文合并：`main/lyricsProviders/translationMerge.js`（可参考其"统一在所有来源出口处理"的思路）
- 解析器的译文括号剥离：`shared/lyricsParsing/lineClassification.js` 的 `stripTranslationBrackets`