/* Beep Echo (medium): repeat R2's growing sequence on four light pads. The sequence grows by one each round up to cfg.length (default 12),
   playback speeds up, 3 lives (a wrong pad costs one and replays the round). Keys 1-4 or tap. "Best streak" is saved. Content: content/games/echo.js */
(function () {
  'use strict';
  const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  /* a sequence of pads 0-3; never more than 2 of the same pad in a row (fair and readable) */
  function genSequence(len, seed) {
    const r = rng(seed), out = [];
    while (out.length < len) { const p = Math.floor(r() * 4), n = out.length; if (n >= 2 && out[n - 1] === p && out[n - 2] === p) continue; out.push(p); }
    return out;
  }
  const interval = (round, c) => Math.max(+c.minInterval || 260, (+c.startInterval || 700) - (+c.speedUp || 30) * (round - 1));     // ms between two beeps: shorter every round
  function check(seq, progress, pad) { return seq[progress] !== pad ? 'wrong' : progress + 1 === seq.length ? 'done' : 'ok'; }
  const starsFor = lives => Math.max(1, Math.min(3, lives));
  const CSS = `.ec{width:100%;display:flex;flex-direction:column;align-items:center;gap:12px}
.ec-top{display:flex;justify-content:space-between;width:100%;max-width:420px;font-size:20px}
.ec-hearts{display:flex;gap:4px;min-height:26px}.ec-hearts svg{width:26px;height:26px}.ec-hearts .off{opacity:.25;filter:grayscale(1)}
.ec-pads{display:grid;grid-template-columns:1fr 1fr;gap:12px;width:min(100%,calc(100dvh - 300px),400px);aspect-ratio:1}
.ec-pad{position:relative;border:4px solid var(--bk);border-radius:18px;padding:0;background:var(--pc);box-shadow:inset 0 -8px 0 rgba(0,0,0,.25),0 5px 0 var(--bk);font:inherit;font-size:28px;color:rgba(18,6,47,.55);-webkit-tap-highlight-color:transparent;filter:saturate(.75) brightness(.8);transition:transform .08s,filter .08s}
.ec-pad.lit{transform:scale(1.04);filter:saturate(1.3) brightness(1.25)}.ec-pad::after{content:"";position:absolute;inset:0;border-radius:14px;background:#fff;opacity:0;transition:opacity .08s}.ec-pad.lit::after{opacity:.45}
.ec-pad:focus-visible{outline:3px solid #fff;outline-offset:3px}
.ec-msg{min-height:32px;font-size:21px;text-align:center}.ec-go{min-height:52px}
@media (prefers-reduced-motion:reduce){.ec-pad{transition:none}}`;
  R2.games.register({
    id: 'echo',
    schema: [
      { key: 'length', type: 'number', label: 'Rounds to clear = the longest sequence (default 12)' },
      { key: 'lives', type: 'number', label: 'Lives (default 3)' },
      { key: 'padColors', type: 'list', label: 'The 4 pad colours, one hex per line (R2 light colours)' },
      { key: 'tones', type: 'list', label: 'The 4 tones in Hz, one per line' },
      { key: 'startInterval', type: 'number', label: 'Milliseconds between beeps in round 1 (default 700)' },
      { key: 'speedUp', type: 'number', label: 'Milliseconds faster every round (default 30)' },
      { key: 'minInterval', type: 'number', label: 'Never faster than this many ms (default 260)' },
      { key: 'introText', type: 'text', label: 'Text before the first round' },
      { key: 'listenText', type: 'text', label: 'Text while R2 plays' },
      { key: 'yourTurnText', type: 'text', label: 'Text when it is her turn' }
    ],
    defaults: { length: 12, lives: 3, padColors: ['#FF6B6B', '#5BA8FF', '#FFD84A', '#6BE07A'], tones: [523, 659, 784, 1047], startInterval: 700, speedUp: 30, minInterval: 260, introText: 'Listen to R2, then repeat.', listenText: 'Listen...', yourTurnText: 'Your turn!' },
    logic: { rng, genSequence, interval, check, starsFor },
    mount(ctx) {
      const cfg = ctx.cfg, root = ctx.root, len = Math.max(3, Math.min(30, Math.floor(+cfg.length || 12))), maxLives = Math.max(1, Math.floor(+cfg.lives || 3));
      const st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
      const cols = (cfg.padColors || []).concat(Echo_default.colors).slice(0, 4), tones = (cfg.tones || []).map(Number).filter(x => x > 50).concat(Echo_default.tones).slice(0, 4);
      const seq = genSequence(len, (Date.now() ^ 0x2C1B3A5F) >>> 0), HEART = '<svg viewBox="-12 -12 24 24"><path d="M0 8C-14-2-9-12 0-5 9-12 14-2 0 8z" fill="#E8403A" stroke="#12062F" stroke-width="2"/></svg>';
      let round = 1, prog = 0, lives = maxLives, listening = false, paused = false, dead = false, timers = [], score = 0, streak = 0;
      const later = (f, ms) => { const t = setTimeout(() => { if (!dead) f(); }, ms); timers.push(t); };
      const tone = (f, d, w, v, dl) => { try { ctx.sfx.tone(f, d, w, v, dl); } catch (e) {} };
      const best = () => +store.get('echo.best', 0) || 0;
      const w = document.createElement('div'); w.className = 'ec';
      w.innerHTML = `<div class="ec-top t"><span data-r></span><span data-b></span></div><div class="ec-hearts" data-l></div>
        <div class="ec-pads">${[0, 1, 2, 3].map(i => `<button type="button" class="ec-pad" data-p="${i}" style="--pc:${cols[i]}" aria-label="Pad ${i + 1}">${i + 1}</button>`).join('')}</div><div class="ec-msg t" data-m></div>`;
      root.appendChild(w);
      const pads = Array.from(w.querySelectorAll('.ec-pad')), msg = t => { w.querySelector('[data-m]').textContent = t; };
      const paint = () => { w.querySelector('[data-r]').textContent = 'Round ' + round + '/' + len; w.querySelector('[data-b]').textContent = best() ? 'Best streak ' + best() : ''; w.querySelector('[data-l]').innerHTML = Array.from({ length: maxLives }, (_, i) => i < lives ? HEART : HEART.replace('<svg', '<svg class="off"')).join(''); ctx.stars(starsFor(lives)); };
      function light(i, ms, quiet) { pads[i].classList.add('lit'); if (!quiet) tone(tones[i], Math.max(0.12, ms / 1000), 'triangle', 0.09); later(() => pads[i].classList.remove('lit'), ms); }
      function play() {                                      // R2 plays the first `round` beeps
        listening = false; prog = 0; msg(cfg.listenText || 'Listen...'); paint(); const iv = interval(round, cfg);
        seq.slice(0, round).forEach((p, k) => later(() => { if (!paused) light(p, iv * 0.6); }, 700 + k * iv));
        later(() => { listening = true; msg(cfg.yourTurnText || 'Your turn!'); }, 700 + round * iv);
      }
      function press(i) {
        if (!listening || paused || dead) return; light(i, 160);
        const r = check(seq.slice(0, round), prog, i);
        if (r === 'wrong') {
          listening = false; lives--; streak = 0; tone(150, 0.35, 'sawtooth', 0.07); R2.bus.emit('quiz:wrong'); paint();
          if (lives <= 0) { later(() => ctx.lose(), 600); return; }
          msg('Oops! Listen again.'); later(play, 1100); return;
        }
        prog++;
        if (r === 'done') {
          listening = false; streak = round; score += round * 100; if (round > best()) store.set('echo.best', round); R2.bus.emit('quiz:right');
          if (round >= len) { try { ctx.sfx.speak('beep boop bweep', 'excited'); } catch (e) {} [523, 659, 784, 1047, 1319].forEach((f, k) => tone(f, 0.16, 'triangle', 0.08, k * 0.08)); msg('R2 is cheering!'); later(() => ctx.win({ score: score + lives * 200, stars: starsFor(lives) }), 1500); return; }
          [784, 988].forEach((f, k) => tone(f, 0.1, 'triangle', 0.06, k * 0.08)); msg('Nice!'); round++; later(play, 900);
        }
      }
      const onClick = e => { const p = e.target.closest('.ec-pad'); if (p) press(+p.dataset.p); };
      const onKey = e => { const k = { 1: 0, 2: 1, 3: 2, 4: 3, Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3 }[e.key] ?? { Numpad1: 0, Numpad2: 1, Numpad3: 2, Numpad4: 3 }[e.code]; if (k !== undefined) press(k); };
      root.addEventListener('click', onClick); document.addEventListener('keydown', onKey);
      msg(cfg.introText || 'Listen to R2, then repeat.'); paint(); later(play, 900);
      return { pause() { paused = true; }, resume() { paused = false; if (!listening && prog === 0) later(play, 400); }, destroy() { dead = true; timers.forEach(clearTimeout); document.removeEventListener('keydown', onKey); root.innerHTML = ''; } };
    }
  });
  var Echo_default = { colors: ['#FF6B6B', '#5BA8FF', '#FFD84A', '#6BE07A'], tones: [523, 659, 784, 1047] };
})();
