/* Pixel Heart UI test (dev only, needs playwright + chromium: npm i -D playwright && npx playwright install chromium; NOT shipped).
   Repeats 8 actions on the board and fails on any page error, popup, navigation or if the mode disappears. Run: node tests/nonogram-ui.test.js */
let pw; try { pw = require('playwright'); } catch (e) { try { pw = require(process.env.PW_PATH || 'playwright'); } catch (e2) { console.log('SKIP nonogram-ui: playwright is not installed'); process.exit(0); } }
const { chromium } = pw; const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (fs.existsSync(f) && fs.statSync(f).isFile()) { r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); } else { r.writeHead(404); r.end(); } });
let fails = 0;
(async () => {
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const b = await chromium.launch(); const ctx = await b.newContext({ viewport: { width: 900, height: 900 } }); const page = await ctx.newPage();
  const ev = []; page.on('pageerror', e => ev.push('PAGEERROR ' + e.message)); page.on('console', m => { if (m.type() === 'error') ev.push('CONSOLE ' + m.text()); });
  page.on('popup', p => ev.push('POPUP ' + p.url())); ctx.on('page', p => { if (p !== page) ev.push('NEWPAGE ' + p.url()); }); page.on('framenavigated', f => { if (f === page.mainFrame()) ev.push('NAV ' + f.url()); });
  await page.goto(`http://127.0.0.1:${port}/index.html?dev=test&day=7`); await page.waitForTimeout(1500);
  await page.click('#splashGo').catch(() => {}); await page.waitForTimeout(300);
  await page.click('[data-action="play"]'); await page.waitForTimeout(200); await page.click('[data-gmode="nonogram"]'); await page.waitForTimeout(800);
  const ok = await page.$('[data-ht-ok]'); if (ok) { await ok.click(); await page.waitForTimeout(300); }
  ev.length = 0;
  const state = async () => page.evaluate(() => ({ shell: document.getElementById('gameShell') ? !document.getElementById('gameShell').hidden : 'MISSING', board: !!document.querySelector('#gameShell [data-board]'), title: (document.querySelector('.gs-title') || {}).textContent, url: location.href.slice(-30) }));
  const box = async sel => (await page.$(sel)).boundingBox();
  const acts = {
    'a cell': async () => { const c = await box('.ng-c[data-i="12"]'); await page.mouse.click(c.x + c.width / 2, c.y + c.height / 2); },
    'b grid line': async () => { const c = await box('.ng-c[data-i="12"]'); await page.mouse.click(c.x + c.width - 0.5, c.y + c.height / 2); await page.mouse.click(c.x + c.width / 2, c.y + c.height - 0.5); },
    'c board border': async () => { const c = await box('[data-board]'); await page.mouse.click(c.x + 1, c.y + 1); await page.mouse.click(c.x + c.width - 1, c.y + c.height - 1); await page.mouse.click(c.x + c.width + 2, c.y + c.height / 2); },
    'd clue': async () => { await page.click('.ng-col[data-col="0"]'); await page.click('.ng-row[data-row="0"]'); },
    'e empty area': async () => { const c = await box('[data-board]'); await page.mouse.click(c.x + c.width + 120, c.y + c.height + 30); await page.mouse.click(10, 300); },
    'f drag 3 cells': async () => { const c = await box('.ng-c[data-i="6"]'), d = await box('.ng-c[data-i="8"]'); await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2); await page.mouse.down(); await page.mouse.move(d.x + d.width / 2, d.y + d.height / 2, { steps: 6 }); await page.mouse.up(); const o = await box('[data-board]'); await page.mouse.move(c.x + 5, c.y + 5); await page.mouse.down(); await page.mouse.move(o.x - 80, o.y - 80, { steps: 6 }); await page.mouse.move(o.x + o.width + 80, o.y + o.height + 80, { steps: 6 }); await page.mouse.up(); },
    'g buttons': async () => { for (const s of ['[data-mode]', '[data-undo]', '[data-hint]', '[data-gs="howto"]']) { await page.click(s); await page.waitForTimeout(150); const ok = await page.$('[data-ht-ok]'); if (ok) await ok.click(); } await page.click('[data-gs="pause"]'); await page.waitForTimeout(100); await page.click('[data-gs="resume"]'); },
    'h long press': async () => { const c = await box('.ng-c[data-i="20"]'); await page.mouse.move(c.x + c.width / 2, c.y + c.height / 2); await page.mouse.down(); await page.waitForTimeout(700); await page.mouse.up(); await page.mouse.click(c.x + 5, c.y + 5, { button: 'right' }); },
  };
  for (const [n, f] of Object.entries(acts)) { ev.length = 0; try { await f(); } catch (e) { ev.push('SCRIPT ' + e.message.split('\n')[0]); } await page.waitForTimeout(500); const s = await state(); const okk = !ev.length && s.shell === true && s.board; console.log((okk ? 'ok   ' : 'FAIL ') + n + (ev.length ? ' :: ' + ev.join(' | ').slice(0, 300) : '')); if (!okk) fails++; }
  await b.close(); srv.close(); console.log(fails ? 'FAIL nonogram-ui: ' + fails + ' action(s) broke the mode' : 'PASS nonogram-ui: all 8 actions leave the mode running'); process.exit(fails ? 1 : 0);
})().catch(e => { console.log('FAIL nonogram-ui', e.message); process.exit(1); });
