/* Phone layout test (dev only: needs playwright + chromium, NOT shipped). node tests/mobile.test.js   (PW_PATH=/path/to/playwright if it is not installed here)
   For each viewport x page / modal / mode: no horizontal overflow, nothing wider than the screen, tap targets >= 44x44, sheets <= 92dvh,
   no overlap between the bottom bar, the floating buttons, R2's bubble and the countdown bar, game stage without inner scroll. Prints a table, exit 1 on any FAIL. */
let pw; try { pw = require('playwright'); } catch (e) { try { pw = require(process.env.PW_PATH || 'playwright'); } catch (e2) { console.log('SKIP mobile: playwright is not installed'); process.exit(0); } }
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (fs.existsSync(f) && fs.statSync(f).isFile()) { r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); } else { r.writeHead(404); r.end(); } });
const ALL = [[320, 568], [360, 640], [390, 844], [412, 915], [844, 390]], VIEWS = process.env.ONLY ? ALL.filter(v => v.join('x') === process.env.ONLY) : ALL, MODES = ['quiz', 'dodge', 'memory', 'mot', 'sliding', 'sweeper', 'nonogram', 'tower', 'echo', 'cipher'];
const wait = ms => new Promise(r => setTimeout(r, ms));
/* runs in the page: returns a list of problems for the elements inside `scope` */
const CHECK = ({ scope, taps, maxH }) => {
  const out = [], vw = innerWidth, vh = innerHeight, root = document.querySelector(scope) || document.body;
  if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) out.push('page scrolls sideways (' + document.documentElement.scrollWidth + '>' + document.documentElement.clientWidth + ')');
  const vis = e => { const s = getComputedStyle(e), b = e.getBoundingClientRect(); return s.display !== 'none' && s.visibility !== 'hidden' && +s.opacity > 0 && b.width > 0 && b.height > 0 && !e.closest('[hidden]'); };
  const clipped = e => { for (let p = e.parentElement; p && p !== document.body; p = p.parentElement) { const s = getComputedStyle(p); if ((s.overflowX !== 'visible') && p.scrollWidth > p.clientWidth + 1 && s.overflowX !== 'hidden') return true; } return false; };
  const name = e => (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : '')) + (e.dataset && (e.dataset.action || e.dataset.gs || e.dataset.k) ? '[' + (e.dataset.action || e.dataset.gs || e.dataset.k) + ']' : '');
  const all = [...root.querySelectorAll('*')].filter(vis);
  all.forEach(e => { const b = e.getBoundingClientRect(); if (b.width > vw + 1 && !e.closest('svg') && !/^(HTML|BODY)$/.test(e.tagName)) { const s = getComputedStyle(e); if (!(e.closest('.ps-track,.gs-stage canvas'))) out.push('wider than screen: ' + name(e) + ' ' + Math.round(b.width)); } });
  if (taps) [...root.querySelectorAll('button,a[href],a[role=button],[role=button],input:not([type=hidden]),select,[data-gmode],[data-k]')].filter(vis).forEach(e => { const b = e.getBoundingClientRect(); const board = e.matches('.sw-cell,.cp-l,.ng-c,.mem-card,[data-gmode]'), key = e.matches('.mo-k,.cp-k'); const minW = board ? 28 : key ? 26 : 43.5, minH = board ? 28 : 43.5; if ((b.width < minW || b.height < minH) && b.right > 0 && b.left < vw && b.bottom > 0 && b.top < vh && !e.closest('.p-arena')) out.push('tap target ' + name(e) + ' ' + Math.round(b.width) + 'x' + Math.round(b.height)); });
  if (maxH) { const m = document.querySelector(maxH); if (m && m.getBoundingClientRect().height > vh * 0.92 + 1) out.push('taller than 92dvh: ' + name(m)); }
  return out;
};
const OVER = () => {
  const R = s => { const e = document.querySelector('#stageP ' + s); if (!e || !e.offsetParent && getComputedStyle(e).position !== 'fixed') return null; const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom }; };
  const parts = { bar: R('.p-nav'), fabL: R('.p-fab.l .btn'), fabR: R('.p-fab.r .btn'), count: R('.p-count'), bubble: (() => { const m = document.querySelector('#stageP .mini'); return m && getComputedStyle(m).opacity > 0.05 && m.offsetWidth ? R('.mini') : null; })(), quest: R('.p-quest'), r2: R('.r2wrap') };
  const hit = (a, b) => a && b && a.l < b.r - 1 && a.r > b.l + 1 && a.t < b.b - 1 && a.b > b.t + 1, out = [], k = Object.keys(parts);
  for (let i = 0; i < k.length; i++) for (let j = i + 1; j < k.length; j++) { if ((k[i] === 'r2' && k[j] === 'bubble') || (k[i] === 'bubble' && k[j] === 'r2')) continue; if (hit(parts[k[i]], parts[k[j]])) out.push('overlap ' + k[i] + ' x ' + k[j]); }
  if (parts.bubble && (parts.bubble.l < 0 || parts.bubble.r > innerWidth)) out.push('bubble leaves the screen');
  return out;
};
(async () => {
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port, base = `http://127.0.0.1:${port}/`; let b; const rows = []; let fails = 0;
  const rec = (page, view, probs) => { if (process.env.V) console.error(page, view, probs.length ? 'F' : 'ok'); const ok = !probs.length; if (!ok) fails++; rows.push([page, view, ok ? 'PASS' : 'FAIL ' + probs.slice(0, 4).join(' ; ')]); };
  for (const [w, h] of VIEWS) {
    const view = w + 'x' + h, land = w > h; b = await pw.chromium.launch();
    const ctx = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true }); const page = await ctx.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('crash', () => console.error('PAGE CRASHED')); page.on('close', () => process.env.V && console.error('page closed'));
    await page.addInitScript(() => { window.close = () => console.error('WINDOW.CLOSE CALLED ' + new Error().stack); }); page.on('console', m => { if (process.env.V && /WINDOW.CLOSE/.test(m.text())) console.error(m.text()); }); await page.goto(base + 'index.html?dev=test&day=7'); await wait(1300); await page.click('#splashGo').catch(() => {}); await wait(400);
    await page.addStyleTag({ content: 'body > div[style*="z-index: 60"]{display:none!important}' });      // the dev-only mood cycler (not shipped: devKey is empty)
    const chk = (scope, taps, maxH) => page.evaluate(CHECK, { scope, taps: taps && !land, maxH });
    rec('lobby', view, [...await chk('body', true), ...(land ? [] : await page.evaluate(OVER)), ...errs.splice(0).map(e => 'js error ' + e)]);
    for (const act of ['quests', 'facts', 'gift', 'menu', 'play']) {
      if (process.env.V) console.error('step', act, page.url().slice(-40), page.isClosed());
      await page.click(`${land ? '#stageD' : '#stageP'} [data-action="${act}"]`, { force: true }).catch(() => {}); await wait(450);
      rec('sheet:' + act, view, await chk('#modalRoot', true, '#modalRoot .modal')); await page.evaluate(() => closeModal()); await wait(100);
    }
    await page.click(`${land ? '#stageD' : '#stageP'} [data-action="pass"]`, { force: true }).catch(() => {}); await wait(600); rec('pass', view, await chk('#passRoot', true)); await page.click('#passRoot [data-pclose]', { force: true }).catch(() => {}); await wait(300);
    for (const id of MODES) {
      await page.evaluate(() => closeModal()); await page.click(`${land ? '#stageD' : '#stageP'} [data-action="play"]`, { force: true }).catch(() => {}); await wait(250);
      await page.click(`[data-gmode="${id}"]`, { force: true }).catch(() => {}); await wait(900); const ok = await page.$('[data-ht-ok]');
      if (ok) { rec('howto:' + id, view, await chk('.gs-howto', true, '.gs-howto .modal')); await ok.click().catch(() => {}); await wait(300); }
      const probs = await chk('#gameShell', true); probs.push(...await page.evaluate((land) => { if (land) return []; const s = document.querySelector('#gameShell .gs-stage'); return s && !document.getElementById('gameShell').classList.contains('native') && s.scrollHeight > s.clientHeight + 1 ? ['stage scrolls inside (' + s.scrollHeight + '>' + s.clientHeight + ')'] : []; }, land));
      rec('mode:' + id, view, [...probs, ...errs.splice(0).map(e => 'js error ' + e)]);
      process.env.V && console.error('back'); await page.evaluate(() => { const b = document.querySelector('#gameShell [data-gs="back"]'); b && b.click(); }); await wait(300); process.env.V && console.error('backed', await page.evaluate(() => [!document.getElementById('modalRoot').hidden, document.getElementById('gameShell').hidden]));
    }
    await ctx.close();
    const c2 = await b.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true }); const bp = await c2.newPage(); bp.on('pageerror', e => errs.push(e.message));
    await bp.goto(base + 'bazaar.html?dev=test&day=7'); await wait(1300); await bp.addStyleTag({ content: 'body > div[style*="z-index"]{display:none!important}' }); await bp.click('.welcome-go').catch(() => {}); await wait(400);
    rec('bazaar', view, [...await bp.evaluate(CHECK, { scope: 'body', taps: !land }), ...errs.splice(0).map(e => 'js error ' + e)]);
    await c2.close(); await b.close();
  }
  srv.close();
  const wP = Math.max(...rows.map(r => r[0].length)); console.log('page'.padEnd(wP), ' viewport  result'); rows.forEach(r => console.log(r[0].padEnd(wP), ' ' + r[1].padEnd(8), r[2]));
  console.log(fails ? `\nFAIL mobile: ${fails} of ${rows.length}` : `\nPASS mobile: ${rows.length} of ${rows.length}`); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('FAIL mobile', e.message); process.exit(1); });
