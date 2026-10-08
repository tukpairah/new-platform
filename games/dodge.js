/* ==========================================================================
   Dodge fight "Message Through". Everything you edit is in config.js (games.dodge).
   Opened from the lobby with Dodge.open({ onToggle(open, ownMusic) }).
   ========================================================================== */
const Dodge = (function () {
  'use strict';
  const A = 400;                       // arena size in arena units (square)
  const BOSS_ZONE = 130;               // arena units reserved above the arena for the boss
  const STEP = 1 / 60;                 // fixed timestep
  const TELE = 0.7;                    // every attack is shown this long before it is deadly (never below 0.6)
  const BOSS_X = A / 2, BOSS_Y = -62;  // where attacks start
  let DEV = false;                     // set by the lobby (only when config.devKey is used)
  const COLORS = ['#7CD6FF', '#C792FF', '#FF9A90', '#F4C444', '#9DF28A'];   // bullet accent per phase
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const cfg = () => CONFIG.games.dodge;

  /* ---------- state ---------- */
  let root, cv, ctx, hud = {}, scr = {};
  let built = false, opts = {}, music = null, ownMusic = false;
  let W = 0, H = 0, dpr = 1, sc = 1, ox = 0, oy = 0;
  let state = 'title';                 // title | play | dialog | pause | dead | result
  let raf = 0, last = 0, acc = 0, animT = 0, fpsT = 0, fpsN = 0, fps = 0;
  let assist = false, ready = false;
  let imgs = new Map();               // src -> Image or null (failed)
  const keys = new Set();
  const dev = { inv: false, hit: false, on: false };

  const P = { x: A / 2, y: A * 0.78, hp: 5, maxHp: 5, inv: 0, dash: 0, dashDx: 0, dashDy: -1, meter: 1, vx: 0, vy: 0, fx: 0, fy: -1, trail: [] };
  const G = {                         // the run
    phase: 0, mode: 'intro', t: 0, score: 0, combo: 0, maxCombo: 0, hits: 0, deaths: 0, grazes: 0,
    cp: null, shake: 0, flash: 0, bossHurt: 0, events: [], evI: 0, rng: null, runClock: 0
  };
  const drag = { id: null, fx: 0, fy: 0, cx: 0, cy: 0, px: 0, py: 0 };
  let patterns = [], token = null;

  /* ---------- bullet pool ---------- */
  const MAXB = 300;
  const pool = [];
  function makePool() { pool.length = 0; for (let i = 0; i < MAXB; i++) pool.push({ on: false, type: 'orb', x: 0, y: 0, vx: 0, vy: 0, r: 6, age: 0, grazed: false, col: 0, ang: 0 }); }
  const poolCap = () => Math.min(MAXB, cfg().rules.maxBullets || MAXB);
  let live = 0;
  function spawn(type, x, y, vx, vy) {
    const cap = poolCap();
    for (let i = 0; i < cap; i++) {
      const b = pool[i];
      if (!b.on) {
        b.on = true; b.type = type; b.x = x; b.y = y; b.vx = vx; b.vy = vy; b.age = 0; b.grazed = false; b.col = G.phase;
        b.r = cfg().art.bulletHit[type] || 6; b.ang = Math.atan2(vy, vx); live++;
        return b;
      }
    }
    return null;
  }
  function clearBullets() { for (const b of pool) b.on = false; live = 0; }

  /* ---------- seeded random (same fight every time) ---------- */
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /* ---------- images: preload with fallbacks ---------- */
  function artSources() {
    const a = cfg().art, out = [];
    const add = s => { if (s && typeof s === 'string') out.push(s); };
    ['image', 'imageHurt', 'imageDash'].forEach(k => add(a.player[k]));
    ['image', 'imageHurt', 'imageWin'].forEach(k => add(a.boss[k]));
    (a.boss.phaseImages || []).forEach(add);
    Object.keys(a.bullets || {}).forEach(k => add(a.bullets[k]));
    add(a.portrait); add(a.arena && a.arena.background);
    return Array.from(new Set(out));
  }
  function loadImage(src) {
    return new Promise(res => {
      const im = new Image(); let done = false;
      const fin = ok => { if (done) return; done = true; clearTimeout(tm); if (!ok) console.warn('[dodge] image failed to load, using the drawn default:', src); imgs.set(src, ok ? im : null); res(); };
      const tm = setTimeout(() => fin(false), 8000);
      im.onload = () => fin(true); im.onerror = () => fin(false);
      im.src = src;
    });
  }
  function preload() {
    ready = false; paintTitle();
    const todo = artSources().filter(s => !imgs.has(s));
    return Promise.all(todo.map(loadImage)).then(() => { ready = true; paintTitle(); });
  }
  const getImg = src => (src && imgs.get(src)) || null;

  const flashCv = document.createElement('canvas'); flashCv.width = flashCv.height = 256;
  /* draws a picture centred, keeping its aspect ratio, inside a size x size box. flash 0..1 = white hit flash */
  function drawImg(c, im, x, y, size, rot, alpha, flash) {
    const iw = im.naturalWidth || im.width || size, ih = im.naturalHeight || im.height || size, k = size / Math.max(iw, ih);
    const w = iw * k, h = ih * k;
    c.save(); c.translate(x, y); if (rot) c.rotate(rot); c.globalAlpha = alpha == null ? 1 : alpha;
    if (flash > 0.01) {
      const f = flashCv.getContext('2d'), m = 256 / Math.max(w, h) * 0.9, fw = w * m, fh = h * m;
      f.clearRect(0, 0, 256, 256); f.globalCompositeOperation = 'source-over';
      f.drawImage(im, 128 - fw / 2, 128 - fh / 2, fw, fh);
      f.globalCompositeOperation = 'source-atop'; f.fillStyle = `rgba(255,255,255,${flash})`; f.fillRect(0, 0, 256, 256);
      c.drawImage(flashCv, -128 / m, -128 / m, 256 / m, 256 / m);
    } else c.drawImage(im, -w / 2, -h / 2, w, h);
    c.restore();
  }

  /* ---------- drawn default art ---------- */
  function heartPath(c, s) {
    c.beginPath(); c.moveTo(0, s * 0.38);
    c.bezierCurveTo(-s * 0.62, -s * 0.05, -s * 0.46, -s * 0.5, 0, -s * 0.2);
    c.bezierCurveTo(s * 0.46, -s * 0.5, s * 0.62, -s * 0.05, 0, s * 0.38); c.closePath();
  }
  function drawHeart(c, x, y, s, alpha) {
    c.save(); c.translate(x, y); c.globalAlpha = alpha;
    heartPath(c, s); c.fillStyle = '#E8403A'; c.fill(); c.lineWidth = 2.5; c.strokeStyle = '#fff'; c.stroke();
    c.restore();
  }
  function drawCloud(c, x, y, s, t, ph, flash) {
    const col = COLORS[ph % COLORS.length];
    c.save(); c.translate(x, y);
    c.fillStyle = flash > 0.01 ? '#fff' : '#26293A'; c.strokeStyle = col; c.lineWidth = 3;
    for (let i = 0; i < 7; i++) {
      const a = i / 7 * 6.283 + t * 0.5, r = s * (0.28 + 0.05 * Math.sin(t * 2 + i * 1.7));
      c.beginPath(); c.arc(Math.cos(a) * s * 0.28, Math.sin(a) * s * 0.18, r, 0, 6.283); c.fill(); c.stroke();
    }
    c.beginPath(); c.arc(0, 0, s * 0.34, 0, 6.283); c.fillStyle = flash > 0.01 ? '#fff' : '#26293A'; c.fill();
    // glitch bars
    for (let i = 0; i < 5; i++) {
      const k = Math.floor(t * 8 + i * 13) % 7, gx = (Math.sin(i * 12.9 + k * 4.1)) * s * 0.4, gy = (Math.cos(i * 7.7 + k * 2.3)) * s * 0.3;
      c.fillStyle = i % 2 ? col : '#fff'; c.globalAlpha = 0.55; c.fillRect(gx - s * 0.12, gy, s * 0.24, 3 + (i % 3) * 2);
    }
    c.globalAlpha = 1;
    // eyes
    c.fillStyle = col; c.fillRect(-s * 0.17, -s * 0.06, s * 0.1, s * 0.07); c.fillRect(s * 0.07, -s * 0.06, s * 0.1, s * 0.07);
    c.restore();
  }
  const spriteCache = {};
  function sprite(type, col) {
    const key = type + col; if (spriteCache[key]) return spriteCache[key];
    const cvs = document.createElement('canvas'); cvs.width = cvs.height = 64; const c = cvs.getContext('2d'); c.translate(32, 32);
    const color = COLORS[col % COLORS.length];
    if (type === 'shard') {
      c.beginPath(); c.moveTo(28, 0); c.lineTo(0, -9); c.lineTo(-22, 0); c.lineTo(0, 9); c.closePath();
      c.fillStyle = color; c.fill(); c.lineWidth = 3; c.strokeStyle = '#fff'; c.stroke();
    } else {
      const g = c.createRadialGradient(0, 0, 2, 0, 0, 26); g.addColorStop(0, '#fff'); g.addColorStop(0.45, color); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.beginPath(); c.arc(0, 0, 26, 0, 6.283); c.fill();
      c.lineWidth = 3; c.strokeStyle = type === 'homing' ? '#fff' : color; c.beginPath(); c.arc(0, 0, type === 'homing' ? 16 : 11, 0, 6.283); c.stroke();
    }
    return (spriteCache[key] = cvs);
  }

  /* ---------- audio (synthesized, no files) ---------- */
  let ac = null;
  function tone(freq, dur, type, vol, slide, delay) {
    if (isMuted()) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      if (ac.state === 'suspended') ac.resume();
      const t = ac.currentTime + (delay || 0), o = ac.createOscillator(), g = ac.createGain();
      o.type = type || 'square'; o.frequency.setValueAtTime(freq, t);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime((vol || 0.1) * (window.Sfx ? Sfx.level('sfx') * Sfx.level('master') : 1) + 0.0001, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  }
  const sfx = {
    hit()   { tone(180, 0.28, 'sawtooth', 0.16, 0.35); tone(90, 0.3, 'square', 0.1, 0.5); },
    graze() { tone(1200, 0.06, 'triangle', 0.05, 1.4); },
    dash()  { tone(300, 0.14, 'triangle', 0.09, 2.6); },
    phase() { [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.1, 1, i * 0.09)); },
    win()   { [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(f, 0.22, 'triangle', 0.11, 1, i * 0.11)); },
    lose()  { [392, 330, 262].forEach((f, i) => tone(f, 0.3, 'triangle', 0.1, 0.95, i * 0.15)); }
  };

  /* ---------- attack patterns ---------- */
  // Each pattern: { update(dt), draw(c), done }. They are deterministic: same fight every time.
  const spd = v => v * (cfg().rules.difficulty || 1) * (assist ? cfg().rules.assistBulletSpeed : 1);

  // Aimed burst: a red line shows where it will fire, then a fan of bullets goes along it.
  function aimed(p) {
    const o = { done: false, st: 'tele', t: 0, n: 0, ang: 0, locked: false };
    o.update = function (dt) {
      o.t += dt;
      if (o.st === 'tele') {
        if (!o.locked) { o.ang = Math.atan2(P.y - BOSS_Y, P.x - BOSS_X); o.locked = true; }
        if (o.t >= TELE) {
          const n = p.count, sp = (p.spread || 0) * Math.PI / 180;
          for (let i = 0; i < n; i++) {
            const a = o.ang + (n > 1 ? (i / (n - 1) - 0.5) * sp : 0), v = spd(p.speed);
            spawn(p.type || 'orb', BOSS_X, BOSS_Y, Math.cos(a) * v, Math.sin(a) * v);
          }
          o.n++; o.t = 0; o.st = 'gap'; o.locked = false;
          if (o.n >= p.bursts) o.done = true;
        }
      } else if (o.t >= (p.gap || 0.35)) { o.t = 0; o.st = 'tele'; }
    };
    o.draw = function (c) {
      if (o.st !== 'tele' || !o.locked) return;
      const k = o.t / TELE, n = p.count, sp = (p.spread || 0) * Math.PI / 180;
      c.save(); c.lineWidth = 2 + k * 3; c.strokeStyle = `rgba(255,90,80,${0.25 + 0.55 * k})`; c.setLineDash([10, 8]);
      for (let i = 0; i < n; i++) {
        const a = o.ang + (n > 1 ? (i / (n - 1) - 0.5) * sp : 0);
        c.beginPath(); c.moveTo(BOSS_X, BOSS_Y); c.lineTo(BOSS_X + Math.cos(a) * 700, BOSS_Y + Math.sin(a) * 700); c.stroke();
      }
      c.restore();
    };
    return o;
  }
  const PATTERNS = { aimed };

  /* A phase script is a list of { at, pattern, params }. Stage 2 gives each phase its own mix. */
  function scriptFor(idx) {
    const ev = [], d = idx;
    const end = idx >= cfg().phases.length ? cfg().finale.duration : cfg().phases[idx].duration;
    for (let t = 2, i = 0; t < end - 3; t += Math.max(2.4, 4.2 - d * 0.4), i++) {
      if (i % 2 === 0) ev.push({ at: t, pat: 'aimed', p: { count: 3 + Math.min(d, 2), spread: 26, bursts: 2, speed: 140 + d * 14, type: 'orb', gap: 0.4 } });
      else ev.push({ at: t, pat: 'aimed', p: { count: 1, spread: 0, bursts: 3 + (d > 1 ? 1 : 0), speed: 220 + d * 14, type: 'shard', gap: 0.25 } });
    }
    return ev;
  }

  /* ---------- phases ---------- */
  const phaseCount = () => cfg().phases.length + 1;             // + the finale
  const phaseDur = i => i >= cfg().phases.length ? cfg().finale.duration : cfg().phases[i].duration;
  const phaseName = i => i >= cfg().phases.length ? 'Finale' : cfg().phases[i].name;
  const totalDur = () => { let s = 0; for (let i = 0; i < phaseCount(); i++) s += phaseDur(i); return s; };
  function elapsedBefore(i) { let s = 0; for (let k = 0; k < i; k++) s += phaseDur(k); return s; }

  function startPhase(idx) {
    G.phase = idx; G.mode = 'intro'; G.t = 0; G.evI = 0; G.events = scriptFor(idx);
    G.rng = rng(1234 + idx * 7919); patterns = []; clearBullets();
    G.cp = { phase: idx, score: G.score, maxCombo: G.maxCombo, hits: G.hits, grazes: G.grazes };
    P.hp = P.maxHp; P.inv = 0; P.dash = 0; P.meter = 1; P.trail.length = 0;
    banner(phaseName(idx));
    state = 'play'; showScreen(null); paintHud(true); blurFocus();
  }
  function endPhase() {
    G.mode = 'clear'; G.t = 0; G.flash = 1; G.bossHurt = 1; G.shake = 10; patterns = []; clearBullets();
    G.score += 300; sfx.phase();
  }
  function afterClear() {
    const last = G.phase >= phaseCount() - 1;
    if (last) return win();
    showDialog();
  }
  function die() {
    if (opts.onEvent) opts.onEvent('lose');
    state = 'dead'; G.deaths++; if (!opts.customResult) sfx.lose(); clearBullets(); patterns = [];
    showScreen('dead'); paintDead();
  }
  function win() {
    if (opts.onEvent) opts.onEvent('win');
    state = 'result'; if (!opts.customResult) sfx.win();
    if (opts.rewards && token) { const res = opts.rewards.finish(token, { cleared: true, score: G.score }); token = null; if (opts.onReward) opts.onReward(res); }
    showScreen('result'); paintResult();
  }
  function retryCheckpoint() {
    const cp = G.cp; G.score = cp.score; G.maxCombo = cp.maxCombo; G.hits = cp.hits; G.grazes = cp.grazes; G.combo = 0;
    startPhase(cp.phase);
  }
  function newRun(fromPhase) {
    Object.assign(G, { score: 0, combo: 0, maxCombo: 0, hits: 0, grazes: 0, deaths: 0 });
    const rules = cfg().rules; P.maxHp = assist ? rules.assistHp : rules.hp;
    P.x = A / 2; P.y = A * 0.78; P.trail.length = 0;
    if (!fromPhase) { token = opts.rewards ? opts.rewards.start('dodge') : null; if (opts.onEvent) opts.onEvent('start'); }     // one reward session per run; checkpoint retries keep it
    startPhase(fromPhase || 0);
    if (music && ownMusic) music.play();
  }

  /* ---------- simulation ---------- */
  function moveVec() {
    let x = 0, y = 0;
    if (keys.has('ArrowLeft') || keys.has('a') || keys.has('q')) x--;
    if (keys.has('ArrowRight') || keys.has('d')) x++;
    if (keys.has('ArrowUp') || keys.has('w') || keys.has('z')) y--;
    if (keys.has('ArrowDown') || keys.has('s')) y++;
    if (x && y) { x *= 0.7071; y *= 0.7071; }
    return [x, y];
  }
  function tryDash() {
    if (state !== 'play' || P.dash > 0 || P.meter < 1 || G.mode === 'clear') return;
    let [dx, dy] = moveVec();
    if (!dx && !dy) { dx = P.fx; dy = P.fy; }
    const l = Math.hypot(dx, dy) || 1; P.dashDx = dx / l; P.dashDy = dy / l;
    P.dash = cfg().rules.dash.duration; P.meter = 0; sfx.dash();
  }

  function update(dt) {
    const R = cfg().rules, art = cfg().art.player;
    animT += dt; G.runClock += dt;
    G.shake = Math.max(0, G.shake - dt * 30); G.flash = Math.max(0, G.flash - dt * 3); G.bossHurt = Math.max(0, G.bossHurt - dt * 1.2);

    /* player */
    const px = P.x, py = P.y;
    if (P.dash > 0) {
      P.dash -= dt; const sp = R.dash.speed;
      P.x += P.dashDx * sp * dt; P.y += P.dashDy * sp * dt;
      P.trail.push({ x: P.x, y: P.y, a: 0.6 });
      if (P.dash <= 0 && drag.id !== null) { drag.fx = drag.cx; drag.fy = drag.cy; drag.px = P.x; drag.py = P.y; }
    } else {
      const [mx, my] = moveVec();
      if (drag.id !== null) { P.x = drag.px + (drag.cx - drag.fx) / sc * R.dragGain; P.y = drag.py + (drag.cy - drag.fy) / sc * R.dragGain; }
      else { P.x += mx * R.speed * dt; P.y += my * R.speed * dt; }
    }
    const m = 6; P.x = clamp(P.x, m, A - m); P.y = clamp(P.y, m, A - m);
    const vx = (P.x - px) / dt, vy = (P.y - py) / dt, vl = Math.hypot(vx, vy);
    if (vl > 5) { P.fx = vx / vl; P.fy = vy / vl; }
    for (let i = P.trail.length - 1; i >= 0; i--) { P.trail[i].a -= dt * 3; if (P.trail[i].a <= 0) P.trail.splice(i, 1); }
    if (P.inv > 0) P.inv -= dt;
    if (P.dash <= 0 && P.meter < 1) P.meter = Math.min(1, P.meter + dt / R.dash.cooldown);

    /* phase flow */
    G.t += dt;
    if (G.mode === 'intro' && G.t >= 1.6) { G.mode = 'fight'; G.t = 0; }
    else if (G.mode === 'fight') {
      while (G.evI < G.events.length && G.events[G.evI].at <= G.t) { const e = G.events[G.evI++]; patterns.push(PATTERNS[e.pat](e.p)); }
      if (G.t >= phaseDur(G.phase)) endPhase();
    } else if (G.mode === 'clear' && G.t >= 1.1) { afterClear(); return; }

    /* patterns */
    for (let i = patterns.length - 1; i >= 0; i--) { patterns[i].update(dt); if (patterns[i].done) patterns.splice(i, 1); }

    /* bullets */
    const hr = art.hitRadius, gr = hr + art.grazeRadius, ghost = P.inv > 0 || P.dash > 0 || dev.inv || G.mode === 'clear';
    const cap = poolCap();
    for (let i = 0; i < cap; i++) {
      const b = pool[i]; if (!b.on) continue;
      b.age += dt; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < -120 || b.x > A + 120 || b.y < -120 || b.y > A + 120) { b.on = false; live--; continue; }
      const dx = b.x - P.x, dy = b.y - P.y, d2 = dx * dx + dy * dy, hb = b.r + hr;
      if (d2 < hb * hb) {
        if (!ghost) { hurt(); b.on = false; live--; }
      } else if (!b.grazed && d2 < (b.r + gr) * (b.r + gr)) {
        b.grazed = true; graze();
      }
    }
  }
  function mult() { const R = cfg().rules; return Math.min(R.comboMax, 1 + Math.floor(G.combo / R.comboStep) * 0.5); }
  function graze() {
    const R = cfg().rules; G.combo++; G.grazes++; if (G.combo > G.maxCombo) G.maxCombo = G.combo;
    G.score += Math.round(R.grazeScore * mult()); P.meter = Math.min(1, P.meter + R.grazeDash); sfx.graze(); paintHud();
  }
  function hurt() {
    P.hp--; P.inv = cfg().rules.invincibility; G.combo = 0; G.hits++; G.shake = 9; sfx.hit(); paintHud(true);
    if (P.hp <= 0) die();
  }

  /* ---------- layout and render ---------- */
  function layout() {
    if (!root || root.hidden) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = root.clientWidth; H = root.clientHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    const top = 78, bottom = root.classList.contains('touch') ? 100 : 40;
    sc = Math.max(0.3, Math.min((W - 20) / A, (H - top - bottom) / (A + BOSS_ZONE)));
    ox = (W - A * sc) / 2; oy = top + BOSS_ZONE * sc + Math.max(0, (H - top - bottom - (A + BOSS_ZONE) * sc) / 2);
    if (hud.pause) { hud.pause.style.right = '12px'; hud.pause.style.top = (top + 4) + 'px'; }
  }

  function bossImage() {
    const b = cfg().art.boss, ph = (b.phaseImages || [])[G.phase];
    if (state === 'dead' && getImg(b.imageWin)) return getImg(b.imageWin);
    if (G.bossHurt > 0.3 && getImg(b.imageHurt)) return getImg(b.imageHurt);
    return getImg(ph) || getImg(b.image);
  }
  function drawBoss(c) {
    const b = cfg().art.boss, bob = Math.sin(animT * 2) * 6, rot = Math.sin(animT * 1.3) * 0.06;
    const x = BOSS_X + Math.sin(animT * 0.8) * 10, y = BOSS_Y + bob - 8, fl = Math.max(G.flash, G.bossHurt * 0.6);
    const im = bossImage();
    if (im) drawImg(c, im, x, y, b.size, rot, 1, fl);
    else { c.save(); c.translate(x, y); c.rotate(rot); drawCloud(c, 0, 0, b.size, animT, G.phase, fl); c.restore(); }
  }
  function drawPlayer(c) {
    const a = cfg().art.player, blink = P.inv > 0 && Math.floor(P.inv * 14) % 2 === 0, alpha = blink ? 0.35 : 1;
    for (const t of P.trail) { c.globalAlpha = t.a * 0.5; const im = getImg(a.image); if (im) drawImg(c, im, t.x, t.y, a.size, 0, t.a * 0.5); else drawHeart(c, t.x, t.y, a.size, t.a * 0.5); }
    c.globalAlpha = 1;
    const im = (P.dash > 0 && getImg(a.imageDash)) || (P.inv > 0 && getImg(a.imageHurt)) || getImg(a.image);
    if (im) drawImg(c, im, P.x, P.y, a.size, 0, alpha);
    else drawHeart(c, P.x, P.y, a.size, alpha);
    if (a.showHitbox || dev.hit) {
      c.beginPath(); c.arc(P.x, P.y, Math.max(2.2, a.hitRadius), 0, 6.283);
      c.fillStyle = '#fff'; c.fill(); c.lineWidth = 1.5; c.strokeStyle = '#E8403A'; c.stroke();
    }
  }
  function drawBullet(c, b) {
    const art = cfg().art, im = getImg(art.bullets[b.type]), size = (art.bulletSize || {})[b.type] || 22;
    if (im) { drawImg(c, im, b.x, b.y, size, b.type === 'shard' ? b.ang : 0, 1); }
    else {
      const s = sprite(b.type, b.col), k = size / 40;      // the drawn sprite is 64px with ~40px of body
      c.save(); c.translate(b.x, b.y); if (b.type === 'shard') c.rotate(b.ang); c.scale(k, k); c.drawImage(s, -32, -32); c.restore();
    }
    if (dev.hit) { c.beginPath(); c.arc(b.x, b.y, b.r, 0, 6.283); c.strokeStyle = '#0f0'; c.lineWidth = 1; c.stroke(); }
  }

  function render() {
    if (!ctx || root.hidden) return;
    const c = ctx;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    const sk = G.shake, sx = sk ? (Math.random() - 0.5) * sk : 0, sy = sk ? (Math.random() - 0.5) * sk : 0;
    c.translate(ox * 1 + sx, oy + sy); c.scale(sc, sc);

    drawBoss(c);

    // arena box
    c.fillStyle = '#0C070F'; c.fillRect(0, 0, A, A);
    const bg = getImg(cfg().art.arena && cfg().art.arena.background);
    if (bg) c.drawImage(bg, 0, 0, A, A);
    c.save(); c.beginPath(); c.rect(0, 0, A, A); c.clip();
    for (const p of patterns) p.draw(c);
    for (let i = 0; i < pool.length; i++) if (pool[i].on) drawBullet(c, pool[i]);
    if (state !== 'dead') drawPlayer(c);
    c.restore();
    c.lineWidth = 5; c.strokeStyle = '#fff'; c.strokeRect(0, 0, A, A);

    // dash meter under the arena
    const mw = 140, mx = (A - mw) / 2, my = A + 14;
    c.fillStyle = 'rgba(0,0,0,.45)'; c.fillRect(mx, my, mw, 10);
    c.fillStyle = P.meter >= 1 ? '#8CEB6B' : '#F4C444'; c.fillRect(mx, my, mw * P.meter, 10);
    c.lineWidth = 2; c.strokeStyle = '#0C070F'; c.strokeRect(mx, my, mw, 10);
    c.fillStyle = '#fff'; c.font = '13px "Lilita One",sans-serif'; c.textAlign = 'center';
    c.fillText(P.meter >= 1 ? 'DASH READY' : 'DASH', A / 2, my + 28);

    // phase banner
    if (bannerT > 0) {
      c.globalAlpha = clamp(bannerT / 0.4, 0, 1);
      c.font = '30px "Lilita One",sans-serif'; c.lineWidth = 6; c.strokeStyle = '#0C070F'; c.strokeText(bannerText, A / 2, A / 2 - 40); c.fillStyle = '#fff'; c.fillText(bannerText, A / 2, A / 2 - 40);
      c.globalAlpha = 1;
    }
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (dev.on) { c.fillStyle = '#fff'; c.font = '12px monospace'; c.textAlign = 'left'; c.fillText(`${fps} fps  bullets ${live}  ${dev.inv ? 'INV' : ''}`, 8, H - 8 - (hud.dev ? 40 : 0)); }
  }
  let bannerT = 0, bannerText = '';
  function banner(t) { bannerText = t; bannerT = 1.6; }

  /* ---------- HUD (hearts, boss bar, combo, score) ---------- */
  const HEART = '<svg viewBox="-12 -12 24 24"><path d="M0 8C-14-2-9-12 0-5 9-12 14-2 0 8z" fill="#E8403A" stroke="#fff" stroke-width="2"/></svg>';
  let lastHp = -1, lastStats = '';
  function paintHud(force) {
    if (!hud.hearts) return;
    if (force) lastStats = '';
    if (force || lastHp !== P.hp) {
      lastHp = P.hp; let h = '';
      for (let i = 0; i < P.maxHp; i++) h += i < P.hp ? HEART : HEART.replace('<svg', '<svg class="off"');
      hud.hearts.innerHTML = h;
    }
    hud.name.textContent = phaseName(G.phase);
    const m = mult();
    const txt = `${G.score}<br><small>${G.combo ? 'x' + m.toFixed(1) + ' combo ' + G.combo : ''}</small>`;
    if (txt !== lastStats) { lastStats = txt; hud.stats.innerHTML = txt; }
  }
  function paintBar() {
    const el = elapsedBefore(G.phase) + (G.mode === 'fight' ? G.t : G.mode === 'clear' ? phaseDur(G.phase) : 0);
    hud.bar.style.width = (100 - clamp(el / totalDur(), 0, 1) * 100) + '%';
  }

  /* ---------- screens (title, dialog, pause, dead, result) ---------- */
  const T = k => cfg().texts[k];
  function showScreen(name) { for (const k in scr) scr[k].hidden = k !== name; }
  function blurFocus() { try { document.activeElement && document.activeElement.blur(); } catch (e) {} }
  function modalBox(title, inner) { return `<div class="modal"><h2>${esc(title)}</h2>${inner}</div>`; }

  function paintTitle() {
    const d = cfg();
    const devBtns = DEV ? `<p class="mnote">DEV: start at</p><div class="row-flex">${Array.from({ length: phaseCount() }, (_, i) => `<button type="button" class="mbtn small grey" data-dg-start="${i}">${i + 1}</button>`).join('')}</div>` : '';
    scr.title.innerHTML = modalBox(d.title, `<p class="mnote">${esc(T('intro'))}</p>
      <p class="mnote">${esc(T('controls'))}</p>
      <button type="button" class="mbtn grey" data-dg="assist">${esc(T('assist'))}: ${assist ? 'ON' : 'off'}</button>
      <button type="button" class="mbtn dg-big" data-dg="play" ${ready ? '' : 'disabled'}>${ready ? esc(T('play')) : esc(T('loading'))}</button>
      <button type="button" class="mbtn grey" data-dg="quit">${esc(T('back'))}</button>${devBtns}`);
  }
  function portraitHTML() {
    const a = cfg().art, src = a.portrait || '';
    if (getImg(src)) return `<img src="${esc(src)}" alt="">`;
    const bi = getImg(a.boss.image); if (bi) return `<img src="${esc(a.boss.image)}" alt="">`;
    return '<canvas width="84" height="84" data-dg-portrait></canvas>';
  }
  function drawPortrait() {
    const pc = scr.dialog.querySelector('[data-dg-portrait]'); if (!pc) return;
    const c = pc.getContext('2d'); c.translate(42, 44); drawCloud(c, 0, 0, 62, animT, G.phase, 0);
  }
  function showDialog() {
    state = 'dialog';
    const d = cfg(), i = G.phase, line = i >= d.phases.length ? d.finale.line : d.phases[i].line, frag = i >= d.phases.length ? d.finale.fragment : d.phases[i].fragment;
    scr.dialog.innerHTML = modalBox(phaseName(i) + ' clear!', `<div class="dg-say"><div class="dg-portrait">${portraitHTML()}</div><div class="mnote" style="text-align:left;margin:0">${esc(line)}</div></div>
      <div class="dg-frag t">Message: ${esc(frag)}</div>
      <button type="button" class="mbtn dg-big" data-dg="next">${i >= phaseCount() - 1 ? 'FINISH' : 'NEXT'}</button>`);
    showScreen('dialog'); drawPortrait(); paintBar();
  }
  function paintDead() {
    scr.dead.innerHTML = modalBox('Oh no!', `<p class="mnote">You will restart from the beginning of ${esc(phaseName(G.cp.phase))}. No problem, try again!</p>
      <button type="button" class="mbtn dg-big" data-dg="retry">${esc(T('retry'))}</button>
      <button type="button" class="mbtn grey" data-dg="quit">${esc(T('back'))}</button>`);
  }
  function paintResult() {
    scr.result.innerHTML = modalBox('Message delivered!', `<p class="mnote">${esc(cfg().finalMessage)}</p>
      <p class="mnote">Score ${G.score} &middot; Max combo ${G.maxCombo} &middot; Hits ${G.hits}</p>
      <button type="button" class="mbtn dg-big" data-dg="again">${esc(T('retry'))}</button>
      <button type="button" class="mbtn grey" data-dg="quit">${esc(T('back'))}</button>`);
  }
  function paintPause() {
    scr.pause.innerHTML = modalBox('Paused', `<button type="button" class="mbtn dg-big" data-dg="resume">RESUME</button>
      <button type="button" class="mbtn grey" data-dg="quit">${esc(T('back'))}</button>`);
  }
  function pause() { if (state !== 'play') return; state = 'pause'; paintPause(); showScreen('pause'); if (music) music.pause(); }
  function resume() { if (state !== 'pause') return; state = 'play'; showScreen(null); last = performance.now(); blurFocus(); syncMusic(); }
  function syncMusic() { if (music && ownMusic && !document.hidden && state !== 'title' && state !== 'pause') music.play(); else if (music) music.pause(); }

  /* ---------- input ---------- */
  function onKey(e) {
    if (!root || root.hidden) return;
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (e.type === 'keyup') { keys.delete(k); return; }
    if (k === 'Escape') { e.modalClosed = true; if (state === 'play') pause(); else if (state === 'pause') resume(); e.preventDefault(); return; }
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', ' '].includes(k)) e.preventDefault();
    if (state !== 'play') return;
    if (k === ' ') { if (!e.repeat) tryDash(); return; }
    keys.add(k);
    if (DEV) {
      if (k === 'i') { dev.inv = !dev.inv; devPaint(); }
      if (k === 'h') { dev.hit = !dev.hit; devPaint(); }
      if (/^[1-9]$/.test(k) && +k <= phaseCount()) newRun(+k - 1);
    }
  }
  function pdown(e) {
    if (e.pointerType !== 'mouse' && !root.classList.contains('touch')) { root.classList.add('touch'); layout(); }
    if (state !== 'play' || drag.id !== null) return;
    drag.id = e.pointerId; drag.fx = drag.cx = e.clientX; drag.fy = drag.cy = e.clientY; drag.px = P.x; drag.py = P.y;
    try { cv.setPointerCapture(e.pointerId); } catch (er) {}
  }
  function pmove(e) { if (e.pointerId === drag.id) { drag.cx = e.clientX; drag.cy = e.clientY; } }
  function pup(e) { if (e.pointerId === drag.id) drag.id = null; }

  function devPaint() {
    if (!hud.dev) return;
    hud.dev.innerHTML = `<button type="button" data-dgdev="inv" class="${dev.inv ? 'on' : ''}">Invincible (I)</button><button type="button" data-dgdev="hit" class="${dev.hit ? 'on' : ''}">Hitboxes (H)</button>` +
      Array.from({ length: phaseCount() }, (_, i) => `<button type="button" data-dgdev="ph" data-i="${i}">P${i + 1}</button>`).join('');
  }

  /* ---------- main loop ---------- */
  function frame(ts) {
    raf = requestAnimationFrame(frame);
    let dt = (ts - last) / 1000; last = ts; if (!(dt > 0)) dt = 0; if (dt > 0.1) dt = 0.1;
    fpsT += dt; fpsN++; if (fpsT >= 0.5) { fps = Math.round(fpsN / fpsT); fpsT = fpsN = 0; }
    if (state === 'play') {
      acc += dt;
      while (acc >= STEP && state === 'play') { update(STEP); acc -= STEP; }
      if (bannerT > 0) bannerT -= dt;
      paintBar(); paintHud();
    } else { animT += dt; acc = 0; }
    render();
  }

  /* ---------- open / close ---------- */
  function build() {
    if (built) return; built = true;
    root = document.createElement('div'); root.id = 'dodgeRoot'; root.className = 'dodge-root'; root.hidden = true;
    root.innerHTML = `<canvas class="dg-canvas"></canvas>
      <div class="dg-hud"><div class="dg-row"><div class="dg-hearts"></div><div class="dg-stats t"></div></div>
        <div class="dg-boss"><div class="mbar"><i></i><span class="t" style="--st:var(--bk)"></span></div></div></div>
      <button type="button" class="dg-pause" data-dg="pause" aria-label="Pause">II</button>
      <button type="button" class="mbtn dg-dash" data-dg="dash">DASH</button>
      ${DEV ? '<div class="dg-dev"></div>' : ''}
      <div class="dg-screen" data-s="title"></div><div class="dg-screen" data-s="dialog" hidden></div><div class="dg-screen" data-s="pause" hidden></div>
      <div class="dg-screen" data-s="dead" hidden></div><div class="dg-screen" data-s="result" hidden></div>`;
    document.body.appendChild(root);
    cv = root.querySelector('canvas'); ctx = cv.getContext('2d');
    hud = { hearts: root.querySelector('.dg-hearts'), stats: root.querySelector('.dg-stats'), bar: root.querySelector('.mbar i'), name: root.querySelector('.mbar span'), pause: root.querySelector('.dg-pause'), dev: root.querySelector('.dg-dev') };
    root.querySelectorAll('[data-s]').forEach(el => scr[el.dataset.s] = el);
    cv.addEventListener('pointerdown', pdown); cv.addEventListener('pointermove', pmove); cv.addEventListener('pointerup', pup); cv.addEventListener('pointercancel', pup);
    const dashBtn = root.querySelector('.dg-dash');
    dashBtn.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); tryDash(); });
    dashBtn.addEventListener('click', e => e.stopPropagation());
    root.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey, true); document.addEventListener('keyup', onKey, true);
    document.addEventListener('visibilitychange', () => { if (root.hidden) return; if (document.hidden) pause(); syncMusic(); });
    addEventListener('resize', layout);
    makePool(); devPaint();
  }

  function onClick(e) {
    const dv = e.target.closest('[data-dgdev]');
    if (dv) { const k = dv.dataset.dgdev; if (k === 'inv') dev.inv = !dev.inv; else if (k === 'hit') dev.hit = !dev.hit; else if (k === 'ph') newRun(+dv.dataset.i); devPaint(); blurFocus(); return; }
    const s = e.target.closest('[data-dgstart],[data-dg-start]'); if (s) { newRun(+s.dataset.dgStart); return; }
    const a = e.target.closest('[data-dg]'); if (!a) return;
    switch (a.dataset.dg) {
      case 'assist': assist = !assist; store.set('dodgeAssist', assist); paintTitle(); break;
      case 'play': if (ready) newRun(0); break;
      case 'next': startPhase(G.phase + 1); break;
      case 'retry': retryCheckpoint(); break;
      case 'again': newRun(0); break;
      case 'pause': pause(); break;
      case 'resume': resume(); break;
      case 'quit': close(); break;
    }
  }
  
  function open(o) {
    opts = o || {}; DEV = !!opts.dev; dev.hit = dev.on = DEV; dev.inv = false;
    build();
    assist = !!store.get('dodgeAssist', false);
    const d = cfg();
    const tracks = (d.music || []).filter(Boolean);
    ownMusic = tracks.length > 0;
    music = ownMusic ? makeMusic(tracks, 'lastDodgeTrack', d.musicVolume, d.musicRotate) : null;
    state = 'title'; patterns = []; clearBullets(); P.hp = P.maxHp = d.rules.hp; lastHp = -1;
    G.phase = 0; G.mode = 'intro'; G.t = 0; G.shake = G.flash = G.bossHurt = 0; bannerT = 0;
    root.classList.toggle('touch', !!(window.matchMedia && matchMedia('(pointer:coarse)').matches));
    root.hidden = false; showScreen('title'); paintTitle(); paintHud(true); layout();
    hud.bar.style.width = '100%';
    cancelAnimationFrame(raf); last = performance.now(); raf = requestAnimationFrame(frame);
    if (opts.onToggle) opts.onToggle(true, ownMusic);
    preload();
  }
  function close() {
    state = 'title'; keys.clear(); drag.id = null; cancelAnimationFrame(raf);
    if (music) music.pause();
    root.hidden = true;
    if (opts.onToggle) opts.onToggle(false, ownMusic);
  }

  return { open, close };
})();

/* Hooks Dodge into the shell. "native": it keeps its own title, pause and result screens; the shell only manages the music, the reward token API and leaving. */
if (typeof R2 !== 'undefined' && R2.games) R2.games.register({
  id: "dodge", native: true, schema: [], defaults: {},
  mount(ctx) {
    Dodge.open({ customResult: true, rewards: ctx.rewards, dev: ctx.dev, onEvent: ctx.onEvent, onReward: ctx.onReward, onToggle(open) { if (!open) ctx.exit(); } });
    return { pause() {}, resume() {}, destroy() { Dodge.close(); } };
  }
});
