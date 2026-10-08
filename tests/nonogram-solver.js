/* A nonogram solver for the tests: line propagation + backtracking. count(rows, cols, limit) returns how many solutions exist (up to limit). */
function runs(line) { const o = []; let c = 0; for (const v of line) { if (v === 1) c++; else if (c) { o.push(c); c = 0; } } if (c) o.push(c); return o; }
function lineSolve(clue, known) {                        // returns the refined line, or null on contradiction
  const n = known.length; let all = null;
  const c = clue.filter(x => x > 0);
  const gen = (k, pos, cur) => {
    if (k === c.length) { for (let i = pos; i < n; i++) { if (known[i] === 1) return; } const full = cur.concat(new Array(n - cur.length).fill(0)); merge(full); return; }
    const rest = c.slice(k + 1).reduce((a, b) => a + b + 1, 0);
    for (let s = pos; s + c[k] + rest <= n; s++) {
      let ok = true; for (let i = pos; i < s; i++) if (known[i] === 1) { ok = false; break; } if (!ok) break;
      for (let i = s; i < s + c[k]; i++) if (known[i] === 0) { ok = false; break; } if (!ok) continue;
      if (s + c[k] < n && known[s + c[k]] === 1) continue;
      const next = cur.concat(new Array(s - cur.length).fill(0), new Array(c[k]).fill(1)); if (s + c[k] < n) next.push(0);
      gen(k + 1, s + c[k] + 1, next);
    }
  };
  const merge = full => { if (!all) all = full.map(v => v); else for (let i = 0; i < n; i++) if (all[i] !== full[i]) all[i] = -1; };
  gen(0, 0, []); return all;
}
function count(rowClues, colClues, limit = 2) {
  const R = rowClues.length, C = colClues.length;
  function solve(grid) {
    for (let changed = true; changed;) {
      changed = false;
      for (let r = 0; r < R; r++) { const line = grid[r], res = lineSolve(rowClues[r], line); if (!res) return 0; for (let c = 0; c < C; c++) if (res[c] !== line[c] && res[c] !== -1) { if (line[c] !== -1) return 0; grid[r][c] = res[c]; changed = true; } }
      for (let c = 0; c < C; c++) { const line = grid.map(row => row[c]), res = lineSolve(colClues[c], line); if (!res) return 0; for (let r = 0; r < R; r++) if (res[r] !== line[r] && res[r] !== -1) { if (line[r] !== -1) return 0; grid[r][c] = res[r]; changed = true; } }
    }
    let r0 = -1, c0 = -1; for (let r = 0; r < R && r0 < 0; r++) for (let c = 0; c < C; c++) if (grid[r][c] === -1) { r0 = r; c0 = c; break; }
    if (r0 < 0) return 1;
    let total = 0; for (const v of [1, 0]) { const g2 = grid.map(row => row.slice()); g2[r0][c0] = v; total += solve(g2); if (total >= limit) return total; }
    return total;
  }
  return solve(Array.from({ length: R }, () => new Array(C).fill(-1)));
}
const clueOf = line => { const r = runs(line); return r.length ? r : [0]; };
function cluesOf(grid) { const R = grid.length, C = grid[0].length; return { rows: grid.map(clueOf), cols: Array.from({ length: C }, (_, c) => clueOf(grid.map(row => row[c]))) }; }
module.exports = { runs, count, cluesOf, clueOf };
