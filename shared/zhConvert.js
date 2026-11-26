import zhConvertTable from './zhConvertTable.json' with { type: 'json' };

/**
 * Convert Traditional Chinese characters to Simplified Chinese using a
 * bundled 1-to-1 OpenCC TSCharacters character mapping table.
 *
 * - Traditional -> Simplified only (never Simplified -> Traditional).
 * - Leaves ASCII, LRC timestamps ([00:12.34]), and tag keys ([ti:], [ar:]) intact.
 * - Iterates by Unicode code point so surrogate pairs are preserved safely.
 *
 * @param {string} text
 * @returns {string}
 */
export function toSimplified(text) {
  if (typeof text !== 'string' || text.length === 0) {
    return typeof text === 'string' ? text : '';
  }

  let changed = false;
  let result = '';

  for (const ch of text) {
    const mapped = zhConvertTable[ch];
    if (mapped !== undefined) {
      result += mapped;
      changed = true;
    } else {
      result += ch;
    }
  }

  return changed ? result : text;
}

/**
 * Check whether the input string contains any Traditional Chinese character
 * that would be converted by `toSimplified`.
 *
 * @param {string} text
 * @returns {boolean}
 */
export function hasTraditionalChars(text) {
  if (typeof text !== 'string' || text.length === 0) return false;
  for (const ch of text) {
    if (zhConvertTable[ch] !== undefined) return true;
  }
  return false;
}

/**
 * Convert a fetched lyric payload's title/artist/content to Simplified Chinese
 * when `convertToSimplified` is enabled (default: true).
 *
 * @param {object} lyric
 * @param {{ convertToSimplified?: boolean }} [options]
 * @returns {object}
 */
export function convertLyricToSimplified(lyric, { convertToSimplified = true } = {}) {
  if (!convertToSimplified || !lyric || typeof lyric !== 'object') {
    return lyric;
  }
  return {
    ...lyric,
    title: typeof lyric.title === 'string' ? toSimplified(lyric.title) : lyric.title,
    artist: typeof lyric.artist === 'string' ? toSimplified(lyric.artist) : lyric.artist,
    content: typeof lyric.content === 'string' ? toSimplified(lyric.content) : lyric.content,
  };
}
