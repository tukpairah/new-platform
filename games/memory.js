/* Photo Memory (easy): 3 levels (4x3, 4x4, 6x4). Pairs come from cfg.photos; missing ones are filled with drawn R2 icons.
   Everything she sees is in content/games/memory.js (see the schema below). Pure rules are in def.logic (tested). */
(function () {
  'use strict';
  const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  function shuffle(arr, seed) { const a = arr.slice(), r = rng(seed); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const LEVELS = [{ cols: 4, rows: 3 }, { cols: 4, rows: 4 }, { cols: 6, rows: 4 }];
  const buildDeck = (pairs, seed) => { const d = []; for (let i = 0; i < pairs; i++) d.push(i, i); return shuffle(d, seed); };   // every pair id exactly twice, shuffled by the seed
  const G = '<g stroke="#12062F" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">', V = b => `<svg viewBox="0 0 48 48" aria-hidden="true">${G}${b}</g></svg>`;
  const ICONS = [
    V('<path d="M24 41C6 28 9 12 19 12c3 0 4 2 5 4 1-2 2-4 5-4 10 0 13 16-5 29z" fill="#E8403A"/>'),
    V('<path d="M24 5l5.5 12 13 1.5-9.7 8.8 2.7 12.9L24 33.5 12.5 40.2l2.7-12.9L5.5 18.5l13-1.5z" fill="#FFD21F"/>'),
    V('<rect x="14" y="36" width="20" height="7" rx="2" fill="#4A86F2"/><path d="M24 36V16" fill="none"/><circle cx="24" cy="12" r="5" fill="#F4C444"/><path d="M13 8a15 15 0 0 0 0 10M35 8a15 15 0 0 1 0 10" fill="none" stroke="#6FD0FF"/>'),
    V('<circle cx="24" cy="24" r="12" fill="#C792FF"/><ellipse cx="24" cy="24" rx="20" ry="6" fill="none" stroke="#FFD21F" transform="rotate(-20 24 24)"/>'),
    V('<path d="M32 6a18 18 0 1 0 10 28A15 15 0 0 1 32 6z" fill="#FFE27A"/>'),
    V('<circle cx="24" cy="24" r="9" fill="#FF8A1F"/><path d="M24 4v6M24 38v6M4 24h6M38 24h6M10 10l4 4M34 34l4 4M38 10l-4 4M10 38l4-4" fill="none"/>'),
    V('<path d="M24 4c8 6 9 18 7 28H17c-2-10-1-22 7-28z" fill="#E4EAF5"/><circle cx="24" cy="18" r="4" fill="#5B9BFF"/><path d="M17 26l-6 8 7-2zM31 26l6 8-7-2z" fill="#E8403A"/><path d="M20 36l4 8 4-8z" fill="#FF8A1F"/>'),
    V('<circle cx="15" cy="15" r="9" fill="#FFD21F"/><circle cx="15" cy="15" r="3" fill="#12062F"/><path d="M21 21l20 20M33 33l5-5M38 38l5-5" fill="none" stroke-width="4"/>'),
    V('<circle cx="24" cy="24" r="13" fill="#9AA7C2"/><circle cx="24" cy="24" r="5" fill="#12062F"/><path d="M24 5v7M24 36v7M5 24h7M36 24h7M10 10l5 5M33 33l5 5M38 10l-5 5M10 38l5-5" fill="none"/>'),
    V('<path d="M12 34a8 8 0 0 1 0-16 11 11 0 0 1 21-2 9 9 0 0 1 2 18z" fill="#DDE6F7"/>'),
    V('<rect x="12" y="22" width="24" height="20" rx="4" fill="#E4EAF5"/><path d="M12 22a12 12 0 0 1 24 0z" fill="#fff"/><circle cx="24" cy="15" r="3.5" fill="#E8403A"/>'),
    V('<rect x="8" y="14" width="30" height="20" rx="4" fill="#8CEB6B"/><rect x="38" y="20" width="4" height="8" fill="#12062F"/><path d="M26 17l-6 8h6l-4 7" fill="none" stroke="#fff"/>')
  ];
  /* which picture sits behind each pair: real photos first (shuffled), then drawn icons for what is missing */
  function plan(photos, n, seed) {
    const real = shuffle((photos || []).filter(Boolean).slice(0, 12).map((_, i) => i), seed).slice(0, n).map(i => ({ type: 'photo', i }));
    const icons = shuffle(ICONS.map((_, i) => i), seed + 1).slice(0, n - real.length).map(i => ({ type: 'icon', i }));
    return real.concat(icons);
  }
  const num = (a, i, d) => { const v = Number(a && a[i]); return isFinite(v) && v > 0 ? v : d; };
  const rate = (v, t3, t2) => v <= t3 ? 3 : v <= t2 ? 2 : 1;
  const levelStars = (c, lv, moves, time) => Math.min(rate(moves, num(c.movesThree, lv, 99), num(c.movesTwo, lv, 99)), rate(time, num(c.timeThree, lv, 999), num(c.timeTwo, lv, 999)));
  const fmt = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');

  const CSS = `.mm{width:100%;display:flex;flex-direction:column;align-items:center;gap:10px}
.mm-top{display:flex;justify-content:space-between;width:100%;max-width:520px;font-size:20px}
.mm-grid{display:grid;grid-template-columns:repeat(var(--c),1fr);gap:8px;width:min(100%,calc((100dvh - 230px) * var(--c) / var(--r)),520px)}
.mm-card{position:relative;aspect-ratio:1;padding:0;border:0;background:none;perspective:700px;-webkit-tap-highlight-color:transparent}
.mm-in{position:absolute;inset:0;transform-style:preserve-3d;transition:transform .35s ease-out}
.mm-card.up .mm-in{transform:rotateY(180deg)}
.mm-back,.mm-face{position:absolute;inset:0;border:3px solid var(--bk);border-radius:10px;backface-visibility:hidden;-webkit-backface-visibility:hidden;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:inset 0 -5px 0 rgba(0,0,0,.25),0 3px 0 var(--bk)}
.mm-back{background:var(--mmback,#4A86F2) center/cover}.mm-face{background:#F4F6FF;transform:rotateY(180deg)}
.mm-face img,.mm-face svg{width:86%;height:86%;object-fit:cover;border-radius:6px}.mm-face img{width:100%;height:100%;border-radius:0}
.mm-card.done .mm-face{box-shadow:0 0 0 3px #8CEB6B,0 3px 0 var(--bk)}.mm-card:focus-visible{outline:3px solid #fff;outline-offset:2px}
.mm-cap{position:absolute;left:50%;bottom:14px;transform:translate(-50%,10px);opacity:0;max-width:min(90%,420px);padding:10px 16px;text-align:center;font-size:18px;line-height:1.25;background:#fff;color:#1d1e26;border:3px solid var(--bk);border-radius:12px;transition:transform .25s,opacity .25s;pointer-events:none;z-index:3}
.mm-cap.show{opacity:1;transform:translate(-50%,0)}
.mm-fx{position:fixed;width:10px;height:10px;border-radius:2px;pointer-events:none;z-index:40}
@media (prefers-reduced-motion:reduce){.mm-in{transition:none}.mm-cap{transition:none}}`;

  R2.games.register({
    id: 'memory',
    schema: [
      { key: 'photos', type: 'images', label: 'Photos (6 to 12; each one becomes a pair. Fewer than the level needs are filled with drawn R2 icons)' },
      { key: 'captions', type: 'list', label: 'Captions, one line per photo in the same order (popup when its pair is found; empty line = none)' },
      { key: 'cardBack', type: 'image', label: 'Card back picture (empty = a plain colour)' },
      { key: 'backColor', type: 'color', label: 'Card back colour' },
      { key: 'movesThree', type: 'list', label: '3 stars if moves are at most (one number per level, 3 lines)' },
      { key: 'movesTwo', type: 'list', label: '2 stars if moves are at most (3 lines)' },
      { key: 'timeThree', type: 'list', label: '3 stars if time in seconds is at most (3 lines)' },
      { key: 'timeTwo', type: 'list', label: '2 stars if time in seconds is at most (3 lines)' },
      { key: 'levelLabel', type: 'text', label: 'Word for "Level"' },
      { key: 'clearText', type: 'text', label: 'Message when a level is finished' }
    ],
    defaults: { photos: [], captions: [], cardBack: '', backColor: '#4A86F2', movesThree: [8, 14, 26], movesTwo: [12, 20, 36], timeThree: [40, 70, 130], timeTwo: [70, 110, 200], levelLabel: 'Level', clearText: 'All pairs found!' },
    logic: { rng, shuffle, buildDeck, plan, levelStars, LEVELS, ICONS },
    mount(ctx) {
      const cfg = ctx.cfg, root = ctx.root, reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
      const st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
      const photos = (cfg.photos || []).filter(Boolean).slice(0, 12), seedBase = (Date.now() ^ 0x9E3779B9) >>> 0;
      let level = 0, moves = 0, elapsed = 0, ticking = false, paused = false, lock = false, first = null, found = 0, dead = false, score = 0, lstars = [], tick = 0, timers = [], deck = [], pl = [];
      const later = (f, ms) => { const t = setTimeout(() => { timers = timers.filter(x => x !== t); if (!dead) f(); }, ms); timers.push(t); };
      const tone = (f, d, w, v, dl) => { try { ctx.sfx.tone(f, d, w, v, dl); } catch (e) {} };

      function face(p) {
        if (p.type === 'photo') return `<img src="${esc(photos[p.i])}" alt="" draggable="false" data-ph="${p.i}">`;
        return ICONS[p.i % ICONS.length];
      }
      function start() {
        const L = LEVELS[level], pairs = L.cols * L.rows / 2, seed = seedBase + level * 101 + Math.floor(Math.random() * 1e6);
        pl = plan(photos, pairs, seed); deck = buildDeck(pairs, seed + 7); moves = 0; elapsed = 0; ticking = false; first = null; found = 0; lock = false; clearInterval(tick);
        root.querySelector('.mm') && root.querySelector('.mm').remove();
        const back = cfg.cardBack ? `background-image:url('${esc(cfg.cardBack)}')` : '';
        const wrap = document.createElement('div'); wrap.className = 'mm'; wrap.style.setProperty('--mmback', cfg.backColor || '#4A86F2');
        wrap.innerHTML = `<div class="mm-top t"><span>${esc(cfg.levelLabel || 'Level')} ${level + 1}/3</span><span data-mv>0</span><span data-tm>0:00</span></div>
          <div class="mm-grid" style="--c:${L.cols};--r:${L.rows}">${deck.map((id, n) => `<button type="button" class="mm-card" data-n="${n}" aria-label="Card ${n + 1}"><span class="mm-in"><span class="mm-back" style="${back}"></span><span class="mm-face">${face(pl[id])}</span></span></button>`).join('')}</div><div class="mm-cap" aria-live="polite"></div>`;
        root.appendChild(wrap);
        wrap.querySelectorAll('.mm-face img').forEach(im => im.addEventListener('error', () => { const k = (+im.dataset.ph) % ICONS.length; im.replaceWith(Object.assign(document.createElement('span'), { innerHTML: ICONS[k] }).firstChild); }, { once: true }));   // a missing photo becomes a drawn icon
        ctx.stars(3);
        tick = setInterval(() => { if (ticking && !paused) { elapsed += 0.25; wrap.querySelector('[data-tm]').textContent = fmt(elapsed); } }, 250);
      }
      function caption(p) {
        if (p.type !== 'photo') return; const c = (cfg.captions || [])[p.i]; if (!c) return;
        const el = root.querySelector('.mm-cap'); el.textContent = c; el.classList.add('show'); later(() => el.classList.remove('show'), 2200);
      }
      function burst(card) {
        if (reduced) return; const r = card.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, cols = ['#FFD84A', '#FF6FA8', '#6FD0FF', '#8CEB6B', '#C792FF'];
        for (let i = 0; i < 14; i++) {
          const p = document.createElement('i'); p.className = 'mm-fx'; p.style.left = cx + 'px'; p.style.top = cy + 'px'; p.style.background = cols[i % cols.length]; document.body.appendChild(p);
          const a = Math.random() * 6.283, d = 40 + Math.random() * 50;
          p.animate([{ transform: 'translate(0,0) scale(.5)', opacity: 1 }, { transform: `translate(${Math.cos(a) * d}px,${Math.sin(a) * d}px) rotate(${Math.random() * 360}deg) scale(1)`, opacity: 0 }], { duration: 650, easing: 'ease-out' }).onfinish = () => p.remove();
        }
      }
      function flip(card) {
        if (paused || lock || dead || card.classList.contains('up') || card.classList.contains('done')) return;
        ticking = true; card.classList.add('up'); tone(620, 0.05, 'triangle', 0.05);
        if (!first) { first = card; return; }
        moves++; root.querySelector('[data-mv]').textContent = moves + ' moves';
        const a = first, b = card; first = null;
        if (deck[+a.dataset.n] === deck[+b.dataset.n]) {
          a.classList.add('done'); b.classList.add('done'); found++; [784, 988, 1175].forEach((f, i) => tone(f, 0.12, 'triangle', 0.07, i * 0.07)); burst(b); caption(pl[deck[+a.dataset.n]]);
          const live = levelStars(cfg, level, moves, elapsed); ctx.stars(live);
          if (found === LEVELS[level].cols * LEVELS[level].rows / 2) later(done, 900);
        } else { lock = true; tone(220, 0.12, 'square', 0.04); later(() => { a.classList.remove('up'); b.classList.remove('up'); lock = false; }, 800); }
      }
      function done() {
        ticking = false; const s = levelStars(cfg, level, moves, elapsed); lstars.push(s); score += Math.max(0, Math.round(1000 - moves * 20 - elapsed * 2));
        [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.16, 'triangle', 0.08, i * 0.09));
        const cap = root.querySelector('.mm-cap'); cap.textContent = cfg.clearText || 'All pairs found!'; cap.classList.add('show');
        later(() => { if (++level >= LEVELS.length) { clearInterval(tick); ctx.win({ score, stars: Math.max(1, Math.round(lstars.reduce((a, b) => a + b, 0) / lstars.length)) }); } else start(); }, 1300);
      }
      root.addEventListener('click', onClick);
      function onClick(e) { const c = e.target.closest('.mm-card'); if (c) flip(c); }
      function onKey(e) {                                   // arrows move between cards, Enter / Space flips the focused card
        const cards = Array.from(root.querySelectorAll('.mm-card')); if (!cards.length || paused) return;
        const L = LEVELS[level], i = Math.max(0, cards.indexOf(document.activeElement)); let j = i;
        if (e.key === 'ArrowRight') j = Math.min(cards.length - 1, i + 1); else if (e.key === 'ArrowLeft') j = Math.max(0, i - 1);
        else if (e.key === 'ArrowDown') j = Math.min(cards.length - 1, i + L.cols); else if (e.key === 'ArrowUp') j = Math.max(0, i - L.cols); else return;
        e.preventDefault(); cards[j].focus();
      }
      document.addEventListener('keydown', onKey);
      start();
      return {
        pause() { paused = true; }, resume() { paused = false; },
        destroy() { dead = true; clearInterval(tick); timers.forEach(clearTimeout); document.removeEventListener('keydown', onKey); root.removeEventListener('click', onClick); root.innerHTML = ''; }
      };
    }
  });
})();
