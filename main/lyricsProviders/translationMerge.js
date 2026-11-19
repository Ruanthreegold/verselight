// 歌词译文合并：把「译文 LRC」按时间轴插到原文行后面，并用括号标记。
// 应用的双语分组会把「原文 + 括号行」识别成一个译文组（解析时会去掉括号）。

const TIME_TAG = /^\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/;

/** 把 [mm:ss.xx] 归一化成整数百分秒，避免两边时间格式差异导致对不上 */
const timestampKey = (raw) => {
  const match = TIME_TAG.exec(raw || '');
  if (!match) return null;
  const fraction = (match[3] || '0').padEnd(3, '0').slice(0, 3);
  return Number(match[1]) * 6000 + Number(match[2]) * 100 + Math.round(Number(fraction) / 10);
};

/**
 * @param {string} syncedLyrics 原文 LRC
 * @param {string} translationLyrics 译文 LRC
 * @returns {string} 合并后的 LRC（译文与原文相同或缺失的行不会重复插入）
 */
export function mergeTranslationLines(syncedLyrics, translationLyrics) {
  if (!syncedLyrics || !translationLyrics) return syncedLyrics;

  const translations = new Map();
  for (const line of String(translationLyrics).split('\n')) {
    const key = timestampKey(line);
    if (key === null) continue;
    const text = line.replace(TIME_TAG, '').trim();
    if (text) translations.set(key, text);
  }
  if (translations.size === 0) return syncedLyrics;

  const merged = [];
  for (const line of String(syncedLyrics).split('\n')) {
    merged.push(line);

    const key = timestampKey(line);
    if (key === null) continue;

    const original = line.replace(TIME_TAG, '').trim();
    const translated = translations.get(key);
    if (!translated || !original || translated === original) continue;

    merged.push(`${TIME_TAG.exec(line)[0]}(${translated})`);
  }

  return merged.join('\n');
}