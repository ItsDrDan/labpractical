// Station Rotation regression check. Run from this folder: npm install && npm test
// 1) every question type generates N times with no errors or broken text
// 2) the grader accepts the game's own answer and rejects each typed wrong choice
// 3) 300 mock practicals: no repeated kind of question on a student's sheet
const path = require('path'), load = require('./load');
const DIR = path.resolve(__dirname, '../..'), N = +(process.argv[2] || 60);
const strip = s => String(s == null ? '' : s).replace(/<sub>(.*?)<\/sub>/g, '$1').replace(/<sup>(.*?)<\/sup>/g, '^$1').replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const plainNum = s => strip(s).replace(/×\s*10\^?([−-]?\d+)/, 'E$1').replace(/−/g, '-').replace(/\s/g, '');
// true observations that also fit another station (H₂ is colorless and odorless too)
const ALLOWED_WRONG = [/^10a\.station: typed "Lots of fizzing/];
(async () => {
  const fails = [];
  const X = load(DIR); await new Promise(r => setTimeout(r, 50));
  if (X.errors.length) fails.push('page errors: ' + X.errors.join(' | '));
  let n = 0;
  for (const L of X.LABS) for (const k of Object.keys(L.K)) for (let i = 0; i < N; i++) {
    const id = `${L.id}.${k}`; let q;
    try { q = X.makeQ(L.id, k); } catch (e) { fails.push(`${id}: throws ${e.message}`); break; }
    n++;
    const txt = strip([q.prompt, q.ref, q.hint, q.solution, ...q.parts.map(p => [p.label, p.ans, (p.options || []).join('|')].join(' '))].join(' '));
    if (/\bNaN\b|undefined|Infinity|\[object|\bnull\b|\de[+-]\d/.test(txt)) { fails.push(`${id}: bad text: ${txt.match(/.{0,50}(\bNaN\b|undefined|Infinity|\[object|\bnull\b|\de[+-]\d).{0,30}/)[0]}`); break; }
    for (const p of q.parts) {
      if (p.dep || p.free) continue;
      const g = (v, u = '', m = false) => X.gradePart(p, v, u, m);
      if (p.type === 'num') { const a = plainNum(p.ans); if (!g(a, p.unit || '').ok) fails.push(`${id}: own answer ${a} rejected`); }
      else if (p.type === 'choice') {
        if (!g('T:' + strip(p.options[p.ok])).ok) fails.push(`${id}: typed right option rejected: ${strip(p.options[p.ok])}`);
        p.options.forEach((o, j) => { if (j === p.ok) return; const msg = `${id}: typed "${strip(o)}" accepted`; if (g('T:' + strip(o)).ok && !ALLOWED_WRONG.some(r => r.test(msg))) fails.push(msg); if (!(p.why && p.why[j])) fails.push(`${id}: no feedback for wrong choice "${strip(o)}"`); });
      }
      else if ((p.type === 'text' && !p.kw) || p.type === 'name' || p.type === 'formula') { if (!g(p.accept[0]).ok) fails.push(`${id}: own answer ${p.accept[0]} rejected`); }
      else if (p.type === 'coef') { if (!g(p.vals.join(',')).ok) fails.push(`${id}: own coefficients rejected`); }
      else if (p.type === 'eq') { if (!g(strip(p.ans).replace(/→/g, '->')).ok) fails.push(`${id}: own equation rejected`); }
      else if (p.type === 'ions') { if (!g(p.none ? 'none' : p.spec.join(' ')).ok) fails.push(`${id}: own spectator ions rejected`); }
    }
  }
  // mock practicals
  const M = load(DIR, 'https://itsdrdan.github.io/labpractical/?sec=25784'); await new Promise(r => setTimeout(r, 50));
  let rep = 0, sheets = 0;
  for (let i = 0; i < 300; i++) {
    M.buildPractical('A', true); const st = M.getMock().stations;
    for (const V of 'ABC') { sheets++; const fams = st.filter(s => !s.hands && s.lab !== 'gen').map(s => M.famOf(s.versions[V].lab, s.versions[V].kind)); if (new Set(fams).size !== fams.length) rep++; }
  }
  if (rep) fails.push(`mock: ${rep}/${sheets} sheets repeat a kind of question`);
  const uniq = [...new Set(fails)];
  console.log(`${n} questions checked, ${sheets} mock sheets built.`);
  if (uniq.length) { console.log(`${uniq.length} problem(s):\n` + uniq.slice(0, 60).join('\n')); process.exit(1); }
  console.log('All checks passed.');
})();
