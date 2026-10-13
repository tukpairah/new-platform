/* "Message" (Day 7, shown as Transmission in the idea). The id stays "cipher" so the icon, the unlock day, the music and the tests keep working; the old code-breaking mechanic is gone.
   R2 brings the final message in broken pieces: for each sentence the words are scattered, and she taps them in the right order to rebuild it.
   A wrong sentence sends only the misplaced words back (the right start stays). 3 free hints. Stars come from mistakes + hints.
   Content: content/games/cipher.js (the sentences, one per line). Pure rules are in def.logic (tested). */
(function () {
  'use strict';
  const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const norm = s => String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
  const parseLines = s => String(s == null ? '' : s).split(/\n+/).map(norm).filter(Boolean);
  const wordsOf = line => norm(line).split(' ').filter(Boolean);
  const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return h; };
  /* the order in which the words of a sentence are shown: a seeded shuffle that is never the right order (unless every word is the same) */
  function shuffleWords(ws, seed) {
    const n = ws.length, idx = Array.from({ length: n }, (_, i) => i), r = rng(seed);
    for (let tries = 0; tries < 40; tries++) {
      for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
      if (n < 2 || idx.some((v, i) => ws[v] !== ws[i])) break;
    }
    return idx;
  }
  const correctPrefix = (placedWords, ws) => { let k = 0; while (k < placedWords.length && k < ws.length && placedWords[k] === ws[k]) k++; return k; };
  const isSolvedLine = (placedWords, ws) => placedWords.length === ws.length && correctPrefix(placedWords, ws) === ws.length;
  const num = (v, d) => (v === '' || v == null || isNaN(+v)) ? d : +v;
  const starsFor = (errs, c) => errs <= num(c && c.errors3, 2) ? 3 : errs <= num(c && c.errors2, 6) ? 2 : 1;
  const DEFAULT_LINES = ['Je ne savais pas que cette personne serait toi.', 'Tu n’as pas besoin d’être parfaite pour être précieuse à mes yeux.', 'Je veux construire une vie avec la personne que j’aime.', 'Je suis tellement heureux que nos chemins se soient croisés.', 'Joyeux anniversaire, mon amour.'].join('\n');

  const CSS = `.tr{width:100%;max-width:560px;display:flex;flex-direction:column;align-items:center;gap:10px}
.tr-top{display:flex;justify-content:space-between;width:100%;font-size:20px}.tr-coach{margin:0;min-height:24px;text-align:center;font-size:18px;color:var(--y2)}
.tr-done{width:100%;display:flex;flex-direction:column;gap:6px;max-height:26dvh;overflow-y:auto}.tr-done p{margin:0;padding:6px 12px;border-radius:10px;background:rgba(0,0,0,.25);font-size:16px;line-height:1.3;text-align:center;opacity:.9}
.tr-done.big p{font-size:19px;opacity:1}
.tr-slot,.tr-pool{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;width:100%;padding:10px;border-radius:12px}
.tr-slot{min-height:76px;align-content:flex-start;border:3px dashed rgba(255,255,255,.35);background:rgba(0,0,0,.2)}
.tr-pool{min-height:64px;align-content:flex-start}
.tr-c{min-height:46px;padding:0 14px;border:3px solid var(--bk);border-radius:10px;background:linear-gradient(var(--sl3),var(--sl));color:#fff;font:inherit;font-size:20px;line-height:1;box-shadow:0 3px 0 var(--bk);-webkit-tap-highlight-color:transparent}
.tr-c.in{background:linear-gradient(var(--y2),var(--y));color:var(--bk)}
.tr-c.bad{background:linear-gradient(#FF9A90,#E8403A);color:#fff;animation:trShake .35s}
.tr-c.ok{background:linear-gradient(#8CEB6B,#45BA20);color:#fff}
@keyframes trShake{25%{transform:translateX(-5px)}75%{transform:translateX(5px)}}
.tr-tools{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}.tr-tools .mbtn.small{min-height:46px;margin:0;padding:0 16px;font-size:17px}
.tr-end{text-align:center;width:100%}.tr-end .mbtn{min-height:50px}
@media (prefers-reduced-motion:reduce){.tr-c.bad{animation:none}}`;

  R2.games.register({
    id: 'cipher',
    schema: [
      { key: 'lines', type: 'longtext', label: 'The message in pieces: ONE sentence per line (about 5 lines, each 4 to 12 words). The words are scattered and she puts them back in order. The last line is the finale.' },
      { key: 'afterText', type: 'longtext', label: 'A line shown under the finished message' },
      { key: 'hintsPerGame', type: 'number', label: 'Hints (place the next right word), default 3' },
      { key: 'errors3', type: 'number', label: '3 stars if mistakes + hints are at most (default 2)' },
      { key: 'errors2', type: 'number', label: '2 stars if mistakes + hints are at most (default 6)' }
    ],
    defaults: { lines: DEFAULT_LINES, afterText: '', hintsPerGame: 3, errors3: 2, errors2: 6 },
    logic: { rng, norm, parseLines, wordsOf, shuffleWords, correctPrefix, isSolvedLine, starsFor, hash },
    mount(ctx) {
      const cfg = ctx.cfg, root = ctx.root;
      const st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
      let lines = parseLines(cfg.lines); if (!lines.length) lines = parseLines(DEFAULT_LINES);
      const h = hash(lines.join('|')), per = Math.max(0, Math.floor(num(cfg.hintsPerGame, 3)));
      let saved = store.get('cipher', null);
      if (!saved || saved.h !== h || saved.solved || !(saved.line >= 0 && saved.line < lines.length)) saved = { h, seed: (Date.now() ^ 0x7F4A7C15) >>> 0, line: 0, errs: 0, hints: 0, solved: false };
      let li = saved.line, errs = saved.errs || 0, hints = saved.hints || 0, ws = [], order = [], placed = [], locked = false, paused = false, dead = false, over = false, timers = [];
      const later = (f, ms) => { const t = setTimeout(() => { if (!dead) f(); }, ms); timers.push(t); };
      const tone = (f, d, w, v, dl) => { try { ctx.sfx.tone(f, d, w, v, dl); } catch (e) {} };
      const flush = () => store.set('cipher', { h, seed: saved.seed, line: li, errs, hints, solved: saved.solved });
      const w = document.createElement('div'); w.className = 'tr';
      w.innerHTML = `<div class="tr-top t"><span>Message</span><span data-prog></span></div><p class="tr-coach" data-coach></p>
        <div class="tr-done" data-done></div><div class="tr-slot" data-slot></div><div class="tr-pool" data-pool></div>
        <div class="tr-tools"><button type="button" class="mbtn small grey" data-clear>Effacer</button><button type="button" class="mbtn small" data-hint></button></div><div class="tr-end"></div>`;
      root.appendChild(w);
      const $ = s => w.querySelector(s), coach = t => { $('[data-coach]').textContent = t; };
      const chip = (id, cls) => `<button type="button" class="tr-c ${cls || ''}" data-id="${id}">${esc(ws[id])}</button>`;
      function draw(bad) {
        const inSlot = new Set(placed);
        $('[data-slot]').innerHTML = placed.map(id => chip(id, 'in' + (bad && bad.has(id) ? ' bad' : ''))).join('');
        $('[data-pool]').innerHTML = order.filter(id => !inSlot.has(id)).map(id => chip(id)).join('');
        $('[data-prog]').textContent = (li + 1) + ' / ' + lines.length;
        const hb = $('[data-hint]'); hb.textContent = 'Indice (' + Math.max(0, per - hints) + ')'; hb.disabled = hints >= per || over || locked;
        $('[data-clear]').disabled = !placed.length || over || locked; ctx.stars(starsFor(errs + hints, cfg));
      }
      function startLine() {
        ws = wordsOf(lines[li]); order = shuffleWords(ws, saved.seed + li * 977); placed = []; locked = false;
        coach(li === lines.length - 1 ? 'La dernière ! Remets les mots dans l’ordre.' : 'Touche les mots dans l’ordre pour refaire la phrase.'); draw();
      }
      const wordsPlaced = () => placed.map(id => ws[id]);
      function check() {
        const pw = wordsPlaced();
        if (isSolvedLine(pw, ws)) return lineDone();
        errs++; locked = true; const k = correctPrefix(pw, ws), bad = new Set(placed.slice(k)); tone(220, 0.15, 'square', 0.06); coach('Presque ! Les mots mal placés reviennent.'); draw(bad); flush();
        later(() => { placed = placed.slice(0, k); locked = false; draw(); }, 850);
      }
      function lineDone() {
        locked = true; const slot = $('[data-slot]'); slot.querySelectorAll('.tr-c').forEach(b => { b.classList.remove('in'); b.classList.add('ok'); });
        [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.14, 'triangle', 0.07, i * 0.08)); coach('Bravo !');
        later(() => {
          const p = document.createElement('p'); p.textContent = lines[li]; $('[data-done]').appendChild(p); $('[data-done]').scrollTop = 1e6;
          if (li + 1 < lines.length) { li++; flush(); startLine(); } else win();
        }, 900);
      }
      function win() {
        over = true; saved.solved = true; flush(); $('[data-slot]').hidden = true; $('[data-pool]').hidden = true; w.querySelector('.tr-tools').hidden = true; $('[data-done]').classList.add('big'); $('[data-done]').style.maxHeight = 'none';
        coach(''); try { ctx.sfx.speak(lines[lines.length - 1], 'love'); } catch (e) {} R2.bus.emit('quiz:right');
        $('.tr-end').innerHTML = `${cfg.afterText ? `<p class="qq">${esc(cfg.afterText)}</p>` : ''}<button type="button" class="mbtn" data-finish>Continuer</button>`;
      }
      function hint() {
        if (over || locked || paused || hints >= per) return; const k = correctPrefix(wordsPlaced(), ws); placed = placed.slice(0, k);
        const next = order.find(id => placed.indexOf(id) < 0 && ws[id] === ws[k]); if (next == null) return;
        placed.push(next); hints++; tone(880, 0.12, 'triangle', 0.07); coach('Un mot de R2 ! Continue.'); draw(); flush(); if (placed.length === ws.length) check();
      }
      const onClick = e => {
        if (over || paused) { if (e.target.closest('[data-finish]')) ctx.win({ score: Math.max(500, 3000 - errs * 150 - hints * 200), stars: starsFor(errs + hints, cfg) }); return; }
        if (locked) return; const c = e.target.closest('.tr-c');
        if (c) { const id = +c.dataset.id, i = placed.indexOf(id); if (i >= 0) placed.splice(i, 1); else placed.push(id); tone(i >= 0 ? 380 : 560, 0.04, 'triangle', 0.05); draw(); if (placed.length === ws.length) check(); return; }
        if (e.target.closest('[data-clear]')) { placed = []; tone(300, 0.04, 'triangle', 0.05); draw(); } else if (e.target.closest('[data-hint]')) hint();
      };
      root.addEventListener('click', onClick); startLine();
      return { pause() { paused = true; flush(); }, resume() { paused = false; }, destroy() { dead = true; flush(); timers.forEach(clearTimeout); root.removeEventListener('click', onClick); root.innerHTML = ''; } };
    }
  });
})();
