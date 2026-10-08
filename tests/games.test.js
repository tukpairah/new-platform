/* Game registry + reward flow + lazy loading. Run from the project folder:  node tests/games.test.js */
const assert = require('assert'), fs = require('fs'), vm = require('vm');
const Core = require('../lib/core.js');
let pass = 0, fail = 0;
const t = async (n, f) => { try { await f(); pass++; console.log('  ok   ' + n); } catch (e) { fail++; console.log('  FAIL ' + n + '\n       ' + e.message); } };
const reg = {}; const R = { register(k, v) { reg[k] = v; } };
vm.runInContext('0', vm.createContext({}));
new Function('R2', fs.readFileSync('content/games.js', 'utf8'))(R);
new Function('R2', fs.readFileSync('content/economy.js', 'utf8'))(R);
const list = reg.games.list, eco = reg.economy;

(async () => {
  console.log('registry');
  await t('exactly the 10 modes, unique ids, in the planned order of days', () => {
    assert.strictEqual(list.length, 10); assert.strictEqual(new Set(list.map(m => m.id)).size, 10);
    assert.deepStrictEqual(list.map(m => m.id + ':' + m.unlockDay + ':' + m.difficulty).sort(), ['cipher:7:hard', 'dodge:1:hard', 'echo:6:medium', 'memory:2:easy', 'mot:3:medium', 'nonogram:5:hard', 'quiz:1:easy', 'sliding:4:easy', 'sweeper:4:medium', 'tower:6:hard']);
  });
  await t('every entry is valid (days 1-7, difficulty, minSeconds, music is a list)', () => list.forEach(m => {
    assert.ok(/^[a-z][a-z0-9]*$/.test(m.id) && m.name && Number.isInteger(m.unlockDay) && m.unlockDay >= 1 && m.unlockDay <= 7, m.id);
    assert.ok(['easy', 'medium', 'hard'].includes(m.difficulty), m.id); assert.ok(m.minSeconds >= 1, m.id); assert.ok(Array.isArray(m.music), m.id);
  }));
  await t('every mode has its code file (or is marked coming soon by having none); content files exist when named', () => list.forEach(m => {
    if (m.file) assert.ok(fs.existsSync(m.file), 'missing ' + m.file);
    if (m.contentFile) assert.ok(fs.existsSync(m.contentFile), 'missing ' + m.contentFile);
    if (m.file) assert.ok(new RegExp('id:\\s*["\']' + m.id + '["\']').test(fs.readFileSync(m.file, 'utf8')), m.file + ' does not register ' + m.id);
  }));
  await t('the first-clear rewards are shares of the daily budget: every unlock day adds up to exactly 55 Gems and 30 XP, in multiples of 5', () => {
    const r = Core.budgetRewards(list, eco), days = {}; list.forEach(m => { const d = days[m.unlockDay] = days[m.unlockDay] || { g: 0, x: 0 }; d.g += r[m.id].gems; d.x += r[m.id].xp; assert.ok(r[m.id].gems % 5 === 0 && r[m.id].xp % 5 === 0 && r[m.id].gems >= 5, m.id); });
    Object.keys(days).forEach(d => assert.deepStrictEqual(days[d], { g: 55, x: 30 }, 'day ' + d));
    assert.deepStrictEqual([r.quiz.gems, r.dodge.gems, r.memory.gems, r.sliding.gems, r.sweeper.gems, r.tower.gems, r.echo.gems], [20, 35, 55, 20, 35, 30, 25]); assert.ok(r.dodge.gems > r.quiz.gems && r.sweeper.gems > r.sliding.gems && r.tower.gems > r.echo.gems, 'harder modes get more');
    assert.deepStrictEqual(eco.modeRepeat, { gems: 5, xp: 0, oncePerDayPerMode: true, dailyCap: 10 }); assert.ok(!('modeFirstClear' in eco), 'the old per-difficulty rewards are gone');
    assert.deepStrictEqual([eco.pass.xpPerStep, ...eco.pass.gems], [60, 20, 20, 20, 20, 20, 20, 20]);
  });

  console.log('rewards');
  class Mem { constructor() { this.m = new Map(); } getItem(k) { return this.m.has(k) ? this.m.get(k) : null; } setItem(k, v) { this.m.set(k, String(v)); } removeItem(k) { this.m.delete(k); } get length() { return this.m.size; } key(i) { return [...this.m.keys()][i] ?? null; } }
  const START = Date.parse('2026-10-08T00:00:00+02:00');
  const mk = (day) => {
    const save = Core.createSave({ storage: new Mem(), key: 'k', salt: 's', legacy: false, now: () => 1000 });
    const st = { mono: 0, day };
    const clock = { day: () => st.day, isUnlocked: n => st.day >= n };
    const rew = Core.createRewards({ save, clock, mono: () => st.mono, rand: Math.random, economy: () => eco, onClear() {},
      mode: id => { const m = list.find(x => x.id === id); return m ? { minDuration: m.minSeconds, unlockDay: m.unlockDay, difficulty: m.difficulty, rewards: { first: (m.rewards && m.rewards.first) || Core.budgetRewards(list, eco)[m.id], repeat: m.rewards && m.rewards.repeat } } : null; } });
    return { save, st, rew };
  };
  await t('first clear pays the mode\'s share of the day budget, once; repeats pay 5 Gems per mode per day and 10 Gems at most per day', () => {
    const { save, st, rew } = mk(7);
    const play = (id, secs) => { const tk = rew.start(id); st.mono += secs * 1000; return rew.finish(tk, { cleared: true, score: 100, stars: 3 }); };
    let r = play('quiz', 10); assert.deepStrictEqual([r.kind, r.gems, r.xp], ['first', 20, 10]);
    r = play('mot', 40); assert.deepStrictEqual([r.kind, r.gems, r.xp], ['first', 55, 30]);
    r = play('dodge', 70); assert.deepStrictEqual([r.kind, r.gems, r.xp], ['first', 35, 20]);
    r = play('quiz', 10); assert.deepStrictEqual([r.kind, r.gems], ['daily', 5]);
    r = play('quiz', 10); assert.strictEqual(r.kind, 'none', 'once per mode per day');
    r = play('mot', 40); assert.deepStrictEqual([r.kind, r.gems], ['daily', 5]);
    r = play('dodge', 70); assert.strictEqual(r.kind, 'none', 'the daily cap of 10 repeat Gems is used up');
    assert.strictEqual(save.balance().gems, 20 + 55 + 35 + 5 + 5);
  });
  await t('stars are saved (best only) and never pay Gems', () => {
    const { save, st, rew } = mk(7);
    let tk = rew.start('quiz'); st.mono += 20000; rew.finish(tk, { cleared: true, score: 10, stars: 1 });
    const g = save.balance().gems;
    tk = rew.start('quiz'); st.mono += 20000; const r = rew.finish(tk, { cleared: true, score: 5, stars: 3 });
    assert.strictEqual(r.stars, 3); assert.strictEqual(save.getMode('quiz').stars, 3); assert.strictEqual(save.getMode('quiz').best, 10);
    tk = rew.start('quiz'); st.mono += 20000; rew.finish(tk, { cleared: true, stars: 1 }); assert.strictEqual(save.getMode('quiz').stars, 3);
    assert.strictEqual(save.balance().gems - g, 5, 'only the 5-Gem daily repeat, nothing for stars');
  });
  await t('minimum run time per mode is enforced; the token is burnt', () => {
    const { save, st, rew } = mk(7); const tk = rew.start('nonogram'); st.mono = 30000;
    assert.strictEqual(rew.finish(tk, { cleared: true }).reason, 'short'); assert.strictEqual(rew.finish(tk, { cleared: true }).reason, 'token'); assert.strictEqual(save.balance().gems, 0);
  });
  await t('a locked mode gives no token; a made-up mode gives none; no token = no reward', () => {
    const { rew } = mk(1); assert.strictEqual(rew.start('memory'), null); assert.strictEqual(rew.start('cipher'), null); assert.strictEqual(rew.start('nope'), null);
    assert.strictEqual(rew.finish(undefined, { cleared: true }).ok, false); assert.strictEqual(rew.finish('x'.repeat(8), { cleared: true }).ok, false);
  });
  await t('a per-mode reward override from the registry is honoured', () => {
    const { st, rew } = mk(7); const save2 = mk(7);
    const custom = Core.createRewards({ save: save2.save, clock: { day: () => 7, isUnlocked: () => true }, mono: () => save2.st.mono, rand: Math.random, economy: () => eco, onClear() {},
      mode: () => ({ minDuration: 1, unlockDay: 1, difficulty: 'easy', rewards: { first: { gems: 45, xp: 25 } } }) });
    const tk = custom.start('quiz'); save2.st.mono += 5000; const r = custom.finish(tk, { cleared: true }); assert.deepStrictEqual([r.gems, r.xp], [45, 25]);
  });

  console.log('lazy loading');
  const loads = [];
  function boot(day) {
    const ls = new Map(), seen = [];
    const sb = { console, Math, Date, Map, Set, JSON, URLSearchParams, TextEncoder, btoa, atob, unescape, escape, encodeURIComponent, decodeURIComponent, Uint32Array, Promise,
      localStorage: { getItem: k => ls.has(k) ? ls.get(k) : null, setItem: (k, v) => ls.set(k, String(v)), removeItem: k => ls.delete(k), get length() { return ls.size }, key: i => [...ls.keys()][i] ?? null },
      location: { search: '?dev=k&day=' + day, protocol: 'file:', origin: 'null', pathname: '/' }, navigator: {}, performance: { now: () => Date.now() }, setInterval() {}, setTimeout, clearTimeout, addEventListener() {}, Sfx: { bind() {}, level: () => 1, onLevel() {}, play() {}, loadCustom() {} } };
    sb.document = { addEventListener() {}, hidden: false, head: { appendChild(el) { seen.push(el.src); setTimeout(() => { if (fs.existsSync(el.src)) { vm.runInContext(fs.readFileSync(el.src, 'utf8'), sb); el.onload(); } else el.onerror(); }, 0); } }, createElement: () => ({ remove() {} }) };
    sb.window = sb; vm.createContext(sb);
    for (const f of ['config.js', 'lib/registry.js', 'content/settings.js', 'content/economy.js', 'content/shop.js', 'content/games.js', 'lib/core.js']) vm.runInContext(fs.readFileSync(f, 'utf8').replace(/devKey:\s*"[^"]*"/, 'devKey: "k"'), sb);
    vm.runInContext(fs.readFileSync('common.js', 'utf8') + ';globalThis.__R2=R2', sb);
    return { R2: sb.__R2, seen };
  }
  await t('on day 1 only the day-1 modes can be loaded; nothing of day 2+ is fetched', async () => {
    const { R2, seen } = boot(1); await new Promise(r => setTimeout(r, 20));
    const res = {}; for (const m of R2.games.list()) res[m.id] = (await R2.games.load(m.id)).reason || 'ok';
    assert.strictEqual(res.quiz, 'ok'); assert.strictEqual(res.dodge, 'ok');
    ['memory', 'mot', 'sliding', 'sweeper', 'nonogram', 'tower', 'echo', 'cipher'].forEach(id => assert.strictEqual(res[id], 'locked', id));
    assert.ok(!seen.some(f => /memory|mot|sliding|sweeper|nonogram|tower|echo|cipher/.test(f)), seen.join());
    assert.ok(seen.includes('games/quiz.js') && seen.includes('games/dodge.js'));
  });
  await t('on day 4 the stubs of days 2-4 load, later ones do not; a stub opens as "ok" (it shows Coming soon itself)', async () => {
    const { R2, seen } = boot(4); await new Promise(r => setTimeout(r, 20));
    for (const id of ['memory', 'mot', 'sliding', 'sweeper']) { const r = await R2.games.load(id); assert.ok(r.ok, id); assert.ok(seen.includes('games/' + id + '.js') && seen.includes('content/games/' + id + '.js'), id); }
    for (const id of ['nonogram', 'tower', 'echo', 'cipher']) { assert.strictEqual((await R2.games.load(id)).reason, 'locked'); assert.ok(!seen.some(f => f.includes(id)), id); }
  });
  await t('a mode\'s content file really reaches its config (cfg.howTo from content/games/memory.js)', async () => {
    const { R2 } = boot(4); await new Promise(r => setTimeout(r, 20)); const r = await R2.games.load('memory');
    assert.ok(r.ok && r.cfg.howTo && /paires/.test(r.cfg.howTo.goal), 'howTo missing: ' + JSON.stringify(r.cfg.howTo));
    const c = await R2.games.load('quiz'); assert.ok(c.cfg.howTo && c.cfg.howTo.steps.length >= 2, 'quiz how-to missing');
  });
  console.log('admin server');
  const http = require('http'), admin = require('../tools/admin.js');
  const hadBackups = fs.existsSync('.admin-backups');
  await new Promise(r => admin.server.listen(0, '127.0.0.1', r));
  const port = admin.server.address().port;
  const call = (method, p, body, headers) => new Promise((res, rej) => { const rq = http.request({ host: '127.0.0.1', port, method, path: p, headers: Object.assign({ Host: '127.0.0.1:' + port }, headers || {}) }, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => res({ code: r.statusCode, body: d })); }); rq.on('error', rej); if (body) rq.write(body); rq.end(); });
  await t('lists every mode with files, schema and music', async () => { const r = await call('GET', '/api/games'); const j = JSON.parse(r.body); assert.strictEqual(r.code, 200); assert.strictEqual(j.modes.length, 10); assert.ok(j.modes.every(m => m.codeExists)); assert.strictEqual(typeof j.devKey, 'string'); assert.ok(j.modes.every(m => m.schemaInfo.schema.some(f => f.key === 'howTo.goal')), 'every mode has the how-to fields'); });
  await t('blocks path traversal, other folders, bad extensions, foreign hosts and foreign origins', async () => {
    assert.strictEqual((await call('POST', '/api/upload?path=' + encodeURIComponent('audio/games/memory/../../../config.js'), 'x')).code, 400);
    assert.strictEqual((await call('POST', '/api/upload?path=' + encodeURIComponent('audio/games/memory/evil.html'), 'x')).code, 403);
    assert.strictEqual((await call('POST', '/api/upload?path=' + encodeURIComponent('lib/core.js'), 'x')).code, 400);
    assert.strictEqual((await call('DELETE', '/api/file?path=' + encodeURIComponent('config.js'))).code, 403);
    assert.strictEqual((await call('GET', '/tools/admin.js')).code, 403); assert.strictEqual((await call('GET', '/..%2f..%2fetc/passwd')).code >= 400, true);
    assert.strictEqual((await call('GET', '/api/games', null, { Host: 'evil.example.com' })).code, 403);
    assert.strictEqual((await call('POST', '/api/games/registry', '{}', { Origin: 'http://evil.example.com' })).code, 403);
  });
  await t('saving the registry and a mode content keeps the hand-editable format (round trip, then restored)', async () => {
    const before = fs.readFileSync('content/games.js', 'utf8'), c0 = fs.readFileSync('content/games/memory.js', 'utf8'), reg0 = admin.registry();
    try {
      assert.strictEqual((await call('POST', '/api/games/registry', JSON.stringify(reg0))).code, 200);
      assert.strictEqual(JSON.stringify(admin.registry()), JSON.stringify(reg0)); assert.ok(fs.readFileSync('content/games.js', 'utf8').startsWith('/* The registry of game modes'));
      assert.strictEqual((await call('POST', '/api/games/content/memory', JSON.stringify({ photos: ['img/a.jpg'] }))).code, 200);
      assert.strictEqual(JSON.stringify(admin.gameContent('memory')), JSON.stringify({ photos: ['img/a.jpg'] }));
    } finally { fs.writeFileSync('content/games.js', before); fs.writeFileSync('content/games/memory.js', c0); }
    assert.ok(fs.readdirSync('.admin-backups').length >= 2, 'overwritten files are backed up');
  });
  await t('the preview route forces everything open in its own save, opens the mode and reloads on changes', async () => {
    const r = await call('GET', '/preview?mode=memory'); assert.strictEqual(r.code, 200);
    assert.ok(r.body.includes('dev=preview&day=7&mode=memory') && r.body.includes('CONFIG.devKey = "preview"') && r.body.includes('Shell.launch("memory")') && r.body.includes('/api/mtimes') && r.body.includes('games/memory.js'));
    assert.strictEqual((await call('GET', '/preview?mode=../x')).code, 400);
    const m = JSON.parse((await call('GET', '/api/mtimes?paths=games/memory.js,nope.js')).body); assert.ok(m['games/memory.js'] > 0 && m['nope.js'] === 0);
    assert.ok(!fs.readFileSync('index.html', 'utf8').includes('preview'), 'the real site has no preview code');
  });
  admin.server.close(); if (!hadBackups) fs.rmSync('.admin-backups', { recursive: true, force: true });
  console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
})();
