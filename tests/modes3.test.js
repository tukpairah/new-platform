/* Rules of Droid Tower, Beep Echo and Pixel Heart (nonogram). Run from the project folder:  node tests/modes3.test.js */
const assert = require('assert'), fs = require('fs');
const NS = require('./nonogram-solver.js');
let pass = 0, fail = 0;
const t = (n, f) => { try { f(); pass++; console.log('  ok   ' + n); } catch (e) { fail++; console.log('  FAIL ' + n + '\n       ' + e.message); } };
const load = id => { let def; new Function('R2', fs.readFileSync('games/' + id + '.js', 'utf8'))({ games: { register: d => { def = d; } } }); return def; };
const T = load('tower'), E = load('echo'), N = load('nonogram'), TL = T.logic, EL = E.logic, NL = N.logic;

console.log('nonogram');
t('the solver itself is right (an ambiguous puzzle has 2 solutions, a unique one has 1, an impossible one has 0)', () => {
  assert.strictEqual(NS.count([[1], [1]], [[1], [1]], 5), 2);                        // the classic diagonal ambiguity
  assert.strictEqual(NS.count([[2], [1]], [[2], [1]], 5), 1); assert.strictEqual(NS.count([[2], [0]], [[1], [1]], 5), 1);
  assert.strictEqual(NS.count([[2], [2]], [[2], [1]], 5), 0); assert.strictEqual(NS.count([[1, 1], [0], [1, 1]], [[1, 1], [0], [1, 1]], 9), 1);
});
t('5 puzzles in the planned order and sizes: star 5x5, key 5x5, R2 head 7x7, envelope 10x10, heart 15x15', () => {
  const p = NL.parsePuzzles(N.defaults.puzzles); assert.deepStrictEqual(p.map(x => x.rows.length + 'x' + x.rows[0].length), ['5x5', '5x5', '7x7', '10x10', '15x15']); assert.deepStrictEqual(p.map(x => x.name), ['Star', 'Key', 'R2', 'Envelope', 'Pixel Heart']);
});
t('EVERY puzzle has exactly ONE solution (verified by the solver)', () => {
  NL.parsePuzzles(N.defaults.puzzles).forEach(p => { const cl = NS.cluesOf(p.rows.map(r => r.split('').map(c => c === '#' ? 1 : 0))); assert.strictEqual(NS.count(cl.rows, cl.cols, 5), 1, p.name + ' is not unique'); });
});
t('clue generation matches the solver module and a hand check', () => {
  NL.parsePuzzles(N.defaults.puzzles).forEach(p => { const a = NL.cluesOf(p.rows), b = NS.cluesOf(p.rows.map(r => r.split('').map(c => c === '#' ? 1 : 0))); assert.deepStrictEqual(a.rows, b.rows); assert.deepStrictEqual(a.cols, b.cols); });
  const c = NL.cluesOf(['..#..', '.###.', '#####', '.###.', '.#.#.']); assert.deepStrictEqual(c.rows, [[1], [3], [5], [3], [1, 1]]); assert.deepStrictEqual(c.cols, [[1], [4], [4], [4], [1]]); assert.deepStrictEqual(NL.cluesOf(['..', '..']).rows, [[0], [0]]);
});
t('the heart picture really contains a heart and a small R2 beside it', () => {
  const p = NL.parsePuzzles(N.defaults.puzzles)[4].rows; assert.ok(p[2].slice(0, 11) === '#'.repeat(11), 'heart body'); assert.ok(p.slice(8).some(r => r.slice(10).includes('#')), 'R2 at the bottom right');
});
t('solved / mistakes / finished clues / hints', () => {
  const rows = ['.#', '##']; assert.ok(NL.isSolved([2, 1, 1, 1], rows)); assert.ok(!NL.isSolved([0, 1, 1, 0], rows)); assert.ok(!NL.isSolved([1, 1, 1, 1], rows));
  assert.deepStrictEqual(NL.mistakes([1, 0, 1, 1], rows), [true, false, false, false].map((x, i) => i === 0));
  assert.ok(NL.lineDone([1, 1, 0, 1], [2, 1]) && !NL.lineDone([1, 0, 1, 1], [2, 1]) && NL.lineDone([2, 2, 2], [0]));
  const h = NL.hintCell([0, 0, 0, 0], rows, [], 0.5); assert.ok(h && rows.join('')[h.idx] === '#' && h.value === 1);
  const h2 = NL.hintCell([1, 0, 0, 0], rows, [], 0); assert.ok(h2 && h2.idx === 0 && h2.value === 2);
  assert.strictEqual(NL.hintCell([2, 1, 1, 1], rows, [], 0.3), null);
  assert.strictEqual(NL.starsFor(0, N.defaults), 3); assert.strictEqual(NL.starsFor(5, N.defaults), 2); assert.strictEqual(NL.starsFor(20, N.defaults), 1);
  assert.deepStrictEqual(NL.parsePuzzles('# A\n#.\n.#\n---\n# bad\n##\n#\n---\nXX\n..'), [{ name: 'A', rows: ['#.', '.#'] }, { name: '', rows: ['##', '..'] }]);
});

console.log('tower');
const O = { tol: 5, grow: 8, maxW: 180 };
t('a perfect landing snaps onto the block below and grows it (never past the maximum, never off the world)', () => {
  let r = TL.land({ x: 80, w: 140 }, { x: 83, w: 140 }, O); assert.ok(r.perfect && !r.miss && r.cuts.length === 0); assert.strictEqual(r.block.w, 148); assert.strictEqual(r.block.x, 76);
  r = TL.land({ x: 80, w: 175 }, { x: 80, w: 175 }, O); assert.strictEqual(r.block.w, 180); r = TL.land({ x: 0, w: 140 }, { x: 0, w: 140 }, O); assert.strictEqual(r.block.x, 0); r = TL.land({ x: 160, w: 140 }, { x: 160, w: 140 }, O); assert.ok(r.block.x + r.block.w <= 300);
});
t('an imperfect landing trims the overhang: what stays + what falls = the dropped block', () => {
  for (const [p, c] of [[{ x: 80, w: 140 }, { x: 100, w: 140 }], [{ x: 80, w: 140 }, { x: 50, w: 140 }], [{ x: 100, w: 60 }, { x: 70, w: 120 }], [{ x: 20, w: 100 }, { x: 119, w: 100 }]]) {
    const r = TL.land(p, c, O); assert.ok(!r.miss && !r.perfect); const cut = r.cuts.reduce((a, x) => a + x.w, 0); assert.ok(Math.abs(r.block.w + cut - c.w) < 1e-9, JSON.stringify([p, c]));
    assert.ok(r.block.x >= p.x - 1e-9 && r.block.x + r.block.w <= p.x + p.w + 1e-9, 'stays within the block below');
  }
  const r = TL.land({ x: 100, w: 60 }, { x: 70, w: 120 }, O); assert.strictEqual(r.cuts.length, 2); assert.deepStrictEqual(r.block, { x: 100, w: 60 });
});
t('a block that does not touch the one below is a miss, and it falls whole', () => { const r = TL.land({ x: 0, w: 100 }, { x: 150, w: 100 }, O); assert.ok(r.miss && r.block === null && r.cuts[0].w === 100); assert.ok(TL.land({ x: 0, w: 100 }, { x: 100, w: 50 }, O).miss); });
t('the swing is a fair, repeatable triangle wave inside the free range', () => {
  const range = 160; for (let i = 0; i < 2000; i++) { const x = TL.swingX(i * 0.013, 130, range, i % 2); assert.ok(x >= -1e-9 && x <= range + 1e-9); }
  assert.strictEqual(TL.swingX(0, 130, 160, 0), 0); assert.strictEqual(TL.swingX(160 / 130, 130, 160, 0), 160); assert.ok(Math.abs(TL.swingX(2 * 160 / 130, 130, 160, 0)) < 1e-9); assert.strictEqual(TL.swingX(0.5, 130, 160, 0), TL.swingX(0.5, 130, 160, 0));
});
t('speed ramps up in steps every 5 blocks, is capped, and Assist is slower', () => {
  const c = T.defaults, s = h => TL.speedAt(h, c, false); assert.strictEqual(s(0), 130); assert.strictEqual(s(4), 130); assert.ok(s(5) > s(4) && s(10) > s(5)); assert.ok(s(500) <= 130 * 3 + 1e-9); assert.ok(TL.speedAt(10, c, true) < s(10));
  for (let h = 1; h < 100; h++) assert.ok(s(h) >= s(h - 1));
});
t('combo pitch rises a semitone per perfect, stars follow the share of perfects', () => { assert.ok(TL.comboFreq(1) > TL.comboFreq(0) && TL.comboFreq(12) > 1.99 * TL.comboFreq(0)); assert.strictEqual(TL.starsFor(20, 30, T.defaults), 3); assert.strictEqual(TL.starsFor(10, 30, T.defaults), 2); assert.strictEqual(TL.starsFor(1, 30, T.defaults), 1); assert.strictEqual(T.defaults.goalHeight, 30); });

console.log('echo');
t('the sequence has the right length, only pads 0-3, never 3 of the same in a row, and is repeatable per seed', () => {
  for (let s = 1; s <= 500; s++) { const q = EL.genSequence(12, s); assert.strictEqual(q.length, 12); assert.ok(q.every(p => p >= 0 && p <= 3 && Number.isInteger(p))); for (let i = 2; i < q.length; i++) assert.ok(!(q[i] === q[i - 1] && q[i] === q[i - 2])); }
  assert.deepStrictEqual(EL.genSequence(12, 7), EL.genSequence(12, 7)); assert.notDeepStrictEqual(EL.genSequence(12, 7), EL.genSequence(12, 8)); assert.deepStrictEqual(EL.genSequence(8, 3), EL.genSequence(12, 3).slice(0, 8));
  const used = new Set(); for (let s = 1; s <= 50; s++) EL.genSequence(12, s).forEach(p => used.add(p)); assert.strictEqual(used.size, 4);
});
t('playback gets faster every round but never faster than the minimum', () => { const c = E.defaults; assert.strictEqual(EL.interval(1, c), 700); for (let r = 2; r <= 30; r++) assert.ok(EL.interval(r, c) <= EL.interval(r - 1, c) && EL.interval(r, c) >= 260); assert.strictEqual(EL.interval(30, c), 260); assert.strictEqual(E.defaults.length, 12); assert.strictEqual(E.defaults.lives, 3); });
t('input check: right pad continues, last right pad finishes the round, a wrong pad fails', () => { const q = [2, 0, 3]; assert.strictEqual(EL.check(q, 0, 2), 'ok'); assert.strictEqual(EL.check(q, 1, 0), 'ok'); assert.strictEqual(EL.check(q, 2, 3), 'done'); assert.strictEqual(EL.check(q, 1, 1), 'wrong'); assert.strictEqual(EL.starsFor(3), 3); assert.strictEqual(EL.starsFor(1), 1); });

console.log(`\n${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
