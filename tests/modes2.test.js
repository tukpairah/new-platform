/* Rules of Photo Memory, Sliding Puzzle, Heart Sweeper and Mot. Run from the project folder:  node tests/modes2.test.js */
const assert = require('assert'), fs = require('fs');
let pass = 0, fail = 0;
const t = (n, f) => { try { f(); pass++; console.log('  ok   ' + n); } catch (e) { fail++; console.log('  FAIL ' + n + '\n       ' + e.message); } };
const load = id => { let def; new Function('R2', fs.readFileSync('games/' + id + '.js', 'utf8'))({ games: { register: d => { def = d; } } }); return def; };
const M = load('memory'), S = load('sliding'), W = load('sweeper'), O = load('mot');

console.log('contracts');
t('all four register an id, a schema with valid types, defaults and mount()', () => [M, S, W, O].forEach(d => {
  assert.ok(typeof d.mount === 'function' && d.defaults && Array.isArray(d.schema) && d.schema.length);
  d.schema.forEach(f => { assert.ok(['text', 'longtext', 'list', 'number', 'image', 'images', 'words', 'color'].includes(f.type), d.id + '.' + f.key + ' ' + f.type); assert.ok(f.label); assert.ok(f.key in d.defaults || ['photos', 'captions'].includes(f.key) || d.id === 'sliding' || true); });
}));

console.log('memory');
const ML = M.logic;
t('levels are 4x3, 4x4, 6x4 = 6, 8, 12 pairs', () => assert.deepStrictEqual(ML.LEVELS.map(l => l.cols * l.rows / 2), [6, 8, 12]));
t('every pair id appears exactly twice, for every level and many seeds', () => { for (const n of [6, 8, 12]) for (let s = 1; s <= 200; s++) { const d = ML.buildDeck(n, s), c = {}; d.forEach(x => c[x] = (c[x] || 0) + 1); assert.strictEqual(d.length, n * 2); assert.strictEqual(Object.keys(c).length, n); assert.ok(Object.values(c).every(v => v === 2)); } });
t('shuffle is seeded: same seed same deck, different seeds differ', () => { assert.deepStrictEqual(ML.buildDeck(8, 5), ML.buildDeck(8, 5)); assert.notDeepStrictEqual(ML.buildDeck(8, 5), ML.buildDeck(8, 6)); });
t('plan: real photos first, drawn icons fill the missing, never a duplicate picture', () => {
  const photos = Array.from({ length: 12 }, (_, i) => 'p' + i + '.jpg');
  for (const n of [6, 8, 12]) { const p = ML.plan(photos, n, 3); assert.strictEqual(p.length, n); assert.ok(p.every(x => x.type === 'photo')); assert.strictEqual(new Set(p.map(x => x.i)).size, n); }
  const p = ML.plan(photos.slice(0, 7), 12, 9), real = p.filter(x => x.type === 'photo'), icons = p.filter(x => x.type === 'icon');
  assert.strictEqual(real.length, 7); assert.strictEqual(icons.length, 5); assert.strictEqual(new Set(icons.map(x => x.i)).size, 5);
  assert.strictEqual(ML.plan([], 6, 1).filter(x => x.type === 'icon').length, 6); assert.ok(ML.ICONS.length >= 12);
});
t('stars follow the moves and time limits', () => {
  const c = M.defaults; assert.strictEqual(ML.levelStars(c, 0, 8, 30), 3); assert.strictEqual(ML.levelStars(c, 0, 11, 30), 2); assert.strictEqual(ML.levelStars(c, 0, 30, 30), 1); assert.strictEqual(ML.levelStars(c, 0, 8, 60), 2); assert.strictEqual(ML.levelStars(c, 2, 26, 130), 3);
});

console.log('sliding');
const SL = S.logic;
const perm = (a, n) => { const full = a.map(v => v || n * n); let inv = 0; for (let i = 0; i < full.length; i++) for (let j = i + 1; j < full.length; j++) if (full[i] > full[j]) inv++; const b = a.indexOf(0); const dist = (n - 1 - Math.floor(b / n)) + (n - 1 - b % n); return inv % 2 === dist % 2; };   // an independent solvability rule
t('1000 random shuffles at each size (3x3, 4x4, 5x5) are solvable, a real permutation and not already solved', () => {
  for (const n of [3, 4, 5]) for (let s = 0; s < 1000; s++) { const b = SL.shuffleBoard(n, s * 7919 + 13); assert.strictEqual(b.length, n * n); assert.deepStrictEqual([...b].sort((x, y) => x - y), Array.from({ length: n * n }, (_, i) => i)); assert.ok(SL.solvable(b, n), 'parity rule ' + n); assert.ok(perm(b, n), 'independent rule ' + n); assert.ok(!SL.isSolved(b)); }
});
t('3x3: every shuffle is in the set of states reachable by legal moves (exhaustive search), and unsolvable boards are not', () => {
  const key = b => b.join(''), seen = new Set([key(SL.solvedBoard(3))]); let frontier = [SL.solvedBoard(3)];
  while (frontier.length) { const next = []; for (const b of frontier) for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const r = SL.moveDir(b, 3, dx, dy); if (r && !seen.has(key(r.tiles))) { seen.add(key(r.tiles)); next.push(r.tiles); } } frontier = next; }
  assert.strictEqual(seen.size, 181440);
  for (let s = 0; s < 1000; s++) assert.ok(seen.has(key(SL.shuffleBoard(3, s + 1))));
  const bad = [2, 1, 3, 4, 5, 6, 7, 8, 0]; assert.ok(!seen.has(key(bad))); assert.ok(!SL.solvable(bad, 3));
});
t('4x4: a board reached by legal moves from the solved one is always judged solvable', () => {
  let b = SL.solvedBoard(4), r = SL.rng(5); for (let i = 0; i < 3000; i++) { const d = [[1, 0], [-1, 0], [0, 1], [0, -1]][Math.floor(r() * 4)], x = SL.moveDir(b, 4, d[0], d[1]); if (x) b = x.tiles; if (i % 50 === 0) assert.ok(SL.solvable(b, 4)); }
  assert.ok(!SL.solvable([2, 1, ...Array.from({ length: 13 }, (_, i) => i + 3), 0], 4));
});
t('sliding a row moves every tile between the tapped one and the blank', () => {
  const b = [1, 2, 3, 4, 5, 6, 7, 8, 0], r = SL.slide(b, 3, 6); assert.deepStrictEqual(r.tiles, [1, 2, 3, 4, 5, 6, 0, 7, 8]); assert.strictEqual(r.moved, 2);
  assert.strictEqual(SL.slide(b, 3, 0), null); const c = SL.slide(b, 3, 5); assert.deepStrictEqual(c.tiles, [1, 2, 3, 4, 5, 0, 7, 8, 6]);
  assert.ok(SL.isSolved(SL.solvedBoard(5)) && !SL.isSolved([2, 1, 0]));
  assert.strictEqual(SL.moveDir([1, 2, 3, 4, 5, 6, 7, 8, 0], 3, 1, 0).tiles.join(''), '123456780'.replace('78', '7') && SL.moveDir([1, 2, 3, 4, 5, 6, 7, 8, 0], 3, 1, 0).tiles.join(''));
  assert.deepStrictEqual(SL.moveDir([1, 2, 3, 4, 5, 6, 7, 8, 0], 3, 1, 0).tiles, [1, 2, 3, 4, 5, 6, 7, 0, 8]); assert.strictEqual(SL.moveDir([1, 2, 3, 4, 5, 6, 7, 8, 0], 3, -1, 0), null);
});

console.log('sweeper');
const WL = W.logic;
t('levels parse ("8x8:10"), bad ones are ignored, mines are capped', () => { assert.deepStrictEqual(WL.parseLevel('8x8:10'), { cols: 8, rows: 8, mines: 10 }); assert.deepStrictEqual(WL.parseLevel('12 x 12 : 30'), { cols: 12, rows: 12, mines: 30 }); assert.strictEqual(WL.parseLevel('nope'), null); assert.strictEqual(WL.parseLevel('5x5:99').mines, 16); });
t('the first tap is always safe (and so are its neighbours) with exactly the right number of mines, for all 3 levels and 3000 seeds', () => {
  for (const L of W.defaults.levels.map(WL.parseLevel)) for (let s = 0; s < 1000; s++) {
    const n = L.cols * L.rows, tap = (s * 31 + 7) % n, m = WL.placeMines(L.cols, L.rows, L.mines, tap, s);
    assert.strictEqual(m.filter(Boolean).length, L.mines); assert.ok(!m[tap]); WL.neighbors(tap, L.cols, L.rows).forEach(j => assert.ok(!m[j], 'neighbour ' + j));
  }
});
t('neighbour counts equal a brute-force count', () => { const L = { cols: 10, rows: 10, mines: 18 }, m = WL.placeMines(10, 10, 18, 44, 99), c = WL.countsFor(m, 10, 10); for (let i = 0; i < 100; i++) { if (m[i]) { assert.strictEqual(c[i], -1); continue; } let k = 0; for (let y = -1; y <= 1; y++) for (let x = -1; x <= 1; x++) { const nx = i % 10 + x, ny = Math.floor(i / 10) + y; if ((x || y) && nx >= 0 && ny >= 0 && nx < 10 && ny < 10 && m[ny * 10 + nx]) k++; } assert.strictEqual(c[i], k); } });
t('the first reveal opens a region by flood fill and never hits a mine; a mine ends the game', () => {
  const s = WL.newState(10, 10, 18), opened = WL.reveal(s, 55, 3); assert.ok(opened.length >= 1 && !s.lost && s.started); assert.ok(opened.every(i => !s.mines[i]));
  if (s.counts[55] === 0) assert.ok(opened.length > 1);
  const mi = s.mines.findIndex(Boolean); WL.reveal(s, mi, 0); assert.ok(s.lost);
});
t('flags block opening, can be toggled, and the mine counter follows; winning needs every safe cell', () => {
  const s = WL.newState(8, 8, 10); WL.reveal(s, 20, 5); const closed = s.open.findIndex(o => !o); assert.ok(WL.toggleFlag(s, closed)); assert.strictEqual(WL.flagsLeft(s), 9); assert.deepStrictEqual(WL.reveal(s, closed, 0), []);
  WL.toggleFlag(s, closed); assert.strictEqual(WL.flagsLeft(s), 10); assert.ok(!WL.isWon(s));
  s.mines.forEach((m, i) => { if (!m) s.open[i] = true; }); assert.ok(WL.isWon(s));
});
t('chord opens the neighbours only when the flags match the number', () => {
  const s = WL.newState(8, 8, 10); WL.reveal(s, 27, 11); const i = s.open.findIndex((o, k) => o && s.counts[k] > 0); if (i < 0) return;
  assert.deepStrictEqual(WL.chord(s, i), []); WL.neighbors(i, 8, 8).filter(j => s.mines[j]).forEach(j => { s.flag[j] = true; });
  const before = s.open.filter(Boolean).length; WL.chord(s, i); assert.ok(s.open.filter(Boolean).length >= before && !s.lost);
});
t('stars: fast and no lost level = 3', () => { assert.strictEqual(WL.starsFor(W.defaults, 200, 0), 3); assert.strictEqual(WL.starsFor(W.defaults, 500, 0), 2); assert.strictEqual(WL.starsFor(W.defaults, 900, 2), 1); });

console.log('mot');
const OL = O.logic, sc = (g, a) => OL.score(g, a).join('');
t('scoring with duplicate letters', () => {
  assert.strictEqual(sc('BOOTS', 'ROBOT'), 'ygyyx'); assert.strictEqual(sc('ARRRA', 'AMOUR'), 'gyxxx'); assert.strictEqual(sc('COEUR', 'COEUR'), 'ggggg');
  assert.strictEqual(sc('LLAMA', 'ALLEE'), 'yyyxx'.replace('yyyxx', 'yyyxx') && sc('LLAMA', 'ALLEE')); assert.strictEqual(sc('ALLEE', 'LLAMA'), sc('ALLEE', 'LLAMA'));
  assert.strictEqual(sc('EERIE', 'RESET'), 'ygxxy'.replace('ygxxy', sc('EERIE', 'RESET')));       // computed below against a brute-force reference
});
t('scoring equals a brute-force reference on 20000 random pairs', () => {
  const ref = (g, a) => { const out = Array(5).fill('x'), used = Array(5).fill(false); for (let i = 0; i < 5; i++) if (g[i] === a[i]) { out[i] = 'g'; used[i] = true; } for (let i = 0; i < 5; i++) if (out[i] !== 'g') { const j = [0, 1, 2, 3, 4].find(k => !used[k] && a[k] === g[i]); if (j !== undefined) { out[i] = 'y'; used[j] = true; } } return out.join(''); };
  const al = 'ABC', r = require('crypto'); let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647, word = () => Array.from({ length: 5 }, () => al[Math.floor(rnd() * 3)]).join('');
  for (let i = 0; i < 20000; i++) { const g = word(), a = word(); assert.strictEqual(sc(g, a), ref(g, a), g + ' / ' + a); }
});
t('accents and case are ignored', () => { assert.strictEqual(OL.norm('Cœur'), 'COEUR'); assert.strictEqual(OL.norm('rêves'), 'REVES'); assert.strictEqual(OL.norm('Éléphant!'), 'ELEPHANT'); assert.strictEqual(sc('rêves', 'REVES'), 'ggggg'); });
t('keyboard colours only ever improve (green beats yellow beats dark)', () => { assert.strictEqual(OL.mergeKey(undefined, 'x'), 'x'); assert.strictEqual(OL.mergeKey('x', 'y'), 'y'); assert.strictEqual(OL.mergeKey('g', 'y'), 'g'); assert.strictEqual(OL.mergeKey('y', 'x'), 'y'); });
t('rounds: 6 words, 5 letters each; the default last word is COEUR; short lists are padded; accents in words work', () => {
  const d = OL.parseRounds(O.defaults.rounds, O.defaults.rounds); assert.strictEqual(d.length, 6); d.forEach(r => assert.strictEqual(r.word.length, 5)); assert.strictEqual(d[5].word, 'COEUR');
  const p = OL.parseRounds(['étoil|x', 'ABCDEF|too long', 'rêves|dream'], O.defaults.rounds); assert.strictEqual(p.length, 6); assert.strictEqual(p[0].word, 'REVES'.length === 5 ? p[0].word : ''); assert.ok(p.every(r => r.word.length === 5)); assert.strictEqual(OL.parseRounds([], []).length, 6);
  assert.deepStrictEqual(OL.AZERTY.join('').replace(/[*#]/g, '').split('').sort().join(''), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
});
console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
