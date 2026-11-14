#!/usr/bin/env node
/* Station Rotation: which lab-practical questions students miss, per experiment and per kind of question.

   node tools/item-analysis.js                    fetch the last 365 days from the stats sheet
   node tools/item-analysis.js --days 60          e.g. this semester only
   node tools/item-analysis.js --file stats.json  use a saved copy of <stats URL>?days=365
   node tools/item-analysis.js --min 5            answers needed before a question kind is ranked (default 5)
   node tools/item-analysis.js --mode mock        only Mock Practical answers (or: practice, vlab, phet)

   Needs jsdom from tools/check (cd tools/check && npm install, once).
   Writes item-analysis.md in the repo folder (not committed) and prints a summary.

   The data comes from games/track.js: every first answer in Practice and Mock Practical sends
   topic "Exp <lab> <lab name> · <question tag>" and correct/wrong, and the Virtual Lab and PhET bench
   send their own topics. The stats sheet (the same Apps Script as the MCAT, TEAS and Final Boss
   reports) returns answer and wrong counts per game, mode and topic. Lab practical questions are
   generated with new numbers each time, so the unit here is the KIND of question (e.g. 7a Calorimetry ·
   Heat lost by the water), not one fixed item, and there is no mis-key check: a high miss rate means
   "reteach this skill or look at the question's wording and hints", not "the key is wrong". */
"use strict";
const fs = require("fs"), path = require("path");
const ROOT = path.resolve(__dirname, "..");
const STATS_URL = "https://script.google.com/macros/s/AKfycbylSKoW9GE6AkN4HiC1uts3Y5Z4oUPHY7OQ88vXrjpcanooloYRTIGW9cS5n0dulp4vQg/exec";
const MODES = { practice: "Practice", mock: "Mock Practical", vlab: "Virtual Lab", phet: "PhET Bench" };

const argv = process.argv.slice(2), opt = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const days = +opt("--days", 365), file = opt("--file", null), MIN = +opt("--min", 5), modeArg = opt("--mode", null);
if (modeArg && !MODES[modeArg]) { console.error(`✗ --mode must be one of: ${Object.keys(MODES).join(", ")}`); process.exit(1); }
const pct = (c, n) => n ? Math.round(100 * c / n) + "%" : "–";
const cell = s => String(s).replace(/\|/g, "/");

/* Tags each question kind can produce in the current game (some kinds have variants, e.g. Type I / Type II). */
function gameKinds() {
  let load;
  try { load = require("./check/load"); } catch (e) { throw new Error("jsdom missing: run  cd tools/check && npm install  first"); }
  const X = load(ROOT), labs = new Map();
  for (const L of X.LABS) {
    const kinds = new Map(); // tag -> kind id
    for (const k of Object.keys(L.K)) for (let i = 0; i < 25; i++) { try { kinds.set(X.makeQ(L.id, k).tag, k); } catch (e) { break; } }
    if (X.HANDS && X.HANDS[L.id]) kinds.set("Hands-on station", "hands");
    labs.set(L.id, { id: L.id, name: L.name, kinds });
  }
  return labs;
}

/* topic "Exp 7a Calorimetry · Heat lost by the water" -> { lab: "7a", tag: "Heat lost by the water" } */
function parseTopic(t) {
  const m = /^Exp (\S+) (.*?) · (.+)$/.exec(t);
  return m ? { lab: m[1], labName: m[2], tag: m[3] } : null;
}

function analyze(data, labs) {
  const rows = (data.topics || []).filter(t => t.game === "labpractical" && (!modeArg || t.mode === MODES[modeArg]));
  const byKind = new Map(), byLab = new Map(), byMode = new Map(), byTag = new Map(), other = new Map(), retired = [];
  const add = (m, k, n, w, extra) => { const o = m.get(k) || Object.assign({ n: 0, w: 0 }, extra); o.n += n; o.w += w; m.set(k, o); return o; };
  let N = 0, W = 0;
  for (const t of rows) {
    const n = +t.answers || 0, w = +t.wrong || 0; N += n; W += w;
    add(byMode, t.mode || "(none)", n, w);
    const p = parseTopic(t.topic || "");
    if (!p) { add(other, `${t.mode} · ${t.topic}`, n, w, { mode: t.mode, topic: t.topic }); continue; }
    const L = labs.get(p.lab), kind = L && L.kinds.get(p.tag);
    add(byLab, p.lab, n, w, { name: L ? L.name : p.labName });
    if (!kind) { retired.push({ lab: p.lab, tag: p.tag, mode: t.mode, n, w }); }
    const key = `${p.lab}.${kind || "?" + p.tag}`;
    const o = add(byKind, key, n, w, { lab: p.lab, kind: kind || "", tags: new Set(), modes: {} });
    o.tags.add(p.tag); o.modes[t.mode] = (o.modes[t.mode] || 0) + n;
    add(byTag, p.tag === "Hands-on station" ? p.tag : p.tag.replace(/ \((Type I+|molecular)( ionic)?\)$/, ""), n, w, { labs: new Set() }).labs.add(p.lab);
  }
  return { rows: rows.length, N, W, byKind, byLab, byMode, byTag, other, retired };
}

function report(data, labs, R) {
  const name = id => (labs.get(id) || {}).name || "";
  const kindLabel = o => `${o.lab} ${name(o.lab)} · ${[...o.tags].join(" / ")}`;
  const missRate = o => o.w / o.n;
  const L = [`# Station Rotation item analysis (${data.days || days} days${modeArg ? ", " + MODES[modeArg] + " only" : ""}, generated ${data.generated || new Date().toISOString()})`, "",
    `First answers: ${R.N} · correct: ${pct(R.N - R.W, R.N)} · question kinds with answers: ${R.byKind.size} · ranked (${MIN}+ answers): ${[...R.byKind.values()].filter(o => o.n >= MIN).length}`, "",
    "Counts are first answers (a student's first try at each question). Lab practical numbers change every time, so each row is a kind of question, not one fixed item.",
    "With only a few answers a percentage can swing a lot: read the Answers column before acting on a row.", "",
    "## By mode", "", "| Mode | Answers | Correct |", "|---|---|---|",
    ...[...R.byMode].sort((a, b) => b[1].n - a[1].n).map(([m, o]) => `| ${m} | ${o.n} | ${pct(o.n - o.w, o.n)} |`), ""];

  const ranked = [...R.byKind.values()].filter(o => o.n >= MIN).sort((a, b) => missRate(b) - missRate(a) || b.n - a.n);
  L.push(`## Most-missed question kinds (${MIN}+ answers; reteach these)`, "");
  if (ranked.length) L.push("| Question kind | Answers | Missed | Correct | Answered in |", "|---|---|---|---|---|",
    ...ranked.slice(0, 30).map(o => `| ${cell(kindLabel(o))} | ${o.n} | ${o.w} | ${pct(o.n - o.w, o.n)} | ${Object.entries(o.modes).map(([m, c]) => `${m} ${c}`).join(", ")} |`));
  else L.push(`No question kind has ${MIN}+ answers yet. Try  --min 2  for an early look, or see the per-experiment tables below.`);
  L.push("");

  L.push("## By experiment", "", "| Experiment | Answers | Correct | Most-missed kind (2+ answers) | Kinds never answered |", "|---|---|---|---|---|");
  for (const [id, lab] of labs) {
    const o = R.byLab.get(id) || { n: 0, w: 0 };
    const ks = [...R.byKind.values()].filter(k => k.lab === id);
    const worst = ks.filter(k => k.n >= 2).sort((a, b) => missRate(b) - missRate(a) || b.n - a.n)[0];
    const seen = new Set(ks.map(k => k.kind)), never = [...new Set(lab.kinds.values())].filter(k => !seen.has(k)).length;
    L.push(`| ${id} ${cell(lab.name)} | ${o.n} | ${pct(o.n - o.w, o.n)} | ${worst ? `${cell([...worst.tags].join(" / "))} (${worst.n - worst.w}/${worst.n} right)` : "–"} | ${never} of ${new Set(lab.kinds.values()).size} |`);
  }
  L.push("");

  const shared = [...R.byTag].filter(([t, o]) => o.labs.size > 1 && t !== "Hands-on station").sort((a, b) => missRate(b[1]) - missRate(a[1]) || b[1].n - a[1].n);
  if (shared.length) {
    L.push("## Same skill across experiments", "", "| Question tag | Experiments | Answers | Correct |", "|---|---|---|---|",
      ...shared.map(([t, o]) => `| ${cell(t)} | ${[...o.labs].join(", ")} | ${o.n} | ${pct(o.n - o.w, o.n)} |`), "");
  }

  L.push("## Every question kind, by experiment", "");
  for (const [id, lab] of labs) {
    const ks = [...R.byKind.values()].filter(k => k.lab === id).sort((a, b) => missRate(b) - missRate(a) || b.n - a.n);
    const seen = new Set(ks.map(k => k.kind));
    const variants = new Map(); for (const [t, k] of lab.kinds) variants.set(k, [...(variants.get(k) || []), t]);
    const never = [...variants].filter(([k]) => !seen.has(k)).map(([, ts]) => ts.join(" / "));
    L.push(`### ${id} ${lab.name}`, "");
    if (ks.length) L.push("| Question kind | Answers | Missed | Correct |", "|---|---|---|---|",
      ...ks.map(k => `| ${cell([...k.tags].join(" / "))}${k.kind ? "" : " *(not in the current game)*"} | ${k.n} | ${k.w} | ${pct(k.n - k.w, k.n)} |`));
    else L.push("No answers yet.");
    if (never.length) L.push("", `Never answered: ${never.join("; ")}`);
    L.push("");
  }

  if (R.other.size) {
    L.push("## Virtual Lab and PhET bench", "", "| Mode | Task | Answers | Correct |", "|---|---|---|---|",
      ...[...R.other.values()].sort((a, b) => missRate(b) - missRate(a) || b.n - a.n).map(o => `| ${o.mode} | ${cell(o.topic)} | ${o.n} | ${pct(o.n - o.w, o.n)} |`), "");
  }
  if (R.retired.length) L.push(`Rows marked *not in the current game* are tags the game no longer makes (renamed or removed); they are counted under their experiment.`, "");
  return L;
}

async function main() {
  let data;
  if (file) data = JSON.parse(fs.readFileSync(file, "utf8"));
  else { const r = await fetch(`${STATS_URL}?days=${days}`, { redirect: "follow" }); if (!r.ok) throw new Error("stats request failed: HTTP " + r.status); data = await r.json(); }
  const labs = gameKinds(), R = analyze(data, labs);
  if (!R.rows) { console.log("No lab practical answers in this window yet (none arrive from Do-Not-Track browsers or local copies)."); return; }
  const L = report(data, labs, R), out = path.join(ROOT, "item-analysis.md");
  fs.writeFileSync(out, L.join("\n") + "\n");
  console.log(L.slice(0, 3).join("\n"));
  const top = L.indexOf(L.find(l => l.startsWith("## Most-missed")));
  console.log(L.slice(top, top + 12).join("\n") + `\n\nReport written to ${out}`);
}
if (require.main === module) main().catch(e => { console.error("✗ " + e.message); process.exit(1); });
module.exports = { analyze, parseTopic };
