/* Love Quiz inside the shell. Same mechanics as before: a wrong answer greys out and she tries again, the right one shows feedback and Next. */
R2.games.register({
  id: "quiz",
  schema: [],        // the questions live in content/quiz.js
  defaults: {},
  mount(ctx) {
    const qs = (CONFIG.games.quiz.questions || []), root = ctx.root; let i = 0, wrong = 0, dead = false, done = false, ord = [];
    function show() {
      if (dead) return;
      if (i >= qs.length) { if (!done) { done = true; root.innerHTML = `<div class="gs-panel"><p class="qq">${esc(CONFIG.games.quiz.finish || '')}</p><div class="qnext"><button type="button" class="mbtn" data-qend>OK</button></div></div>`; return; } ctx.win({ score: Math.max(0, qs.length * 100 - wrong * 25), stars: wrong === 0 ? 3 : wrong <= 2 ? 2 : 1 }); return; }
      const q = qs[i]; ord = q.options.map((_, k) => k); for (let k = ord.length - 1; k > 0; k--) { const j = Math.floor(Math.random() * (k + 1)); [ord[k], ord[j]] = [ord[j], ord[k]]; }
      R2.bus.emit('quiz:question'); ctx.stars(wrong === 0 ? 3 : wrong <= 2 ? 2 : 1);
      root.innerHTML = `<div class="gs-panel"><div class="mbar"><i style="width:${i / qs.length * 100}%"></i><span class="t" style="--st:var(--mst)">${i + 1} / ${qs.length}</span></div>
        <p class="qq">${esc(q.q)}</p>${ord.map(k => `<button type="button" class="mbtn qopt" data-qopt="${k}">${esc(q.options[k])}</button>`).join('')}<p class="qfb" aria-live="polite"></p><div class="qnext"></div></div>`;
    }
    root.onclick = e => {
      const b = e.target.closest('[data-qopt]'), nx = e.target.closest('[data-qnext]'), q = qs[i];
      if (e.target.closest('[data-qend]')) { show(); return; }
      if (nx) { i++; show(); return; }
      if (!b || !q) return;
      const fb = root.querySelector('.qfb');
      if (+b.dataset.qopt === q.correct) {
        b.classList.add('correct'); root.querySelectorAll('.qopt').forEach(x => x.disabled = true); fb.textContent = q.right; R2.bus.emit('quiz:right');
        root.querySelector('.qnext').innerHTML = `<button type="button" class="mbtn" data-qnext>${i === qs.length - 1 ? 'Finish' : 'Next'}</button>`;
      } else { b.classList.add('wrong'); b.disabled = true; fb.textContent = q.wrong; wrong++; R2.bus.emit('quiz:wrong'); ctx.stars(wrong === 0 ? 3 : wrong <= 2 ? 2 : 1); }
    };
    show();
    return { pause() {}, resume() {}, destroy() { dead = true; root.onclick = null; root.innerHTML = ''; } };
  }
});
