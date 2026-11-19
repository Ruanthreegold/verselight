const { pathToFileURL } = require('url');
(async () => {
  const asar = process.argv[2];
  const mod = await import(pathToFileURL(asar + '/main/lyricsProviders/index.js').href);
  const res = await mod.searchAllProviders('周杰伦 晴天', { limit: 10, mode: 'full', skipCache: true });
  console.log('\n各源:', res.meta.providers.map(p => `${p.id}:${p.count}`).join('  '));
  for (const r of res.results.slice(0, 8)) console.log(`  ${r.provider} | ${r.artist} - ${r.title}`);
  for (const provider of ['netease', 'qqmusic']) {
    const hit = res.results.find(r => r.provider === provider);
    if (!hit) { console.log(`\n${provider}: 结果里没有`); continue; }
    const lyr = await mod.fetchLyricsByProvider(provider, hit.payload);
    console.log(`\n${provider} 取词 OK | 字数 ${lyr.content.length} | 翻译 ${lyr.metadata.hasTranslation}`);
  }
})().catch(e => { console.error('FAIL', e.message); process.exit(1); });