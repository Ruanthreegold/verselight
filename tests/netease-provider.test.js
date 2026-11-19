import test from 'node:test';
import assert from 'node:assert/strict';

import * as netease from '../main/lyricsProviders/providers/netease.js';

const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

test('netease search normalizes song fields into the shared result shape', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return jsonResponse({
      result: {
        songs: [
          {
            id: 186016,
            name: '晴天',
            artists: [{ name: '周杰伦' }],
            album: { id: 18875, name: '叶惠美' },
            duration: 269000,
          },
        ],
      },
    });
  };

  const { results, errors } = await netease.search('晴天', { limit: 5, fetchImpl });

  assert.equal(errors.length, 0);
  assert.equal(results.length, 1);
  assert.equal(calls[0].url, 'https://music.163.com/api/search/get/web');
  assert.equal(calls[0].options.method, 'POST');

  const [result] = results;
  assert.equal(result.provider, 'netease');
  assert.equal(result.id, 'netease:186016');
  assert.equal(result.title, '晴天');
  assert.equal(result.artist, '周杰伦');
  assert.equal(result.album, '叶惠美');
  assert.equal(result.payload.id, '186016');
  assert.equal(result.metadata.durationMs, 269000);
});

test('netease search reports provider error codes instead of throwing', async () => {
  const fetchImpl = async () => jsonResponse({ code: 50000005 });
  const { results, errors } = await netease.search('晴天', { fetchImpl });

  assert.equal(results.length, 0);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /50000005/);
});

test('netease getLyrics merges translations beside their original lines', async () => {
  const fetchImpl = async () => jsonResponse({
    lrc: { lyric: '[00:01.00]line one\n[00:02.00]line two' },
    tlyric: { lyric: '[00:01.00]第一行\n[00:02.00]line two' },
  });

  const lyric = await netease.getLyrics({ payload: { id: '186016', title: '晴天', artist: '周杰伦' } }, { fetchImpl });

  // 第一行有译文 → 紧跟一行括号译文；第二行译文与原文相同 → 不重复插入
  assert.equal(lyric.content, '[00:01.00]line one\n[00:01.00](第一行)\n[00:02.00]line two');
  assert.equal(lyric.metadata.hasSyncedLyrics, true);
  assert.equal(lyric.metadata.hasTranslation, true);
  assert.equal(lyric.metadata.translation, '[00:01.00]第一行\n[00:02.00]line two');
  assert.equal(lyric.title, '晴天');
  assert.match(lyric.sourceUrl, /song\?id=186016/);
});

test('netease getLyrics rejects when the provider returns no lyrics', async () => {
  const fetchImpl = async () => jsonResponse({ lrc: { lyric: '' } });

  await assert.rejects(
    () => netease.getLyrics({ payload: { id: '1' } }, { fetchImpl }),
    /没有这首歌的歌词/,
  );
});