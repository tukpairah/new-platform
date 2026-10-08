/* Pixel Heart (hard): 5 nonogram puzzles in order (star, key, R2 head, envelope, pixel HEART with a small R2). Puzzles are ASCII grids in content/games/nonogram.js.
   Tap to fill, long-press or X-mode to mark empty, drag to paint a row or column, undo, 3 hints per puzzle, finished clues turn grey,
   mistakes show softly, progress is saved in her save (prefs key "nonogram"). Pure rules are in def.logic (tested). */
(function () {
  'use strict';
  const FILLED = /[#xX1█]/;
  /* "# Name" line, then rows of # (filled) and . (empty); puzzles are separated by a line with ---  */
  function parsePuzzles(text) {
    return String(text || '').split(/^\s*-{3,}\s*$/m).map(block => {
      let name = ''; const rows = [];
      block.split(/\r?\n/).forEach(l => { const s = l.trim(); if (!s) return; if (/^#\s+\S/.test(s)) name = s.replace(/^#\s+/, ''); else if (/^[.#xX1_\-0█]+$/.test(s)) rows.push(s.split('').map(ch => FILLED.test(ch) ? '#' : '.').join('')); });
      return rows.length >= 2 && rows.every(r => r.length === rows[0].length) ? { name, rows } : null;
    }).filter(Boolean);
  }
  const runsOf = line => { const o = []; let c = 0; for (const v of line) { if (v) c++; else if (c) { o.push(c); c = 0; } } if (c) o.push(c); return o; };
  function cluesOf(rows) {
    const R = rows.length, C = rows[0].length, cell = (r, c) => rows[r][c] === '#' ? 1 : 0, z = a => a.length ? a : [0];
    return { rows: rows.map((_, r) => z(runsOf(Array.from({ length: C }, (_, c) => cell(r, c))))), cols: Array.from({ length: C }, (_, c) => z(runsOf(Array.from({ length: R }, (_, r) => cell(r, c))))) };
  }
  /* cells: 0 unknown, 1 filled, 2 marked empty. solved = exactly the right cells are filled */
  const isSolved = (cells, rows) => rows.join('').split('').every((ch, i) => (ch === '#') === (cells[i] === 1));
  const lineDone = (states, clue) => { const r = runsOf(states.map(v => v === 1 ? 1 : 0)); const c = clue.filter(x => x > 0); return r.length === c.length && r.every((v, i) => v === c[i]); };
  const mistakes = (cells, rows) => cells.map((v, i) => v === 1 && rows.join('')[i] !== '#');
  function hintCell(cells, rows, locked, pick) {          // a cell that is not right yet: fill a missing pixel, or mark a wrong one empty
    const flat = rows.join(''), c = []; flat.split('').forEach((ch, i) => { if (locked.indexOf(i) >= 0) return; const want = ch === '#' ? 1 : 2; if (cells[i] !== want && !(want === 2 && cells[i] === 0)) c.push(i); });
    if (!c.length) { flat.split('').forEach((ch, i) => { if (locked.indexOf(i) < 0 && ch === '#' && cells[i] !== 1) c.push(i); }); }
    return c.length ? { idx: c[Math.floor(pick * c.length) % c.length], value: flat[c[Math.floor(pick * c.length) % c.length]] === '#' ? 1 : 2 } : null;
  }
  const starsFor = (hints, c) => hints <= (+c.hints3 >= 0 ? +c.hints3 : 2) ? 3 : hints <= (+c.hints2 >= 0 ? +c.hints2 : 7) ? 2 : 1;

  const DEFAULT_PUZZLES = `# Star
..#..
.###.
#####
.###.
.#.#.
---
# Key
.###.
.#.#.
.###.
..#..
..##.
---
# R2
..###..
.#####.
###.###
#######
#.###.#
#######
.#...#.
---
# Envelope
##########
###....###
####..####
#.######.#
#..####..#
#...##...#
#........#
#........#
#........#
##########
---
# Pixel Heart
.###...###.....
#####.#####....
###########....
###########....
###########....
.#########.....
..#######......
...#####.......
....###....###.
.....#....##.##
..........#####
..........#####
..........#.#.#
..........#####
...........#.#.`;

  const CSS = `.ng{width:100%;display:flex;flex-direction:column;align-items:center;gap:8px}
.ng-top{display:flex;justify-content:space-between;width:100%;max-width:520px;font-size:20px}
.ng-wrap{display:grid;grid-template-columns:auto auto;align-items:end;justify-content:center;user-select:none;-webkit-user-select:none;touch-action:none}
.ng-cols{display:grid;grid-auto-flow:column;grid-auto-columns:var(--cell);align-items:end}
.ng-col,.ng-row{display:flex;font-size:calc(var(--cell) * .5);line-height:1.05;color:#fff;gap:calc(var(--cell) * .22)}
.ng-col{flex-direction:column;align-items:center;justify-content:flex-end;padding-bottom:4px}.ng-row{justify-content:flex-end;align-items:center;text-align:right;padding-right:7px;height:var(--cell)}
.ng-col.done,.ng-row.done{opacity:.35}
.ng-rows{display:flex;flex-direction:column}
.ng-board{display:grid;grid-template-columns:repeat(var(--n),var(--cell));grid-auto-rows:var(--cell);border:3px solid var(--bk);border-radius:6px;background:#1c1f2d;overflow:hidden;touch-action:none}
.ng-c{border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;position:relative;font-size:calc(var(--cell) * .6);color:#8a8fa8}
.ng-c.r5{border-right:2px solid rgba(255,255,255,.35)}.ng-c.b5{border-bottom:2px solid rgba(255,255,255,.35)}
.ng-c.f{background:var(--pz,#4A86F2);box-shadow:inset 0 -3px 0 rgba(0,0,0,.22)}.ng-c.bad{background:#b5586a}.ng-c.h{outline:2px solid #FFE27A;outline-offset:-3px}.ng-c.cur{outline:2px solid #fff;outline-offset:-2px;z-index:1}
.ng-board.reveal .ng-c{border-color:transparent;background:transparent}.ng-board.reveal .ng-c.f{background:var(--pz);box-shadow:none;animation:ngPix .45s ease-out both;animation-delay:var(--d)}
@keyframes ngPix{0%{transform:scale(0)}70%{transform:scale(1.2)}100%{transform:scale(1)}}
.ng-board.beat{animation:ngBeat 1s ease-in-out infinite}@keyframes ngBeat{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
.ng-tools{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}.ng-tools .mbtn.small{min-height:46px;padding:0 14px;margin:0;font-size:18px}
.ng-msg{width:100%;max-width:520px;text-align:center;min-height:24px}.ng-msg .mbtn{min-height:50px}.ng-final{font-size:24px;line-height:1.3;margin:6px 0 10px}
.ng-heart{position:fixed;width:20px;height:20px;pointer-events:none;z-index:40}
@media (prefers-reduced-motion:reduce){.ng-board.reveal .ng-c.f{animation:none}.ng-board.beat{animation:none}}`;

  R2.games.register({
    id: 'nonogram',
    schema: [
      { key: 'puzzles', type: 'longtext', label: 'The 5 puzzles in order. Each: a "# Name" line, then rows of # (filled) and . (empty); separate puzzles with a line ---' },
      { key: 'colors', type: 'list', label: 'The picture colour of each puzzle (hex, one per line)' },
      { key: 'finalText', type: 'longtext', label: 'The message shown when the last puzzle (the heart) is finished' },
      { key: 'hintsPerPuzzle', type: 'number', label: 'Hints per puzzle (default 3)' },
      { key: 'hints3', type: 'number', label: '3 stars if hints used in total are at most' },
      { key: 'hints2', type: 'number', label: '2 stars if hints used in total are at most' }
    ],
    defaults: { puzzles: DEFAULT_PUZZLES, colors: ['#FFD21F', '#F4C444', '#4A86F2', '#F6E7B4', '#E8403A'], finalText: 'You found the heart.', hintsPerPuzzle: 3, hints3: 2, hints2: 7 },
    logic: { parsePuzzles, runsOf, cluesOf, isSolved, lineDone, mistakes, hintCell, starsFor, DEFAULT_PUZZLES },
    mount(ctx) {
      const cfg = ctx.cfg, root = ctx.root, reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
      const st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
      let puzzles = parsePuzzles(cfg.puzzles).slice(0, 5); if (!puzzles.length) puzzles = parsePuzzles(DEFAULT_PUZZLES);
      const NP = puzzles.length, perHints = Math.max(0, Math.floor(+cfg.hintsPerPuzzle >= 0 ? +cfg.hintsPerPuzzle : 3));
      let prog = store.get('nonogram', null); if (!prog || !Array.isArray(prog.done) || prog.done.length !== NP || prog.done.every(Boolean)) prog = { i: 0, done: new Array(NP).fill(false), cells: {}, used: {}, locked: {} };   // all done = a new run
      let pi = Math.min(prog.i || 0, NP - 1), P, N, M, cells, locked, used, undo = [], xmode = false, paused = false, dead = false, cell = 24, cur = 0, paint = null, saveT = 0, timers = [], over = false;
      const later = (f, ms) => { const t = setTimeout(() => { if (!dead) f(); }, ms); timers.push(t); };
      const tone = (f, d, w, v, dl) => { try { ctx.sfx.tone(f, d, w, v, dl); } catch (e) {} };
      const color = i => (cfg.colors && cfg.colors[i]) || DEFAULT_COLORS[i % 5];
      function save() { clearTimeout(saveT); saveT = setTimeout(flush, 400); }
      function flush() { prog.i = pi; prog.cells[pi] = cells.join(''); prog.locked[pi] = locked; prog.used[pi] = used; store.set('nonogram', prog); }
      function begin(i) {
        pi = i; P = puzzles[pi]; N = P.rows.length; M = P.rows[0].length; over = false; undo = [];
        const sc = prog.cells[pi]; cells = sc && sc.length === N * M && !prog.done[pi] ? sc.split('').map(Number) : new Array(N * M).fill(0);
        locked = (prog.locked[pi] || []).slice(); used = prog.used[pi] || 0; cur = 0; render(); ctx.stars(starsFor(totalHints(), cfg));
      }
      const totalHints = () => Object.keys(prog.used).reduce((a, k) => a + (prog.used[k] || 0), 0) - (prog.used[pi] || 0) + used;
      function sizeCells(cl) {
        const maxR = Math.max(...cl.rows.map(r => r.length)), maxC = Math.max(...cl.cols.map(c => c.length)), avail = Math.min(root.clientWidth - 8 || 340, 520), hAvail = innerHeight - 340;
        return Math.max(14, Math.floor(Math.min(avail / (M + 0.55 * maxR), hAvail / (N + 0.55 * maxC), 44)));
      }
      function render() {
        const cl = cluesOf(P.rows); cell = sizeCells(cl); const old = root.querySelector('.ng'); old && old.remove();
        const w = document.createElement('div'); w.className = 'ng'; w.style.setProperty('--cell', cell + 'px'); w.style.setProperty('--n', M); w.style.setProperty('--pz', color(pi));
        w.innerHTML = `<div class="ng-top t"><span>${esc(P.name || 'Puzzle')}</span><span>${pi + 1}/${NP}</span></div>
          <div class="ng-wrap"><div></div><div class="ng-cols">${cl.cols.map((c, i) => `<div class="ng-col" data-col="${i}">${c.map(n => `<span>${n}</span>`).join('')}</div>`).join('')}</div>
          <div class="ng-rows">${cl.rows.map((r, i) => `<div class="ng-row" data-row="${i}">${r.map(n => `<span>${n}</span>`).join('')}</div>`).join('')}</div>
          <div class="ng-board" data-board>${Array.from({ length: N * M }, (_, i) => `<div class="ng-c${(i % M) % 5 === 4 && i % M < M - 1 ? ' r5' : ''}${Math.floor(i / M) % 5 === 4 && Math.floor(i / M) < N - 1 ? ' b5' : ''}" data-i="${i}"></div>`).join('')}</div></div>
          <div class="ng-tools"><button type="button" class="mbtn small ${xmode ? 'grey' : ''}" data-xmode>${xmode ? 'X: mark empty' : 'Fill'}</button><button type="button" class="mbtn small grey" data-undo>Undo</button><button type="button" class="mbtn small grey" data-hint></button></div><div class="ng-msg"></div>`;
        root.appendChild(w); paintAll();
      }
      function paintCell(i) {
        const el = root.querySelector(`.ng-c[data-i="${i}"]`); if (!el) return; const v = cells[i], bad = v === 1 && P.rows.join('')[i] !== '#';
        el.className = el.className.replace(/\b(f|bad|h|cur)\b/g, '').trim() + (v === 1 ? ' f' : '') + (bad ? ' bad' : '') + (locked.indexOf(i) >= 0 ? ' h' : '') + (i === cur ? ' cur' : ''); el.textContent = v === 2 ? '×' : '';
      }
      function paintClues() {
        const cl = cluesOf(P.rows);
        cl.rows.forEach((c, r) => root.querySelector(`[data-row="${r}"]`).classList.toggle('done', lineDone(cells.slice(r * M, r * M + M), c)));
        cl.cols.forEach((c, k) => root.querySelector(`[data-col="${k}"]`).classList.toggle('done', lineDone(Array.from({ length: N }, (_, r) => cells[r * M + k]), c)));
        const h = root.querySelector('[data-hint]'); h.textContent = 'Hint (' + Math.max(0, perHints - used) + ')'; h.disabled = used >= perHints;
      }
      function paintAll() { for (let i = 0; i < N * M; i++) paintCell(i); paintClues(); }
      function set(i, v, batch) { if (cells[i] === v || locked.indexOf(i) >= 0) return false; batch.push({ i, from: cells[i], to: v }); cells[i] = v; paintCell(i); return true; }
      function cellAt(e) { const b = root.querySelector('[data-board]').getBoundingClientRect(), c = Math.floor((e.clientX - b.left) / b.width * M), r = Math.floor((e.clientY - b.top) / b.height * N); return c < 0 || r < 0 || c >= M || r >= N ? -1 : r * M + c; }
      const onDown = e => {
        if (paused || over || e.button > 0 || !e.target.closest('[data-board]')) return; const i = cellAt(e); if (i < 0) return;
        const v = xmode ? (cells[i] === 2 ? 0 : 2) : (cells[i] === 1 ? 0 : 1);
        paint = { v, start: i, axis: null, batch: [], moved: false, long: false, t: setTimeout(() => { if (paint && !paint.moved) { paint.long = true; const b = []; set(i, cells[i] === 2 ? 0 : 2, b); undo.push(b); done(); } }, 450) };
        try { e.target.setPointerCapture(e.pointerId); } catch (er) {}
      };
      const onMove = e => {
        if (!paint || paint.long) return; const i = cellAt(e); if (i < 0) return;
        if (i !== paint.start) { paint.moved = true; clearTimeout(paint.t); }
        if (!paint.moved) return;
        if (!paint.axis && i !== paint.start) paint.axis = Math.floor(i / M) === Math.floor(paint.start / M) ? 'r' : 'c';
        const ok = paint.axis === 'r' ? Math.floor(i / M) === Math.floor(paint.start / M) : paint.axis === 'c' ? i % M === paint.start % M : false;
        if (i === paint.start || ok) { set(paint.start, paint.v, paint.batch); if (ok) set(i, paint.v, paint.batch); }
      };
      const onUp = () => {
        if (!paint) return; clearTimeout(paint.t); const p = paint; paint = null; if (p.long) return;
        if (!p.moved) set(p.start, p.v, p.batch); if (p.batch.length) { undo.push(p.batch); tone(p.v === 1 ? 600 : 420, 0.04, 'triangle', 0.05); done(); }
      };
      function done() { paintClues(); save(); ctx.stars(starsFor(totalHints(), cfg)); if (isSolved(cells, P.rows)) solved(); }
      function doUndo() { if (paused || over) return; const b = undo.pop(); if (!b) return; b.reverse().forEach(c => { cells[c.i] = c.from; paintCell(c.i); }); paintClues(); save(); tone(300, 0.05, 'square', 0.04); }
      function hint() {
        if (paused || over || used >= perHints) return; const h = hintCell(cells, P.rows, locked, Math.random()); if (!h) return;
        const b = []; set(h.idx, h.value, b); locked.push(h.idx); used++; cur = h.idx; paintCell(h.idx); undo.push([]); tone(880, 0.1, 'triangle', 0.06); done();
      }
      function solved() {
        over = true; prog.done[pi] = true; delete prog.cells[pi]; prog.i = Math.min(pi + 1, NP - 1); flush();
        root.querySelectorAll('.ng-col,.ng-row').forEach(c => { c.style.opacity = 0.15; });
        const board = root.querySelector('[data-board]'); board.classList.add('reveal'); board.querySelectorAll('.ng-c').forEach(c => { const i = +c.dataset.i; c.className = c.className.replace(/\bbad\b|\bh\b|\bcur\b/g, ''); c.textContent = ''; c.style.setProperty('--d', (reduced ? 0 : ((i % M) + Math.floor(i / M)) * 28) + 'ms'); if (P.rows.join('')[i] !== '#') c.classList.remove('f'); else c.classList.add('f'); });
        [523, 659, 784, 1047].forEach((f, k) => tone(f, 0.18, 'triangle', 0.08, k * 0.1));
        const last = pi === NP - 1, msg = root.querySelector('.ng-msg');
        later(() => {
          if (!last) { msg.innerHTML = `<button type="button" class="mbtn" data-next>Next puzzle</button>`; return; }
          board.classList.add('beat'); R2.bus.emit('quiz:right'); try { ctx.sfx.speak('beep boop bweep', 'love'); } catch (e) {} confetti();
          msg.innerHTML = `<p class="ng-final t">${esc(cfg.finalText || '')}</p><button type="button" class="mbtn" data-finish>Continue</button>`;
        }, reduced ? 200 : 1300);
      }
      function confetti() {
        if (reduced) return; const r = root.querySelector('[data-board]').getBoundingClientRect();
        for (let k = 0; k < 36; k++) { const e = document.createElement('div'); e.className = 'ng-heart'; e.innerHTML = '<svg viewBox="-12 -12 24 24"><path d="M0 8C-14-2-9-12 0-5 9-12 14-2 0 8z" fill="#FF6FA8" stroke="#12062F" stroke-width="2"/></svg>'; e.style.left = r.left + Math.random() * r.width + 'px'; e.style.top = r.top + r.height * 0.7 + 'px'; document.body.appendChild(e); e.animate([{ transform: 'translateY(0) scale(.5)', opacity: 0 }, { opacity: 1, offset: .2 }, { transform: `translate(${(Math.random() - .5) * 80}px,-${160 + Math.random() * 200}px) scale(1.1)`, opacity: 0 }], { duration: 1800 + Math.random() * 1200, delay: Math.random() * 700, easing: 'ease-out', fill: 'backwards' }).onfinish = () => e.remove(); }
      }
      const onClick = e => {
        if (e.target.closest('[data-xmode]')) { xmode = !xmode; const b = e.target.closest('[data-xmode]'); b.textContent = xmode ? 'X: mark empty' : 'Fill'; b.classList.toggle('grey', xmode); }
        else if (e.target.closest('[data-undo]')) doUndo(); else if (e.target.closest('[data-hint]')) hint();
        else if (e.target.closest('[data-next]')) begin(pi + 1);
        else if (e.target.closest('[data-finish]')) { const hints = totalHints(); ctx.win({ score: Math.max(500, 5000 - hints * 100), stars: starsFor(hints, cfg) }); }
      };
      const onKey = e => {
        if (paused || over) return; const k = e.key; let j = cur;
        if (k === 'ArrowRight') j = Math.min(N * M - 1, cur + 1); else if (k === 'ArrowLeft') j = Math.max(0, cur - 1); else if (k === 'ArrowDown') j = Math.min(N * M - 1, cur + M); else if (k === 'ArrowUp') j = Math.max(0, cur - M);
        else if (k === ' ' || k === 'Enter') { e.preventDefault(); const b = []; set(cur, cells[cur] === 1 ? 0 : 1, b); if (b.length) { undo.push(b); done(); } return; }
        else if (k === 'x' || k === 'X') { const b = []; set(cur, cells[cur] === 2 ? 0 : 2, b); if (b.length) { undo.push(b); done(); } return; }
        else if (k === 'z' || k === 'Z') { doUndo(); return; } else if (k === 'h' || k === 'H') { hint(); return; } else return;
        e.preventDefault(); const o = cur; cur = j; paintCell(o); paintCell(cur);
      };
      root.addEventListener('pointerdown', onDown); root.addEventListener('pointermove', onMove); root.addEventListener('pointerup', onUp); root.addEventListener('pointercancel', onUp); root.addEventListener('click', onClick); document.addEventListener('keydown', onKey); addEventListener('resize', render_);
      function render_() { if (!over && !dead) { const cl = cluesOf(P.rows), c = sizeCells(cl); if (c !== cell) { render(); } } }
      begin(pi);
      return { pause() { paused = true; paint = null; flush(); }, resume() { paused = false; }, destroy() { dead = true; flush(); timers.forEach(clearTimeout); document.removeEventListener('keydown', onKey); removeEventListener('resize', render_); root.innerHTML = ''; document.querySelectorAll('.ng-heart').forEach(h => h.remove()); } };
    }
  });
  var DEFAULT_COLORS = ['#FFD21F', '#F4C444', '#4A86F2', '#F6E7B4', '#E8403A'];
})();
