import { fetchWithTimeout } from '../fetchWithTimeout.js';
import { LYRICS_PROVIDER_USER_AGENT } from '../userAgent.js';

// 网易云音乐歌词源（非官方接口，仅建议自用）。
//
// 走的是不需要登录的旧版 /api 接口：
//   POST /api/search/get/web   —— 关键词搜索单曲
//   GET  /api/song/lyric       —— 按歌曲 ID 取 LRC（含翻译/罗马音）
// 相比 weapi 加密接口更稳定：weapi 的 cloudsearch 现在会返回 code 50000005（需要登录）。

const BASE_URL = 'https://music.163.com';

const SEARCH_TYPE_SONG = '1';

const requestHeaders = () => ({
  'Content-Type': 'application/x-www-form-urlencoded',
  Accept: '*/*',
  Referer: 'https://music.163.com/',
  'User-Agent': LYRICS_PROVIDER_USER_AGENT,
  Cookie: 'os=pc; appver=8.9.70; channel=netease; osver=Microsoft-Windows-10',
});

export const definition = {
  id: 'netease',
  displayName: '网易云音乐',
  description: '中文曲库覆盖好，带同步歌词与翻译（非官方接口，仅建议自用）。',
  requiresKey: false,
  homepage: 'https://music.163.com',
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

const normalizeTrack = (song) => {
  // 新接口用 artists/album/duration，cloudsearch 用 ar/al/dt，这里都兼容
  const artistList = song?.artists || song?.ar || [];
  const artist = Array.isArray(artistList)
    ? artistList.map((item) => item?.name).filter(Boolean).join(', ')
    : '';
  const album = song?.album?.name || song?.al?.name || '';
  const durationMs = song?.duration || song?.dt || null;
  const title = song?.name || 'Untitled';
  const durationLabel = durationMs
    ? `${Math.floor(Math.round(durationMs / 1000) / 60)}:${String(Math.round(durationMs / 1000) % 60).padStart(2, '0')}`
    : '';

  return {
    id: `${definition.id}:${song?.id}`,
    provider: definition.id,
    title,
    artist: artist || 'Unknown Artist',
    album,
    snippet: album ? `${album}${durationLabel ? ` - ${durationLabel}` : ''}` : durationLabel,
    payload: {
      id: song?.id ? String(song.id) : null,
      title,
      artist,
      album,
      duration: durationMs,
    },
    metadata: {
      albumId: song?.album?.id ?? song?.al?.id ?? null,
      coverUrl: song?.album?.picUrl ?? song?.al?.picUrl ?? null,
      durationMs,
    },
  };
};

export async function search(query, { limit = 10, signal, timeoutMs = 15000, fetchImpl = fetch } = {}) {
  const trimmed = typeof query === 'string' ? query.trim() : '';
  if (!trimmed) return { results: [], errors: [] };

  try {
    const fetchFn = withTimeout(fetchImpl, timeoutMs);
    const response = await fetchFn(`${BASE_URL}/api/search/get/web`, {
      method: 'POST',
      signal,
      headers: requestHeaders(),
      body: new URLSearchParams({
        s: trimmed,
        type: SEARCH_TYPE_SONG,
        offset: '0',
        total: 'true',
        limit: String(limit),
      }).toString(),
    });

    if (!response.ok) {
      return { results: [], errors: [`网易云搜索失败（HTTP ${response.status}）`] };
    }

    const data = await response.json();
    if (data?.code && data.code !== 200) {
      return { results: [], errors: [`网易云搜索失败（code ${data.code}）`] };
    }

    const songs = data?.result?.songs;
    if (!Array.isArray(songs) || songs.length === 0) {
      return { results: [], errors: [] };
    }

    return { results: songs.slice(0, limit).map(normalizeTrack), errors: [] };
  } catch (error) {
    if (error?.name === 'AbortError') return { results: [], errors: [] };
    return { results: [], errors: [error?.message || '网易云搜索失败'] };
  }
}

export async function getLyrics({ payload }, { signal, fetchImpl = fetch, timeoutMs = 15000 } = {}) {
  const songId = payload?.id;
  if (!songId) {
    throw new Error('网易云需要歌曲 ID 才能获取歌词');
  }

  const params = new URLSearchParams({
    os: 'pc',
    id: String(songId),
    lv: '-1',
    kv: '-1',
    tv: '-1',
    rv: '-1',
  });

  const fetchFn = withTimeout(fetchImpl, timeoutMs);
  const response = await fetchFn(`${BASE_URL}/api/song/lyric?${params.toString()}`, {
    signal,
    headers: requestHeaders(),
  });

  if (!response.ok) {
    throw new Error(`网易云取词失败（HTTP ${response.status}）`);
  }

  const data = await response.json();
  const synced = typeof data?.lrc?.lyric === 'string' ? data.lrc.lyric.trim() : '';
  const translation = typeof data?.tlyric?.lyric === 'string' ? data.tlyric.lyric.trim() : '';
  const romanization = typeof data?.romalrc?.lyric === 'string' ? data.romalrc.lyric.trim() : '';

  if (!synced) {
    throw new Error('网易云没有这首歌的歌词');
  }

  return {
    provider: definition.id,
    title: payload?.title || 'Untitled',
    artist: payload?.artist || 'Unknown Artist',
    content: synced,
    sourceUrl: `https://music.163.com/#/song?id=${encodeURIComponent(songId)}`,
    credits: translation ? '含中文翻译' : null,
    metadata: {
      hasSyncedLyrics: true,
      hasTranslation: Boolean(translation),
      translation: translation || null,
      romanization: romanization || null,
      duration: payload?.duration ?? null,
    },
  };
}