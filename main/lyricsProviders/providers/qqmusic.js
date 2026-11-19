import { fetchWithTimeout } from '../fetchWithTimeout.js';
import { LYRICS_PROVIDER_USER_AGENT } from '../userAgent.js';
import { mergeTranslationLines } from '../translationMerge.js';

// QQ 音乐歌词源（非官方接口，仅建议自用）。
//
// 两个接口都不需要签名：
//   GET /soso/fcgi-bin/search_for_qq_cp        —— 关键词搜索
//   GET /lyric/fcgi-bin/fcg_query_lyric_new.fcg —— 歌词，nobase64=1 时直接返回明文 LRC
// 两个接口都要求 Referer 为 y.qq.com 域名，否则返回空。

const SEARCH_URL = 'https://c.y.qq.com/soso/fcgi-bin/search_for_qq_cp';
const LYRIC_URL = 'https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg';

const COMMON_PARAMS = {
  format: 'json',
  g_tk: '5381',
  loginUin: '0',
  hostUin: '0',
  inCharset: 'utf8',
  outCharset: 'utf-8',
  notice: '0',
  platform: 'yqq',
  needNewCode: '0',
};

export const definition = {
  id: 'qqmusic',
  displayName: 'QQ 音乐',
  description: '华语曲库全、原版资源多，歌词为 LRC 明文（非官方接口，仅建议自用）。',
  requiresKey: false,
  homepage: 'https://y.qq.com',
  supportedFeatures: {
    suggestions: true,
    search: true,
    lyrics: true,
    syncedLyrics: true,
  },
};

const withTimeout = (fetchImpl, timeoutMs) => (
  fetchImpl === fetch
    ? (url, options) => fetchWithTimeout(url, options, timeoutMs + 1500)
    : fetchImpl
);

const formatDuration = (seconds) => {
  if (!seconds || typeof seconds !== 'number') return '';
  const total = Math.round(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
};

const normalizeTrack = (song) => {
  const artists = Array.isArray(song?.singer)
    ? song.singer.map((item) => item?.name).filter(Boolean).join(', ')
    : '';
  const title = song?.songname || song?.title || 'Untitled';
  const album = song?.albumname || '';
  const durationLabel = formatDuration(song?.interval);

  return {
    id: `${definition.id}:${song?.songmid}`,
    provider: definition.id,
    title,
    artist: artists || 'Unknown Artist',
    album,
    snippet: album ? `${album}${durationLabel ? ` - ${durationLabel}` : ''}` : durationLabel,
    payload: {
      songmid: song?.songmid || null,
      title,
      artist: artists,
      album,
      duration: typeof song?.interval === 'number' ? song.interval * 1000 : null,
    },
    metadata: {
      albumMid: song?.albummid ?? null,
      durationMs: typeof song?.interval === 'number' ? song.interval * 1000 : null,
    },
  };
};

export async function search(query, { limit = 10, signal, timeoutMs = 15000, fetchImpl = fetch } = {}) {
  const trimmed = typeof query === 'string' ? query.trim() : '';
  if (!trimmed) return { results: [], errors: [] };

  try {
    const params = new URLSearchParams({
      ...COMMON_PARAMS,
      w: trimmed,
      n: String(limit),
      p: '1',
    });

    const fetchFn = withTimeout(fetchImpl, timeoutMs);
    const response = await fetchFn(`${SEARCH_URL}?${params.toString()}`, {
      signal,
      headers: {
        Referer: 'https://y.qq.com/',
        'User-Agent': LYRICS_PROVIDER_USER_AGENT,
      },
    });

    if (!response.ok) {
      return { results: [], errors: [`QQ 音乐搜索失败（HTTP ${response.status}）`] };
    }

    const data = await response.json();
    if (data?.code && data.code !== 0) {
      return { results: [], errors: [`QQ 音乐搜索失败（code ${data.code}）`] };
    }

    const songs = data?.data?.song?.list;
    if (!Array.isArray(songs) || songs.length === 0) {
      return { results: [], errors: [] };
    }

    return { results: songs.slice(0, limit).map(normalizeTrack), errors: [] };
  } catch (error) {
    if (error?.name === 'AbortError') return { results: [], errors: [] };
    return { results: [], errors: [error?.message || 'QQ 音乐搜索失败'] };
  }
}

export async function getLyrics({ payload }, { signal, fetchImpl = fetch, timeoutMs = 15000 } = {}) {
  const songmid = payload?.songmid;
  if (!songmid) {
    throw new Error('QQ 音乐需要歌曲 mid 才能获取歌词');
  }

  const params = new URLSearchParams({
    ...COMMON_PARAMS,
    nobase64: '1',
    songmid,
  });

  const fetchFn = withTimeout(fetchImpl, timeoutMs);
  const response = await fetchFn(`${LYRIC_URL}?${params.toString()}`, {
    signal,
    headers: {
      Referer: 'https://y.qq.com/portal/player.html',
      'User-Agent': LYRICS_PROVIDER_USER_AGENT,
    },
  });

  if (!response.ok) {
    throw new Error(`QQ 音乐取词失败（HTTP ${response.status}）`);
  }

  const data = await response.json();
  if (data?.retcode && data.retcode !== 0) {
    throw new Error(`QQ 音乐取词失败（code ${data.retcode}）`);
  }

  const lyric = typeof data?.lyric === 'string' ? data.lyric.trim() : '';
  const translation = typeof data?.trans === 'string' ? data.trans.trim() : '';

  if (!lyric) {
    throw new Error('QQ 音乐没有这首歌的歌词');
  }

  return {
    provider: definition.id,
    title: payload?.title || 'Untitled',
    artist: payload?.artist || 'Unknown Artist',
    content: mergeTranslationLines(lyric, translation),
    sourceUrl: `https://y.qq.com/n/ryqq/songDetail/${encodeURIComponent(songmid)}`,
    credits: null,
    metadata: {
      hasSyncedLyrics: /\[\d{1,2}:\d{2}/.test(lyric),
      hasTranslation: Boolean(translation),
      translation: translation || null,
      duration: payload?.duration ?? null,
    },
  };
}