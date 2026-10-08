#!/usr/bin/env node
/* Admin server for the r2-lobby project. Run:  node tools/admin.js   then open http://127.0.0.1:8787/admin.html
   Built-in modules only. Listens on 127.0.0.1 only. Writes only inside content/, img/, audio/ (allowed extensions, size limit)
   and copies every file it overwrites to .admin-backups/. NEVER upload tools/, admin.html, tests/ or .admin-backups/ to the website. */
const http = require('http'), fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.resolve(__dirname, '..'), HOST = '127.0.0.1', PORT = +process.env.PORT || +process.argv[2] || 8787;
const WRITE = ['content', 'img', 'audio'], EXT = /\.(js|png|jpe?g|webp|svg|gif|mp3|ogg|wav|m4a)$/i, MAX = 30 * 1024 * 1024;
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.m4a': 'audio/mp4', '.json': 'application/json' };
const BLOCK = /^\/(tools|tests|\.admin-backups|\.backup)/;

class HttpError extends Error { constructor(code, msg) { super(msg); this.code = code; } }
function abs(rel) {                                   // a path inside the project, no traversal
  rel = String(rel || '').replace(/\\/g, '/').replace(/^\/+/, '');
  const p = path.resolve(ROOT, rel); if (rel.split('/').includes('..') || (p !== ROOT && !p.startsWith(ROOT + path.sep))) throw new HttpError(400, 'bad path'); return p;
}
function writable(rel) { rel = String(rel).replace(/\\/g, '/').replace(/^\/+/, ''); if (!WRITE.includes(rel.split('/')[0]) || !EXT.test(rel) || rel.includes('..')) throw new HttpError(403, 'not allowed: ' + rel); return abs(rel); }
function backup(file) {
  if (!fs.existsSync(file)) return; const dir = path.join(ROOT, '.admin-backups'); fs.mkdirSync(dir, { recursive: true });
  fs.copyFileSync(file, path.join(dir, new Date().toISOString().replace(/[:.]/g, '-') + '__' + path.relative(ROOT, file).replace(/[\\/]/g, '__')));
}
function write(rel, data) { const f = writable(rel); fs.mkdirSync(path.dirname(f), { recursive: true }); backup(f); fs.writeFileSync(f, data); }
const exists = rel => !!rel && fs.existsSync(abs(rel));
const read = rel => fs.readFileSync(abs(rel), 'utf8');

/* read the project's own data files by running them against a fake R2 */
function evalData(rel, fake) { const box = { R2: fake, CONFIG: {}, window: {}, document: {} }; vm.createContext(box); vm.runInContext(read(rel), box, { timeout: 2000 }); }
function registry() { let out = { defaultMusic: [], list: [] }; evalData('content/games.js', { register: (k, v) => { if (k === 'games') out = v; } }); return out; }
function gameContent(id) { let out = {}; try { evalData('content/games/' + id + '.js', { register: (k, a, b) => { if (k === 'gamecontent' && a === id) out = b; } }); } catch (e) {} return out; }
const HOWTO_FIELDS = [
  { key: 'howTo.goal', type: 'text', label: 'COMMENT JOUER (French) - goal ("But :")' },
  { key: 'howTo.steps', type: 'list', label: 'COMMENT JOUER - 2 to 4 steps, one per line, max 12 words each' },
  { key: 'howTo.phone', type: 'text', label: 'COMMENT JOUER - "Sur téléphone :"' },
  { key: 'howTo.desktop', type: 'text', label: 'COMMENT JOUER - "Sur ordinateur :"' },
  { key: 'howTo.tip', type: 'text', label: 'COMMENT JOUER - "Astuce :"' }];
function schemaOf(m) { const r = schemaOf0(m); r.schema = (r.schema || []).concat(HOWTO_FIELDS); return r; }       // every mode gets the how-to fields
function schemaOf0(m) {                                // the schema a mode declares in R2.games.register (modes are never run, only registered)
  if (!m.file || !exists(m.file) || m.id === 'quiz' || m.id === 'dodge') return { schema: [], defaults: {} };
  let def = null; const noop = new Proxy(function () {}, { get: () => noop, apply: () => noop, construct: () => ({}) });
  try { const box = { R2: { games: { register: d => { def = d; } }, register() {} }, CONFIG: {}, window: noop, document: noop, Image: noop, Audio: noop, console }; vm.createContext(box); vm.runInContext(read(m.file), box, { timeout: 2000 }); } catch (e) { return { schema: [], defaults: {}, error: String(e.message) }; }
  return { schema: (def && def.schema) || [], defaults: (def && def.defaults) || {} };
}
function listDir(rel) { try { return fs.readdirSync(abs(rel)).filter(f => EXT.test(f)).map(f => rel + '/' + f); } catch (e) { return []; } }
function overview() {
  const reg = registry(), cfg = exists('config.js') ? read('config.js') : '', dk = /devKey:\s*"([^"]*)"/.exec(cfg);
  let results = { win: [], lose: [], maxSeconds: 8, volume: 0.8 }; try { const rb = /\/\/ RESULTS-BEGIN\s*results:\s*([\s\S]*?),?\s*\/\/ RESULTS-END/.exec(cfg); if (rb) results = Object.assign(results, vm.runInNewContext('(' + rb[1] + ')')); } catch (e) {}
  return { results, devKey: dk ? dk[1] : '', defaultMusic: reg.defaultMusic || [], modes: (reg.list || []).map(m => Object.assign({}, m, { codeExists: exists(m.file), contentExists: m.contentFile ? exists(m.contentFile) : null, content: gameContent(m.id), schemaInfo: schemaOf(m), audioFiles: listDir('audio/games/' + m.id) })) };
}
function economyAudit() {                                  // the same audit as R2.audit() and node tests/economy-sim.js
  let eco = {}, items = []; evalData('content/economy.js', { register: (k, v) => { if (k === 'economy') eco = v; } }); evalData('content/shop.js', { register: (k, v) => { if (k === 'shop') items = v.items; } });
  return require('../lib/core.js').audit({ economy: eco, items, modes: registry().list || [] });
}
function saveRegistry(body) {
  const old = read('content/games.js'), head = old.slice(0, old.indexOf('R2.register('));
  const lines = (body.list || []).map(m => '    ' + JSON.stringify({ id: m.id, name: m.name, difficulty: m.difficulty, unlockDay: +m.unlockDay, file: m.file || '', contentFile: m.contentFile || '', minSeconds: +m.minSeconds, winSound: m.winSound || [], loseSound: m.loseSound || [], icon: m.icon || '', iconLocked: m.iconLocked || '', music: m.music || [], ...(m.rewards ? { rewards: m.rewards } : {}) })).join(',\n');
  write('content/games.js', head + 'R2.register("games", {\n  "defaultMusic": ' + JSON.stringify(body.defaultMusic || []) + ',\n  "list": [\n' + lines + '\n  ]\n});\n');
}
function saveContent(id, obj) {
  if (!/^[a-z][a-z0-9]*$/.test(id)) throw new HttpError(400, 'bad id');
  const rel = 'content/games/' + id + '.js'; let head = '/* Content of this mode. Edited by the admin; you can also edit it by hand (strict JSON inside the call). */\n';
  if (exists(rel)) { const m = /^\s*\/\*[\s\S]*?\*\//.exec(read(rel)); if (m) head = m[0].trim() + '\n'; }
  write(rel, head + 'R2.register("gamecontent", ' + JSON.stringify(id) + ', ' + JSON.stringify(obj, null, 2) + ');\n');
}

/* ---------- release check: what must be fixed before the site is uploaded ---------- */
function walk(rel, out) { try { fs.readdirSync(abs(rel), { withFileTypes: true }).forEach(d => { const r = rel + '/' + d.name; if (d.isDirectory()) walk(r, out); else if (/\.js$/.test(d.name)) out.push(r); }); } catch (e) {} return out; }
function stripLine(l) { let q = ''; for (let i = 0; i < l.length; i++) { const c = l[i]; if (q) { if (c === '\\') i++; else if (c === q) q = ''; } else if (c === '"' || c === "'" || c === '`') q = c; else if (c === '/' && l[i + 1] === '/' && l[i - 1] !== ':') return l.slice(0, i); } return l; }   // cut a trailing // comment, but never inside a string
const stripComments = src => src.replace(/\/\*[\s\S]*?\*\//g, '').split('\n').map(stripLine).join('\n');
function releaseCheck() {
  const res = [], add = (level, text) => res.push({ level, text });
  const files = walk('content', []).concat(['config.js']);
  files.forEach(f => {                                                    // placeholders still in the content
    const src = stripComments(read(f)), m = src.match(/\[\s*REPLACE[^\]]*\]?/gi);
    if (m) add('warn', `${f}: ${m.length} placeholder(s) left, e.g. ${m[0].slice(0, 50)}`);
    const seen = new Set(); (src.match(/["'`]([^"'`\n]+\.(?:png|jpe?g|webp|svg|gif|mp3|ogg|wav|m4a))["'`]/gi) || []).forEach(q => {        // pictures and sounds that do not exist
      const p = q.slice(1, -1).replace(/^\.\//, '').split('?')[0]; if (seen.has(p) || /^(https?:)?\/\//.test(p)) return; seen.add(p);
      if (!exists(p)) add('error', `${f}: missing file ${p}`);
    });
  });
  const cfg = read('config.js'), dk = /devKey:\s*"([^"]*)"/.exec(cfg);
  if (dk && dk[1]) add('error', 'config.js devKey is not empty ("' + dk[1] + '"): set devKey: "" before uploading');
  if (/saveSalt:\s*"r2-8f31c2d7a9"/.test(cfg)) add('warn', 'config.js saveSalt is still the default. Change it once, before she receives the final version, and never again after');
  const reg = registry(), ids = new Set();
  (reg.list || []).forEach(m => {
    if (ids.has(m.id)) add('error', 'games registry: duplicate id ' + m.id); ids.add(m.id);
    if (!(m.unlockDay >= 1 && m.unlockDay <= 7)) add('error', `${m.id}: unlockDay ${m.unlockDay} is not between 1 and 7`);
    if (m.file && !exists(m.file)) add('warn', `${m.id}: code file ${m.file} missing (shows "Coming soon")`);
    if (m.contentFile && !exists(m.contentFile)) add('warn', `${m.id}: content file ${m.contentFile} missing`);
    if (m.unlockDay >= 1 && m.unlockDay <= 7 && !exists('content/days/day' + m.unlockDay + '.js')) add('warn', `${m.id} opens on Day ${m.unlockDay} but content/days/day${m.unlockDay}.js is missing (that day has no pack)`);
    ['icon', 'iconLocked'].forEach(k => { if (m[k] && !exists(m[k])) add('warn', `${m.id}: ${k} file ${m[k]} is missing`); });
    if (!(m.music || []).length && !(reg.defaultMusic || []).length) add('warn', `${m.id}: no music (the lobby music keeps playing)`);
  });
  try { const mt = fs.readFileSync(path.join(ROOT, 'content/games/mot.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''); [...mt.matchAll(/"([^"|]+)\|[^"]*"/g)].forEach(x => { const w = x[1].normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z]/g, ''); if (w.length !== 5) add('error', `Mot: "${x[1]}" has ${w.length} letters, it must be exactly 5`); }); } catch (e) {}
  for (let d = 1; d <= 7; d++) if (!exists('content/days/day' + d + '.js')) add('warn', 'content/days/day' + d + '.js is missing');
  if (exists('content/shop.js')) (read('content/shop.js').match(/"availableFromDay":\s*(\d+)/g) || []).forEach(x => { if (+x.match(/\d+/)[0] > 7) add('error', 'a Bazaar item opens after Day 7: ' + x); });
  const dep = exists('DEPLOY.md') ? read('DEPLOY.md') : '';
  if (!dep) add('error', 'DEPLOY.md is missing');
  else ['tools/', 'tests/', 'admin.html', '.admin-backups/', '.backup'].forEach(x => { if (dep.indexOf(x) < 0) add('warn', 'DEPLOY.md does not list "' + x + '" as do-not-upload'); });
  ['tools', 'tests', 'admin.html', '.admin-backups'].filter(x => exists(x)).forEach(x => add('info', 'Do NOT upload: ' + x));
  fs.readdirSync(ROOT).filter(n => /^\.backup/.test(n)).forEach(n => add('info', 'Do NOT upload: ' + n + '/'));
  if (!res.some(r => r.level === 'error' || r.level === 'warn')) add('ok', 'Nothing to fix.');
  return res;
}

/* the preview page: the real lobby with every day open, in its own save, that opens one mode and reloads when its files change */
function previewPage(id) {
  if (!/^[a-z][a-z0-9]*$/.test(id)) throw new HttpError(400, 'bad mode');
  const watch = JSON.stringify(['games/' + id + '.js', 'content/games/' + id + '.js', 'content/games.js', 'content/economy.js', 'games/shell.js', 'games/shell.css', 'common.js']);
  let html = read('index.html');
  html = html.replace('<head>', '<head>\n<script>history.replaceState(null, "", "/preview?dev=preview&day=7&mode=' + id + '");</script>');
  html = html.replace('<script src="config.js"></script>', '<script src="config.js"></script>\n<script>CONFIG.devKey = "preview"; CONFIG.startScreen = false;</script>');
  html = html.replace('</body>', `<script>
(function () {                                    // admin preview only (this route does not exist on the website)
  var bar = document.createElement('div'); bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99;background:#E8403A;color:#fff;font:12px monospace;text-align:center;padding:2px'; bar.textContent = 'ADMIN PREVIEW: separate test save, every day unlocked'; document.body.appendChild(bar);
  setTimeout(function () { Shell.launch(${JSON.stringify(id)}); }, 500);
  var last = null, paths = ${watch};
  setInterval(function () { fetch('/api/mtimes?paths=' + encodeURIComponent(paths.join(','))).then(function (r) { return r.json(); }).then(function (j) { var s = JSON.stringify(j); if (last !== null && s !== last) location.reload(); last = s; }).catch(function () {}); }, 1000);
})();
</script>
</body>`);
  return html;
}

function body(req) {
  return new Promise((res, rej) => { const chunks = []; let n = 0; req.on('data', c => { n += c.length; if (n > MAX) { rej(new HttpError(413, 'too large')); req.destroy(); } else chunks.push(c); }); req.on('end', () => res(Buffer.concat(chunks))); req.on('error', rej); });
}
const send = (res, code, data, type) => { res.writeHead(code, { 'Content-Type': type || 'application/json', 'Cache-Control': 'no-store' }); res.end(typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data)); };

const server = http.createServer(async (req, res) => {
  try {
    const u = new URL(req.url, 'http://x'), p = decodeURIComponent(u.pathname);
    if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(req.headers.host || '')) throw new HttpError(403, 'host');           // blocks DNS-rebinding
    if (req.method !== 'GET' && req.headers.origin && new URL(req.headers.origin).host !== req.headers.host) throw new HttpError(403, 'origin');
    if (p === '/api/release') return send(res, 200, releaseCheck());
    if (p === '/api/economy') return send(res, 200, economyAudit());
    if (p === '/api/games' && req.method === 'GET') return send(res, 200, overview());
    if (p === '/api/games/registry' && req.method === 'POST') { saveRegistry(JSON.parse((await body(req)).toString())); return send(res, 200, { ok: true }); }
    if (p.startsWith('/api/games/content/') && req.method === 'POST') { saveContent(p.split('/').pop(), JSON.parse((await body(req)).toString())); return send(res, 200, { ok: true }); }
    if (p === '/api/results' && req.method === 'POST') {        // rewrites only the block between RESULTS-BEGIN / RESULTS-END in config.js
      const b = JSON.parse((await body(req)).toString()), clean = a => (a || []).filter(x => /^audio\/results\/[\w.\- ()]+$/.test(x));
      const blk = '\t// RESULTS-BEGIN\n\tresults: ' + JSON.stringify({ win: clean(b.win), lose: clean(b.lose), maxSeconds: Math.max(1, +b.maxSeconds || 8), volume: Math.min(1, Math.max(0, b.volume == null ? 0.8 : +b.volume)) }) + ',\n\t// RESULTS-END';
      const cur = read('config.js'); if (!/\t\/\/ RESULTS-BEGIN[\s\S]*?\/\/ RESULTS-END/.test(cur)) throw new HttpError(400, 'config.js has no RESULTS-BEGIN / RESULTS-END block');
      write('config.js', cur.replace(/\t\/\/ RESULTS-BEGIN[\s\S]*?\/\/ RESULTS-END/, () => blk)); return send(res, 200, { ok: true });
    }
    if (p === '/api/upload' && req.method === 'POST') {
      const rel = u.searchParams.get('path'); if (!/^((audio|img)\/games\/[a-z][a-z0-9]*|audio\/results)\/[\w.\- ()]+$/.test(rel || '')) throw new HttpError(400, 'upload only to audio|img/games/<mode>/');
      write(rel, await body(req)); return send(res, 200, { ok: true, path: rel });
    }
    if (p === '/api/file' && req.method === 'DELETE') { const rel = u.searchParams.get('path'); if (!/^(audio|img)\/games\/|^audio\/results\//.test(rel || '')) throw new HttpError(403, 'only game files'); const f = writable(rel); backup(f); if (fs.existsSync(f)) fs.unlinkSync(f); return send(res, 200, { ok: true }); }
    if (p === '/api/mtimes') { const o = {}; String(u.searchParams.get('paths') || '').split(',').filter(Boolean).slice(0, 20).forEach(r => { try { o[r] = fs.statSync(abs(r)).mtimeMs; } catch (e) { o[r] = 0; } }); return send(res, 200, o); }
    if (p === '/preview') return send(res, 200, previewPage(u.searchParams.get('mode')), MIME['.html']);
    if (req.method !== 'GET') throw new HttpError(405, 'method');
    if (BLOCK.test(p) && p !== '/admin.html') throw new HttpError(403, 'private');
    let f = abs(p === '/' ? 'index.html' : p); if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    if (!fs.existsSync(f)) throw new HttpError(404, 'not found');
    return send(res, 200, fs.readFileSync(f), MIME[path.extname(f).toLowerCase()] || 'application/octet-stream');
  } catch (e) { send(res, e.code || 500, { error: String(e.message || e) }); }
});
if (require.main === module && process.argv.includes('--check')) { const r = releaseCheck(); r.forEach(x => console.log(x.level.toUpperCase().padEnd(6) + x.text)); process.exit(r.some(x => x.level === 'error') ? 1 : 0); }
else if (require.main === module) server.listen(PORT, HOST, () => console.log(`Admin: http://${HOST}:${PORT}/admin.html   (Ctrl+C to stop; never upload tools/ or admin.html)`));
module.exports = { releaseCheck, economyAudit, server, registry, schemaOf, gameContent, saveRegistry, saveContent, overview, abs, writable };
