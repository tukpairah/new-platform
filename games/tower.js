/* Droid Tower (hard): a crane swings a droid panel; tap / Space drops it, the overhang is trimmed off and falls away, perfect landings
   grow the block and build a combo, the camera climbs smoothly. Reach cfg.goalHeight to clear; then "Endless" with a saved best.
   Assist (title screen) slows the swing. Content: content/games/tower.js. Pure rules are in def.logic (tested). */
(function () {
  'use strict';
  const WORLD = 300, BH = 22;                                           // world units: width 300, block height 22
  const tri = u => { const p = ((u % 2) + 2) % 2; return p < 1 ? p : 2 - p; };    // 0..1..0 triangle wave: fair, deterministic swing
  const swingX = (t, speed, range, phase) => tri((phase || 0) + t * speed / Math.max(1, range)) * range;
  const speedAt = (h, c, assist) => Math.min(+c.speedMax || 3, 1 + (+c.speedStep || 12) / 100 * Math.floor(h / 5)) * (+c.speedBase || 130) * (assist ? 0.65 : 1);   // steps up every 5 blocks
  /* where a dropped block lands on the one below. prev/cur = { x, w }; returns the new block and the pieces that fall away */
  function land(prev, cur, o) {
    const l = Math.max(prev.x, cur.x), r = Math.min(prev.x + prev.w, cur.x + cur.w);
    if (r - l <= 0) return { miss: true, perfect: false, block: null, cuts: [{ x: cur.x, w: cur.w }] };
    if (Math.abs(cur.x - prev.x) <= o.tol) {                            // perfect: snap onto the block below, and grow a little
      const w = Math.min(o.maxW, prev.w + o.grow), x = Math.max(0, Math.min(WORLD - w, prev.x - (w - prev.w) / 2));
      return { miss: false, perfect: true, block: { x, w }, cuts: [] };
    }
    const cuts = []; if (cur.x < l) cuts.push({ x: cur.x, w: l - cur.x }); if (cur.x + cur.w > r) cuts.push({ x: r, w: cur.x + cur.w - r });
    return { miss: false, perfect: false, block: { x: l, w: r - l }, cuts };
  }
  const comboFreq = c => 392 * Math.pow(2, Math.min(c, 14) / 12);        // every perfect in a row is a semitone higher
  const starsFor = (perfects, total, c) => { const q = total ? perfects / total : 0; return q >= (+c.star3 || 0.6) ? 3 : q >= (+c.star2 || 0.3) ? 2 : 1; };

  const CSS = `.tw{position:relative;width:min(100%,420px);height:calc(100dvh - 130px);min-height:320px;touch-action:manipulation;user-select:none;-webkit-user-select:none}
.tw canvas{width:100%;height:100%;display:block;border:4px solid var(--bk);border-radius:12px;background:#12062F}
.tw-hud{position:absolute;left:12px;right:12px;top:10px;display:flex;justify-content:space-between;font-size:22px;pointer-events:none}
.tw-over{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(8,6,20,.72);border-radius:10px}.tw-over[hidden]{display:none}
.tw-over .modal{width:100%;text-align:center;max-height:none}.tw-over .mbtn{min-height:50px;margin-top:8px}.tw-over h2{margin:0 0 8px;text-align:center}`;

  R2.games.register({
    id: 'tower',
    schema: [
      { key: 'goalHeight', type: 'number', label: 'Blocks to build to clear the mode (default 30)' },
      { key: 'blockImage', type: 'image', label: 'Optional picture for the blocks (empty = drawn droid panels)' },
      { key: 'introText', type: 'longtext', label: 'Text on the title screen' },
      { key: 'colorBody', type: 'color', label: 'Panel colour' },
      { key: 'colorBand', type: 'color', label: 'Stripe colour' },
      { key: 'speedBase', type: 'number', label: 'Swing speed at the start (world units per second, default 130)' },
      { key: 'speedStep', type: 'number', label: 'Speed increase every 5 blocks, in percent (default 12)' },
      { key: 'tolerance', type: 'number', label: 'How close counts as a perfect landing (default 5)' },
      { key: 'grow', type: 'number', label: 'How much a perfect landing widens the block (default 8)' },
      { key: 'star3', type: 'number', label: 'Share of perfect landings for 3 stars (0.6 = 60%)' },
      { key: 'star2', type: 'number', label: 'Share of perfect landings for 2 stars' }
    ],
    defaults: { goalHeight: 30, blockImage: '', introText: 'Stack the droid panels as high as you can. Tap or press Space to drop.', colorBody: '#E4EAF5', colorBand: '#4A86F2', speedBase: 130, speedStep: 12, speedMax: 3, tolerance: 5, grow: 8, star3: 0.6, star2: 0.3 },
    logic: { WORLD, BH, tri, swingX, speedAt, land, comboFreq, starsFor },
    mount(ctx) {
      const cfg = ctx.cfg, root = ctx.root, reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
      const st = document.createElement('style'); st.textContent = CSS; root.appendChild(st);
      const wrap = document.createElement('div'); wrap.className = 'tw'; wrap.innerHTML = '<canvas></canvas><div class="tw-hud t"><span data-h></span><span data-b></span></div><div class="tw-over"></div>'; root.appendChild(wrap);
      const cv = wrap.querySelector('canvas'), g = cv.getContext('2d'), over = wrap.querySelector('.tw-over');
      const goal = Math.max(5, Math.floor(+cfg.goalHeight || 30)), opts = { tol: +cfg.tolerance || 5, grow: +cfg.grow || 8, maxW: 180 };
      let img = null; if (cfg.blockImage) { const im = new Image(); im.onload = () => { img = im; }; im.onerror = () => console.warn('[tower] block image failed, using drawn panels:', cfg.blockImage); im.src = cfg.blockImage; }
      // pools: nothing is allocated while playing
      const falls = Array.from({ length: 24 }, () => ({ on: false, x: 0, y: 0, w: 0, vy: 0, rot: 0, vr: 0 })), parts = Array.from({ length: 90 }, () => ({ on: false, x: 0, y: 0, vx: 0, vy: 0, life: 0 })), texts = Array.from({ length: 6 }, () => ({ on: false, s: '', x: 0, y: 0, life: 0 }));
      let stack = [], cur = null, drop = null, t = 0, cam = 0, W = 300, H = 400, scale = 1, endless = false, assist = !!store.get('tower.assist', false), combo = 0, maxCombo = 0, perfects = 0, running = false, paused = false, dead = false, state = 'title', raf = 0, last = 0, shake = 0, flash = 0, endTimer = 0;
      const tone = (f, d, w, v, dl) => { try { ctx.sfx.tone(f, d, w, v, dl); } catch (e) {} };
      const best = () => +store.get('tower.best', 0) || 0, height = () => stack.length - 1;

      function resize() { const r = cv.getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1); W = r.width; H = r.height; cv.width = Math.round(W * d); cv.height = Math.round(H * d); g.setTransform(d, 0, 0, d, 0, 0); scale = W / WORLD; }
      const sy = wy => H - (wy - cam) * scale - 8;                                    // world height -> screen y
      function spawn(arr, f) { for (let i = 0; i < arr.length; i++) if (!arr[i].on) { arr[i].on = true; f(arr[i]); return arr[i]; } return null; }
      function newBlock() { const top = stack[stack.length - 1]; cur = { w: top.w, t0: t, phase: stack.length % 2 }; }
      function reset(endlessMode) {
        endless = endlessMode; stack = [{ x: (WORLD - 140) / 2, w: 140 }]; combo = 0; maxCombo = 0; perfects = 0; cam = 0; drop = null; t = 0; falls.forEach(f => f.on = false); parts.forEach(p => p.on = false); texts.forEach(x => x.on = false);
        newBlock(); state = 'play'; over.hidden = true; running = true; ctx.stars(3); hud();
      }
      function hud() { wrap.querySelector('[data-h]').textContent = endless ? height() + ' blocks' : height() + ' / ' + goal; wrap.querySelector('[data-b]').textContent = endless && best() ? 'Best ' + best() : (combo > 1 ? 'x' + combo : ''); }
      function press() {
        if (state !== 'play' || paused || dead || drop || !cur) return;
        const top = stack[stack.length - 1], range = WORLD - cur.w, sp = speedAt(height(), cfg, assist), x = swingX(t - cur.t0, sp, range, cur.phase);
        drop = { x, w: cur.w, y: (stack.length + 3) * BH, to: stack.length * BH, v: 0, res: land(top, { x, w: cur.w }, opts) }; cur = null;
      }
      function burst(x, y, n) { if (reduced) return; for (let i = 0; i < n; i++) spawn(parts, p => { const a = Math.random() * 6.283, s = 40 + Math.random() * 90; p.x = x; p.y = y; p.vx = Math.cos(a) * s; p.vy = Math.sin(a) * s + 40; p.life = 0.6; }); }
      function landed() {
        const r = drop.res, y = drop.to; drop = null;
        r.cuts.forEach(c => spawn(falls, f => { f.x = c.x; f.y = y; f.w = c.w; f.vy = 0; f.rot = 0; f.vr = (Math.random() - 0.5) * 3 * (reduced ? 0 : 1); }));
        if (r.miss) { tone(140, 0.4, 'sawtooth', 0.07); shake = 0.3; state = 'ending'; endTimer = 0.9; return; }
        stack.push(r.block);
        if (r.perfect) { combo++; perfects++; maxCombo = Math.max(maxCombo, combo); flash = 0.25; burst(r.block.x + r.block.w / 2, y, 14); spawn(texts, x => { x.s = combo > 1 ? 'PERFECT x' + combo : 'PERFECT'; x.x = r.block.x + r.block.w / 2; x.y = y + BH; x.life = 1; }); tone(comboFreq(combo), 0.16, 'triangle', 0.08); tone(comboFreq(combo) * 1.5, 0.12, 'triangle', 0.05, 0.05); }
        else { combo = 0; tone(300 + height() * 3, 0.08, 'square', 0.05); }
        ctx.stars(starsFor(perfects, height(), cfg)); hud();
        if (!endless && height() >= goal) { state = 'won'; tone(659, 0.16, 'triangle', 0.08); tone(880, 0.16, 'triangle', 0.08, 0.12); tone(1175, 0.24, 'triangle', 0.08, 0.24); endTimer = 1.4; return; }
        newBlock();
      }
      function ending() {
        if (state === 'won') { store.set('tower.cleared', true); ctx.win({ score: goal * 100 + maxCombo * 50 + perfects * 20, stars: starsFor(perfects, height(), cfg) }); state = 'done'; return; }
        if (endless) { const h = height(); if (h > best()) store.set('tower.best', h); showOver('Tower fell!', `<p class="mnote">${h} blocks &middot; Best ${Math.max(h, best())}</p><button type="button" class="mbtn" data-again>AGAIN</button>`); state = 'done'; }
        else { ctx.lose(); state = 'done'; }
      }
      function showOver(title, html) { over.hidden = false; over.innerHTML = `<div class="modal"><h2>${title}</h2>${html}</div>`; }
      function title() {
        state = 'title'; running = true; const cleared = !!store.get('tower.cleared', false) || (R2.mode('tower').clears > 0);
        showOver('Droid Tower', `<p class="mnote">${esc(cfg.introText)}</p><p class="mnote">Goal: ${goal} blocks${cleared ? '' : '. Endless opens after your first clear.'}${best() ? ' &middot; Endless best ' + best() : ''}</p>
          <button type="button" class="mbtn" data-play style="font-size:28px">PLAY</button>${cleared ? '<button type="button" class="mbtn grey" data-endless>ENDLESS</button>' : ''}<button type="button" class="mbtn grey" data-assist>Assist: ${assist ? 'ON (slower swing)' : 'off'}</button>`);
      }
      function update(dt) {
        t += dt; cam += (Math.max(0, stack.length * BH - (H / scale) * 0.42) - cam) * (1 - Math.exp(-dt * 5)); shake = Math.max(0, shake - dt); flash = Math.max(0, flash - dt);
        if (drop) { drop.v += 1500 * dt; drop.y -= drop.v * dt; if (drop.y <= drop.to) { drop.y = drop.to; landed(); } }
        for (const f of falls) if (f.on) { f.vy += 900 * dt; f.y -= f.vy * dt; f.rot += f.vr * dt; if (f.y < cam - 80) f.on = false; }
        for (const p of parts) if (p.on) { p.vy -= 200 * dt; p.x += p.vx * dt; p.y += p.vy * dt; if ((p.life -= dt) <= 0) p.on = false; }
        for (const x of texts) if (x.on) { x.y += 24 * dt; if ((x.life -= dt) <= 0) x.on = false; }
        if ((state === 'ending' || state === 'won') && (endTimer -= dt) <= 0) ending();
      }
      function block(x, w, wy, i, ghost) {
        const X = x * scale, Y = sy(wy + BH), Wd = w * scale, Hh = BH * scale; if (Y > H + 4 || Y + Hh < -4) return;
        if (img) { g.drawImage(img, X, Y, Wd, Hh); g.strokeStyle = '#12062F'; g.lineWidth = 2; g.strokeRect(X, Y, Wd, Hh); return; }
        g.fillStyle = cfg.colorBody || '#E4EAF5'; g.fillRect(X, Y, Wd, Hh); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(X, Y, Wd, 3); g.fillStyle = cfg.colorBand || '#4A86F2'; g.fillRect(X, Y + Hh * 0.55, Wd, Hh * 0.22);
        g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(X + Wd * 0.8, Y, Wd * 0.2, Hh); g.fillStyle = '#12062F'; g.fillRect(X + 3, Y + 4, 3, 3); g.fillRect(X + Wd - 6, Y + 4, 3, 3);
        if (i % 5 === 0 && i) { g.fillStyle = '#E8403A'; g.beginPath(); g.arc(X + Wd / 2, Y + Hh * 0.3, Hh * 0.18, 0, 6.283); g.fill(); }
        g.strokeStyle = '#12062F'; g.lineWidth = 2; g.strokeRect(X, Y, Wd, Hh);
      }
      function draw() {
        g.save(); if (shake > 0 && !reduced) g.translate((Math.random() - .5) * 8 * shake * 3, (Math.random() - .5) * 8 * shake * 3);
        const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#12062F'); bg.addColorStop(1, '#3B2A80'); g.fillStyle = bg; g.fillRect(-10, -10, W + 20, H + 20);
        g.fillStyle = 'rgba(255,255,255,.55)'; for (let i = 0; i < 36; i++) { const x = (i * 97 % 100) / 100 * W, y = ((i * 53 % 100) / 100 * H + cam * scale * 0.2 * (1 + i % 3)) % H; g.fillRect(x, H - y, 2, 2); }
        stack.forEach((b, i) => block(b.x, b.w, i * BH, i));
        if (cur) { const sp = speedAt(height(), cfg, assist), x = swingX(t - cur.t0, sp, WORLD - cur.w, cur.phase), wy = (stack.length + 3) * BH;
          g.strokeStyle = '#9AA7C2'; g.lineWidth = 2; g.beginPath(); g.moveTo((x + cur.w / 2) * scale, 0); g.lineTo((x + cur.w / 2) * scale, sy(wy + BH)); g.stroke(); block(x, cur.w, wy, stack.length); }
        if (drop) block(drop.x, drop.w, drop.y, stack.length);
        for (const f of falls) if (f.on) { g.save(); g.translate((f.x + f.w / 2) * scale, sy(f.y + BH / 2)); g.rotate(f.rot); g.globalAlpha = 0.9; g.fillStyle = cfg.colorBody || '#E4EAF5'; g.fillRect(-f.w * scale / 2, -BH * scale / 2, f.w * scale, BH * scale); g.fillStyle = cfg.colorBand || '#4A86F2'; g.fillRect(-f.w * scale / 2, BH * scale * 0.05, f.w * scale, BH * scale * 0.22); g.strokeStyle = '#12062F'; g.lineWidth = 2; g.strokeRect(-f.w * scale / 2, -BH * scale / 2, f.w * scale, BH * scale); g.restore(); }
        g.fillStyle = '#FFE27A'; for (const p of parts) if (p.on) { g.globalAlpha = Math.max(0, p.life / 0.6); g.fillRect(p.x * scale, sy(p.y), 4, 4); } g.globalAlpha = 1;
        g.font = '20px "Lilita One",sans-serif'; g.textAlign = 'center'; for (const x of texts) if (x.on) { g.globalAlpha = Math.min(1, x.life * 2); g.lineWidth = 4; g.strokeStyle = '#12062F'; g.strokeText(x.s, x.x * scale, sy(x.y)); g.fillStyle = '#FFE27A'; g.fillText(x.s, x.x * scale, sy(x.y)); } g.globalAlpha = 1;
        if (flash > 0) { g.fillStyle = `rgba(255,255,255,${flash})`; g.fillRect(0, 0, W, H); }
        g.restore();
      }
      function loop(now) { raf = requestAnimationFrame(loop); const dt = Math.min(0.033, (now - last) / 1000 || 0); last = now; if (!paused && state !== 'title') { update(dt); } draw(); }
      const onPtr = e => { if (e.target.closest('.tw-over')) return; press(); };
      const onKey = e => { if (e.code === 'Space' || e.key === 'Enter') { if (state === 'play') { e.preventDefault(); press(); } } };
      const onClick = e => {
        if (e.target.closest('[data-play]')) reset(false); else if (e.target.closest('[data-endless]')) reset(true); else if (e.target.closest('[data-again]')) reset(true);
        else if (e.target.closest('[data-assist]')) { assist = !assist; store.set('tower.assist', assist); title(); }
      };
      cv.addEventListener('pointerdown', onPtr); document.addEventListener('keydown', onKey); wrap.addEventListener('click', onClick); addEventListener('resize', resize);
      resize(); reset(false); title(); last = performance.now(); raf = requestAnimationFrame(loop);
      return { pause() { paused = true; }, resume() { paused = false; last = performance.now(); }, destroy() { dead = true; cancelAnimationFrame(raf); document.removeEventListener('keydown', onKey); removeEventListener('resize', resize); root.innerHTML = ''; } };
    }
  });
})();
