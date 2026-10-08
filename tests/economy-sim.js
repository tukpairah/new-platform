/* Economy audit. Run:  node tests/economy-sim.js
   The same audit as R2.audit() (dev mode, Menu button) and the admin Economy tab. Reads content/economy.js, content/shop.js, content/games.js.
   perfect = gift, quests, pass step, every mode cleared on its unlock day, repeat cap used
   typical = gift, quests, pass daily, clears 7 of 10 modes (every third one never), 5 repeat Gems a day
   minimal = gift, quests and pass only                                                                     */
const C = require('../lib/core.js'); let eco, items, games;
global.R2 = { register(k, v) { if (k === 'economy') eco = v; else if (k === 'shop') items = v.items; else if (k === 'games') games = v; } };
['content/economy.js', 'content/shop.js', 'content/games.js'].forEach(f => require('../' + f));
const a = C.audit({ economy: eco, items: items, modes: games.list });
console.log('Prices:', a.prices.join(' / '), '(total ' + a.total + ')  | xpPerStep', eco.pass.xpPerStep, '| pass gems', eco.pass.gems.join(','));
console.log('Mode first-clear rewards:', Object.entries(a.rewards).map(([k, v]) => `${k} ${v.gems}g/${v.xp}xp`).join(', '));
const perDay = {}; games.list.forEach(m => { perDay[m.unlockDay] = (perDay[m.unlockDay] || 0) + a.rewards[m.id].gems; }); console.log('Mode gems per unlock day:', JSON.stringify(perDay));
for (const k of ['perfect', 'typical', 'minimal']) {
  const p = a.players[k]; console.log('\n' + k + ' - ' + p.about + '\n day | +Gems  total | +XP  total | pass needs | XP margin');
  p.rows.forEach(r => console.log(` ${r.day}   | ${String(r.gems).padStart(4)}  ${String(r.cumGems).padStart(5)} | ${String(r.xp).padStart(3)}  ${String(r.cumXp).padStart(5)} | ${String(r.passNeed).padStart(9)}  | ${String(r.margin).padStart(5)}${r.margin < 10 ? '  <-- under 10' : ''}`));
  console.log(' affordable on day:', p.afford.map((d, i) => `${a.prices[i]}G=${d || 'never'}`).join('  '), '| all five:', p.allDay || 'never', '| Gems left on Day 7:', p.left7, '| every pass step reachable:', p.passOk ? 'yes' : 'NO');
}
console.log('');
if (a.ok) console.log('OK: typical player has ' + a.spare + '% spare, nobody owns all five before Day 5, the minimal player cannot afford all five, every pass step is reachable with a margin of at least 10 XP.');
else a.warnings.forEach(w => console.log('!! ' + w));
process.exit(a.ok ? 0 : 1);
