/* Heart Sweeper (medium): Minesweeper. The mines are "Static" glitches; winning rains hearts from the revealed field.
   Levels (editable): "8x8:10" = columns x rows : mines. Content: content/games/sweeper.js. Pure rules are in def.logic (tested). */
(function () {
  'use strict';
  const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  function parseLevel(s) { const m = /^\s*(\d+)\s*[x×]\s*(\d+)\s*[:,]\s*(\d+)\s*$/i.exec(String(s)); if (!m) return null; const c = Math.min(20, Math.max(5, +m[1])), r = Math.min(20, Math.max(5, +m[2])); return { cols: c, rows: r, mines: Math.max(1, Math.min(+m[3], c * r - 9)) }; }
  function neighbors(i, cols, rows) { const x = i % cols, y = Math.floor(i / cols), o = []; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; const nx = x + dx, ny = y + dy; if (nx >= 0 && ny >= 0 && nx < cols && ny < rows) o.push(ny * cols + nx); } return o; }
  /* the first tap is always safe: its cell and its neighbours stay free of mines (when the board is big enough) */
  function placeMines(cols, rows, mines, safeIdx, seed) {
    const n = cols * rows, r = rng(seed), banned = new Set([safeIdx]); const ring = neighbors(safeIdx, cols, rows);
    if (n - (ring.length + 1) >= mines) ring.forEach(i => banned.add(i));
    const pool = []; for (let i = 0; i < n; i++) if (!banned.has(i)) pool.push(i);
    for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
    const m = new Array(n).fill(false); pool.slice(0, mines).forEach(i => { m[i] = true; }); return m;
  }
  const countsFor = (mines, cols, rows) => mines.map((m, i) => m ? -1 : neighbors(i, cols, rows).filter(j => mines[j]).length);
  const newState = (cols, rows, mines) => ({ cols, rows, minesN: mines, mines: null, counts: null, open: new Array(cols * rows).fill(false), flag: new Array(cols * rows).fill(false), started: false, lost: false });
  function reveal(s, idx, seed) {                           // returns the list of newly opened cells; sets s.lost when a mine is hit
    if (s.lost || s.flag[idx] || s.open[idx]) return [];
    if (!s.started) { s.mines = placeMines(s.cols, s.rows, s.minesN, idx, seed); s.counts = countsFor(s.mines, s.cols, s.rows); s.started = true; }
    if (s.mines[idx]) { s.lost = true; s.open[idx] = true; return [idx]; }
    const out = [], q = [idx];                              // flood fill from zeros
    while (q.length) { const i = q.pop(); if (s.open[i] || s.flag[i]) continue; s.open[i] = true; out.push(i); if (s.counts[i] === 0) neighbors(i, s.cols, s.rows).forEach(j => { if (!s.open[j] && !s.mines[j]) q.push(j); }); }
    return out;
  }
  function chord(s, idx) {                                  // a number with exactly that many flags around it opens the other neighbours
    if (!s.started || !s.open[idx] || s.counts[idx] <= 0) return [];
    const nb = neighbors(idx, s.cols, s.rows); if (nb.filter(j => s.flag[j]).length !== s.counts[idx]) return [];
    let out = []; nb.forEach(j => { if (!s.flag[j] && !s.open[j]) out = out.concat(reveal(s, j, 0)); }); return out;
  }
  const toggleFlag = (s, idx) => { if (s.open[idx] || s.lost) return false; s.flag[idx] = !s.flag[idx]; return true; };
  const isWon = s => s.started && !s.lost && s.mines.every((m, i) => m || s.open[i]);
  const flagsLeft = s => s.minesN - s.flag.filter(Boolean).length;
  const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const starsFor = (c, time, losses) => { const p = (time <= (+c.time3 || 300) ? 2 : time <= (+c.time2 || 600) ? 1 : 0) + (losses === 0 ? 1 : 0); return p >= 3 ? 3 : p === 2 ? 2 : 1; };
  const NUMCOL = ['', '#6FD0FF', '#8CEB6B', '#FF8A8A', '#C792FF', '#FFB400', '#6FE0D0', '#fff', '#9AA7C2'];
  const SVG = { // the Static glitch and the flag, drawn
    mine: '<svg viewBox="0 0 24 24"><g stroke="#12062F" stroke-width="1.6" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="3" fill="#26293A"/><rect x="5" y="7" width="6" height="3" fill="#6FD0FF"/><rect x="12" y="11" width="7" height="3" fill="#FF6FA8"/><rect x="6" y="15" width="5" height="2" fill="#fff"/><rect x="14" y="6" width="4" height="2" fill="#8CEB6B"/></g></svg>',
    flag: '<svg viewBox="0 0 24 24"><g stroke="#12062F" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><path d="M7 3v18" fill="none"/><path d="M7 4l12 4.5L7 13z" fill="#FF6FA8"/></g></svg>',
    heart: '<svg viewBox="-12 -12 24 24"><path d="M0 8C-14-2-9-12 0-5 9-12 14-2 0 8z" fill="#FF6FA8" stroke="#12062F" stroke-width="2"/></svg>'
  };
  const CSS = `.sw{width:100%;display:flex;flex-direction:column;align-items:center;gap:10px}
.sw-top{display:flex;justify-content:space-between;align-items:center;width:100%;max-width:520px;font-size:20px;gap:8px}.sw-top .mbtn.small{min-height:44px}
.sw-grid{display:grid;grid-template-columns:repeat(var(--c),1fr);gap:2px;width:min(100%,calc((100dvh - 250px) * var(--c) / var(--r)),560px);touch-action:manipulation;user-select:none;-webkit-user-select:none}
.sw-cell{position:relative;aspect-ratio:1;padding:0;border:2px solid var(--bk);border-radius:5px;background:linear-gradient(var(--sl3),var(--sl));box-shadow:inset 0 -3px 0 rgba(0,0,0,.25);font:inherit;font-size:clamp(11px,calc(min(100vw,560px) / var(--c) * .55),26px);line-height:1;color:#fff;display:flex;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent}
.sw-cell.o{background:#14101C;box-shadow:none}.sw-cell svg{width:78%;height:78%}.sw-cell:focus-visible{outline:3px solid #fff;z-index:1}
.sw-cell.boom{background:#7A1E30;animation:swBoom .35s ease-out}@keyframes swBoom{0%{transform:scale(.6)}60%{transform:scale(1.15)}100%{transform:scale(1)}}
.sw-msg{width:100%;max-width:520px;text-align:center}.sw-msg .mbtn{min-height:48px}
.sw-heart{position:fixed;width:22px;height:22px;pointer-events:none;z-index:40}.sw-heart svg{width:100%;height:100%}
@media (prefers-reduced-motion:reduce){.sw-cell.boom{animation:none}}`;

  R2.games.register({
    id: 'sweeper',
    schema: [
      { key: 'levels', type: 'list', label: 'Levels, one per line: columns x rows : mines (e.g. 8x8:10). The first three are used' },
      { key: 'loseMessages', type: 'list', label: 'Friendly messages when the Static gets her (one is picked each time)' },
      { key: 'winMessage', type: 'text', label: 'Message when a level is cleared' },
      { key: 'time3', type: 'number', label: '3-star total time in seconds (with no lost level)' },
      { key: 'time2', type: 'number', label: '2-star total time in seconds' },
      { key: 'retryText', type: 'text', label: 'Retry button text' }
    ],
    defaults: { levels: ['8x8:10', '10x10:18', '12x12:30'], loseMessages: ['The Static got you! No problem, same level again.', 'Bzzzt! Just a glitch. Try once more.', 'Oops, that was Static. You can do it!'], winMessage: 'Signal clear!', time3: 300, time2: 600, retryText: 'TRY AGAIN' },
    logic: { rng, parseLevel, neighbors, placeMines, countsFor, newState, reveal, chord, toggleFlag, isWon, flagsLeft, starsFor },
    mount(ctx) {
      const cfg = ctx.cfg, root = ctx.root, reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
      const st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
      const levels = (cfg.levels || []).map(parseLevel).filter(Boolean).slice(0, 3); while (levels.length < 3) levels.push(parseLevel(['8x8:10', '10x10:18', '12x12:30'][levels.length]));
      let li = 0, S = null, elapsed = 0, ticking = false, paused = false, dead = false, flagMode = false, losses = 0, score = 0, tick = 0, timers = [], press = null, over = false;
      const later = (f, ms) => { const t = setTimeout(() => { if (!dead) f(); }, ms); timers.push(t); };
      const tone = (f, d, w, v, dl) => { try { ctx.sfx.tone(f, d, w, v, dl); } catch (e) {} };

      function start() {
        const L = levels[li]; S = newState(L.cols, L.rows, L.mines); over = false; ticking = false; paintShell(); ctx.stars(starsFor(cfg, elapsed, losses));
      }
      function paintShell() {
        const L = levels[li], old = root.querySelector('.sw'); old && old.remove();
        const w = document.createElement('div'); w.className = 'sw';
        w.innerHTML = `<div class="sw-top t"><span data-mines>${S.minesN}</span><span>${li + 1}/3</span><span data-tm>${fmt(elapsed)}</span><button type="button" class="mbtn small ${flagMode ? '' : 'grey'}" data-flagmode aria-pressed="${flagMode}">Flag</button></div>
          <div class="sw-grid" style="--c:${L.cols};--r:${L.rows}">${S.open.map((_, i) => `<button type="button" class="sw-cell" data-i="${i}" aria-label="Cell ${i + 1}"></button>`).join('')}</div><div class="sw-msg"></div>`;
        root.appendChild(w);
      }
      function paintCell(i, boom) {
        const el = root.querySelector(`.sw-cell[data-i="${i}"]`); if (!el) return;
        el.className = 'sw-cell' + (S.open[i] ? ' o' : '') + (boom ? ' boom' : '');
        if (S.open[i]) el.innerHTML = S.mines && S.mines[i] ? SVG.mine : (S.counts[i] > 0 ? `<b style="color:${NUMCOL[S.counts[i]]};font-weight:400">${S.counts[i]}</b>` : '');
        else el.innerHTML = S.flag[i] ? SVG.flag : '';
        root.querySelector('[data-mines]').textContent = flagsLeft(S);
      }
      function afterOpen(list) {
        list.forEach(i => paintCell(i, S.lost && S.mines[i])); if (list.length) tone(420 + Math.min(list.length, 12) * 25, 0.05, 'triangle', 0.05);
        if (S.lost) return lose();
        if (isWon(S)) win();
      }
      function open(i) { if (paused || dead || over) return; if (!S.started) ticking = true; afterOpen(reveal(S, i, (Date.now() ^ (li * 7919)) >>> 0)); }
      function chordAt(i) { if (paused || dead || over) return; afterOpen(chord(S, i)); }
      function flag(i) { if (paused || dead || over) return; if (toggleFlag(S, i)) { paintCell(i); tone(S.flag[i] ? 760 : 520, 0.05, 'square', 0.04); } }
      function lose() {
        over = true; ticking = false; losses++; tone(150, 0.4, 'sawtooth', 0.08);
        S.mines.forEach((m, i) => { if (m && !S.open[i]) later(() => { S.open[i] = true; paintCell(i, true); }, reduced ? 0 : (i % 7) * 40); });
        const msgs = cfg.loseMessages && cfg.loseMessages.length ? cfg.loseMessages : ['The Static got you! Try again.'];
        root.querySelector('.sw-msg').innerHTML = `<p class="qq">${esc(msgs[Math.floor(Math.random() * msgs.length)])}</p><button type="button" class="mbtn" data-retry>${esc(cfg.retryText || 'TRY AGAIN')}</button>`;   // same level again, no penalty
      }
      function win() {
        over = true; ticking = false; score += Math.max(100, 1500 - Math.round(elapsed)); [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.08, i * 0.09));
        root.querySelector('.sw-msg').innerHTML = `<p class="qq">${esc(cfg.winMessage || 'Signal clear!')}</p>`; hearts();
        later(() => { if (++li >= 3) { clearInterval(tick); ctx.win({ score, stars: starsFor(cfg, elapsed, losses) }); } else start(); }, reduced ? 1200 : 2600);
      }
      function hearts() {                                   // hearts rain down from the revealed field
        if (reduced) return; const cells = Array.from(root.querySelectorAll('.sw-cell.o')), H = innerHeight;
        for (let k = 0; k < 42; k++) {
          const c = cells[Math.floor(Math.random() * cells.length)]; if (!c) break; const r = c.getBoundingClientRect(), e = document.createElement('div'); e.className = 'sw-heart'; e.innerHTML = SVG.heart; e.style.left = r.left + 'px'; e.style.top = r.top + 'px'; document.body.appendChild(e);
          e.animate([{ transform: 'translate(0,0) scale(.4)', opacity: 0 }, { opacity: 1, offset: .15 }, { transform: `translate(${(Math.random() - .5) * 90}px,${H - r.top + 30}px) rotate(${(Math.random() - .5) * 120}deg) scale(1)`, opacity: 0.9 }], { duration: 1500 + Math.random() * 900, delay: Math.random() * 500, easing: 'ease-in', fill: 'backwards' }).onfinish = () => e.remove();
        }
      }
      /* input: tap = open (or flag in flag mode), long-press / right-click = flag, click on a number = chord, arrows + Enter + F on the keyboard */
      const cellOf = e => e.target.closest('.sw-cell');
      const onDown = e => { const c = cellOf(e); if (!c || e.button > 0) return; press = { i: +c.dataset.i, long: false, t: setTimeout(() => { if (press) { press.long = true; flag(press.i); } }, 450) }; };
      const onUp = e => {
        const c = cellOf(e); if (!press) return; clearTimeout(press.t); const p = press; press = null; if (p.long || !c || +c.dataset.i !== p.i || e.button > 0) return;
        if (flagMode) flag(p.i); else if (S.open[p.i]) chordAt(p.i); else open(p.i);
      };
      const onClick = e => {
        if (e.target.closest('[data-retry]')) { start(); return; }
        const fm = e.target.closest('[data-flagmode]'); if (fm) { flagMode = !flagMode; fm.classList.toggle('grey', !flagMode); fm.setAttribute('aria-pressed', flagMode); }
      };
      const onCtx = e => { const c = cellOf(e); if (c) { e.preventDefault(); flag(+c.dataset.i); } };
      const onAux = e => { const c = cellOf(e); if (c && e.button === 1) { e.preventDefault(); chordAt(+c.dataset.i); } };
      const onKey = e => {
        const cells = Array.from(root.querySelectorAll('.sw-cell')), L = levels[li]; if (!cells.length || paused) return;
        const i = Math.max(0, cells.indexOf(document.activeElement)); let j = i;
        if (e.key === 'ArrowRight') j = Math.min(cells.length - 1, i + 1); else if (e.key === 'ArrowLeft') j = Math.max(0, i - 1); else if (e.key === 'ArrowDown') j = Math.min(cells.length - 1, i + L.cols); else if (e.key === 'ArrowUp') j = Math.max(0, i - L.cols);
        else if (e.key === 'f' || e.key === 'F') { flag(i); return; } else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); S.open[i] ? chordAt(i) : open(i); return; } else return;
        e.preventDefault(); cells[j].focus();
      };
      root.addEventListener('pointerdown', onDown); root.addEventListener('pointerup', onUp); root.addEventListener('click', onClick); root.addEventListener('contextmenu', onCtx); root.addEventListener('auxclick', onAux); document.addEventListener('keydown', onKey);
      tick = setInterval(() => { if (ticking && !paused) { elapsed += 0.25; const e = root.querySelector('[data-tm]'); e && (e.textContent = fmt(elapsed)); } }, 250);
      start();
      return { pause() { paused = true; clearTimeout(press && press.t); press = null; }, resume() { paused = false; }, destroy() { dead = true; clearInterval(tick); timers.forEach(clearTimeout); document.removeEventListener('keydown', onKey); root.innerHTML = ''; document.querySelectorAll('.sw-heart').forEach(h => h.remove()); } };
    }
  });
})();
