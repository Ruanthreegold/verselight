/**
 * Shared cover/version detection and original-only filtering for online lyrics search.
 * Used by both Electron main-process ranking (searchAlgorithm.js) and renderer UI filtering.
 */

// 中文曲库与英文曲库常见的翻唱/伴奏/演绎版本标记
const COVER_PATTERNS = [
  /翻唱/,
  /翻自/,
  /翻唱版/,
  /女声版/,
  /男声版/,
  /童声/,
  /钢琴版/,
  /吉他版/,
  /器乐版/,
  /伴奏/,
  /纯音乐/,
  /合唱版/,
  /改编版/,
  /串烧/,
  /片段/,
  /原唱\s*[:：]/,
  /现场版/,
  /抖音/,
  /cover/i,
  /instrumental/i,
  /karaoke/i,
  /ktv/i,
  /remix/i,
  /dj\s*版?/i,
];

/**
 * Determine whether a search result is likely a cover, instrumental, or derivative version.
 *
 * @param {object} item
 * @returns {boolean}
 */
export function isCoverLikeResult(item) {
  const text = `${item?.title || ''} ${item?.album || ''} ${item?.snippet || ''}`;
  if (!text.trim()) return false;
  if (item?.metadata?.instrumental) return true;
  return COVER_PATTERNS.some((pattern) => pattern.test(text));
}

/**
 * Filter a search result list to keep only likely original tracks.
 *
 * When `enabled` is true and fewer than `minResults` originals remain while covers
 * were present, automatically relaxes the filter and marks `fallbackApplied: true`
 * so the UI can show all results with an explanatory banner.
 *
 * @param {Array<object>} results
 * @param {{ enabled?: boolean, minResults?: number }} [options]
 * @returns {{ items: Array<object>, originalCount: number, fallbackApplied: boolean, filteredOutCount: number }}
 */
export function filterOriginals(results, { enabled = true, minResults = 3 } = {}) {
  const list = Array.isArray(results) ? results : [];
  if (list.length === 0) {
    return {
      items: [],
      originalCount: 0,
      fallbackApplied: false,
      filteredOutCount: 0,
    };
  }

  const originals = list.filter((item) => !isCoverLikeResult(item));
  const originalCount = originals.length;

  if (!enabled) {
    return {
      items: list,
      originalCount,
      fallbackApplied: false,
      filteredOutCount: 0,
    };
  }

  if (originalCount < minResults && list.length > originalCount) {
    return {
      items: list,
      originalCount,
      fallbackApplied: true,
      filteredOutCount: 0,
    };
  }

  return {
    items: originals,
    originalCount,
    fallbackApplied: false,
    filteredOutCount: list.length - originalCount,
  };
}
