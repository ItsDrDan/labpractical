// Station Rotation grading and content rules. Run with npm test (after check.js).
// Each case is something a student could really type; a wrong answer must never be marked right.
const path = require('path'), load = require('./load');
const X = load(path.resolve(__dirname, '../..'));
const strip = s => String(s == null ? '' : s).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const fails = []; let n = 0;
const N = (v, o) => Object.assign({ type: 'num', v }, o);
const want = (name, got, exp) => { n++; if (got !== exp) fails.push(`${name}: expected ${exp}, got ${got}`); };
const ok = (p, val, mock) => X.gradePart(p, val, p.unit || '', !!mock).ok;

// 1) a value rounded too far is wrong (it used to pass as "right number, wrong sig figs")
want('count 16 typed 20', ok(N(16, { tol: 0, unit: '' }), '20'), false);
want('count 16 typed 16', ok(N(16, { tol: 0, unit: '' }), '16'), true);
want('207.23 amu typed 207', ok(N(207.23, { tol: 0.006, dp: 2, unit: 'amu' }), '207'), false);
want('207.23 amu typed 200', ok(N(207.23, { tol: 0.006, dp: 2, unit: 'amu' }), '200'), false);
want('207.23 amu typed 207.2 (one place short: right, with a notice)', ok(N(207.23, { tol: 0.006, dp: 2, unit: 'amu' }), '207.2'), true);
want('buret 24.13 typed 20', ok(N(24.13, { dp: 2, tol: 0.02, unit: 'mL' }), '20'), false);
want('balance 36.4200 typed 40', ok(N(36.42, { dp: 4, tol: 0.0002, unit: 'g' }), '40'), false);
want('balance 36.4200 typed 36', ok(N(36.42, { dp: 4, tol: 0.0002, unit: 'g' }), '36'), false);
want('4844.7 J (3 sf) typed 5000', ok(N(4844.7, { sf: 3, unit: 'J' }), '5000'), false);
want('4844.7 J (3 sf) typed 4800 (2 sf: right, with a notice)', ok(N(4844.7, { sf: 3, unit: 'J' }), '4800'), true);
want('4844.7 J (3 sf) typed 4840', ok(N(4844.7, { sf: 3, unit: 'J' }), '4840'), true);
want('4844.7 J typed 4.84e3', ok(N(4844.7, { sf: 3, unit: 'J' }), '4.84e3'), true);
want('4844.7 J typed 4.84x10^3', ok(N(4844.7, { sf: 3, unit: 'J' }), '4.84x10^3'), true);
want('25 (2 sf) typed 30', ok(N(25.4, { sf: 2, unit: 'g' }), '30'), false);
want('1 sf key 2E-6 typed 2E-6', ok(N(1.995e-6, { sf: 1, unit: 'M', rel: 0.001 }), '2E-6'), true);
// 2) very small answers keep a relative tolerance
want('4.0E-14 M typed 1.0E-12', ok(N(4.0e-14, { sf: 2, unit: 'M' }), '1.0E-12'), false);
want('4.0E-14 M typed 4.0E-13', ok(N(4.0e-14, { sf: 2, unit: 'M' }), '4.0E-13'), false);
want('4.0E-14 M typed 4.0E-14', ok(N(4.0e-14, { sf: 2, unit: 'M' }), '4.0E-14'), true);
want('4.07E-19 J typed 1E-15', ok(N(4.07e-19, { sf: 3, unit: 'J' }), '1.00E-15'), false);
// 3) in the mock a reading outside its window is not rescued by rounding
{ const r = X.gradePart(N(24.13, { dp: 2, rtol: 0.1, read: true, unit: 'mL' }), '24', 'mL', true); want('mock buret 24.13 typed 24: accuracy lost', r.valueOk, false); }
// 4) a negated observation is not the observation
const obs = { type: 'text', kw: ['precipitat', 'solid', 'cloud'], accept: [] };
want('obs: a white solid formed', X.gradePart(obs, 'a white solid formed').ok, true);
want('obs: no solid formed', X.gradePart(obs, 'no solid formed').ok, false);
want('obs: did not see a precipitate', X.gradePart(obs, 'did not see a precipitate').ok, false);
want('obs: cloudy, no bubbles', X.gradePart(obs, 'cloudy, no bubbles').ok, true);

// 4b) typed choices: negation, two answers, articles, units, punctuation
const CH = (options, okI) => ({ type: 'choice', options, ok: okI });
const typed = (p, v) => X.gradePart(p, 'T:' + v).ok;
const upDown = CH(['Went up', 'Went down'], 0), exo = CH(['Exothermic', 'Endothermic'], 0), ang = CH(['180°', '120°', '109.5°', 'about 107°', 'about 104.5°'], 2);
want('went up', typed(upDown, 'it went up'), true);
want('it did not go up', typed(upDown, 'it did not go up'), false);
want('the temperature did not increase', typed(upDown, 'the temperature did not increase'), false);
want('not exothermic', typed(exo, 'not exothermic'), false);
want('not endothermic, exothermic', typed(exo, 'not endothermic, exothermic'), true);
want('angle 109.5', typed(ang, '109.5'), true);
want('angle 120 or 109.5', typed(ang, '120° or 109.5°'), false);
want('angle 108 is not 109.5', typed(ang, '108'), false);
const eqp = { type: 'text', accept: ['buret', 'burette'], ans: 'Buret' }, cl = { type: 'text', accept: ['chlorine'], ans: 'Chlorine' };
want('the buret', X.gradePart(eqp, 'the buret').ok, true);
want('a burette', X.gradePart(eqp, 'a burette').ok, true);
want('chlorine typo chlorene... still ine', X.gradePart(cl, 'chlorrine').ok, true);
want('chloride is not chlorine', X.gradePart(cl, 'chloride').ok, false);
const unitCases = [['g/mL', 'g/cm^3'], ['g/mL', 'g/cc'], ['mol', 'mols'], ['°C', 'oC'], ['Hz', 'Hertz'], ['M', 'moles/L'], ['J/g°C', 'J/g/°C'], ['L', 'litres'], ['mL', 'mL.'], ['L·atm/(mol·K)', 'atm·L/(mol·K)'], ['L·atm/(mol·K)', 'L⋅atm/mol⋅K']];
unitCases.forEach(([u, t]) => want(`unit ${t} for ${u}`, X.gradePart(N(1.234, { sf: 4, unit: u }), '1.234', t, true).uOk, true));
[['g/mL', 'g'], ['mol', 'M'], ['M', 'm'], ['J', 'kJ'], ['mL', 'L']].forEach(([u, t]) => want(`wrong unit ${t} for ${u}`, X.gradePart(N(1.234, { sf: 4, unit: u }), '1.234', t, true).uOk, false));
want('practice: 0.00126 mols', ok(N(0.00126, { sf: 3, unit: 'mol' }), '0.00126 mols'), true);
want('reading 6.34 typed 6', ok(N(6.34, { dp: 2, tol: 0.1, unit: 'mL' }), '6'), false);
want('1e-101 does not throw', (() => { try { X.gradePart(N(6.34, { dp: 2, tol: 0.1, unit: 'mL' }), '1e-101', 'mL', true); return true; } catch (e) { return false; } })(), true);
want('pH strip reading: full marks possible', X.gradePart(N(4.5, { dp: 1, unit: '', read: true, rtol: 0.5 }), '4.5', '', true).score, 1);
want('formula with a trailing period', X.gradePart({ type: 'formula', accept: ['Cr2(SO4)3'] }, 'Cr2(SO4)3.').ok, true);
want('aluminium sulphate', X.gradePart({ type: 'name', accept: ['aluminum sulfate'] }, 'aluminium sulphate').ok, true);
{ const slip = v => X.gradePart(N(22.43, { dp: 2, tol: 0.02, unit: 'mL', reading: true }), v, '', false).note || ''; want('no mole-ratio claim on a buret reading', /mole ratio/.test(slip('44.86')), false); }
{ let q; for (let i = 0; i < 400 && !(q && /KI|iodide/i.test(strip(q.prompt + q.solution))); i++) q = X.makeQ('10a', 'netIonic'); const p = q && q.parts.find(x => x.type === 'ions'); if (p && p.react.includes('I')) want('iodide typed as I- is not a spectator', X.gradePart(p, 'K+, NO3-, I-').ok, false); }

// 5) generators: rules that were wrong once
const many = (lab, kind, k, fn) => { for (let i = 0; i < k; i++) { n++; const q = X.makeQ(lab, kind), e = fn(q); if (e) { fails.push(`${lab}.${kind}: ${e}`); break; } } };
many('9a', 'molality', 200, q => (q.parts[1].sf > 4 ? `molality keyed to ${q.parts[1].sf} sig figs (58.44 g/mol has 4)` : ''));
many('7a', 'ice', 200, q => (q.parts[0].sf !== 5 ? `moles of ice keyed to ${q.parts[0].sf} sig figs (should be 5)` : ''));
many('1a', 'percentDiff', 400, q => (/^[−-]?0\.0$/.test(strip(q.parts[0].ans)) ? 'percent difference of 0.0' : ''));
many('4a', 'pctDiff', 400, q => (/^[−-]?0\.0$/.test(strip(q.parts[1].ans)) ? 'percent difference of 0.0' : ''));
many('4a', 'pctDiff', 400, q => { // the class average is the exact mean of the six table values, rounded half up
  const v = strip(q.ref).match(/\d\.\d{3}/g).slice(0, 6).map(x => Math.round(x * 1000)), sum = v.reduce((a, b) => a + b, 0), avg = Math.floor((2 * sum + 6) / 12) / 1000;
  return Math.abs(avg - parseFloat(strip(q.parts[0].ans))) > 1e-9 ? `class average ${strip(q.parts[0].ans)} but the table gives ${avg}` : '';
});
many('9a', 'density', 600, q => { // exact ties (1.0195) round half up
  const m = strip(q.ref).match(/([\d.]+) g.*?([\d.]+) g/), V = +strip(q.prompt).match(/(\d+)\.00 mL/)[1], diff = Math.round(m[2] * 1e4) - Math.round(m[1] * 1e4), k = Math.floor((2 * diff + V * 10) / (2 * V * 10)) / 1000;
  return Math.abs(k - parseFloat(strip(q.parts[0].ans))) > 1e-9 ? `density key ${strip(q.parts[0].ans)} but the data give ${k}` : '';
});
many('3a', 'fingerprintMix', 300, q => (/helium/i.test(strip(q.solution)) && /sodium/i.test(strip(q.solution)) && /588/.test(q.art || '') && /589/.test(q.art || '') ? 'helium + sodium drawn together (588 and 589 nm overlap)' : ''));
for (const L of X.LABS) for (const k of Object.keys(L.K)) many(L.id, k, 25, q => (/(^|[\s(=×÷→:])-\d/.test(strip(q.solution)) ? `hyphen used as a minus sign in the worked answer: ${strip(q.solution).match(/.{0,20}(^|[\s(=×÷→:])-\d.{0,10}/)[0]}` : ''));
// 6) every option of every typed choice question, typed word for word, is graded as that option only
for (const L of X.LABS) for (const k of Object.keys(L.K)) many(L.id, k, 15, q => {
  for (const p of q.parts) { if (p.type !== 'choice' || p.kw) continue; if (!X.gradePart(p, 'T:' + strip(p.options[p.ok])).ok) return `typing the right option is rejected: ${strip(p.options[p.ok])}`; }
  return '';
});

// 7) Hint 2 (the setup) never shows a final answer in bold, and multi-part questions don't show an earlier answer
for (const L of X.LABS) for (const k of Object.keys(L.K)) many(L.id, k, 12, q => {
  const h = X.setupHint(q); if (!h) return '';
  if (/<b>(?!\?<\/b>)/.test(h)) return `setup hint still shows a bold result: ${strip(h).slice(0, 80)}`;
  if (q.parts.length > 1) for (const p of q.parts) { if (p.type !== 'num') continue; const a = strip(p.ans); if (a.length > 3 && new RegExp('(^|[^\\d.,−-])' + a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?![\\d]|\\.\\d)').test(strip(h))) return `setup hint shows the answer ${a}: ${strip(h).slice(0, 90)}`; }
  return '';
});
// 8) Scheme 2: a metal + acid question explains why "gas evolution" is not the answer
many('10a', 'scheme2', 200, q => { const p = q.parts[0], i = p.options.indexOf('Gas evolution'); return /Zn/.test(strip(q.prompt)) && /HCl/.test(strip(q.prompt)) && !/redox/i.test(p.why[i] || '') ? 'Zn + HCl: no redox explanation on Gas evolution' : ''; });

// 9) fixes from the Nov 2026 most-missed review (tools/item-analysis.js)
const G = (p, val) => X.gradePart(p, val, p.unit || '', false);
many('12b', 'molarMass', 1, q => { const p = q.parts[0]; return !G(p, '126.1').ok || !G(p, '126.1').warn ? '126.1 for 126.06 g/mol should be right with a decimal-places notice' : G(p, '126').ok ? '126 for 126.06 g/mol must be wrong' : ''; });
many('11a', 'molarMass', 1, q => (!G(q.parts[0], '474.4').ok ? '474.4 for 474.37 g/mol should be right with a notice' : ''));
many('2a', 'abundance', 40, q => { const p = q.parts[0]; return !G(p, p.v.toFixed(1)).ok ? `abundance ${p.ans} typed ${p.v.toFixed(1)} rejected` : ''; });
many('4b', 'acid', 60, q => { const p = q.parts[0]; return p.type === 'name' && !G(p, p.ans + ' (aq)').ok ? `"${p.ans} (aq)" rejected` : ''; });
many('5a', 'formula', 60, q => { const p = q.parts[0], f = p.accept[0], one = f.replace(/([A-Za-z])(?![a-z0-9])/g, '$11'); return one !== f && (G(p, one).ok || !/subscripts of 1/.test(G(p, one).note)) ? `${one} for ${f}: no "subscripts of 1" note` : ''; });
many('0a', 'buret', 60, q => { const p = q.parts[0], v = p.v, up = 2 * Math.floor(v) + 1 - v; return Math.abs(up - v) > 0.25 && !/top-down/.test(G(p, up.toFixed(2)).note || '') ? `buret ${v} read upward as ${up.toFixed(2)}: no top-down note` : ''; });
many('3a', 'energy', 30, q => { const p = q.parts[0]; return G(p, String(p.v * 1e-9)).ok || !/nm to m/.test(G(p, String(p.v * 1e-9)).note || '') ? 'photon energy without nm→m: no conversion note' : ''; });
many('8a', 'idea', 40, q => (!q.hint || /gas collection tube/.test(q.hint) && !/vapor pressure/.test(q.prompt) ? `gas lab idea has the wrong hint: ${strip(q.prompt).slice(0, 40)}` : ''));

console.log(`${n} grading and content checks run.`);
if (fails.length) { console.log(`${fails.length} problem(s):\n` + [...new Set(fails)].join('\n')); process.exit(1); }
console.log('All grading checks passed.');
