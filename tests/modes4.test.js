/* Cipher rules, the release check, a mount smoke test of all 10 modes, and a mobile CSS audit. Run from the project folder:  node tests/modes4.test.js */
const assert = require('assert'), fs = require('fs'), path = require('path');
let pass = 0, fail = 0;
const t = (n, f) => { try { f(); pass++; console.log('  ok   ' + n); } catch (e) { fail++; console.log('  FAIL ' + n + '\n       ' + (e.stack || e.message).split('\n').slice(0, 3).join('\n       ')); } };
const defs = {}; const R2mock = { games: { register: d => { defs[d.id] = d; } }, register() {}, bus: { emit() {}, on() {} }, mode: () => ({ plays: 0, clears: 0, best: 0, stars: 0 }) };
const ids = ['quiz', 'dodge', 'memory', 'mot', 'sliding', 'sweeper', 'nonogram', 'tower', 'echo', 'cipher'];

console.log('transmission (the id is still "cipher")');
let C;
t('loads and its logic is available', () => { new Function('R2', fs.readFileSync('games/cipher.js', 'utf8'))(R2mock); C = defs.cipher.logic; assert.ok(C.shuffleWords && C.correctPrefix); });
t('the shuffle is a permutation, repeatable for a seed, and never the right order (many seeds, many sentences)', () => {
  const lines = C.parseLines(defs.cipher.defaults.lines); assert.ok(lines.length >= 4);
  for (const l of lines) { const ws = C.wordsOf(l); for (let s = 1; s <= 200; s++) { const o = C.shuffleWords(ws, s); assert.deepStrictEqual(o.slice().sort((x, y) => x - y), ws.map((_, i) => i)); assert.deepStrictEqual(o, C.shuffleWords(ws, s)); assert.ok(o.some((v, i) => ws[v] !== ws[i]), l + ' seed ' + s); } }
  assert.deepStrictEqual(C.shuffleWords(['a'], 1), [0]);
});
t('prefix and solved detection, also with repeated words', () => {
  const ws = ['la', 'vie', 'est', 'la', 'vie'];
  assert.strictEqual(C.correctPrefix(['la', 'vie', 'est'], ws), 3); assert.strictEqual(C.correctPrefix(['vie'], ws), 0); assert.strictEqual(C.correctPrefix(['la', 'est'], ws), 1);
  assert.ok(C.isSolvedLine(ws.slice(), ws)); assert.ok(!C.isSolvedLine(['la', 'vie', 'est', 'vie', 'la'], ws)); assert.ok(!C.isSolvedLine(ws.slice(0, 4), ws));
});
t('every default sentence has 4 to 12 words and a full playthrough with the prefix rule always ends solved', () => {
  for (const l of C.parseLines(defs.cipher.defaults.lines)) {
    const ws = C.wordsOf(l); assert.ok(ws.length >= 4 && ws.length <= 12, l); const order = C.shuffleWords(ws, 7); let placed = [];
    for (let guard = 0; guard < 500 && !C.isSolvedLine(placed.map(i => ws[i]), ws); guard++) { const k = C.correctPrefix(placed.map(i => ws[i]), ws); placed = placed.slice(0, k); const next = order.find(i => placed.indexOf(i) < 0 && ws[i] === ws[k]); assert.ok(next != null); placed.push(next); }
    assert.ok(C.isSolvedLine(placed.map(i => ws[i]), ws));
  }
});
t('stars, parsing, and no leftover code-breaking or package wording anywhere in the mode', () => {
  const d = defs.cipher.defaults; assert.strictEqual(C.starsFor(0, d), 3); assert.strictEqual(C.starsFor(2, d), 3); assert.strictEqual(C.starsFor(3, d), 2); assert.strictEqual(C.starsFor(6, d), 2); assert.strictEqual(C.starsFor(7, d), 1);
  assert.deepStrictEqual(C.parseLines('a  b\n\n c d \n'), ['a b', 'c d']);
  const all = fs.readFileSync('games/cipher.js', 'utf8') + fs.readFileSync('content/games/cipher.js', 'utf8');
  assert.ok(!/\[REPLACE|amazon|package|colis|locker|casier|substitution|\bcode\b/i.test(all.replace(/\/\*[\s\S]*?\*\//g, '')), 'old wording is still there');
  assert.ok(!/amazon|package|colis|locker|leopard/i.test(fs.readFileSync('config.js', 'utf8')));
});

console.log('release check');
const admin = require('../tools/admin.js');
t('the release check reports placeholders, devKey and the do-not-upload list', () => {
  const r = admin.releaseCheck(); assert.ok(Array.isArray(r) && r.length && r.every(x => ['error', 'warn', 'info', 'ok'].includes(x.level) && x.text));
  assert.ok(r.some(x => /Do NOT upload: tools/.test(x.text))); assert.strictEqual(r.some(x => /devKey is not empty/.test(x.text)), /devKey:\s*"[^"]+"/.test(fs.readFileSync('config.js', 'utf8')), 'a non-empty devKey must be reported');
  assert.ok(!r.some(x => x.level === 'error' && !/devKey|audio\/gifts\//.test(x.text)), 'errors: ' + r.filter(x => x.level === 'error').map(x => x.text).join(' | ')); assert.ok(fs.readFileSync('DEPLOY.md', 'utf8').includes('DO NOT UPLOAD'));
});

console.log('all 10 modes mount, pause, resume and destroy without errors');
function stub() {                                           // a DOM stand-in that accepts anything (it only catches typos and missing names)
  const mk = () => { const store = {}; return new Proxy(function () {}, {
    get(_, p) { if (p in store) return store[p]; if (p === Symbol.toPrimitive) return () => ''; if (p === Symbol.iterator) return function* () {}; if (p === 'length') return 0; if (p === 'then') return undefined; if (p === 'dataset') return (store.dataset = {}); if (p === 'value' || p === 'textContent' || p === 'innerHTML' || p === 'className') return ''; if (p === 'querySelectorAll') return () => Array.from({ length: 30 }, (_, k) => { const e = mk(); e.dataset = { v: k + 1, i: k, n: k, p: k, c: 'A', k: 'A' }; return e; }); if (p === 'style' || p === 'classList' || p === 'children') return (store[p] = mk()); return (...a) => mk(); },
    set(_, p, v) { store[p] = v; return true; }, apply() { return mk(); }, has() { return true; }
  }); };
  return mk();
}
const timers = [];
const G = { CONFIG: { games: { quiz: { questions: [{ q: 'a', options: ['b', 'c'], correct: 0, right: 'r', wrong: 'w' }] } } }, window: null, document: null, esc: s => String(s), store: { get: (k, d) => d, set() {} }, R2: R2mock, matchMedia: () => ({ matches: false }), innerWidth: 390, innerHeight: 800, devicePixelRatio: 2, Image: function () { setTimeout(() => this.onerror && this.onerror(), 0); },
  addEventListener() {}, removeEventListener() {}, requestAnimationFrame: () => 1, cancelAnimationFrame() {}, performance: { now: () => Date.now() }, setInterval: (f, ms) => { const h = setInterval(f, ms); timers.push(h); return h; }, setTimeout: (f, ms) => { const h = setTimeout(f, ms); timers.push(h); return h; }, clearInterval, clearTimeout };
for (const id of ids.filter(i => i !== 'dodge')) t(id + ' mounts and tears down', () => {
  const doc = stub(); doc.createElement = () => stub(); doc.addEventListener = () => {}; doc.removeEventListener = () => {}; doc.querySelectorAll = () => []; doc.body = stub();
  const g = Object.assign({}, G, { document: doc }); g.window = g; g.R2 = undefined; delete g.R2;
  const names = Object.keys(g); const fn = new Function(...names, 'R2', fs.readFileSync('games/' + id + '.js', 'utf8'));
  fn(...names.map(n => g[n]), Object.assign({}, R2mock, { games: { register: d => { defs[d.id] = d; } } }));
  const d = defs[id], cfg = JSON.parse(JSON.stringify(d.defaults)); const ctx = { root: stub(), cfg, sfx: { tone() {}, play() {}, speak() {} }, bus: R2mock.bus, dev: false, stars() {}, win() {}, lose() {} };
  const inst = d.mount(ctx); assert.ok(inst && typeof inst.pause === 'function' && typeof inst.resume === 'function' && typeof inst.destroy === 'function', id + ' must return pause/resume/destroy');
  inst.pause(); inst.resume(); inst.destroy();
});
t('dodge registers with the shell (native)', () => { const src = fs.readFileSync('games/dodge.js', 'utf8'); assert.ok(/id:\s*"dodge",\s*native:\s*true/.test(src)); });
timers.forEach(h => { clearInterval(h); clearTimeout(h); });

console.log('mobile audit (static)');
t('every small button in the shell and the modes is at least 44px tall; no 100vw widths or forced horizontal scroll', () => {
  const files = ['games/shell.css', 'games/shell.js'].concat(ids.map(i => 'games/' + i + '.js'));
  files.forEach(f => { const s = fs.readFileSync(f, 'utf8'); const re = /([^{}\n]*\.mbtn\.small[^{}]*)\{([^}]*)\}/g; let m; while ((m = re.exec(s))) { const h = /min-height:\s*(\d+)px/.exec(m[2]); if (h) assert.ok(+h[1] >= 44, f + ': ' + m[1].trim() + ' ' + h[0]); }
    assert.ok(!/overflow-x:\s*(scroll|auto)/.test(s), f + ' scrolls sideways'); assert.ok(!/width:\s*100vw/.test(s), f + ' uses 100vw'); });
  assert.ok(/overflow-x:hidden/.test(fs.readFileSync('games/shell.css', 'utf8')));
});
t('every mode registers a schema field set the admin can render (known types) and a description', () => ids.filter(i => defs[i]).forEach(i => { const sc = defs[i].schema || []; sc.forEach(f => { assert.ok(['text', 'longtext', 'list', 'number', 'image', 'images', 'words', 'color'].includes(f.type), i + '.' + f.key); assert.ok(f.label && f.key, i); }); }));
console.log('lobby page wiring (regression)');
t('no click selector in the lobby matches an attribute that <body> itself has (that once made EVERY click do nothing)', () => {
  const html = fs.readFileSync('index.html', 'utf8'), body = /<body([^>]*)>/.exec(html)[1], bodyAttrs = (body.match(/data-[\w-]+/g) || []);
  const sels = (html.match(/closest\('\[(data-[\w-]+)/g) || []).map(x => x.replace(/.*\[/, ''));
  assert.ok(sels.length > 10); bodyAttrs.forEach(a => assert.ok(!sels.includes(a), 'body has ' + a + ' and a click handler also uses closest([' + a + '])'));
});
t('the lobby script defines everything it calls: pass icons / opening / letter, facts cards, the gift windows, the picker', () => {
  const js = fs.readFileSync('index.html', 'utf8').match(/<script>([\s\S]*?)<\/script>/g).pop();
  ['function stepIcon', 'function fixStepIcons', 'const PASS_OPEN', 'const PASS_CLOSED', 'function openStep', 'function playOpen', 'function showSurprise', 'function factCard', 'function fadeFacts'].forEach(x => assert.ok(js.includes(x), 'missing ' + x));
  ['gift()', 'giftView(', 'facts()', 'play()', 'menu()', 'quests()', 'pass()', 'soon()'].forEach(x => assert.ok(new RegExp('^  ' + x.replace(/[()]/g, '\\$&'), 'm').test(js), 'MODALS.' + x + ' is missing'));
  assert.ok(!/closest\('\[data-mode\]'\)/.test(js));
});

console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
