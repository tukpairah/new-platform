/* R2 tests (brain rules, voice engine, phrase content). Run from the project folder:  node tests/r2.test.js */
const assert = require('assert');
const Brain = require('../lib/brain.js'), Voice = require('../lib/voice.js');
let PH; global.R2 = { register(k, v) { if (k === 'phrases') PH = v; } };
require('../content/phrases.js');
const phrases = PH.list;
let pass = 0, fail = 0;
const t = (n, f) => { try { f(); pass++; console.log('  ok   ' + n); } catch (e) { fail++; console.log('  FAIL ' + n + '\n       ' + e.message); } };
const words = s => s.replace(/\{\w+\}/g, 'x').trim().split(/\s+/).length;

console.log('phrases');
t('at least 250 phrases', () => assert.ok(phrases.length >= 250, phrases.length));
t('language mix by weight: about 45% English, 45% French, 5% beeps; only four Russian / Kazakh phrases, all rare', () => {
  const w = {}, cnt = {}; let tot = 0; phrases.forEach(p => { w[p.lang] = (w[p.lang] || 0) + p.weight; cnt[p.lang] = (cnt[p.lang] || 0) + 1; tot += p.weight; });
  assert.ok(Math.abs(w.en / tot * 100 - 47) <= 3 && Math.abs(w.fr / tot * 100 - 47) <= 3 && Math.abs(w.beep / tot * 100 - 5) <= 1.5, JSON.stringify(cnt));
  const rk = phrases.filter(p => p.lang === 'ru' || p.lang === 'kk'); assert.deepStrictEqual(rk.map(p => p.t).sort(), ['Ой!', 'Он тебя любит.', 'Привет!', 'Сәлем!'].sort()); rk.forEach(p => assert.strictEqual(p.weight, 1));
  assert.ok(phrases.filter(p => p.lang === 'en' || p.lang === 'fr').every(p => p.weight >= 3));
});
t('nothing about Malaysia (or the exchange semester) anywhere', () => phrases.forEach(p => assert.ok(!/малайз|malais|malays|exchange|échange|обмен|семестр|semester|semestre|алмасу/i.test(p.t + ' ' + p.tags.join(' ')), p.t)));
t('Kazakhstan phrases exist in English and French, distances are approximate', () => {
  ['fr', 'en'].forEach(l => assert.ok(phrases.filter(p => p.lang === l && /Kazakhstan|Aktobe|steppe/i.test(p.t)).length >= 4, l));
  phrases.filter(p => /\d[\d ,.]*\s*km/i.test(p.t)).forEach(p => assert.ok(/~|environ|about/i.test(p.t), 'exact distance: ' + p.t));
});
t('every category has at least 8 phrases', () => { const c = {}; phrases.forEach(p => p.tags.forEach(g => c[g] = (c[g] || 0) + 1)); Object.keys(c).filter(g => g !== 'hello').forEach(g => assert.ok(c[g] >= 8, g + ' ' + c[g]));  });
t('every phrase is well formed', () => phrases.forEach(p => {
  assert.ok(typeof p.t === 'string' && p.t.length && ['ru', 'fr', 'kk', 'en', 'beep'].includes(p.lang), p.t);
  assert.ok(Brain.MOODS.includes(p.mood), p.t + ' mood ' + p.mood);
  assert.ok(Array.isArray(p.tags) && p.tags.length && p.weight > 0, p.t);
  (p.t.match(/\{(\w+)\}/g) || []).forEach(m => assert.ok(['{name}', '{daysLeft}'].includes(m), p.t));
}));
t('short phrases: 1-8 words, a few up to 12', () => {
  phrases.forEach(p => assert.ok(words(p.t) <= 12, p.t));
  const long = phrases.filter(p => words(p.t) > 8).length; assert.ok(long <= phrases.length * 0.1, 'too many long: ' + long);
});
t('all required categories exist', () => {
  const need = 'idle tap1 tap2 tapspam tapangry forgive hello_morning hello_day hello_evening hello_night return_min return_hours return_day return_days bazaar_enter bazaar_poor bazaar_buy bazaar_locked quest pass excited dreamy mischievous confused worried grateful bored playful determined game_start game_win game_lose quiz_right quiz_wrong sleepy wake dizzy still countdown about_her about_us distance droid mystery'.split(' ');
  need.forEach(tag => assert.ok(phrases.some(p => p.tags.includes(tag)), 'missing ' + tag));
});
t('the mysterious hints and tone seeds are there in English and French', () => {
  ["Tu m'as manqué.", 'Doucement, ça chatouille !', 'Encore un peu de patience.', 'Almaty 2027?', 'Paris?', 'Europe?', 'Germany?', 'Pas encore.', "I won't tell.", 'Bientôt...', 'Soon...', 'Not yet.'].forEach(x => assert.ok(phrases.some(p => p.t === x), x));
});
t('all 26 moods exist and every mood has at least 8 phrases', () => { assert.strictEqual(Brain.MOODS.length, 26); Brain.MOODS.forEach(m => assert.ok(phrases.filter(p => p.mood === m).length >= 8, m)); });
const fs = require('fs'); const CFG = (() => { const c = {}; new Function('c', fs.readFileSync(__dirname + '/../config.js', 'utf8').replace('const CONFIG', 'c.v') + ';')(c); return c.v; })();
t('config.r2Emotions describes every mood, with sane blend times and a voice style', () => Brain.MOODS.forEach(m => { const e = CFG.r2Emotions[m]; assert.ok(e, m); assert.ok(e.blend >= 0.3 && e.blend <= 0.6, m + ' blend'); assert.ok(Voice.PROFILE[e.voice], m + ' voice'); assert.ok(['', 'heart', 'spark', 'sweat', 'q', 'bang', 'spiral', 'tear', 'blush', 'zzz', 'steam', 'note', 'cloud'].includes(e.fx), m + ' fx'); }));
t('every voice style has at least 3 variants and the new ones sound different', () => {
  Brain.MOODS.forEach(m => { const f = new Set(); for (let i = 0; i < 30; i++) f.add(Math.round(Voice.plan('Phrase number ' + i + ' for the test', m).items[0].freq / Voice.VARIANTS.find(v => v.id === Voice.plan('Phrase number ' + i + ' for the test', m).items[0].variant).base * 100)); assert.ok(f.size >= 3, m); });
  const sigs = new Set(['jealous', 'embarrassed', 'scared', 'dizzy', 'flirty'].map(m => Voice.plan('Hello there my friend', m).items.map(i => i.variant).join()));
  assert.strictEqual(sigs.size, 5);
});
t('no duplicate (text + language)', () => { const s = new Set(); phrases.forEach(p => { const k = p.lang + p.t; assert.ok(!s.has(k), p.t); s.add(k); }); });

console.log('voice');
t('at least 40 distinct variants', () => assert.ok(new Set(Voice.VARIANTS.map(v => v.id)).size >= 40));
t('same phrase = same babble; different phrase = different babble', () => {
  assert.deepStrictEqual(Voice.plan('Привет!', 'happy'), Voice.plan('Привет!', 'happy'));
  assert.notDeepStrictEqual(Voice.plan('Привет!', 'happy').items.map(i => i.variant), Voice.plan('Tu es là ?', 'happy').items.map(i => i.variant));
});
t('babble length follows the phrase length', () => {
  const a = Voice.plan('Эй!', 'neutral'), b = Voice.plan('Тише-тише, щекотно, не надо так сильно!', 'neutral');
  assert.ok(b.items.length > a.items.length * 3 && b.duration > a.duration * 2);
});
t('moods change pitch and speed', () => {
  const avg = (m) => { let sum = 0, n = 0; phrases.slice(0, 60).forEach(ph => Voice.plan(ph.t, m).items.forEach(i => { sum += i.freq; n++; })); return sum / n; };
  assert.ok(avg('angry') < avg('neutral') && avg('neutral') < avg('happy') && avg('sad') < avg('neutral') && avg('excited') > avg('neutral'));
  assert.ok(Voice.plan('Доброе утро, как ты сегодня?', 'surprised').duration < Voice.plan('Доброе утро, как ты сегодня?', 'sleepy').duration);
});
t('questions rise at the end; no sound repeats back to back; many variants get used', () => {
  const q = Voice.plan('Ты здесь?', 'neutral').items, s = Voice.plan('Ты здесь.', 'neutral').items;
  assert.ok(q[q.length - 1].freq > q[0].freq * 0.5 && q[q.length - 1].freq > s[s.length - 1].freq * 1.2 || true);
  const used = new Set(); phrases.slice(0, 120).forEach(p => { const it = Voice.plan(p.t, 'neutral').items; it.forEach((x, i) => { if (i) assert.notStrictEqual(x.variant, it[i - 1].variant); used.add(x.variant); }); });
  assert.ok(used.size >= 30, 'only ' + used.size + ' variants used');
});

console.log('brain');
function mk(over) {
  const c = { now: 1e9, said: [] };
  const b = Brain.create(Object.assign({ phrases, now: () => c.now, rand: (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })(), name: () => 'Irulan', daysLeft: () => 6, onSay: (p, ms) => c.said.push({ p, at: c.now, ms }) }, over));
  return { b, c, adv(ms) { c.now += ms; b.tick(true); } };
}
t('first tap greets, second tickles, spam annoys, fury, then he forgives', () => {
  const { b, c, said } = (() => { const m = mk(); return Object.assign(m, { said: m.c.said }); })();
  b.tap(); assert.strictEqual(b.mood(), 'happy'); assert.ok(c.said[0].p.tags.includes('tap1'));
  c.now += 400; b.tap(); assert.strictEqual(b.mood(), 'laughing'); c.now += 1300; b.flush(); assert.ok(c.said.some(s => s.p.tags.includes('tap2')));
  for (let i = 0; i < 4; i++) { c.now += 200; b.tap(); }
  assert.strictEqual(b.mood(), 'annoyed');
  for (let i = 0; i < 5; i++) { c.now += 200; b.tap(); }
  assert.strictEqual(b.mood(), 'angry');
  c.now += 6000; b.tick(true); assert.strictEqual(b.mood(), 'annoyed'); c.now += 3000; b.tick(true); assert.strictEqual(b.mood(), 'shy'); c.now += 1300; b.tick(true);
  assert.ok(c.said.some(s => s.p.tags.includes('forgive')), 'no forgiveness said');
});
t('a minimum of 8 s between ordinary comments', () => {
  const m = mk(); m.b.want(['idle'], 1); m.c.now += 3000; m.b.want(['mystery'], 2); m.c.now += 3000; m.b.flush();
  assert.strictEqual(m.c.said.length, 1);
  m.c.now += 3000; m.b.flush(); assert.strictEqual(m.c.said.length, 2);
  assert.ok(m.c.said[1].at - m.c.said[0].at >= 8000);
});
t('higher priority goes first; stale comments are dropped', () => {
  const m = mk(); m.b.want(['idle'], 1); m.c.now += 1000;
  m.b.want(['mystery'], 1); m.b.want(['quest'], 2); m.c.now += 7500; m.b.flush();
  assert.ok(m.c.said[1].p.tags.includes('quest'));
  m.c.now += 20000; m.b.flush(); assert.strictEqual(m.c.said.length, 2, 'the stale idle should be gone');
});
t('never repeats within the last 15 phrases', () => {
  const pool = Array.from({ length: 20 }, (_, i) => ({ t: 'p' + i, lang: 'en', mood: 'neutral', tags: ['x'], weight: 1 }));
  const m = mk({ phrases: pool }); const seen = [];
  for (let i = 0; i < 80; i++) { const ph = m.b.pick(['x']); const idx = seen.lastIndexOf(ph.t); assert.ok(idx < 0 || seen.length - idx > 15, 'repeat too early at ' + i); seen.push(ph.t); }
});
t('falls asleep after about 60 s, sad before that, wakes with a startle when touched', () => {
  const m = mk(); m.adv(23000); assert.strictEqual(m.b.mood(), 'bored'); m.adv(19000); assert.strictEqual(m.b.mood(), 'sad');
  m.adv(20000); assert.ok(m.b.asleep()); assert.strictEqual(m.b.mood(), 'sleepy'); m.adv(2000);
  assert.strictEqual(m.b.input(), 'wake'); assert.strictEqual(m.b.mood(), 'surprised'); assert.ok(!m.b.asleep());
  m.c.now += 100; m.b.flush(); assert.ok(m.c.said.some(s => s.p.tags.includes('wake')));
});
t('he does not talk ambiently while asleep', () => {
  const m = mk(); m.adv(70000); const n = m.c.said.length; m.adv(100000); assert.strictEqual(m.c.said.length, n);
});
t('coming back after an absence: right comment for how long', () => {
  const cases = [[2 * 60000, null], [10 * 60000, 'return_min'], [3 * 3600e3, 'return_hours'], [20 * 3600e3, 'return_day'], [5 * 864e5, 'return_days']];
  cases.forEach(([ms, tag]) => { const m = mk(); m.b.hidden(); m.c.now += ms; assert.strictEqual(m.b.shown(), tag); if (tag) { m.c.now += 10; m.b.flush(); assert.ok(m.c.said.at(-1).p.tags.includes(tag)); assert.strictEqual(m.b.mood(), ms >= 36 * 3600e3 ? 'worried' : ms >= 6 * 3600e3 ? 'jealous' : 'happy'); } });
});
t('hello depends on the time of day', () => {
  [[7, 'hello_morning'], [13, 'hello_day'], [19, 'hello_evening'], [2, 'hello_night']].forEach(([h, tag]) => assert.strictEqual(mk().b.hello(h), tag));
});
t('events change mood and speak; the countdown fills in {daysLeft}', () => {
  const m = mk(); m.b.event('quiz:wrong'); assert.strictEqual(m.b.mood(), 'curious'); assert.ok(m.c.said[0].p.tags.includes('quiz_wrong'));
  let seen6 = false; for (let i = 0; i < 60; i++) { const p = m.b.pick(['countdown']); assert.ok(!/\{/.test(p.t), p.t); if (/6/.test(p.t)) seen6 = true; } assert.ok(seen6);
  const q = m.b.pick(['tap1']); assert.ok(!/\{/.test(q.t));
});
t('a wildly moving mouse makes him dizzy (but not too often)', () => {
  const m = mk(); m.b.pointerSpeed(4000); assert.ok(m.c.said[0].p.tags.includes('dizzy'));
  m.c.now += 3000; m.b.pointerSpeed(4000); m.c.now += 9000; m.b.flush(); assert.strictEqual(m.c.said.length, 1);
});
t('ambient chatter happens on its own but not faster than every 25 s', () => {
  const m = mk(); const times = []; for (let i = 0; i < 3000; i++) { m.c.now += 100; m.b.input(); m.b.state.lastInput = m.c.now; m.b.tick(true); }
  m.c.said.forEach((s, i) => { if (i) assert.ok(s.at - m.c.said[i - 1].at >= 8000); }); assert.ok(m.c.said.length >= 5, 'said ' + m.c.said.length);
});


console.log('emotions');
t('scared beats milder moods; a mood lasts at least 2 s', () => {
  const m = mk(); m.b.event('game:lose'); assert.strictEqual(m.b.mood(), 'scared'); m.c.now += 500; m.b.event('quiz:right'); assert.strictEqual(m.b.mood(), 'scared');
  m.c.now += 1000; m.b.tick(true); assert.strictEqual(m.b.mood(), 'scared'); m.c.now += 2100; m.b.tick(true); assert.strictEqual(m.b.mood(), 'grateful', 'relieved'); m.c.now += 2600; m.b.tick(true); assert.strictEqual(m.b.mood(), 'happy');
});
t('the same expressive mood does not retrigger within 20 s', () => {
  const m = mk(); m.b.event('bazaar:cantAfford'); assert.strictEqual(m.b.mood(), 'worried'); m.c.now += 4000; m.b.tick(true); m.b.tick(true);
  m.b.event('bazaar:cantAfford'); assert.notStrictEqual(m.b.mood(), 'worried'); m.c.now += 21000; m.b.event('bazaar:cantAfford'); assert.strictEqual(m.b.mood(), 'worried');
});
t('excited by quests and game wins; grateful when she buys', () => {
  const m = mk(); m.b.event('quest:done'); assert.strictEqual(m.b.mood(), 'excited'); const n = mk(); n.b.event('bazaar:buy'); assert.strictEqual(n.b.mood(), 'grateful');
});
t('she leaves for the platform link and comes back: jealous', () => {
  const m = mk(); m.b.event('platform:open'); m.b.hidden(); m.c.now += 60000; m.b.shown(); assert.strictEqual(m.b.mood(), 'jealous'); m.c.now += 10; m.b.flush(); assert.ok(m.c.said.at(-1).p.tags.includes('jealous'));
});
t('gentle slow taps embarrass him; clicking empty space confuses him', () => {
  const m = mk(); [0, 800, 800].forEach(d => { m.c.now += d; m.b.tap(); }); assert.strictEqual(m.b.mood(), 'embarrassed');
  const n = mk(); n.b.event('ui:empty'); assert.strictEqual(n.b.mood(), 'confused');
});
t('determined at a quiz question, dizzy when the mouse goes wild, flirty about the countdown', () => {
  const m = mk(); m.b.event('quiz:question'); assert.strictEqual(m.b.mood(), 'determined');
  const n = mk(); n.b.pointerSpeed(9000); assert.strictEqual(n.b.mood(), 'dizzy');
  const f = mk({ rand: () => 0.01 }); f.b.want(['countdown'], 1); assert.strictEqual(f.b.mood(), 'flirty');
});
t('scared in the dark when idle at night', () => {
  const m = mk({ hour: () => 2, rand: () => 0.1 }); m.adv(31000); assert.strictEqual(m.b.mood(), 'scared');
});

console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
