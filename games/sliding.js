/* Sliding Puzzle (easy): 3x3, 4x4, 5x5 with a guaranteed-solvable shuffle (inversion parity). Tap a tile (a whole row/column slides) or swipe.
   Content: content/games/sliding.js. Pure rules are in def.logic (tested). */
(function () {
  'use strict';
  const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const SIZES = [3, 4, 5];
  const solvedBoard = size => { const a = []; for (let i = 1; i < size * size; i++) a.push(i); a.push(0); return a; };         // 1..n-1 then the blank (0)
  const isSolved = t => t.every((v, i) => v === (i === t.length - 1 ? 0 : i + 1));
  function inversions(tiles) { const a = tiles.filter(Boolean); let c = 0; for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) if (a[i] > a[j]) c++; return c; }
  /* odd width: solvable iff inversions are even. even width: solvable iff inversions + (blank's row counted from the bottom, 1-based) is odd */
  function solvable(tiles, size) { const inv = inversions(tiles); if (size % 2) return inv % 2 === 0; return (inv + (size - Math.floor(tiles.indexOf(0) / size))) % 2 === 1; }
  function shuffleBoard(size, seed) {
    const r = rng(seed);
    for (let n = 0; ; n++) {
      const a = solvedBoard(size); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      if (!solvable(a, size)) { const x = a.findIndex(v => v), y = a.findIndex((v, i) => v && i > x); [a[x], a[y]] = [a[y], a[x]]; }   // swapping two tiles flips the parity
      if (!isSolved(a)) return a;
    }
  }
  /* slide the tile at idx toward the blank (a whole row or column moves together). returns { tiles, moved } or null */
  function slide(tiles, size, idx) {
    const b = tiles.indexOf(0); if (idx === b || idx < 0 || idx >= tiles.length) return null;
    const sameRow = Math.floor(idx / size) === Math.floor(b / size), sameCol = idx % size === b % size; if (!sameRow && !sameCol) return null;
    const dir = (sameRow ? 1 : size) * Math.sign(idx - b), t = tiles.slice(); let cur = b, moved = 0;
    while (cur !== idx) { t[cur] = t[cur + dir]; cur += dir; moved++; } t[idx] = 0; return { tiles: t, moved };
  }
  /* a swipe/arrow moves a tile in direction (dx, dy) into the blank */
  function moveDir(tiles, size, dx, dy) {
    const b = tiles.indexOf(0), c = b % size - dx, r = Math.floor(b / size) - dy; if (c < 0 || c >= size || r < 0 || r >= size) return null;
    return slide(tiles, size, r * size + c);
  }
  const num = (a, i, d) => { const v = Number(a && a[i]); return isFinite(v) && v > 0 ? v : d; };
  const rate = (v, t3, t2) => v <= t3 ? 3 : v <= t2 ? 2 : 1;
  const levelStars = (c, lv, moves, time) => Math.min(rate(moves, num(c.movesThree, lv, 99), num(c.movesTwo, lv, 99)), rate(time, num(c.timeThree, lv, 999), num(c.timeTwo, lv, 999)));
  const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

  const CSS = `.sl{width:100%;display:flex;flex-direction:column;align-items:center;gap:10px}
.sl-top{display:flex;justify-content:space-between;align-items:center;width:100%;max-width:520px;font-size:20px;gap:8px}
.sl-top .mbtn.small{min-height:44px}
.sl-board{position:relative;width:min(100%,calc(100dvh - 250px),520px);aspect-ratio:1;touch-action:none;user-select:none;-webkit-user-select:none;border:4px solid var(--bk);border-radius:12px;background:rgba(0,0,0,.35);overflow:hidden}
.sl-tile{position:absolute;left:0;top:0;transition:transform .16s ease-out;will-change:transform}
.sl-tile i{position:absolute;inset:2px;border-radius:7px;border:2px solid var(--bk);background-color:#4A86F2;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:clamp(16px,6vw,34px);color:#fff;text-shadow:2px 0 0 var(--bk),-2px 0 0 var(--bk),0 2px 0 var(--bk),0 -2px 0 var(--bk);box-shadow:inset 0 -4px 0 rgba(0,0,0,.2)}
.sl-prev{position:absolute;inset:0;opacity:0;transition:opacity .2s;pointer-events:none;border-radius:8px}.sl-prev.on{opacity:1}
.sl-final{width:100%;max-width:520px;text-align:center}.sl-final .pic{width:100%;aspect-ratio:1;border:4px solid var(--bk);border-radius:12px;margin-bottom:10px;animation:slReveal .8s ease-out both}
@keyframes slReveal{from{transform:scale(.7);opacity:0}to{transform:none;opacity:1}}
@media (prefers-reduced-motion:reduce){.sl-tile{transition:none}.sl-final .pic{animation:none}}`;

  R2.games.register({
    id: 'sliding',
    schema: [
      { key: 'image', type: 'image', label: 'The photo to put back together (empty = a coloured pattern with numbers)' },
      { key: 'caption', type: 'longtext', label: 'Caption shown with the full photo after the last level' },
      { key: 'showNumbers', type: 'number', label: 'Show numbers on photo tiles (1 = yes, 0 = no). Without a photo numbers always show' },
      { key: 'movesThree', type: 'list', label: '3 stars if moves are at most (one number per level, 3 lines)' },
      { key: 'movesTwo', type: 'list', label: '2 stars if moves are at most (3 lines)' },
      { key: 'timeThree', type: 'list', label: '3 stars if time in seconds is at most (3 lines)' },
      { key: 'timeTwo', type: 'list', label: '2 stars if time in seconds is at most (3 lines)' },
      { key: 'levelLabel', type: 'text', label: 'Word for "Level"' }
    ],
    defaults: { image: '', caption: '', showNumbers: 0, movesThree: [30, 90, 200], movesTwo: [60, 160, 340], timeThree: [60, 180, 420], timeTwo: [120, 320, 720], levelLabel: 'Level' },
    logic: { rng, solvedBoard, isSolved, inversions, solvable, shuffleBoard, slide, moveDir, levelStars, SIZES },
    mount(ctx) {
      const cfg = ctx.cfg, root = ctx.root, seedBase = (Date.now() ^ 0x51ED270B) >>> 0;
      const st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
      let level = 0, tiles = [], size = 3, moves = 0, elapsed = 0, ticking = false, paused = false, dead = false, score = 0, lstars = [], tick = 0, hasImg = false, down = null, timers = [], els = {};
      const later = (f, ms) => { const t = setTimeout(() => { if (!dead) f(); }, ms); timers.push(t); };
      const tone = (f, d, w, v, dl) => { try { ctx.sfx.tone(f, d, w, v, dl); } catch (e) {} };
      const art = (v, n) => {                                  // the picture of tile v (or of the whole board when v is null)
        if (hasImg) return v == null ? `background:url('${esc(cfg.image)}') center/cover` : `background-image:url('${esc(cfg.image)}');background-size:${n * 100}% ${n * 100}%;background-position:${((v - 1) % n) / (n - 1) * 100}% ${Math.floor((v - 1) / n) / (n - 1) * 100}%`;
        return v == null ? 'background:linear-gradient(135deg,#4A86F2,#C792FF 50%,#FF6FA8)' : `background-image:linear-gradient(135deg,hsl(${(v * 37) % 360} 75% 58%),hsl(${(v * 37 + 40) % 360} 70% 42%))`;
      };
      function place(v) { const i = tiles.indexOf(v); els[v].style.transform = `translate(${(i % size) * 100}%,${Math.floor(i / size) * 100}%)`; }
      function start() {
        size = SIZES[level]; tiles = shuffleBoard(size, seedBase + level * 977 + Math.floor(Math.random() * 1e6)); moves = 0; elapsed = 0; ticking = false; clearInterval(tick); els = {};
        const old = root.querySelector('.sl'); old && old.remove();
        const w = document.createElement('div'); w.className = 'sl';
        const nums = !hasImg || +cfg.showNumbers;
        w.innerHTML = `<div class="sl-top t"><span>${esc(cfg.levelLabel || 'Level')} ${level + 1}/3</span><span data-mv>0</span><span data-tm>0:00</span><button type="button" class="mbtn small grey" data-prev>Preview</button></div>
          <div class="sl-board">${tiles.filter(Boolean).sort((a, b) => a - b).map(v => `<div class="sl-tile" data-v="${v}" style="width:${100 / size}%;height:${100 / size}%"><i style="${art(v, size)}">${nums ? v : ''}</i></div>`).join('')}<div class="sl-prev" style="${art(null)}"></div></div>`;
        root.appendChild(w); w.querySelectorAll('.sl-tile').forEach(e => { els[+e.dataset.v] = e; }); tiles.forEach(v => v && place(v)); ctx.stars(3);
        tick = setInterval(() => { if (ticking && !paused) { elapsed += 0.25; const e = root.querySelector('[data-tm]'); e && (e.textContent = fmt(elapsed)); } }, 250);
      }
      function apply(r) {
        if (!r || paused || dead) return; tiles = r.tiles; ticking = true; moves++; root.querySelector('[data-mv]').textContent = moves + ' moves';
        tiles.forEach(v => v && place(v)); tone(380 + Math.min(moves, 40) * 6, 0.05, 'triangle', 0.05); ctx.stars(levelStars(cfg, level, moves, elapsed));
        if (isSolved(tiles)) { ticking = false; later(complete, 350); }
      }
      function complete() {
        lstars.push(levelStars(cfg, level, moves, elapsed)); score += Math.max(0, Math.round(1500 - moves * 5 - elapsed * 2)); [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.08, i * 0.09));
        if (++level < SIZES.length) { later(start, 600); return; }
        clearInterval(tick); root.querySelector('.sl').remove();
        const f = document.createElement('div'); f.className = 'sl sl-final';
        f.innerHTML = `<div class="pic" style="${art(null)}"></div>${cfg.caption ? `<p class="qq">${esc(cfg.caption)}</p>` : ''}<button type="button" class="mbtn" data-go style="min-height:52px">Continue</button>`;
        root.appendChild(f); f.querySelector('[data-go]').onclick = () => ctx.win({ score, stars: Math.max(1, Math.round(lstars.reduce((a, b) => a + b, 0) / lstars.length)) });
      }
      function cellAt(e) { const b = root.querySelector('.sl-board').getBoundingClientRect(); const c = Math.floor((e.clientX - b.left) / b.width * size), r = Math.floor((e.clientY - b.top) / b.height * size); return c < 0 || r < 0 || c >= size || r >= size ? -1 : r * size + c; }
      const onDown = e => { if (e.target.closest('.sl-board')) down = { x: e.clientX, y: e.clientY, idx: cellAt(e) }; };
      const onUp = e => {
        if (!down) return; const dx = e.clientX - down.x, dy = e.clientY - down.y, d = down; down = null;
        if (Math.abs(dx) > 18 || Math.abs(dy) > 18) apply(Math.abs(dx) > Math.abs(dy) ? moveDir(tiles, size, Math.sign(dx), 0) : moveDir(tiles, size, 0, Math.sign(dy)));   // swipe
        else if (d.idx >= 0) apply(slide(tiles, size, d.idx));                                                                                                                  // tap
      };
      const onKey = e => {
        const m = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
        if (m) { e.preventDefault(); apply(moveDir(tiles, size, m[0], m[1])); } else if (e.key === 'p' || e.key === 'P') showPrev();
      };
      function showPrev() { const p = root.querySelector('.sl-prev'); if (!p) return; p.classList.add('on'); later(() => p.classList.remove('on'), 2500); }
      root.addEventListener('pointerdown', onDown); root.addEventListener('pointerup', onUp); root.addEventListener('click', e => { if (e.target.closest('[data-prev]')) showPrev(); }); document.addEventListener('keydown', onKey);
      if (cfg.image) { const im = new Image(); const go = ok => { if (dead || hasImg === null) return; hasImg = ok; start(); }; hasImg = null; let fin = false; const f2 = ok => { if (fin) return; fin = true; hasImg = ok; start(); }; im.onload = () => f2(true); im.onerror = () => { console.warn('[sliding] image failed, using the drawn pattern:', cfg.image); f2(false); }; later(() => f2(false), 4000); im.src = cfg.image; }
      else start();
      return { pause() { paused = true; }, resume() { paused = false; }, destroy() { dead = true; clearInterval(tick); timers.forEach(clearTimeout); document.removeEventListener('keydown', onKey); root.removeEventListener('pointerdown', onDown); root.removeEventListener('pointerup', onUp); root.innerHTML = ''; } };
    }
  });
})();
