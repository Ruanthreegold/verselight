import test from 'node:test';
import assert from 'node:assert/strict';

import * as qqmusic from '../main/lyricsProviders/providers/qqmusic.js';

const jsonResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

test('qqmusic search normalizes songs and keeps the song mid for lookups', async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return jsonResponse({
      code: 0,
      data: {
        song: {
          list: [
            {
              songmid: '0039MnYb0qxYhV',
              songname: '晴天',
              singer: [{ name: '周杰伦' }],
              albumname: '叶惠美',
              interval: 269,
            },
          ],
        },
      },
    });
  };

  const { results, errors } = await qqmusic.search('晴天', { limit: 5, fetchImpl });

  assert.equal(errors.length, 0);
  assert.equal(results.length, 1);
  assert.match(calls[0].url, /search_for_qq_cp/);
  assert.match(calls[0].url, /w=%E6%99%B4%E5%A4%A9/);

  const [result] = results;
  assert.equal(result.provider, 'qqmusic');
  assert.equal(result.id, 'qqmusic:0039MnYb0qxYhV');
  assert.equal(result.title, '晴天');
  assert.equal(result.artist, '周杰伦');
  assert.equal(result.payload.songmid, '0039MnYb0qxYhV');
  assert.equal(result.metadata.durationMs, 269000);
});

test('qqmusic search reports failures without throwing', async () => {
  const fetchImpl = async () => jsonResponse({ code: -1 });
  const { results, errors } = await qqmusic.search('晴天', { fetchImpl });

  assert.equal(results.length, 0);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /code -1/);
});

test('qqmusic getLyrics requests plain LRC and merges translations', async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    return jsonResponse({
      retcode: 0,
      lyric: '[00:01.00]line one\n[00:02.00]line two',
      trans: '[00:01.00]第一行',
    });
  };

  const lyric = await qqmusic.getLyrics(
    { payload: { songmid: '0039MnYb0qxYhV', title: '晴天', artist: '周杰伦' } },
    { fetchImpl },
  );

  assert.match(calls[0], /nobase64=1/);
  assert.match(calls[0], /songmid=0039MnYb0qxYhV/);
  assert.equal(lyric.content, '[00:01.00]line one\n[00:01.00](第一行)\n[00:02.00]line two');
  assert.equal(lyric.metadata.hasTranslation, true);
  assert.equal(lyric.metadata.hasSyncedLyrics, true);
  assert.match(lyric.sourceUrl, /songDetail\/0039MnYb0qxYhV/);
});

test('qqmusic getLyrics rejects when the song has no lyrics', async () => {
  const fetchImpl = async () => jsonResponse({ retcode: 0, lyric: '' });

  await assert.rejects(
    () => qqmusic.getLyrics({ payload: { songmid: 'x' } }, { fetchImpl }),
    /没有这首歌的歌词/,
  );
});