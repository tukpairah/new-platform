/* ==========================================================================
   Shared code for both pages (storage, coins, quests, shop, music, modals).
   You normally do not need to edit this file; everything you change is in config.js
   ========================================================================== */
/* ---------- the save, the trusted clock and the economy (logic lives in lib/core.js) ---------- */
/* R2 is the only door to gems/XP/days. The reward API for games is NOT in here: the lobby receives it once
   through R2.attach() and passes it to the games. */
const R2 = (function () {
  const Core = window.R2Core; delete window.R2Core;
  const REG = window.__r2reg || { days: {}, payloads: {} }; delete window.__r2reg;

  /* content/*.js files override config.js (deep merge) */
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  function merge(t, src) { Object.keys(src || {}).forEach(k => { if (isObj(src[k]) && isObj(t[k])) merge(t[k], src[k]); else t[k] = src[k]; }); return t; }
  if (REG.settings) merge(CONFIG, REG.settings);
  if (REG.economy) merge(CONFIG.economy, REG.economy);
  if (REG.quiz) merge(CONFIG.games.quiz, REG.quiz);
  if (REG.shop) { if (REG.shop.items) CONFIG.bazaar.items = REG.shop.items; }

  let storage;
  try { storage = window.localStorage; storage.getItem('r2probe'); }
  catch (e) { const m = {}; storage = { getItem: k => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: k => { delete m[k]; }, get length() { return Object.keys(m).length; }, key: i => Object.keys(m)[i] || null }; }
  const qs = new URLSearchParams(location.search);
  const dev = !!(CONFIG.devKey && qs.get('dev') === CONFIG.devKey);      // dev tools exist only if config.devKey is set
  const devDay = Math.max(0, Math.min(7, parseInt(qs.get('day'), 10) || 1));
  const startMs = Date.parse(CONFIG.startDate);
  const DAY = Core.DAY_MS;
  const save = Core.createSave({
    storage, key: dev ? 'r2dev.save' : 'r2lobby.save', salt: CONFIG.saveSalt || '', legacy: !dev,
    legacyCap: CONFIG.legacyCap === undefined ? null : CONFIG.legacyCap, startGems: CONFIG.currency.start,
    legacyQuests: CONFIG.quests, dayOfIso: iso => Math.floor((Date.parse(iso + 'T12:00:00+02:00') - startMs) / DAY) + 1
  });

  /* time: the site's own server date (HEAD request), device clock only as a fallback */
  async function fetchServerMs() {
    if (location.protocol === 'file:') return null;
    try {
      const r = await fetch(location.origin + location.pathname + '?t=' + Date.now(), { method: 'HEAD', cache: 'no-store' });
      const ms = Date.parse(r.headers.get('Date')); return isFinite(ms) ? ms : null;
    } catch (e) { return null; }
  }
  const clock = dev
    ? { now: () => startMs + (devDay - 1) * DAY + 12 * 36e5, day: () => devDay, isUnlocked: n => devDay >= n, timeUntil: n => Math.max(0, startMs + (n - 1) * DAY - (startMs + (devDay - 1) * DAY + 12 * 36e5)), sync: async () => false, flush() {} }
    : Core.createClock({ now: Date.now, mono: () => performance.now(), fetchServerMs, startMs, load: save.getClock, store: save.setClock });

  /* the event bus: the app says what happens, R2 reacts */
  const handlers = {};
  const bus = Object.freeze({
    on(ev, f) { (handlers[ev] = handlers[ev] || []).push(f); },
    emit(ev, d) { (handlers[ev] || []).slice().forEach(f => { try { f(d); } catch (e) {} }); }
  });
  const day = () => clock.day();
  const dayNo = () => Math.max(1, clock.day());
  const subs = []; let lastDay = clock.day();
  const emit = () => subs.slice().forEach(f => { try { f(); } catch (e) {} });
  function resync() { clock.sync().then(r => { if (r) { lastDay = clock.day(); loadDays(); emit(); } }); }
  if (!dev) {
    resync(); setInterval(resync, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', () => { if (document.hidden) clock.flush(); else resync(); });
    addEventListener('pagehide', () => clock.flush());
  }
  setInterval(() => { const d = clock.day(); if (d !== lastDay) { const up = d > lastDay; lastDay = d; loadDays(); if (up) bus.emit('day:new'); emit(); } }, 30000);
  addEventListener('storage', () => { save.reconcile(); emit(); });           // another tab changed the save
  addEventListener('focus', () => { save.reconcile(); emit(); });             // coming back to this tab: show the current balance
  document.addEventListener('visibilitychange', () => { if (!document.hidden) emit(); });


  /* ---- daily content: day files load lazily, only for days that have come ---- */
  const dayTried = {};
  function loadScript(src) {
    return new Promise(res => {
      const el = document.createElement('script'); el.src = src; el.async = true;
      el.onload = () => res(true); el.onerror = () => { el.remove(); res(false); };       // a missing file just means "not uploaded yet"
      document.head.appendChild(el);
    });
  }
  const dayJobs = [];
  function loadDays() {
    let added = 0;
    for (let n = 1; n <= day(); n++) if (!dayTried[n]) { dayTried[n] = true; added++; dayJobs.push(loadScript(`content/days/day${n}.js`)); }
    return Promise.all(dayJobs).then(() => { if (added) emit(); });
  }
  const dayContent = n => (n >= 1 && n <= day() ? REG.days[n] || null : null);       // a future day is never handed out
  const dayList = () => { const o = []; for (let n = 1; n <= day(); n++) if (dayContent(n)) o.push(n); return o; };
  /* ---- facts: each day's facts are { ru, fr }; an old plain-text fact still works; a missing list is just empty ---- */
  const factsOfDay = d => { const c = dayContent(d), L = c && Array.isArray(c.facts) ? c.facts : []; return L.map((f, i) => ({ id: d + ':' + i, day: d, idx: i, fr: typeof f === 'string' ? f : String((f && f.fr) || '') })); };
  const factDays = () => dayList().map(d => ({ day: d, facts: factsOfDay(d) })).filter(x => x.facts.length);
  const facts = () => factDays().reduce((a, x) => a.concat(x.facts), []);
  const readMap = () => save.getPref('factRead', {}) || {};
  const factIsRead = id => !!readMap()[id];
  const unreadFacts = () => facts().filter(f => !readMap()[f.id]).length;
  function factRead(id) {                       // opening a card marks it read; reading all of today's facts completes the daily quest
    if (!factIsRead(id)) { const m = Object.assign({}, readMap()); m[id] = 1; save.setPref('factRead', m); }
    const today = factsOfDay(dayNo());
    if (today.length && today.every(f => factIsRead(f.id))) qAdd('facts');
  }
  const eco = () => CONFIG.economy;

  /* ---- Daily Gift: Gems + XP + that day's message. Past days stay claimable, future days do not exist yet ---- */
  const giftDays = () => dayList().filter(n => dayContent(n).phrase);
  function claimGift(d) {
    d = d || dayNo(); const c = dayContent(d);
    if (d > dayNo() || d < 1) return { ok: false, reason: 'locked' };
    if (!c || !c.phrase) return { ok: false, reason: 'none' };
    return save.claim('gift:' + d, { kind: 'gift', gems: eco().dailyGift.gems, xp: eco().dailyGift.xp, day: d });
  }
  const giftPending = () => { const d = dayNo(), c = dayContent(d); return !!(c && c.phrase && !save.has('gift:' + d)); };      // the notification dot
  const giftPhrase = d => { const c = dayContent(d); return c && c.phrase && save.has('gift:' + d) ? c.phrase : null; };      // only after she claimed it

  /* ---- game modes: the registry (content/games.js) and the lazy loader. A mode's code and content are fetched only once its day has come ---- */
  const GAMES = ((REG.games && REG.games.list) || []).filter(m => m && m.id).sort((a, b) => (a.unlockDay || 1) - (b.unlockDay || 1));
  const defs = {}, modeLoaded = {};
  function loadMode(id) {
    const m = GAMES.find(x => x.id === id); if (!m) return Promise.resolve({ ok: false, reason: 'none' });
    if (day() < (m.unlockDay || 1)) return Promise.resolve({ ok: false, reason: 'locked' });
    if (modeLoaded[id]) return modeLoaded[id];
    return (modeLoaded[id] = (async () => {
      if (!defs[id]) { const ok = m.file ? await loadScript(m.file) : false; if (!ok || !defs[id]) return { ok: false, reason: 'soon' }; }   // no file yet = "Coming soon"
      if (m.contentFile && !REG.gc[id]) await loadScript(m.contentFile);                                                                    // no content file = the defaults
      const cfg = merge(JSON.parse(JSON.stringify(defs[id].defaults || {})), REG.gc[id] || {});
      return { ok: true, def: defs[id], cfg, mode: m };
    })());
  }
  const games = Object.freeze({ register(def) { if (def && def.id) defs[def.id] = def; }, list: () => GAMES.map(m => Object.assign({}, m)), defaultMusic: () => ((REG.games && REG.games.defaultMusic) || []).slice(), load: loadMode });

  /* ---- the pass: step N needs day >= N and xp >= xpPerStep * N ---- */
  function passTiers() {
    const pz = eco().pass;
    return pz.gems.map((g, k) => {
      const i = k + 1, c = dayContent(i), p = (c && c.pass) || {};
      return { xp: pz.xpPerStep * i, reward: g, top: p.title || '???', message: String(p.message || p.text || ''), signature: String(p.signature || ''), image: p.image || '', caption: p.caption || '', iconClosed: p.iconClosed || '', iconOpened: p.iconOpened || '', rewardImage: '' };
    });
  }
  function claimPass(i) {
    const t = passTiers()[i - 1]; if (!t) return { ok: false, reason: 'none' };
    if (day() < i) return { ok: false, reason: 'locked' };
    if (save.balance().xp < t.xp) return { ok: false, reason: 'xp' };
    return save.claim('pass:' + i, { kind: 'pass', gems: t.reward || 0, xp: 0, day: i });
  }
  const passClaimedList = () => save.entries().filter(e => e.id.indexOf('pass:') === 0).map(e => +e.id.slice(5)).filter(Boolean);

  /* ---- quests: today's list comes from today's day file; progress is saved per day, claims are ledger entries ---- */
  function quests() {
    const c = dayContent(dayNo()); if (!c) return [];
    const list = c.quests || (REG.days[1] && REG.days[1].quests) || [];       // a day file without its own quests uses Day 1's list
    return list.map(q => Object.assign({ daily: true, goal: 1, reward: eco().dailyQuest.gems, xp: eco().dailyQuest.xp }, q));
  }
  const qKey = (q, d) => q.daily ? `quest:${d}:${q.id}` : `quest:once:${q.id}`;
  function qState(q) {
    const d = dayNo(), claimed = save.has(qKey(q, d)), p = save.getProg()[q.id];
    const cur = !p ? 0 : (q.daily && p.d !== d) ? 0 : p.v;
    return { v: claimed ? Math.max(cur, q.goal) : cur, claimed };
  }
  function qSet(q, v) { save.setProg(q.id, { d: q.daily ? dayNo() : 0, v }); }
  function qAdd(type, n = 1) {
    quests().forEach(q => {
      if (q.type !== type) return;
      const s = qState(q); if (s.claimed || s.v >= q.goal) return;
      const v = Math.min(q.goal, s.v + n); qSet(q, v);
      if (v >= q.goal) bus.emit('quest:done', { id: q.id });
    });
  }
  function qClaim(id) {          // returns { coins, xp }
    const q = quests().find(x => x.id === id), none = { coins: 0, xp: 0 }; if (!q) return none;
    const s = qState(q); if (s.claimed || s.v < q.goal) return none;
    const r = save.claim(qKey(q, dayNo()), { kind: 'quest', gems: q.reward, xp: q.xp || 0, day: dayNo() });
    return r.ok ? { coins: r.entry.gems, xp: r.entry.xp } : none;
  }
  function qManualDone(id) {
    const q = quests().find(x => x.id === id); if (!q || q.type !== 'manual') return;
    qSet(q, q.goal);
  }
  const qToDo = () => quests().filter(q => !qState(q).claimed).length;

  /* ---- shop: price, day and gems are all re-checked here, never trusted from the page ---- */
  const owned = id => save.countPrefix(`buy:${id}:`);
  const purchases = () => { const o = {}; save.entries().forEach(e => { const m = /^buy:(.+):\d+$/.exec(e.id); if (m) o[m[1]] = (o[m[1]] || 0) + 1; }); return o; };
  const itemOf = id => CONFIG.bazaar.items.find(x => x.id === id);
  function price(it) { return it.price != null ? it.price : Math.round(eco().basePrice * ((eco().rarityMultiplier || {})[it.rarity] || 1)); }
  let lastBuy = 0;
  function buyItem(item) {
    const it = itemOf(item && item.id); if (!it) return { ok: false, reason: 'none' };
    if (it.availableFromDay && day() < it.availableFromDay) return { ok: false, reason: 'locked' };
    if (it.limit !== 0 && owned(it.id) >= (it.limit || 1)) return { ok: false, reason: 'owned' };
    if (Date.now() - lastBuy < 500) return { ok: false, reason: 'busy' };       // double click guard
    lastBuy = Date.now();
    const r = save.spend(`buy:${it.id}:${owned(it.id) + 1}`, price(it), { kind: 'buy', day: dayNo() });
    if (r.ok) bus.emit('bazaar:buy', { id: it.id });
    return r.ok ? { ok: true } : { ok: false, reason: r.reason === 'poor' ? 'coins' : r.reason === 'dup' ? 'owned' : r.reason };
  }
  /* the real gift of an item is fetched only once she owns it */
  function loadPayload(id) {
    if (!owned(id)) return Promise.resolve(null);
    if (REG.payloads[id]) return Promise.resolve(REG.payloads[id]);
    return loadScript(`content/shop/${id}.js`).then(() => REG.payloads[id] || null);
  }

  /* ---- game rewards: handed over once, never global ---- */
  const rewards = Core.createRewards({
    save, clock, mono: () => performance.now(), skipMin: dev,
    rand: () => { try { return crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296; } catch (e) { return Math.random(); } },
    economy: () => CONFIG.economy,
    mode: id => {
      const m = GAMES.find(x => x.id === id); if (!m) return null;
      const b = Core.budgetRewards(GAMES, CONFIG.economy);              // the first-clear reward is this mode's share of its day's budget (content/economy.js)
      return { minDuration: m.minSeconds || 0, unlockDay: m.unlockDay || 1, difficulty: m.difficulty || 'easy', rewards: { first: (m.rewards && m.rewards.first) || b[m.id], repeat: m.rewards && m.rewards.repeat } };
    },
    onClear: () => qAdd('game')
  });
  let attached = false;
  function attach(cb) { if (attached) throw new Error('already attached'); attached = true; cb(rewards); }

  const facade = {
    dev, day, isUnlocked: n => clock.isUnlocked(n), timeUntil: n => clock.timeUntil(n), now: () => clock.now(),
    gems: () => save.balance().gems, xp: () => save.balance().xp, has: id => save.has(id),
    on: f => { subs.push(f); }, attach, notice: () => save.takeNotice(), mode: id => save.getMode(id),
    pref: { get: save.getPref, set: save.setPref },
    claimGift, giftDays, giftPending, giftPhrase, claimPass, passTiers, passClaimed: passClaimedList, qState, qAdd, qClaim, qManualDone, qToDo, quests, owned, purchases, buyItem, price, loadPayload,
    register: (kind, a, b) => { if (kind === 'day') REG.days[a] = b; else if (kind === 'payload') REG.payloads[a] = b; else if (kind === 'gamecontent') REG.gc[a] = b; },       // (a mode's content file, loaded when its day has come)
    games, dayContent, dayList, facts, factDays, factIsRead, unreadFacts, factRead, loadDays, bus, phrases: () => (REG.phrases && REG.phrases.list) || [],
    exportCode: save.exportCode, importCode: save.importCode
  };
  loadDays();
  const link = u => (dev ? u + (u.indexOf('?') < 0 ? '?' : '&') + 'dev=' + encodeURIComponent(qs.get('dev')) + '&day=' + devDay : u);       // dev mode: the test save and the day travel with every link
  facade.link = link;
  if (dev) {                                                              // these exist only in dev mode (the separate test save)
    facade.audit = () => Core.audit({ economy: CONFIG.economy, items: CONFIG.bazaar.items.map(it => Object.assign({}, it, { price: price(it) })), modes: GAMES });
    facade.devReset = () => { save.wipe(); location.reload(); };
    facade.devGrant = () => save.claim('dev:grant:' + Date.now(), { kind: 'dev', gems: 1000, xp: 500, day: 0 });     // +1000 Gems, +500 XP for testing
  }
  return Object.freeze(facade);
})();

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pad = n => String(n).padStart(2, '0');
const today = () => new Date().toISOString().slice(0, 10);

/* ---------- small saved settings (sound on/off, last track...) live inside the same signed save ---------- */
const store = { get: (k, d) => R2.pref.get(k, d), set: (k, v) => R2.pref.set(k, v) };
function showSaveNotice() {
  const n = R2.notice(); if (!n) return;
  toast(n === 'restored' ? 'We brought back your last saved progress. All good!' : 'Your save could not be read, so we started fresh. A backup code from the Menu can bring it back.', true);
}

/* ---------- icons ---------- */
const S = p => `<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const DEFAULT_ICONS = {
  bazaar: S('<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>'),
  quests: S('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1"/><path d="M9 13l2 2 4-4"/>'),
  gift:   S('<rect x="4" y="10" width="16" height="10" rx="1"/><path d="M12 10v10"/><path d="M3 7h18v3H3z"/><path d="M12 7c-2.5 0-4-1-4-2.5S10 2.5 12 7c2-4.5 4-3.5 4-2S14.5 7 12 7z"/>'),
  facts:  S('<path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 17l-5.4 2.8 1.1-6.1L3.2 9.4l6.1-.8L12 3z"/>'),
  soon:   S('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  sound:  S('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16 9a4 4 0 0 1 0 6"/><path d="M18.5 6.5a8 8 0 0 1 0 11"/>'),
  mute:   S('<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l4 6M21 9l-4 6"/>'),
  menu:   S('<path d="M4 7h16M4 12h16M4 17h16"/>'),
  lobby:  S('<path d="M4 11l8-7 8 7"/><path d="M6 10v10h12V10"/><path d="M10 20v-5h4v5"/>'),
  platform: S('<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c3 3.2 3 14.8 0 18"/><path d="M12 3c-3 3.2-3 14.8 0 18"/>'),
  cup:    S('<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H5v2a3 3 0 0 0 3 3"/><path d="M16 6h3v2a3 3 0 0 1-3 3"/><path d="M12 13v4"/><path d="M9 20h6"/><path d="M10 17h4v3h-4z"/>'),
  gem:    S('<path d="M7 4h10l4.5 5.2L12 20.5 2.5 9.2z" fill="#52C93F" stroke="#0C070F"/><path d="M2.5 9.2h19M9.200 4L7 9.200 12 20.500M14.800 4L17 9.200 12 20.500" stroke="#CFFAB9" stroke-width="1.2"/>'),
  bag:    S('<rect x="4" y="9" width="16" height="11" rx="2"/><path d="M8 9V7a4 4 0 0 1 8 0v2"/><path d="M4 13h16"/>'),
  back:   S('<path d="M15 5l-7 7 7 7"/>')
};
function iconHTML(name, dark) {
  const src = (CONFIG.icons || {})[name];
  if (src) return `<img src="${esc(src)}" alt="" draggable="false">`;
  const svg = DEFAULT_ICONS[name] || '';
  return dark ? svg.replace(/#fff/g, '#373B50') : svg;
}
function fillIcons(root = document) {
  $$('[data-icon]', root).forEach(el => { el.innerHTML = iconHTML(el.dataset.icon, el.hasAttribute('data-dark')); });
}

/* ---------- coins (Gems) and XP: read from the ledger. Nothing here can add them. ---------- */
const getXp = () => R2.xp();
const getCoins = () => R2.gems();
function refreshCoins() { $$('[data-coins]').forEach(el => el.textContent = getCoins()); }
const coinText = n => `<span class="cin"><span class="ico">${iconHTML('gem')}</span>${n}</span>`;

/* ---------- quests and shop: see R2 above ---------- */
const { qState, qAdd, qClaim, qManualDone, qToDo, owned, purchases, buyItem } = R2;

/* ---------- toast ---------- */
function toast(msg, good) {
  let box = $('#toast');
  if (!box) { box = document.createElement('div'); box.id = 'toast'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
  const el = document.createElement('div');
  el.className = 'toast-item' + (good ? ' good' : ''); el.textContent = msg;
  box.appendChild(el); setTimeout(() => el.remove(), 2400); Sfx.play('toast');
}

/* ---------- modals ---------- */
let lastFocus = null;
function modalRoot() { return $('#modalRoot'); }
function closeModal() { const r = modalRoot(); r.hidden = true; r.innerHTML = ''; document.documentElement.classList.remove('sheet-open'); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
function openModal(title, html) {
  const r = modalRoot(); lastFocus = document.activeElement;
  r.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-labelledby="mt"><button type="button" class="x" aria-label="Close" data-close>&times;</button><h2 id="mt">${esc(title)}</h2><div id="mbody">${html}</div></div>`;
  r.hidden = false; $('.x', r).focus();
  const isPhone = matchMedia('(max-width:600px)').matches;
  if (isPhone) {                                          // bottom sheet: big close button in thumb reach, backdrop tap and swipe down close it, the page behind is locked
    document.documentElement.classList.add('sheet-open');
    const md = $('.modal', r); md.insertAdjacentHTML('beforeend', '<button type="button" class="mbtn sheet-close t" data-close>Close</button>');
    r.onclick = e => { if (e.target === r) closeModal(); };
    let y0 = null, dy = 0; const body = $('#mbody', r);
    md.addEventListener('touchstart', e => { y0 = (body && body.scrollTop > 0 && body.contains(e.target)) ? null : e.touches[0].clientY; dy = 0; }, { passive: true });
    md.addEventListener('touchmove', e => { if (y0 == null) return; dy = e.touches[0].clientY - y0; if (dy > 0) md.style.transform = 'translateY(' + dy + 'px)'; }, { passive: true });
    md.addEventListener('touchend', () => { if (y0 != null && dy > 90) closeModal(); else md.style.transform = ''; y0 = null; });
  }
}
function setModalBody(html) { const b = $('#mbody'); if (b) b.innerHTML = html; }
document.addEventListener('keydown', e => { if (e.key === 'Escape' && modalRoot() && !modalRoot().hidden) { closeModal(); e.modalClosed = true; } });

/* ---------- sound ---------- */
const isMuted = () => store.get('muted', false);
Sfx.bind({ get: (k, d) => store.get(k, d), set: (k, v) => store.set(k, v), muted: isMuted });
Sfx.loadCustom(CONFIG.sfx || {});          // optional custom button sounds (config.sfx)
let ac = null;
function chirp() {
  if (isMuted()) return;
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const t0 = ac.currentTime, n = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < n; i++) {
      const o = ac.createOscillator(), g = ac.createGain(), t = t0 + i * 0.09, f = 500 + Math.random() * 1400;
      o.type = i % 2 ? 'square' : 'triangle';
      o.frequency.setValueAtTime(f, t);
      o.frequency.exponentialRampToValueAtTime(f * (0.6 + Math.random() * 1.2), t + 0.08);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.12, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.085);
      o.connect(g).connect(ac.destination); o.start(t); o.stop(t + 0.09);
    }
  } catch (e) {}
}

/* Music: a random track to start with (never the one she heard last), then the tracks
   take turns (rotate = true) or that one track repeats (rotate = false).
   list: array of file paths   lastKey: storage key   vol: 0..1 */
const _musics = [];
Sfx.onLevel(() => _musics.forEach(m => m.refresh()));
function makeMusic(list, lastKey, vol, rotate) {
  const tracks = (Array.isArray(list) ? list : [list]).filter(Boolean);
  let duckF = 1, duckT = null;
  const base = typeof vol === 'number' ? vol : 0.4, target = () => base * Sfx.level('master') * Sfx.level('music') * duckF;     // follows the volume sliders
  if (!tracks.length) return { track: '', play() { return Promise.resolve(false); }, pause() {}, refresh() {} };
  const spin = tracks.length > 1 && rotate !== false, XF = 0.4;                // crossfade seconds: the next track starts before the end, so the gap stays under 0.5 s
  /* random pick that is never the previous track (the first pick avoids the last one heard in an earlier session) */
  const pick = prev => { if (tracks.length < 2) return 0; let i; do { i = Math.floor(Math.random() * tracks.length); } while (i === prev); return i; };
  let idx = pick(store.get(lastKey, -1)), a = null, b = null, fade = null, fails = 0, playing = false, handing = false;
  const api = { track: tracks[idx] };
  function mk() { const e = new Audio(); e.volume = 0; e.preload = 'auto'; return e; }
  function remember() { api.track = tracks[idx]; store.set(lastKey, idx); }
  function ramp() {
    clearInterval(fade);
    fade = setInterval(() => { const t = target(); if (a && !a.paused) a.volume = Math.min(t, a.volume + 0.04); if (b && !b.paused) b.volume = Math.max(0, b.volume - 0.08); if (b && b.volume <= 0.001) b.pause(); if (a && (a.volume >= t || a.paused) && (!b || b.paused)) clearInterval(fade); }, 60);
  }
  function next() {                                   // hand over to a random other track
    if (handing || !spin || !playing) return; handing = true;
    idx = pick(idx); remember();
    const old = a; b = old; a = mk(); a.src = tracks[idx]; wire(a);
    a.play().then(() => { handing = false; ramp(); }).catch(() => { handing = false; });
  }
  function wire(e) {
    e.addEventListener('timeupdate', () => { if (e === a && spin && e.duration && e.duration - e.currentTime < XF + 0.1) next(); });
    e.addEventListener('ended', () => { if (e === a) { if (spin) next(); else { e.currentTime = 0; e.play().catch(() => {}); } } });
    e.addEventListener('playing', () => { fails = 0; });
    e.addEventListener('error', () => { if (e === a && spin && ++fails < tracks.length * 2) next(); });
  }
  api.play = function () {
    if (isMuted()) return Promise.resolve(false);
    if (!a) { a = mk(); a.src = tracks[idx]; remember(); wire(a); }
    playing = true;
    return a.play().then(() => { ramp(); return true; }).catch(() => false);
  };
  api.pause = function () { playing = false; clearInterval(fade); if (a) a.pause(); if (b) b.pause(); };
  api.duck = function (ms, to) {                       // fade the music down (to 0) or back up (to 1) without stopping it; used under the result jingles
    clearInterval(duckT); const goal = to == null ? 0 : to, step = (goal - duckF) / Math.max(1, (ms || 300) / 30);
    duckT = setInterval(() => { duckF += step; if ((step <= 0 && duckF <= goal) || (step > 0 && duckF >= goal) || !step) { duckF = goal; clearInterval(duckT); } if (a && !a.paused) a.volume = Math.max(0, Math.min(1, target())); }, 30);
  };
  api.refresh = function () { if (a && !a.paused) a.volume = Math.min(1, target()); };
  _musics.push(api);
  return api;
}

/* The Bazaar tab and the lobby tab tell each other when the Bazaar is open,
   so only ONE of them plays music at a time. */
let bc = null;
try { bc = new BroadcastChannel('r2lobby'); } catch (e) {}
const say = msg => { try { bc && bc.postMessage(msg); } catch (e) {} };

/* ---------- sizes / small helpers ---------- */
/* Backgrounds: give ONE path or a LIST of paths. With a list, one is picked each time the page opens.
   CONFIG.backgroundMode: "random" (never the same one twice in a row), "order" (next one every visit),
   "daily" (one per day, in order). The pick is made once per page load. */
const _bgPick = {};
function pickBackground(list, key) {
  if (list.length === 1) return list[0];
  const mode = CONFIG.backgroundMode || 'random', last = store.get('bgLast:' + key, -1);
  let i;
  if (mode === 'daily') { const d = Math.floor((Date.now() - new Date(CONFIG.startDate)) / 864e5); i = ((d % list.length) + list.length) % list.length; }
  else if (mode === 'order') i = (last + 1) % list.length;
  else { i = Math.floor(Math.random() * list.length); if (i === last) i = (i + 1 + Math.floor(Math.random() * (list.length - 1))) % list.length; }
  store.set('bgLast:' + key, i);
  return list[i];
}
function applyBackground(el, src) {
  const list = (Array.isArray(src) ? src : [src]).filter(Boolean);
  if (!list.length) return;
  const key = list.length + ':' + list[0];
  if (!(key in _bgPick)) _bgPick[key] = pickBackground(list, key);
  el.style.backgroundImage = `url("${_bgPick[key]}")`;
}

/* ---------- backup code (signed; importing only ever ADDS to what she has) ---------- */
const exportSave = () => R2.exportCode();
const importSave = code => R2.importCode(code).ok;
try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (e) {}   // asks the browser not to wipe the save

/* ---------- button sounds: ONE listener for every button of every page, window and game (also elements created later) ----------
   click for buttons, back for close / back / X, denied for disabled or locked ones, open for data-sfx="open". data-sfx="none" silences an element.
   Things that already play their own sound (claim, buy, cards, pads, keys, R2) are left out so nothing plays twice. */
(function () {
  const BTN = 'button,a[href],[role=button],summary,input[type=button],input[type=submit],.mbtn,.btn,.mcard.gbtn,.p-tab,.playbtn,.welcome-go,.tab';
  const OWN = '[data-sfx="none"],.r2btn,[data-claim],[data-qclaim],[data-ptier],[data-psurprise],[data-confirm],[data-buy],[data-deny],.ec-pad,.mm-card,.sw-cell,.mo-k,.cp-k,.cp-l,.cp-bar,.tw';
  const BACK = '[data-close],.x,[data-pclose],#back,[data-gback],[data-gs="back"],[data-dg="quit"],[data-sfx="back"]';
  function press(t) {
    const b = t && t.closest && t.closest(BTN); if (!b || b.closest(OWN)) return;
    const o = b.closest('[data-sfx]'), v = o && o.dataset.sfx; if (v === 'none') return;
    if (b.matches(':disabled,[aria-disabled="true"],.locked')) return Sfx.ui('denied');
    if (v === 'open' || v === 'denied' || v === 'back' || v === 'click') return Sfx.ui(v);
    Sfx.ui(b.matches(BACK) ? 'back' : 'click');
  }
  document.addEventListener('pointerdown', e => press(e.target), true);
  document.addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) press(e.target); }, true);       // a button pressed from the keyboard
})();
if (window.matchMedia && matchMedia('(hover: hover)').matches) {
  document.addEventListener('mouseover', e => {
    const b = e.target.closest && e.target.closest('button:not(:disabled),[data-action]');
    if (b && !b.closest('.r2btn') && !(e.relatedTarget && b.contains(e.relatedTarget))) Sfx.play('hover');
  }, true);
}
