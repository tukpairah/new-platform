/* Cipher (hard): R2's transmission. The message (cfg.plaintext) is shown with a random letter-substitution cipher, new for every attempt.
   Tap a cipher letter, choose the plain letter; every copy updates. Frequency bars, 3 hints (reveal one letter), a free "check", progress saved.
   Latin and Cyrillic letters work; spaces and punctuation stay. Content: content/games/cipher.js. Pure rules are in def.logic (tested). */
(function () {
  'use strict';
  const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const LAT = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', CYR = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
  const isPlaceholder = s => !String(s || '').trim() || /\[\s*REPLACE/i.test(s);
  const prep = s => String(s).replace(/œ/g, 'oe').replace(/Œ/g, 'OE').replace(/æ/g, 'ae').replace(/Æ/g, 'AE').replace(/ß/g, 'ss');
  function baseOf(ch) {                                   // the letter of the alphabet a character stands for (accents folded), or null
    const up = ch.toUpperCase(); if (CYR.indexOf(up) >= 0) return up;
    const f = up.normalize('NFD').replace(/[̀-ͯ]/g, ''); return f.length === 1 && LAT.indexOf(f) >= 0 ? f : null;
  }
  const alphabetOf = b => CYR.indexOf(b) >= 0 ? CYR : LAT;
  /* a substitution with no letter standing for itself (Sattolo shuffle = one big cycle), the same for the same seed */
  function permute(alpha, seed) { const r = rng(seed), a = alpha.split(''); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * i); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function makeCipher(text, seed) {
    text = prep(text); const maps = { [LAT]: {}, [CYR]: {} }, inv = {};
    [LAT, CYR].forEach((alpha, k) => { const p = permute(alpha, seed + k * 7919); alpha.split('').forEach((c, i) => { maps[alpha][c] = p[i]; inv[p[i]] = c; }); });
    const tokens = text.split('').map(ch => { const b = baseOf(ch); return b ? { ch, plain: b, cipher: maps[alphabetOf(b)][b] } : { ch, plain: null, cipher: ch }; });
    return { tokens, inv, maps };
  }
  function frequency(tokens) { const f = {}; tokens.forEach(t => { if (t.plain) f[t.cipher] = (f[t.cipher] || 0) + 1; }); return Object.keys(f).map(k => ({ letter: k, n: f[k] })).sort((a, b) => b.n - a.n || (a.letter < b.letter ? -1 : 1)); }
  const solvedAll = (tokens, guesses) => tokens.every(t => !t.plain || guesses[t.cipher] === t.plain);
  const wrongLetters = (tokens, guesses) => Array.from(new Set(tokens.filter(t => t.plain && guesses[t.cipher] && guesses[t.cipher] !== t.plain).map(t => t.cipher)));
  function hintLetter(tokens, guesses, locked) {          // the most frequent letter that is not right yet
    const f = frequency(tokens).filter(x => guesses[x.letter] !== tokens.find(t => t.cipher === x.letter && t.plain).plain && locked.indexOf(x.letter) < 0); return f.length ? f[0].letter : null;
  }
  const hash = s => { let h = 5381; for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0; return h; };
  const starsFor = (hints, c) => hints <= (+c.hints3 >= 0 ? +c.hints3 : 0) ? 3 : hints <= (+c.hints2 >= 0 ? +c.hints2 : 2) ? 2 : 1;
  const SAMPLE = 'Beep boop! R2 carries every word across the sky, even over long distances.';

  const CSS = `.cp{width:100%;max-width:560px;display:flex;flex-direction:column;align-items:center;gap:8px}
.cp-top{display:flex;justify-content:space-between;width:100%;font-size:20px}.cp-note{margin:0;text-align:center;font-size:16px;opacity:.95}
.cp-text{display:flex;flex-wrap:wrap;gap:4px 14px;justify-content:center;width:100%;padding:6px 4px;max-height:36dvh;overflow-y:auto;overflow-x:hidden}
.cp-w{display:inline-flex;gap:2px}.cp-p{align-self:flex-start;font-size:26px;padding-top:6px;min-width:8px;text-align:center}
.cp-l{width:34px;height:56px;padding:0;border:2px solid var(--bk);border-radius:8px;background:linear-gradient(var(--sl3),var(--sl));color:#fff;font:inherit;display:flex;flex-direction:column;align-items:center;justify-content:center;-webkit-tap-highlight-color:transparent}
.cp-l b{font-weight:400;font-size:18px;opacity:.75}.cp-l i{font-style:normal;font-size:24px;min-height:28px;color:var(--y2)}
.cp-l.sel{background:linear-gradient(var(--y2),var(--y));color:var(--bk)}.cp-l.sel i{color:var(--bk)}.cp-l.lock i{color:#8CEB6B}.cp-l.bad{background:#b5586a}.cp-l.twin i{color:#FF9A90}.cp-l.rev{background:#2E8A12;animation:cpRev .3s ease-out}
@keyframes cpRev{from{transform:scale(.7)}60%{transform:scale(1.12)}to{transform:scale(1)}}
.cp-tools{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}.cp-tools .mbtn.small{min-height:46px;margin:0;padding:0 14px;font-size:17px}
.cp-freq{display:flex;align-items:flex-end;gap:3px;height:70px;width:100%;overflow:hidden}.cp-freq[hidden]{display:none}
.cp-bar{flex:1 1 0;min-width:10px;max-width:30px;height:100%;padding:0;border:0;background:none;display:flex;flex-direction:column;justify-content:flex-end;align-items:center;color:#fff;font:inherit;font-size:13px}
.cp-bar span{display:block;width:100%;background:var(--bl);border:2px solid var(--bk);border-radius:4px 4px 0 0;transform-origin:bottom;transform:scaleY(var(--h));height:48px}.cp-bar.sel span{background:var(--y)}
.cp-kb{display:flex;flex-wrap:wrap;gap:5px;justify-content:center;width:100%}.cp-k{width:40px;height:44px;padding:0;border:2px solid var(--bk);border-radius:8px;background:linear-gradient(var(--sl3),var(--sl));color:#fff;font:inherit;font-size:19px;box-shadow:inset 0 -3px 0 rgba(0,0,0,.25)}
.cp-k.used{opacity:.45}.cp-k.wide{width:64px;font-size:15px}
.cp-coach{margin:0;text-align:center;font-size:18px;min-height:24px;color:var(--y2)}.cp-tip{margin:0;text-align:center;font-size:14px;opacity:.8;min-height:18px}
.cp-l.ok{background:linear-gradient(#58b83a,#2E8A12)}.cp-l.ok i{color:#fff}
.cp-tut{width:100%;display:flex;flex-direction:column;align-items:center;gap:12px}.cp-bub{margin:0;padding:10px 14px;border:3px solid var(--bk);border-radius:14px;background:#fff;color:#12062F;font-size:19px;text-align:center;max-width:480px}
.cp-tut .cp-text{max-height:none}.cp-ring{outline:4px solid var(--y2);outline-offset:3px;animation:cpRing 1s ease-in-out infinite;position:relative;z-index:1}
@keyframes cpRing{50%{outline-color:transparent;transform:scale(1.08)}}
.cp-end{text-align:center;width:100%}.cp-end .mbtn{min-height:50px}
@media (prefers-reduced-motion:reduce){.cp-l.rev,.cp-ring{animation:none}}`;

  R2.games.register({
    id: 'cipher',
    schema: [
      { key: 'plaintext', type: 'longtext', label: 'The final message (Latin or Cyrillic letters, spaces and punctuation are kept). Leave the [REPLACE...] text until it is ready' },
      { key: 'afterText', type: 'longtext', label: 'A line shown after the message is revealed' },
      { key: 'waitText', type: 'text', label: 'What she reads while the real message is not filled in yet' },
      { key: 'sampleText', type: 'longtext', label: 'The practice text used while the real message is not filled in' },
      { key: 'language', type: 'text', label: 'Language of the message for the frequency tip: en, fr or ru (default en)' },
      { key: 'hintsPerGame', type: 'number', label: 'Hints (reveal one letter), default 3' },
      { key: 'hints3', type: 'number', label: '3 stars if hints used are at most (default 0)' },
      { key: 'hints2', type: 'number', label: '2 stars if hints used are at most (default 2)' }
    ],
    defaults: { plaintext: '[REPLACE: final message]', afterText: '', waitText: 'The message arrives with the package. Until then, practise with this one.', sampleText: SAMPLE, language: 'en', hintsPerGame: 3, hints3: 0, hints2: 2 },
    logic: { rng, LAT, CYR, isPlaceholder, baseOf, permute, makeCipher, frequency, solvedAll, wrongLetters, hintLetter, starsFor, prep },
    mount(ctx) {
      const cfg = ctx.cfg, root = ctx.root, reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
      const st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
      const sample = isPlaceholder(cfg.plaintext), text = sample ? (cfg.sampleText || SAMPLE) : cfg.plaintext, h = hash(text + (sample ? 's' : 'r')), per = Math.max(0, Math.floor(+cfg.hintsPerGame >= 0 ? +cfg.hintsPerGame : 3));
      let saved = store.get('cipher', null); if (!saved || saved.h !== h || saved.solved) saved = { h, seed: (Date.now() ^ 0x7F4A7C15) >>> 0, guesses: {}, locked: [], hints: 0, solved: false };   // a new attempt = a new cipher
      const C = makeCipher(text, saved.seed), tokens = C.tokens, guesses = saved.guesses, locked = saved.locked; let hints = saved.hints, sel = null, placed = false, hist = [], tipN = 0, tut = null, paused = false, dead = false, over = false, saveT = 0, timers = [];
      const later = (f, ms) => { const t = setTimeout(() => { if (!dead) f(); }, ms); timers.push(t); };
      const tone = (f, d, w, v, dl) => { try { ctx.sfx.tone(f, d, w, v, dl); } catch (e) {} };
      const save = () => { clearTimeout(saveT); saveT = setTimeout(flush, 400); }, flush = () => store.set('cipher', { h, seed: saved.seed, guesses, locked, hints, solved: saved.solved });
      const scripts = new Set(tokens.filter(t => t.plain).map(t => alphabetOf(t.plain))), alpha = scripts.has(CYR) && !scripts.has(LAT) ? CYR : scripts.has(CYR) ? LAT + CYR : LAT;
      const w = document.createElement('div'); w.className = 'cp';
      let words = [], cur = [];
      tokens.forEach((t, i) => { if (t.ch === ' ' || t.ch === '\n') { if (cur.length) words.push(cur); cur = []; } else cur.push(i); }); if (cur.length) words.push(cur);
      w.innerHTML = `<div class="cp-top t"><span>Cipher</span><span data-hl></span></div><p class="cp-coach" data-coach></p><p class="cp-tip" data-tip></p>${sample ? `<p class="cp-note">${esc(cfg.waitText || '')}</p>` : ''}
        <div class="cp-text">${words.map(wd => `<span class="cp-w">${wd.map(i => { const t = tokens[i]; return t.plain ? `<button type="button" class="cp-l" data-c="${t.cipher}" data-i="${i}"><b>${t.cipher}</b><i></i></button>` : `<span class="cp-p">${esc(t.ch)}</span>`; }).join('')}</span>`).join('')}</div>
        <div class="cp-freq" hidden></div>
        <div class="cp-tools"><button type="button" class="mbtn small grey" data-freq>Frequency</button><button type="button" class="mbtn small grey" data-undo>Undo</button><button type="button" class="mbtn small grey" data-check>Check</button><button type="button" class="mbtn small" data-hint></button></div>
        <div class="cp-kb">${alpha.split('').map(c => `<button type="button" class="cp-k" data-k="${c}">${c}</button>`).join('')}<button type="button" class="cp-k wide" data-k="">Clear</button></div><div class="cp-end"></div>`;
      root.appendChild(w);
      function paint() {
        w.querySelectorAll('.cp-l').forEach(b => { const c = b.dataset.c, g = guesses[c]; b.querySelector('i').textContent = g || ''; b.classList.toggle('sel', c === sel); b.classList.toggle('lock', locked.indexOf(c) >= 0); b.classList.toggle('ok', !!g && g === tokens[+b.dataset.i].plain);
          b.classList.toggle('twin', !!g && Object.keys(guesses).some(o => o !== c && guesses[o] === g)); });
        const used = new Set(Object.values(guesses)); w.querySelectorAll('.cp-k').forEach(k => k.classList.toggle('used', !!k.dataset.k && used.has(k.dataset.k)));
        w.querySelector('[data-hl]').textContent = 'Hints ' + Math.max(0, per - hints); const hb = w.querySelector('[data-hint]'); hb.textContent = 'Hint (' + Math.max(0, per - hints) + ')'; hb.disabled = hints >= per || over;
        w.querySelector('[data-coach]').textContent = over ? '' : !sel ? 'Touche une lettre du message.' : placed ? 'Bien joué ! Continue.' : 'Maintenant choisis la vraie lettre au clavier.'; w.querySelector('[data-undo]').disabled = !hist.length || over;
        w.querySelectorAll('.cp-bar').forEach(b => b.classList.toggle('sel', b.dataset.c === sel)); ctx.stars(starsFor(hints, cfg));
      }
      function freqBars() { const f = frequency(tokens), mx = f[0] ? f[0].n : 1; w.querySelector('.cp-freq').innerHTML = f.map(x => `<button type="button" class="cp-bar" data-c="${x.letter}" aria-label="${x.letter} appears ${x.n} times"><span style="--h:${(x.n / mx).toFixed(2)}"></span>${x.letter}</button>`).join(''); }
      function choose(c) { if (over) return; sel = sel === c ? null : c; placed = false; paint(); tone(500, 0.04, 'triangle', 0.04); }
      function assign(letter) {
        if (!sel || over || paused) return; if (locked.indexOf(sel) >= 0) return; hist.push([sel, guesses[sel] || '']); if (hist.length > 80) hist.shift(); if (letter) guesses[sel] = letter; else delete guesses[sel]; placed = !!letter;
        tone(letter ? 640 : 380, 0.04, 'triangle', 0.05); paint(); save(); if (solvedAll(tokens, guesses)) win();
      }
      function undo() { if (over || paused || !hist.length) return; const [c, prev] = hist.pop(); if (locked.indexOf(c) >= 0) return paint(); if (prev) guesses[c] = prev; else delete guesses[c]; sel = c; placed = false; tone(300, 0.04, 'triangle', 0.05); paint(); save(); }
      const FREQ = { en: 'E T A O', fr: 'E A S I', ru: 'О Е А' }, LANGN = { en: 'anglais', fr: 'français', ru: 'russe' };
      const lg = FREQ[String(cfg.language || 'en').toLowerCase()] ? String(cfg.language || 'en').toLowerCase() : 'en';
      const TIPS = ['Regarde les mots courts.', 'Les lettres doublées aident beaucoup.', 'Les lettres qui reviennent souvent sont souvent des voyelles.', 'Lettres les plus fréquentes en ' + LANGN[lg] + ' : ' + FREQ[lg] + '.'];
      (function tipLoop() { if (dead) return; const el = w.querySelector('[data-tip]'); if (el && !over) el.textContent = TIPS[tipN++ % TIPS.length]; later(tipLoop, 7000); })();
      function check() { if (over) return; const bad = wrongLetters(tokens, guesses); w.querySelectorAll('.cp-l').forEach(b => { if (bad.indexOf(b.dataset.c) >= 0) { b.classList.add('bad'); later(() => b.classList.remove('bad'), 2200); } }); tone(bad.length ? 220 : 880, 0.15, bad.length ? 'square' : 'triangle', 0.06); }
      function hint() {
        if (over || paused || hints >= per) return; const c = hintLetter(tokens, guesses, locked); if (!c) return;
        guesses[c] = tokens.find(t => t.cipher === c && t.plain).plain; locked.push(c); hints++; sel = c; tone(880, 0.12, 'triangle', 0.07); paint(); save(); if (solvedAll(tokens, guesses)) win();
      }
      function win() {
        over = true; saved.solved = true; flush(); sel = null; paint();
        const ls = Array.from(w.querySelectorAll('.cp-l')), k = reduced ? 0 : 70;
        ls.forEach((b, n) => later(() => { const t = tokens[+b.dataset.i]; b.classList.add('rev'); b.querySelector('b').textContent = ''; b.querySelector('i').textContent = t.ch.toUpperCase(); tone(420 + (n * 53) % 420, 0.05, 'square', 0.04); }, n * k));      // revealed letter by letter, each with a beep
        later(() => {
          try { ctx.sfx.speak(text.slice(0, 40), 'love'); } catch (e) {} R2.bus.emit('quiz:right');
          w.querySelector('.cp-end').innerHTML = `${!sample && cfg.afterText ? `<p class="qq">${esc(cfg.afterText)}</p>` : ''}<button type="button" class="mbtn" data-finish>Continue</button>`;
        }, ls.length * k + 500);
      }
      const onClick = e => {
        const l = e.target.closest('.cp-l, .cp-bar'); if (l) return choose(l.dataset.c);
        const kk = e.target.closest('[data-k]'); if (kk) return assign(kk.dataset.k);
        if (e.target.closest('[data-freq]')) { const f = w.querySelector('.cp-freq'); if (f.hidden) freqBars(); f.hidden = !f.hidden; paint(); }
        else if (e.target.closest('[data-undo]')) undo(); else if (e.target.closest('[data-check]')) check(); else if (e.target.closest('[data-hint]')) hint();
        else if (e.target.closest('[data-finish]')) ctx.win({ score: Math.max(500, 3000 - hints * 300), stars: starsFor(hints, cfg) });
      };
      const onKey = e => {
        if (paused || over || tut || e.ctrlKey || e.metaKey || e.altKey) return; const k = e.key;
        if (k === 'Backspace' || k === 'Delete') { assign(''); return; }
        if (k === 'Tab' || k === 'ArrowRight' || k === 'ArrowLeft') { e.preventDefault(); const ls = frequency(tokens).map(x => x.letter).filter(c => locked.indexOf(c) < 0), i = ls.indexOf(sel), n = ls.length; if (n) { sel = ls[(i + (k === 'ArrowLeft' ? n - 1 : 1) + n) % n]; paint(); } return; }
        if (k.length === 1) { const b = baseOf(k); if (b && alpha.indexOf(b) >= 0) assign(b); }
      };
      /* interactive tutorial on a tiny sample (BEEP, new random cipher letters each time; never her real message) */
      function tutorial() {
        if (tut || dead) return; const rr = rng((Date.now() ^ 0x51ED27) >>> 0), pool = LAT.split('').filter(c => 'BEP'.indexOf(c) < 0); const pick = own => { let c; do { c = pool[Math.floor(rr() * pool.length)]; } while (c === own || used_.indexOf(c) >= 0); used_.push(c); return c; };
        const used_ = [], cb = pick('B'), ce = pick('E'), cp = pick('P'), word = [cb, ce, ce, cp], plain = 'BEEP';
        const t = document.createElement('div'); t.className = 'cp-tut'; tut = t; w.hidden = true;
        t.innerHTML = `<div class="cp-top t"><span>Tutoriel</span></div><p class="cp-bub" data-bub></p><div class="cp-text"><span class="cp-w">${word.map((c, i) => `<button type="button" class="cp-l" data-ti="${i}"><b>${c}</b><i></i></button>`).join('')}</span></div><div class="cp-kb">${LAT.split('').map(c => `<button type="button" class="cp-k" data-tk="${c}">${c}</button>`).join('')}</div><div class="cp-end" data-tend></div>`;
        root.appendChild(t); let step = 1; const tiles = [...t.querySelectorAll('.cp-l')], bub = t.querySelector('[data-bub]'), ring = el => { t.querySelectorAll('.cp-ring').forEach(x => x.classList.remove('cp-ring')); if (el) el.classList.add('cp-ring'); };
        const keyOf = c => t.querySelector(`[data-tk="${c}"]`), fill = i => { tiles[i].querySelector('i').textContent = plain[i]; tiles[i].classList.add('ok'); };
        const say = () => { bub.textContent = step === 1 ? '1. Touche une lettre codée.' : step === 2 ? '2. Choisis la vraie lettre : B.' : '3. Toutes les lettres identiques se remplissent ! À toi !'; ring(step === 1 ? tiles[0] : step === 2 ? keyOf('B') : null); }; say();
        const end = () => { tut = null; t.remove(); w.hidden = false; store.set('cipherTut', 1); paint(); };
        t.addEventListener('click', e => {
          if (e.target.closest('[data-tend] button')) return end();
          const ti = e.target.closest('[data-ti]'), tk = e.target.closest('[data-tk]');
          if (step === 1 && ti && +ti.dataset.ti === 0) { tiles[0].classList.add('sel'); step = 2; say(); tone(500, 0.04, 'triangle', 0.04); }
          else if (step === 2 && tk && tk.dataset.tk === 'B') {
            fill(0); tiles[0].classList.remove('sel'); step = 3; say(); tone(760, 0.08, 'triangle', 0.06);
            later(() => { if (!tut) return; tiles[1].classList.add('sel'); tiles[2].classList.add('sel'); later(() => { if (!tut) return; fill(1); fill(2); tiles[1].classList.remove('sel'); tiles[2].classList.remove('sel'); tone(880, 0.12, 'triangle', 0.06); t.querySelector('[data-tend]').innerHTML = '<button type="button" class="mbtn">À toi !</button>'; }, 700); }, 700);
          }
        });
      }
      root.addEventListener('click', onClick); document.addEventListener('keydown', onKey); paint();
      if (!store.get('cipherTut', 0)) later(tutorial, 50);
      return { tutorial, pause() { paused = true; flush(); }, resume() { paused = false; }, destroy() { dead = true; flush(); timers.forEach(clearTimeout); document.removeEventListener('keydown', onKey); root.innerHTML = ''; } };
    }
  });
})();
