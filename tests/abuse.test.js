/* Abuse tests for lib/core.js. Run:  node tests/abuse.test.js   (no dependencies) */
const assert = require('assert');
const C = require('../lib/core.js');

class Mem {                       // a fake localStorage; two Saves on one Mem = two tabs
  constructor() { this.m = new Map(); }
  getItem(k) { return this.m.has(k) ? this.m.get(k) : null; }
  setItem(k, v) { this.m.set(k, String(v)); }
  removeItem(k) { this.m.delete(k); }
  get length() { return this.m.size; }
  key(i) { return Array.from(this.m.keys())[i] ?? null; }
}
const SALT = 'test-salt';
const mk = (st, extra) => C.createSave(Object.assign({ storage: st, key: 'r2lobby.save', salt: SALT, legacy: true, legacyCap: null, startGems: 0, now: () => 1000 }, extra));
let pass = 0, fail = 0;
const t = (name, fn) => { try { fn(); pass++; console.log('  ok   ' + name); } catch (e) { fail++; console.log('  FAIL ' + name + '\n       ' + (e && e.message)); } };
const tAsync = async (name, fn) => { try { await fn(); pass++; console.log('  ok   ' + name); } catch (e) { fail++; console.log('  FAIL ' + name + '\n       ' + (e && e.message)); } };

(async () => {
  console.log('sha256 / canonical');
  t('sha256 test vectors', () => {
    assert.strictEqual(C.sha256('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    assert.strictEqual(C.sha256(''), 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855');
  });
  t('canonical ignores key order', () => assert.strictEqual(C.canonical({ b: 1, a: [2, { d: 1, c: 2 }] }), C.canonical({ a: [2, { c: 2, d: 1 }], b: 1 })));

  console.log('ledger');
  t('double claim pays once', () => {
    const s = mk(new Mem());
    assert.ok(s.claim('gift:1', { gems: 10, xp: 40 }).ok);
    assert.strictEqual(s.claim('gift:1', { gems: 10, xp: 40 }).reason, 'dup');
    assert.deepStrictEqual(s.balance(), { gems: 10, xp: 40 });
  });
  t('spend needs the gems and is also once-only', () => {
    const s = mk(new Mem()); s.claim('a', { gems: 30 });
    assert.strictEqual(s.spend('buy:x', 40).reason, 'poor');
    assert.ok(s.spend('buy:x', 25).ok);
    assert.strictEqual(s.spend('buy:x', 1).reason, 'dup');
    assert.strictEqual(s.balance().gems, 5);
  });
  t('negative / huge / NaN amounts are sanitised', () => {
    const s = mk(new Mem()); s.claim('a', { gems: -50, xp: NaN }); s.claim('b', { gems: 1e12 });
    assert.strictEqual(s.balance().gems, 100000); assert.strictEqual(s.balance().xp, 0);
  });
  t('claim in two tabs at the same moment pays once', () => {
    const st = new Mem(); let armed = false, B;
    const A = mk(st, { hooks: { beforeWrite() { if (armed) { armed = false; B.claim('gift:1', { gems: 10 }); } } } });
    B = mk(st); armed = true;
    A.claim('gift:1', { gems: 10 });
    assert.strictEqual(mk(st).balance().gems, 10);
  });
  t('two tabs claiming different things keep both', () => {
    const st = new Mem(); let armed = false, B;
    const A = mk(st, { hooks: { beforeWrite() { if (armed) { armed = false; B.claim('y', { gems: 7 }); } } } });
    B = mk(st); armed = true;
    A.claim('x', { gems: 3 });
    assert.strictEqual(mk(st).balance().gems, 10);
  });
  t('a lost update is put back by reconcile()', () => {
    const st = new Mem(); const A = mk(st), B = mk(st);
    const before = st.getItem('r2lobby.save');
    A.claim('x', { gems: 5 });
    const afterX = st.getItem('r2lobby.save');
    st.setItem('r2lobby.save', before);        // another process overwrote with an old copy
    B.read();
    assert.strictEqual(mk(st).balance().gems, 0);
    A.reconcile();
    assert.strictEqual(mk(st).balance().gems, 5); assert.ok(afterX);
  });
  t('a duplicated id in a stored ledger is counted once', () => {
    const st = new Mem(); const s = mk(st); s.claim('x', { gems: 5 });
    const w = JSON.parse(st.getItem('r2lobby.save')); w.d.ledger.push(Object.assign({}, w.d.ledger[0])); w.sig = C.sha256(SALT + '|' + C.canonical(w.d));
    st.setItem('r2lobby.save', JSON.stringify(w));
    assert.strictEqual(mk(st).balance().gems, 5);
  });

  console.log('integrity');
  t('tampered save is ignored, last valid copy is restored', () => {
    const st = new Mem(); const s = mk(st); s.claim('a', { gems: 10 }); s.claim('b', { gems: 10 });
    const w = JSON.parse(st.getItem('r2lobby.save')); w.d.ledger[0].gems = 99999;
    st.setItem('r2lobby.save', JSON.stringify(w));
    const s2 = mk(st);
    assert.strictEqual(s2.balance().gems, 10); assert.strictEqual(s2.takeNotice(), 'restored');
  });
  t('save edited without breaking JSON, signature wrong', () => {
    const st = new Mem(); const s = mk(st); s.claim('a', { gems: 10 });
    st.setItem('r2lobby.save', st.getItem('r2lobby.save').replace('"gems":10', '"gems":1000'));
    assert.ok(mk(st).balance().gems <= 10);
  });
  t('tampered save AND backup: starts clean with a notice, no crash', () => {
    const st = new Mem(); const s = mk(st); s.claim('a', { gems: 10 }); s.claim('b', { gems: 10 });
    st.setItem('r2lobby.save', 'garbage'); st.setItem('r2lobby.save.bak', '{"d":{},"sig":"x"}');
    const s2 = mk(st); assert.strictEqual(s2.balance().gems, 0); assert.strictEqual(s2.takeNotice(), 'reset');
  });
  t('deleted save is restored from the backup copy', () => {
    const st = new Mem(); const s = mk(st); s.claim('a', { gems: 10 }); s.claim('b', { gems: 10 });
    st.removeItem('r2lobby.save'); assert.strictEqual(mk(st).balance().gems, 10);
  });
  t('a different salt cannot read the save (signature mismatch)', () => {
    const st = new Mem(); mk(st).claim('a', { gems: 10 });
    assert.strictEqual(mk(st, { salt: 'other' }).balance().gems, 0);
  });
  t('tampered backup code is rejected', () => {
    const a = mk(new Mem()); a.claim('a', { gems: 10 });
    const code = a.exportCode(), w = JSON.parse(Buffer.from(code, 'base64').toString('utf8'));
    w.d.ledger[0].gems = 5000;
    const bad = Buffer.from(JSON.stringify(w)).toString('base64');
    const b = mk(new Mem());
    assert.strictEqual(b.importCode(bad).ok, false); assert.strictEqual(b.balance().gems, 0);
    assert.strictEqual(b.importCode('not base64 !!').ok, false);
    assert.strictEqual(b.importCode(Buffer.from('{"x":1}').toString('base64')).ok, false);
  });
  t('valid backup code merges, never lowers the balance', () => {
    const a = mk(new Mem()); a.claim('a', { gems: 10 }); const code = a.exportCode();
    const b = mk(new Mem()); b.claim('b', { gems: 20 });
    assert.ok(b.importCode(code).ok); assert.strictEqual(b.balance().gems, 30);
    assert.ok(b.importCode(code).ok); assert.strictEqual(b.balance().gems, 30);   // idempotent
  });
  t('importing an OLD backup code (unsigned) works', () => {
    const old = { 'r2lobby:coins': '42', 'r2lobby:xp': '15' };
    const code = Buffer.from(JSON.stringify(old)).toString('base64');
    const b = mk(new Mem()); assert.ok(b.importCode(code).ok); assert.deepStrictEqual(b.balance(), { gems: 42, xp: 15 });
  });

  console.log('migration of the existing save');
  t('old keys become one legacy entry + claim markers, nothing lost', () => {
    const st = new Mem();
    st.setItem('r2lobby:coins', '85'); st.setItem('r2lobby:xp', '70');
    st.setItem('r2lobby:giftDay', JSON.stringify('2026-10-08')); st.setItem('r2lobby:passClaimed', '[1]');
    st.setItem('r2lobby:quests', JSON.stringify({ tap: { v: 5, claimed: true, day: '2026-10-08' }, facts: { v: 1, claimed: true, day: '2026-10-08' }, shop: { v: 0, claimed: false, day: '2026-10-08' }, quiz: { v: 1, claimed: false, day: '2026-10-08' } }));
    st.setItem('r2lobby:muted', 'true'); st.setItem('r2lobby:purchases', JSON.stringify({ voice: 1 }));
    const s = mk(st, { dayOfIso: () => 1, legacyQuests: [{ id: 'tap', daily: true }, { id: 'facts', daily: false }, { id: 'quiz', daily: true }] });
    assert.deepStrictEqual(s.balance(), { gems: 85, xp: 70 });
    assert.ok(s.has('legacy') && s.has('pass:1') && s.has('quest:1:tap') && s.has('quest:once:facts') && s.has('buy:voice:1'));
    assert.strictEqual(s.getPref('muted', false), true);
    assert.strictEqual(s.getProg().quiz.v, 1);
    assert.ok(st.getItem('r2lobby:coins') === '85', 'old keys are left untouched');
    assert.strictEqual(mk(st, { dayOfIso: () => 1 }).balance().gems, 85);        // second load: no double migration
  });
  t('legacyCap limits the legacy entry only', () => {
    const st = new Mem(); st.setItem('r2lobby:coins', '500'); st.setItem('r2lobby:xp', '10');
    const s = mk(st, { legacyCap: 100 }); s.claim('a', { gems: 5 });
    assert.strictEqual(s.balance().gems, 105);
  });
  t('fresh install gets the start gems once', () => {
    const st = new Mem(); assert.strictEqual(mk(st, { startGems: 20 }).balance().gems, 20); assert.strictEqual(mk(st, { startGems: 20 }).balance().gems, 20);
  });

  console.log('clock');
  const START = Date.parse('2026-10-08T00:00:00+02:00');
  const mkClock = (state, dev, extra) => {
    const c = { state, dev, mono: 0, server: null };
    c.clock = C.createClock(Object.assign({ now: () => c.dev, mono: () => c.mono, fetchServerMs: async () => c.server, startMs: START, load: () => c.state, store: s => { c.state = s; } }, extra));
    return c;
  };
  await tAsync('server time sets the day', async () => {
    const c = mkClock({}, START + 3 * C.DAY_MS + 1000); c.server = START + 3600e3;
    await c.clock.sync(); assert.strictEqual(c.clock.day(), 1);
  });
  await tAsync('device clock rolled FORWARD after a server sync: no new day', async () => {
    const c = mkClock({}, START + 1000); c.server = START + 1000; await c.clock.sync();
    c.dev = START + 4 * C.DAY_MS; c.mono = 5000;
    assert.strictEqual(c.clock.day(), 1);
  });
  await tAsync('rolled forward and reloaded OFFLINE: still no new day', async () => {
    const c = mkClock({}, START + 1000); c.server = START + 1000; await c.clock.sync(); c.clock.flush();
    const c2 = mkClock(c.state, START + 5 * C.DAY_MS); c2.server = null;            // new session, no network
    await c2.clock.sync(); assert.strictEqual(c2.clock.day(), 1);
  });
  await tAsync('rolled forward and then the server answers: back to the real day', async () => {
    const c = mkClock({}, START + 5 * C.DAY_MS); c.server = START + 2 * C.DAY_MS + 5;
    await c.clock.sync(); assert.strictEqual(c.clock.day(), 3);
  });
  await tAsync('device clock rolled BACK: the day never goes down', async () => {
    const c = mkClock({}, START + 2 * C.DAY_MS + 5); c.server = START + 2 * C.DAY_MS + 5; await c.clock.sync();
    assert.strictEqual(c.clock.day(), 3);
    c.dev = START - 10 * C.DAY_MS; c.server = null; c.mono = 9999; await c.clock.sync();
    assert.strictEqual(c.clock.day(), 3);
  });
  await tAsync('no server ever (file://): clock only moves forward', async () => {
    const c = mkClock({}, START + 2 * C.DAY_MS + 5); assert.strictEqual(c.clock.day(), 3);
    c.dev = START; assert.strictEqual(c.clock.day(), 3);
  });
  await tAsync('an old cached server answer is ignored', async () => {
    const c = mkClock({}, START + 3 * C.DAY_MS); c.server = START + 3 * C.DAY_MS; await c.clock.sync();
    c.server = START + 1000; c.mono = 10; await c.clock.sync(); assert.strictEqual(c.clock.day(), 4);
  });
  await tAsync('isUnlocked / timeUntil', async () => {
    const c = mkClock({}, START + 1000);
    assert.ok(c.clock.isUnlocked(1)); assert.ok(!c.clock.isUnlocked(2));
    assert.ok(Math.abs(c.clock.timeUntil(2) - (C.DAY_MS - 1000)) < 5); assert.strictEqual(c.clock.timeUntil(1), 0);
  });

  console.log('game rewards');
  const eco = { modeFirstClear: { gems: 60, xp: 30 }, modeRepeat: { gems: 5, xp: 0, oncePerDay: true } };
  const mkRew = (save, ck, extra) => {
    const st = { mono: 0 };
    const r = C.createRewards(Object.assign({ save, clock: ck, mono: () => st.mono, rand: Math.random, economy: () => eco,
      mode: id => ({ quiz: { minDuration: 8, unlockDay: 1 }, dodge: { minDuration: 60, unlockDay: 1 }, late: { minDuration: 0, unlockDay: 3 } })[id] || null }, extra));
    return { r, st };
  };
  await tAsync('replaying one token pays once; first clear then daily', async () => {
    const save = mk(new Mem()), c = mkClock({}, START + 1000), { r, st } = mkRew(save, c.clock);
    let tok = r.start('dodge'); st.mono = 120000;
    const a = r.finish(tok, { cleared: true, score: 500 });
    assert.deepStrictEqual([a.ok, a.kind, a.gems, a.xp], [true, 'first', 60, 30]);
    assert.strictEqual(r.finish(tok, { cleared: true }).reason, 'token');
    tok = r.start('dodge'); st.mono += 120000;
    const b = r.finish(tok, { cleared: true, score: 900 }); assert.deepStrictEqual([b.kind, b.gems], ['daily', 5]);
    tok = r.start('dodge'); st.mono += 120000;
    const d = r.finish(tok, { cleared: true }); assert.strictEqual(d.kind, 'none'); assert.strictEqual(d.gems, 0);
    assert.strictEqual(save.balance().gems, 65); assert.strictEqual(save.getMode('dodge').best, 900);
  });
  await tAsync('a run shorter than the minimum is rejected', async () => {
    const save = mk(new Mem()), c = mkClock({}, START + 1000), { r, st } = mkRew(save, c.clock);
    const tok = r.start('quiz'); st.mono = 3000;
    assert.strictEqual(r.finish(tok, { cleared: true }).reason, 'short'); assert.strictEqual(save.balance().gems, 0);
    assert.strictEqual(r.finish(tok, { cleared: true }).reason, 'token');          // the token is burnt
  });
  await tAsync('finish() without a token / with a fake token', async () => {
    const save = mk(new Mem()), c = mkClock({}, START + 1000), { r } = mkRew(save, c.clock);
    for (const bad of [undefined, null, '', 'abc', 12, {}, 'mode:dodge:first']) assert.strictEqual(r.finish(bad, { cleared: true, score: 1e9 }).ok, false);
    assert.strictEqual(save.balance().gems, 0);
  });
  await tAsync('locked day: no token, no reward', async () => {
    const save = mk(new Mem()), c = mkClock({}, START + 1000), { r } = mkRew(save, c.clock);
    assert.strictEqual(r.start('late'), null); assert.strictEqual(r.start('nope'), null);
  });
  await tAsync('a token cannot be used for another mode and the object is frozen', async () => {
    const save = mk(new Mem()), c = mkClock({}, START + 1000), { r, st } = mkRew(save, c.clock);
    assert.ok(Object.isFrozen(r)); assert.throws(() => { 'use strict'; r.finish = () => ({ ok: true }); });
    const tok = r.start('quiz'); st.mono = 20000;
    const x = r.finish(tok, { cleared: true }); assert.ok(x.ok); assert.ok(save.has('mode:quiz:first') && !save.has('mode:dodge:first'));
  });
  await tAsync('next day pays the daily bonus again', async () => {
    const save = mk(new Mem()), c = mkClock({}, START + 1000), { r, st } = mkRew(save, c.clock);
    let tok = r.start('quiz'); st.mono = 20000; r.finish(tok, { cleared: true });
    tok = r.start('quiz'); st.mono += 20000; assert.strictEqual(r.finish(tok, { cleared: true }).kind, 'daily');
    c.dev = START + C.DAY_MS + 1000; c.server = c.dev; await c.clock.sync();
    tok = r.start('quiz'); st.mono += 20000; assert.strictEqual(r.finish(tok, { cleared: true }).kind, 'daily');   // day 2 = a new daily
    tok = r.start('quiz'); st.mono += 20000; assert.strictEqual(r.finish(tok, { cleared: true }).kind, 'none');    // but only once a day
  });

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
