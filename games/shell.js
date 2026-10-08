/* ==========================================================================
   The shell every game mode runs in (top bar, pause, result with stars and reward chips, music).
   A mode registers itself:  R2.games.register({ id, schema, defaults, mount(ctx) -> { pause(), resume(), destroy() } })
   ctx = { root, cfg, sfx, bus, dev, stars(n), win({score, stars}), lose() }  (modes never grant rewards themselves)
   A "native" mode (Dodge) keeps its own screens: ctx = { rewards, dev, onEvent, onReward, exit }.
   ========================================================================== */
const Shell = (function () {
  'use strict';
  const STAR = (on) => `<svg viewBox="-12 -12 24 24" class="${on ? 'on' : 'off'}"><path d="M0-10L3-3 10 0 3 3 0 10-3 3-10 0-3-3z" fill="#FFD84A" stroke="#12062F" stroke-width="2" stroke-linejoin="round"/></svg>`;
  const starsHTML = (n, total = 3) => Array.from({ length: total }, (_, i) => STAR(i < n)).join('');
  let o = { rewards: null }, built = false, root, bar, stage, cur = null, music = null, paused = false, ownMusic = false;
  const $e = (s) => root.querySelector(s);

  function init(opts) { o = Object.assign(o, opts); }
  function build() {
    if (built) return; built = true;
    root = document.createElement('div'); root.className = 'gs-root'; root.hidden = true; root.addEventListener('click', e => e.stopPropagation());
    /* safety net for EVERY game: nothing inside a game may navigate, submit, open a menu or drag a picture away. External links must carry data-external (and target="_blank" rel="noopener noreferrer") */
    root.addEventListener('click', e => { if (root.classList.contains('native') && e.target.closest && e.target.closest('button')) Results.stop(); const l = e.target.closest && e.target.closest('a[href]'); if (l && !l.hasAttribute('data-external')) e.preventDefault(); }, true);
    ['submit', 'contextmenu', 'dragstart'].forEach(t => root.addEventListener(t, e => e.preventDefault(), true)); root.id = 'gameShell';
    root.innerHTML = `<div class="gs-bar"><button type="button" class="mbtn small grey ib" data-gs="back" aria-label="Back"><span class="ico" data-icon="back"></span></button>
        <div class="t gs-title"></div><span class="gs-diff"></span><span class="t gs-best"></span>
        <button type="button" class="mbtn small grey ib" data-gs="howto" aria-label="Comment jouer" hidden>?</button><button type="button" class="mbtn small grey ib" data-gs="pause" aria-label="Pause">II</button><button type="button" class="mbtn small grey ib" data-gs="sound" aria-label="Sound"><span class="ico" data-icon="sound"></span></button></div>
      <div class="gs-stars"></div><div class="gs-stage"></div>
      <div class="gs-screen" data-s="pause" hidden></div><div class="gs-screen" data-s="result" hidden></div><div class="gs-screen" data-s="oops" hidden></div>`;
    document.body.appendChild(root); fillIcons(root);
    bar = $e('.gs-bar'); stage = $e('.gs-stage');
    root.addEventListener('click', onClick);
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && howEl) { e.modalClosed = true; e.preventDefault(); howEl.querySelector('[data-ht-ok]').click(); return; }
      if (e.key === 'Escape' && !root.hidden && !root.classList.contains('native')) { e.modalClosed = true; e.preventDefault(); paused ? resume() : pause(); } }, true);
    document.addEventListener('visibilitychange', () => { if (root.hidden) return; if (document.hidden) { pause(true); if (music) music.pause(); } else if (!paused && music) music.play(); });
  }
  const screen = (n, html) => { root.querySelectorAll('.gs-screen').forEach(s => { s.hidden = s.dataset.s !== n; if (s.dataset.s === n && html != null) s.innerHTML = html; }); };
  const modal = (title, inner) => `<div class="modal"><h2>${esc(title)}</h2>${inner}</div>`;

  const musicCache = {};
  function startMusic(m) {                          // inside the tap that opened the mode, so the browser allows sound
    const list = (m.music && m.music.length ? m.music : R2.games.defaultMusic()).filter(Boolean);
    ownMusic = list.length > 0; const ck = list.join('|'); music = ownMusic ? (musicCache[ck] || (musicCache[ck] = makeMusic(list, 'lastMode:' + m.id, 0.5, true))) : null;   // random first track (never the last one), then in order
    if (o.onMusic) o.onMusic(true, ownMusic);       // the lobby music pauses only when the mode has music of its own
    if (music) music.play();
  }
  function launch(id) {
    const m = R2.games.list().find(x => x.id === id); if (!m) return;
    if (!R2.isUnlocked(m.unlockDay || 1)) { toast('Opens Day ' + m.unlockDay); return; }
    build(); if (cur) teardown();
    cur = { m, token: null, inst: null, done: false, closing: false };
    paused = false; startMusic(m);
    root.classList.remove('native'); root.hidden = false; screen(null);
    $e('.gs-title').innerHTML = icon(m) + '<span>' + esc(m.name) + '</span>'; const d = $e('.gs-diff'); d.className = 'gs-diff ' + m.difficulty; d.textContent = m.difficulty[0].toUpperCase() + m.difficulty.slice(1);
    paintBest(); $e('.gs-stars').innerHTML = ''; stage.innerHTML = '<p class="gs-load t">Loading...</p>';
    R2.games.load(id).then(res => {
      if (!cur || cur.m !== m) return;
      if (!res.ok) { stage.innerHTML = `<div class="gs-panel gs-soon"><div class="t gs-big">${esc(m.name)}</div><p>Coming soon</p></div>`; return; }
      cur.res = res;
      const h = hasHowto(), b = $e('[data-gs="howto"]'); b.hidden = !h;
      const go = () => {
        if (!cur || cur.m !== m) return;
        if (res.def.native) { root.classList.add('native'); floatBtn(h); cur.inst = res.def.mount({ rewards: o.rewards, dev: o.dev, onEvent: n => { if (n === 'start') Results.stop(); if (n === 'win' || n === 'lose') Results.play(n === 'win', cur && cur.m); R2.bus.emit('game:' + n); }, onReward: r => { if (r && r.ok && o.gain) o.gain(r.gems, r.xp); }, exit }); }
        else run();
      };
      if (h && !seen()[m.id]) showHowto(go); else go();
    });
  }
  function run() {                                  // (re)start the mode; the reward token lives until the first clear
    const { m, res } = cur; stage.innerHTML = ''; screen(null); cur.done = false;
    if (!cur.token && o.rewards) cur.token = o.rewards.start(m.id);
    R2.bus.emit('game:start');
    try { cur.inst = res.def.mount({
      root: stage, cfg: res.cfg, sfx: Sfx, bus: R2.bus, dev: o.dev,
      stars: n => { $e('.gs-stars').innerHTML = starsHTML(n); },
      win: r => finish(true, r || {}), lose: () => finish(false, {})
    }); } catch (err) { oops(err); }
  }
  /* a bug inside a mode never throws her out: friendly panel, and "reprendre" mounts the mode again (each mode restores its own saved progress) */
  function oops(err) {
    try { console.error('[shell] mode error in ' + (cur && cur.m && cur.m.id) + ':', err && err.stack || err); } catch (e) {}
    if (!cur || cur.done || !root || root.hidden || root.classList.contains('native')) return;
    try { if (cur.inst && cur.inst.pause) cur.inst.pause(); } catch (e) {}
    screen('oops', modal('Oups', '<p class="mnote">Oups, un petit bug. Touche pour reprendre.</p><button type="button" class="mbtn" data-gs="oops">REPRENDRE</button><button type="button" class="mbtn grey" data-gs="back">Back to games</button>'));
  }
  window.addEventListener('error', e => { if (cur && !root.hidden) oops(e.error || e.message); });
  window.addEventListener('unhandledrejection', e => { if (cur && !root.hidden) oops(e.reason); });

  /* ---- result jingles (win / lose): one place for every mode. Files from config.results (or a mode's winSound / loseSound), else a built-in synthesized jingle ---- */
  const Results = (function () {
    let au = null, t1 = null, t2 = null, fT = null, last = { win: -1, lose: -1 }, ducked = false;
    const rc = () => Object.assign({ win: [], lose: [], maxSeconds: 8, volume: 0.8 }, (typeof CONFIG !== 'undefined' && CONFIG.results) || {});
    const duck = (to, ms) => { try { _musics.forEach(m => m.duck && m.duck(ms || 300, to)); } catch (e) {} };
    function stop() {
      clearTimeout(t1); clearTimeout(t2); clearInterval(fT);
      if (au) { try { au.pause(); } catch (e) {} au = null; }
      if (ducked) { ducked = false; duck(1, 300); }
    }
    function end() { clearTimeout(t1); clearTimeout(t2); clearInterval(fT); au = null; if (ducked) { ducked = false; duck(1, 300); } }
    function play(won, m) {
      stop(); if (isMuted()) return;
      const c = rc(), k = won ? 'win' : 'lose', own = m && m[k + 'Sound'], list = ((own && own.length ? own : c[k]) || []).filter(Boolean);
      const vol = Math.max(0, Math.min(1, (+c.volume >= 0 ? +c.volume : 0.8) * Sfx.level('master') * Sfx.level('sfx')));
      ducked = true; duck(0, 300);
      if (!list.length) {                                        // built-in: a fanfare, or a soft "aww"
        if (won) Sfx.play('levelUp'); else [[392, 0], [349, 0.18], [294, 0.36], [262, 0.56]].forEach(([f, d]) => Sfx.tone(f, 0.34, 'sine', 0.07, d));
        t1 = setTimeout(end, won ? 1500 : 1700); return;
      }
      let i = Math.floor(Math.random() * list.length); if (list.length > 1) while (i === last[k]) i = Math.floor(Math.random() * list.length); last[k] = i;
      const a = new Audio(); au = a; a.volume = vol; a.preload = 'auto'; a.src = list[i];
      const fail = why => { if (au === a) { console.warn('[results] ' + why + ': ' + list[i]); end(); } };
      a.addEventListener('error', () => fail('cannot load'));
      a.addEventListener('ended', () => { if (au === a) end(); });
      const max = Math.max(1, +c.maxSeconds || 8);
      const p = a.play(); if (p && p.then) p.then(() => {
        if (au !== a) { try { a.pause(); } catch (e) {} return; }
        t1 = setTimeout(() => { if (au !== a) return; const v0 = a.volume; let n = 0; fT = setInterval(() => { n++; a.volume = Math.max(0, v0 * (1 - n / 10)); if (n >= 10) end(); }, 50); }, Math.max(0, max - 0.5) * 1000);
      }).catch(() => fail('blocked'));
    }
    return { play, stop };
  })();
  function finish(won, r) {
    if (!cur || cur.done) return; cur.done = true; const { m } = cur;
    if (cur.inst && cur.inst.pause) cur.inst.pause();
    let res = null, stars = Math.max(0, Math.min(3, Math.floor(r.stars) || 0));
    if (won) {
      if (cur.token && o.rewards) { res = o.rewards.finish(cur.token, { cleared: true, score: r.score || 0, stars }); cur.token = null; }
      if (res && res.ok && o.gain) o.gain(res.gems, res.xp);
      R2.bus.emit('game:win');
    } else { R2.bus.emit('game:lose'); }
    paintBest();
    const best = R2.mode(m.id).best;
    let chips = '';
    if (won && res && res.ok) chips = res.gems + res.xp > 0 ? `<span class="gs-chip"><span class="cin"><span class="ico">${iconHTML('gem')}</span>+${res.gems}</span></span>${res.xp ? `<span class="gs-chip t">+${res.xp} XP</span>` : ''}` : '<span class="gs-chip">Reward already collected today</span>';
    else if (won) chips = '<span class="gs-chip">Play a little longer to earn a reward</span>';
    const nid = nextId();
    screen('result', modal(won ? 'Well done!' : 'Try again!', `<div class="gs-rstars">${starsHTML(won ? stars : 0)}</div>
      ${won ? `<p class="mnote">Score ${r.score || 0} &middot; Best ${best}</p>` : '<p class="mnote">No problem. Another go?</p>'}<div class="gs-chips">${chips}</div>
      <button type="button" class="mbtn" data-gs="retry">RETRY</button>${nid ? '<button type="button" class="mbtn grey" data-gs="next">NEXT MODE</button>' : ''}`));
    Results.play(won, m);                                   // once per result: finish() runs once (cur.done) and pause/resume never reach it
    $e('.gs-screen[data-s="result"] .gs-rstars').querySelectorAll('.on').forEach((s, i) => { s.style.animationDelay = (0.2 + i * 0.25) + 's'; });
  }
  /* ---- COMMENT JOUER: the how-to-play window (French, texts in content/games/<id>.js -> howTo). Opens by itself the first time, then with the ? button ---- */
  const seen = () => store.get('howto', {}) || {};                         // remembered in her save (prefs), no new storage key
  const hasHowto = () => { const h = cur && cur.res && cur.res.cfg && cur.res.cfg.howTo; return !!(h && (h.goal || (h.steps && h.steps.length))); };
  let howEl = null, floatEl = null;
  function showHowto(then) {
    if (!hasHowto()) { if (then) then(); return; }
    const h = cur.res.cfg.howTo, line = (k, t) => t ? `<p class="ht-line"><b>${k}</b> ${esc(t)}</p>` : '';
    closeHowto(true);
    howEl = document.createElement('div'); howEl.className = 'gs-howto'; howEl.setAttribute('role', 'dialog'); howEl.setAttribute('aria-label', 'Comment jouer');
    howEl.innerHTML = modal('COMMENT JOUER', `${line('But :', h.goal)}${h.steps && h.steps.length ? `<ol class="ht-steps">${h.steps.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}${line('Sur téléphone :', h.phone)}${line('Sur ordinateur :', h.desktop)}${line('Astuce :', h.tip)}${cur.inst && cur.inst.tutorial ? '<button type="button" class="mbtn grey" data-ht-tut>Revoir le tutoriel</button>' : ''}<button type="button" class="mbtn" data-ht-ok>COMPRIS !</button>`);
    document.body.appendChild(howEl);
    const s = seen(); s[cur.m.id] = 1; store.set('howto', Object.assign({}, s));
    const wasPaused = paused, live = cur.inst && !root.classList.contains('native');
    if (live && !wasPaused) { paused = true; if (cur.inst.pause) cur.inst.pause(); }
    howEl.addEventListener('click', e => { if (e.target.closest('[data-ht-tut]')) { const inst = cur && cur.inst; closeHowto(); if (live && !wasPaused) { paused = false; if (inst && inst.resume) inst.resume(); } if (inst && inst.tutorial) inst.tutorial(); return; } if (e.target.closest('[data-ht-ok]')) { closeHowto(); if (live && !wasPaused) { paused = false; if (cur && cur.inst && cur.inst.resume) cur.inst.resume(); } if (then) then(); } });
    const ok = howEl.querySelector('[data-ht-ok]'); ok && ok.focus();
  }
  function closeHowto(quiet) { if (howEl) { howEl.remove(); howEl = null; } }
  function floatBtn(on) {                                                  // Dodge keeps its own screens, so its ? button floats over it
    if (floatEl) { floatEl.remove(); floatEl = null; } if (!on) return;
    floatEl = document.createElement('button'); floatEl.type = 'button'; floatEl.className = 'mbtn small grey ib gs-howbtn'; floatEl.textContent = '?'; floatEl.setAttribute('aria-label', 'Comment jouer');
    floatEl.addEventListener('click', () => showHowto()); document.body.appendChild(floatEl);
  }
  function nextId() {
    const L = R2.games.list().filter(x => R2.isUnlocked(x.unlockDay || 1)), i = L.findIndex(x => x.id === cur.m.id), n = L[(i + 1) % L.length];
    return n && n.id !== cur.m.id ? n.id : null;
  }
  function paintBest() { const b = $e('.gs-best'); if (b && cur) { const v = R2.mode(cur.m.id).best; b.textContent = v ? 'Best ' + v : ''; } }
  function pause(silent) {
    if (!cur || !cur.inst || cur.done || root.classList.contains('native') || paused) return;
    paused = true; if (cur.inst.pause) cur.inst.pause();
    if (!silent || true) screen('pause', modal('Paused', '<button type="button" class="mbtn" data-gs="resume">RESUME</button><button type="button" class="mbtn grey" data-gs="back">Back to games</button>'));
  }
  function resume() { if (!paused) return; paused = false; screen(null); if (cur && cur.inst && cur.inst.resume) cur.inst.resume(); if (music && !document.hidden) music.play(); }
  function teardown() {
    Results.stop(); if (!cur) return; const c = cur; cur = null;
    try { if (c.inst && c.inst.destroy) c.inst.destroy(); } catch (e) { console.warn('[shell] destroy failed', e); }
    closeHowto(); floatBtn(false);
    if (music) music.pause(); music = null; stage && (stage.innerHTML = '');
  }
  let exiting = false;
  function exit() {
    if (!built || root.hidden || exiting) return; exiting = true;       // (Dodge calls back into exit while it is being closed)
    try { teardown(); root.hidden = true; root.classList.remove('native'); paused = false; if (o.onMusic) o.onMusic(false, false); if (o.onClose) o.onClose(); }
    finally { exiting = false; }
  }
  function onClick(e) {
    const b = e.target.closest('[data-gs]'); if (!b) return;
    switch (b.dataset.gs) {
      case 'back': Results.stop(); exit(); break;
      case 'pause': paused ? resume() : pause(); break;
      case 'howto': showHowto(); break;
      case 'resume': resume(); break;
      case 'oops': { if (cur) { try { if (cur.inst && cur.inst.destroy) cur.inst.destroy(); } catch (er) {} paused = false; run(); } break; }
      case 'retry': Results.stop(); if (cur) { if (cur.inst && cur.inst.destroy) cur.inst.destroy(); paused = false; run(); } break;
      case 'next': { Results.stop(); const id = nextId(); if (id) launch(id); break; }
      case 'sound': store.set('muted', !isMuted()); b.style.opacity = isMuted() ? 0.6 : 1; if (music) { isMuted() ? music.pause() : music.play(); } break;
    }
  }
  /* default drawn icons (Brawl style). A mode with icon: "img/games/x.png" in content/games.js uses that file instead; iconLocked is for the locked card. */
  const ICONS = {"quiz": "<path d=\"M32 56C10 40 6 28 6 20a13 13 0 0 1 26-3 13 13 0 0 1 26 3c0 8-4 20-26 36z\" fill=\"#ff4d79\" stroke=\"#2a0f3a\" stroke-width=\"4\" stroke-linejoin=\"round\"/><text x=\"32\" y=\"38\" text-anchor=\"middle\" font-size=\"26\" font-weight=\"900\" fill=\"#fff\" font-family=\"Lilita One,Arial Black,sans-serif\">?</text>", "dodge": "<path d=\"M32 56C10 40 6 28 6 20a13 13 0 0 1 26-3 13 13 0 0 1 26 3c0 8-4 20-26 36z\" fill=\"#ff4d79\" stroke=\"#2a0f3a\" stroke-width=\"4\" stroke-linejoin=\"round\"/><circle cx=\"10\" cy=\"56\" r=\"4\" fill=\"#ffd23f\"/><circle cx=\"54\" cy=\"52\" r=\"4\" fill=\"#4dd2ff\"/><circle cx=\"32\" cy=\"60\" r=\"3\" fill=\"#7dff6a\"/>", "memory": "<rect x=\"6\" y=\"14\" width=\"30\" height=\"40\" rx=\"5\" fill=\"#4dd2ff\" stroke=\"#2a0f3a\" stroke-width=\"4\" transform=\"rotate(-10 21 34)\"/><rect x=\"28\" y=\"10\" width=\"30\" height=\"40\" rx=\"5\" fill=\"#ffd23f\" stroke=\"#2a0f3a\" stroke-width=\"4\" transform=\"rotate(8 43 30)\"/><path d=\"M43 38c-8-6-9-10-9-12a4.5 4.5 0 0 1 9-1 4.5 4.5 0 0 1 9 1c0 2-1 6-9 12z\" fill=\"#ff4d79\"/>", "mot": "<rect x=\"4\" y=\"20\" width=\"16\" height=\"22\" rx=\"3\" fill=\"#7dff6a\" stroke=\"#2a0f3a\" stroke-width=\"3.5\"/><rect x=\"24\" y=\"20\" width=\"16\" height=\"22\" rx=\"3\" fill=\"#ffd23f\" stroke=\"#2a0f3a\" stroke-width=\"3.5\"/><rect x=\"44\" y=\"20\" width=\"16\" height=\"22\" rx=\"3\" fill=\"#8a8aa0\" stroke=\"#2a0f3a\" stroke-width=\"3.5\"/><g font-family=\"Lilita One,Arial Black,sans-serif\" font-size=\"15\" font-weight=\"900\" fill=\"#fff\" text-anchor=\"middle\"><text x=\"12\" y=\"37\">M</text><text x=\"32\" y=\"37\">O</text><text x=\"52\" y=\"37\">T</text></g>", "sliding": "<g stroke=\"#2a0f3a\" stroke-width=\"3.5\"><rect x=\"6\" y=\"6\" width=\"23\" height=\"23\" rx=\"4\" fill=\"#4dd2ff\"/><rect x=\"35\" y=\"6\" width=\"23\" height=\"23\" rx=\"4\" fill=\"#ffd23f\"/><rect x=\"6\" y=\"35\" width=\"23\" height=\"23\" rx=\"4\" fill=\"#ff4d79\"/></g><path d=\"M38 46h18m-7-7 7 7-7 7\" fill=\"none\" stroke=\"#fff\" stroke-width=\"4\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>", "sweeper": "<path d=\"M32 56C10 40 6 28 6 20a13 13 0 0 1 26-3 13 13 0 0 1 26 3c0 8-4 20-26 36z\" fill=\"#ff4d79\" stroke=\"#2a0f3a\" stroke-width=\"4\" stroke-linejoin=\"round\"/><path d=\"M26 18v26\" stroke=\"#fff\" stroke-width=\"4\" stroke-linecap=\"round\"/><path d=\"M26 18l14 5-14 6z\" fill=\"#ffd23f\" stroke=\"#2a0f3a\" stroke-width=\"2.5\" stroke-linejoin=\"round\"/>", "nonogram": "<g fill=\"#4dd2ff\" stroke=\"#2a0f3a\" stroke-width=\"3\"><rect x=\"10\" y=\"12\" width=\"12\" height=\"12\"/><rect x=\"42\" y=\"12\" width=\"12\" height=\"12\"/><rect x=\"10\" y=\"24\" width=\"12\" height=\"12\"/><rect x=\"22\" y=\"24\" width=\"20\" height=\"12\"/><rect x=\"42\" y=\"24\" width=\"12\" height=\"12\"/><rect x=\"22\" y=\"36\" width=\"20\" height=\"12\"/><rect x=\"28\" y=\"48\" width=\"8\" height=\"8\"/></g><g fill=\"#ff4d79\" stroke=\"#2a0f3a\" stroke-width=\"3\"><rect x=\"22\" y=\"12\" width=\"20\" height=\"12\"/></g>", "tower": "<g stroke=\"#2a0f3a\" stroke-width=\"3.5\" stroke-linejoin=\"round\"><rect x=\"14\" y=\"44\" width=\"36\" height=\"14\" rx=\"3\" fill=\"#4dd2ff\"/><rect x=\"18\" y=\"30\" width=\"30\" height=\"14\" rx=\"3\" fill=\"#ffd23f\"/><rect x=\"22\" y=\"16\" width=\"24\" height=\"14\" rx=\"3\" fill=\"#ff4d79\"/><rect x=\"24\" y=\"4\" width=\"16\" height=\"12\" rx=\"3\" fill=\"#7dff6a\"/></g>", "echo": "<g stroke=\"#2a0f3a\" stroke-width=\"3.5\"><rect x=\"6\" y=\"6\" width=\"25\" height=\"25\" rx=\"7\" fill=\"#ff4d79\"/><rect x=\"33\" y=\"6\" width=\"25\" height=\"25\" rx=\"7\" fill=\"#4dd2ff\"/><rect x=\"6\" y=\"33\" width=\"25\" height=\"25\" rx=\"7\" fill=\"#ffd23f\"/><rect x=\"33\" y=\"33\" width=\"25\" height=\"25\" rx=\"7\" fill=\"#7dff6a\"/></g>", "cipher": "<circle cx=\"20\" cy=\"32\" r=\"13\" fill=\"#ffd23f\" stroke=\"#2a0f3a\" stroke-width=\"4\"/><circle cx=\"20\" cy=\"32\" r=\"5\" fill=\"#2a0f3a\"/><path d=\"M32 32h26M48 32v10M56 32v8\" stroke=\"#2a0f3a\" stroke-width=\"9\" stroke-linecap=\"round\"/><path d=\"M32 32h26M48 32v10M56 32v8\" stroke=\"#ffd23f\" stroke-width=\"4\" stroke-linecap=\"round\"/>"};
  const LOCK = '<svg class="gi-lock" viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="12" rx="3" fill="#ffd23f" stroke="#2a0f3a" stroke-width="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="#2a0f3a" stroke-width="2.5"/></svg>';
  function icon(m, locked) {          // HTML of a mode icon: file if set, else the drawn one. locked = dimmed + lock
    const src = locked ? (m.iconLocked || m.icon) : m.icon, dim = locked && !m.iconLocked;
    const pic = src ? `<img src="${esc(src)}" alt="" draggable="false">` : `<svg viewBox="0 0 64 64" aria-hidden="true">${ICONS[m.id] || ICONS.quiz}</svg>`;
    return `<span class="gi${locked ? ' gi-off' : ''}${dim ? ' gi-dim' : ''}">${pic}${locked ? LOCK : ''}</span>`;
  }
  return { init, launch, exit, starsHTML, icon, winSound: () => Results.play(true), isOpen: () => !!(built && !root.hidden) };
})();
