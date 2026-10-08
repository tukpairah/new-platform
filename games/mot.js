/* Mot (medium): a French 5-letter word game, 6 rounds, 6 attempts each. Words and hints: content/games/mot.js ("WORD|hint" lines).
   Accents are ignored, any 5 letters are accepted (no dictionary). Pure rules are in def.logic (tested). */
(function () {
  'use strict';
  const norm = s => String(s || '').replace(/œ/gi, 'oe').replace(/æ/gi, 'ae').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z]/g, '');
  /* g = right place, y = in the word elsewhere, x = not (counted correctly with double letters: each letter of the answer is used once) */
  function score(guess, answer) {
    const g = norm(guess).split(''), a = norm(answer).split(''), out = g.map(() => 'x'), left = {};
    g.forEach((ch, i) => { if (ch === a[i]) out[i] = 'g'; else left[a[i]] = (left[a[i]] || 0) + 1; });
    g.forEach((ch, i) => { if (out[i] !== 'g' && left[ch] > 0) { out[i] = 'y'; left[ch]--; } });
    return out;
  }
  const RANK = { x: 1, y: 2, g: 3 };
  const mergeKey = (prev, s) => (RANK[s] > (RANK[prev] || 0) ? s : prev);
  const parseList = lines => (lines || []).map(l => { const i = String(l).indexOf('|'); const w = norm(i < 0 ? l : String(l).slice(0, i)); if (w.length !== 5) { try { console.warn('[mot] "' + w + '" is ' + w.length + ' letters, it must be exactly 5 (word ignored)'); } catch (e) {} } return w.length === 5 ? { word: w, hint: i < 0 ? '' : String(l).slice(i + 1).trim() } : null; }).filter(Boolean);
  function parseRounds(lines, defaults) {            // always 6 rounds: missing ones come from the defaults (the last default is COEUR)
    const out = parseList(lines).slice(0, 6), dflt = parseList(defaults);
    for (let k = out.length; k < 6; k++) out.push(dflt[k] || { word: 'COEUR', hint: '' });
    return out;
  }
  const AZERTY = ['AZERTYUIOP', 'QSDFGHJKLM', '*WXCVBN#'];
  const DEFAULT_ROUNDS = ['AVION|Il traverse le ciel pour rapprocher deux personnes.', 'PARIS|La ville où tu vis.', 'ROBOT|Il bipe et il porte des messages.', 'VOEUX|On en fait avant de souffler les bougies.', 'REVES|On les construit ensemble, même à distance.', 'COEUR|Il bat un peu plus fort quand je pense à toi.'];
  const CSS = `.mo{width:100%;display:flex;flex-direction:column;align-items:center;gap:8px}
.mo-top{display:flex;justify-content:space-between;width:100%;max-width:420px;font-size:19px}.mo-hint{max-width:420px;text-align:center;font-size:17px;opacity:.95;min-height:24px}
.mo-grid{display:grid;grid-template-rows:repeat(6,1fr);gap:6px;width:min(100%,calc((100dvh - 400px) * 5 / 6),330px)}
.mo-row{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.mo-row.shake{animation:moShake .35s linear}
.mo-t{aspect-ratio:1;display:flex;align-items:center;justify-content:center;font-size:clamp(22px,7vw,34px);color:#fff;text-shadow:2px 0 0 var(--bk),-2px 0 0 var(--bk),0 2px 0 var(--bk),0 -2px 0 var(--bk);border:3px solid #4a4e69;border-radius:6px;background:rgba(0,0,0,.3)}
.mo-t.f{border-color:#7a7f9c}.mo-t.g{background:var(--green);border-color:var(--bk)}.mo-t.y{background:var(--y);border-color:var(--bk)}.mo-t.x{background:var(--sl);border-color:var(--bk)}
.mo-t.rev{animation:moFlip .36s ease-in-out}.mo-t.pop{animation:moPop .12s ease-out}
@keyframes moFlip{0%{transform:rotateX(0)}50%{transform:rotateX(90deg)}100%{transform:rotateX(0)}}@keyframes moPop{50%{transform:scale(1.12)}}@keyframes moShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-6px)}75%{transform:translateX(6px)}}
.mo-kb{display:flex;flex-direction:column;gap:6px;width:100%;max-width:480px}.mo-kr{display:flex;justify-content:center;gap:4px}
.mo-k{flex:1 1 0;max-width:46px;min-width:0;height:48px;padding:0;border-radius:7px;border:2px solid var(--bk);background:linear-gradient(var(--sl3),var(--sl));color:#fff;font:inherit;font-size:18px;box-shadow:inset 0 -3px 0 rgba(0,0,0,.25);-webkit-tap-highlight-color:transparent}
.mo-k.wide{max-width:64px;font-size:15px}.mo-k.g{background:var(--green)}.mo-k.y{background:var(--y);color:var(--bk)}.mo-k.x{background:#1c1f2d;color:#8a8fa8}
.mo-msg{width:100%;max-width:420px;text-align:center;min-height:30px}.mo-msg .mbtn{min-height:48px}
@media (prefers-reduced-motion:reduce){.mo-t.rev,.mo-t.pop,.mo-row.shake{animation:none}}`;

  R2.games.register({
    id: 'mot',
    schema: [
      { key: 'rounds', type: 'list', label: 'The 6 rounds, one per line: WORD|hint (5 letters, accents are ignored; the last round is COEUR by default)' },
      { key: 'avgThree', type: 'number', label: '3 stars if the average number of attempts is at most' },
      { key: 'avgTwo', type: 'number', label: '2 stars if the average number of attempts is at most' },
      { key: 'winText', type: 'text', label: 'Message when a word is found' },
      { key: 'failText', type: 'text', label: 'Message when a round is lost (the word follows)' },
      { key: 'retryText', type: 'text', label: 'Retry button text' }
    ],
    defaults: { rounds: DEFAULT_ROUNDS, avgThree: 3.5, avgTwo: 4.5, winText: 'Bravo !', failText: 'Le mot était', retryText: 'RÉESSAYER' },
    logic: { norm, score, mergeKey, parseRounds, AZERTY },
    mount(ctx) {
      const cfg = ctx.cfg, root = ctx.root, reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
      const st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
      const rounds = parseRounds(cfg.rounds, DEFAULT_ROUNDS);
      let ri = 0, row = 0, cur = '', busy = false, paused = false, dead = false, fails = 0, used = [], score_ = 0, keys = {}, timers = [];
      const later = (f, ms) => { const t = setTimeout(() => { if (!dead) f(); }, ms); timers.push(t); };
      const tone = (f, d, w, v, dl) => { try { ctx.sfx.tone(f, d, w, v, dl); } catch (e) {} };
      const stars = () => { const avg = used.length ? used.reduce((a, b) => a + b, 0) / used.length : 0; return fails === 0 && avg <= (+cfg.avgThree || 3.5) ? 3 : fails <= 1 && avg <= (+cfg.avgTwo || 4.5) ? 2 : 1; };

      function start() {
        cur = ''; row = 0; busy = false; keys = {}; const old = root.querySelector('.mo'); old && old.remove();
        const w = document.createElement('div'); w.className = 'mo';
        w.innerHTML = `<div class="mo-top t"><span>Mot ${ri + 1}/6</span><span data-att>Essai 1/6</span></div><div class="mo-hint" data-hint>${esc(rounds[ri].hint)}</div>
          <div class="mo-grid">${Array.from({ length: 6 }, () => `<div class="mo-row">${'<div class="mo-t"></div>'.repeat(5)}</div>`).join('')}</div><div class="mo-msg"></div>
          <div class="mo-kb">${AZERTY.map(r => `<div class="mo-kr">${r.split('').map(c => c === '*' ? '<button type="button" class="mo-k wide" data-k="ENTER">Enter</button>' : c === '#' ? '<button type="button" class="mo-k wide" data-k="BACK" aria-label="Backspace">&larr;</button>' : `<button type="button" class="mo-k" data-k="${c}">${c}</button>`).join('')}</div>`).join('')}</div>`;
        root.appendChild(w); ctx.stars(stars());
      }
      const rowEl = () => root.querySelectorAll('.mo-row')[row];
      function paintCur() { const ts = rowEl().children; for (let i = 0; i < 5; i++) { ts[i].textContent = cur[i] || ''; ts[i].classList.toggle('f', !!cur[i]); } }
      function type(c) { if (busy || paused || dead || cur.length >= 5) return; cur += c; paintCur(); const t = rowEl().children[cur.length - 1]; if (!reduced) { t.classList.remove('pop'); void t.offsetWidth; t.classList.add('pop'); } tone(520 + cur.length * 40, 0.03, 'triangle', 0.04); }
      function back() { if (busy || paused || dead || !cur) return; cur = cur.slice(0, -1); paintCur(); }
      function enter() {
        if (busy || paused || dead) return;
        if (cur.length < 5) { const r = rowEl(); r.classList.remove('shake'); void r.offsetWidth; r.classList.add('shake'); tone(180, 0.12, 'square', 0.04); return; }     // any 5 letters are accepted
        const res = score(cur, rounds[ri].word), ts = rowEl().children, guess = cur; busy = true;
        for (let i = 0; i < 5; i++) later(() => {
          ts[i].classList.add('rev'); later(() => { ts[i].classList.add(res[i]); ts[i].classList.remove('f'); const b = root.querySelector(`.mo-k[data-k="${guess[i]}"]`); keys[guess[i]] = mergeKey(keys[guess[i]], res[i]); if (b) { b.classList.remove('g', 'y', 'x'); b.classList.add(keys[guess[i]]); } }, reduced ? 0 : 170);
          tone(res[i] === 'g' ? 880 : res[i] === 'y' ? 660 : 330, 0.07, 'triangle', 0.05);
        }, reduced ? 0 : i * 260);
        later(() => {
          if (res.every(x => x === 'g')) return solved();
          row++; cur = ''; busy = false; root.querySelector('[data-att]').textContent = 'Essai ' + Math.min(row + 1, 6) + '/6';
          if (row >= 6) failed();
        }, reduced ? 100 : 5 * 260 + 250);
      }
      function solved() {
        used.push(row + 1); score_ += (7 - (row + 1)) * 100; [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.15, 'triangle', 0.08, i * 0.08)); ctx.stars(stars());
        root.querySelector('.mo-msg').innerHTML = `<p class="qq" style="margin:0">${esc(cfg.winText || 'Bravo !')}</p>`;
        later(() => { if (++ri >= rounds.length) ctx.win({ score: Math.max(0, score_ - fails * 50), stars: stars() }); else start(); }, 1300);
      }
      function failed() {                                    // no penalty: the word is shown and the same round can be played again
        fails++; busy = true; tone(200, 0.3, 'sawtooth', 0.06); ctx.stars(stars());
        root.querySelector('.mo-msg').innerHTML = `<p class="qq" style="margin:0 0 8px">${esc(cfg.failText || 'Le mot était')} <b>${esc(rounds[ri].word)}</b></p><button type="button" class="mbtn" data-retry>${esc(cfg.retryText || 'RÉESSAYER')}</button>`;
      }
      const onClick = e => {
        if (e.target.closest('[data-retry]')) { start(); return; }
        const k = e.target.closest('[data-k]'); if (!k) return; if (k.blur) k.blur(); const v = k.dataset.k; v === 'ENTER' ? enter() : v === 'BACK' ? back() : type(v);
      };
      const onKey = e => {
        if (e.ctrlKey || e.metaKey || e.altKey || paused) return;
        if (e.key === 'Enter') { if (document.activeElement && document.activeElement.matches('.mbtn,.mo-k')) return; e.preventDefault(); enter(); }
        else if (e.key === 'Backspace') { e.preventDefault(); back(); }
        else if (e.key.length === 1) { const c = norm(e.key); if (c.length === 1) type(c); }
      };
      root.addEventListener('click', onClick); document.addEventListener('keydown', onKey);
      start();
      return { pause() { paused = true; }, resume() { paused = false; }, destroy() { dead = true; timers.forEach(clearTimeout); document.removeEventListener('keydown', onKey); root.innerHTML = ''; } };
    }
  });
})();
