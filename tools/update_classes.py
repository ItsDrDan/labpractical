#!/usr/bin/env python3
"""Refresh classes.js: other FCC CHEM 3A professors' lab lists, read from their PUBLIC syllabi
in FCC's Simple Syllabus library. Run on your own computer each semester:

    python3 tools/update_classes.py

Simple Syllabus blocks cloud servers (GitHub Actions), so this isn't automatic; Claude can also
refresh it by reading Simple Syllabus in your browser. Nothing needs a login.

How labs are found: a syllabus line like "Exp 4b", "Expt 7a" or "Exp. #6 Determination of the Gas
Constant R" (some professors number labs their own way, so lab names are matched too). For each
professor the newest fall/spring syllabus is used (summer schedules are squeezed, so they're skipped).
Dr. Dan's sections are hand-checked in SECTIONS inside index.html, so his syllabi are skipped here.
"""
import json, re, sys, time, urllib.request
from html import unescape
from pathlib import Path

BASE = "https://fresnocitycollege.simplesyllabus.com"
SKIP_INSTRUCTORS = {"Kwasniewski"}
OUT = Path(__file__).resolve().parent.parent / "classes.js"
TERM_NAME = {"SP": "Spring", "SU": "Summer", "FA": "Fall"}
TERM_ORDER = {"SP": 1, "SU": 2, "FA": 3}

# Lab Manual id -> other names professors use for it (regex)
NAMES = {
    "0a": r"Lab Exploration", "1a": r"Making Measurements|Measurements", "2a": r"Atomic Mass",
    "3a": r"Electrons in (?:an )?Atoms?|Spectroscop", "3z": r"Found or Forgery", "4a": r"Constant Composition",
    "4b": r"Rolling (?:for )?Compound|Compounds and Naming", "5a": r"Empirical Formula",
    "6a": r"Molecular Model|Lewis Structures", "7a": r"Calorimetry", "8a": r"Gas Constant|Ideal Gas Constant",
    "9a": r"Solutions and Dilutions|Dilutions", "10a": r"Types of Reactions", "11a": r"Alum",
    "12a": r"pH of Household|Household|Acids and Bases", "12b": r"Citric Acid|Titration",
}
# "Exp"/"Expt"/"Experiment" followed by a space, dot, # or digit (so "Expect"/"Experiments" don't count),
# then either the Lab Manual id or the lab's name within 40 characters.
LAB_RE = {i: re.compile(r"Exp(?:t|eriment)?(?=[\s.#:0-9])(?:\.?\s*" + i + r"(?![0-9a-z])|.{0,40}?(?:" + n + "))", re.I)
          for i, n in NAMES.items()}


def get_json(path):
    req = urllib.request.Request(BASE + path, headers={"User-Agent": "itsdrdan-station-rotation/1.0", "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def strings(o):
    if isinstance(o, str): yield o
    elif isinstance(o, dict):
        for v in o.values(): yield from strings(v)
    elif isinstance(o, list):
        for v in o: yield from strings(v)


def plain(h):
    return re.sub(r"\s+", " ", unescape(re.sub(r"<[^>]+>", " ", h))).strip()


def find_labs(text):
    return [i for i, rx in LAB_RE.items() if rx.search(text)]


def term_key(t):
    return (int(t[:4]), TERM_ORDER.get(t[4:], 0)) if re.match(r"\d{4}[A-Z]{2}$", t or "") else (0, 0)


def main():
    docs, seen = [], set()
    for page in range(1, 30):
        res = get_json(f"/api2/doc-library-search?search=CHEM%203A&page={page}")
        items = res.get("items") or []
        if not items: break
        for it in items:
            if it.get("code") in seen or not re.match(r"CHEM 3A\b", it.get("title", "")): continue
            if (it.get("term_name") or "").endswith("SU"): continue
            seen.add(it["code"]); docs.append(it)
        time.sleep(0.3)
    if not docs: sys.exit("No public CHEM 3A syllabi found; leaving classes.js alone.")
    newest = max(term_key(d["term_name"]) for d in docs)
    oldest_ok = (newest[0] - 1, newest[1])  # only professors who taught 3A in about the last year

    profs = {}
    for d in sorted(docs, key=lambda d: term_key(d["term_name"]), reverse=True):
        eds = [e.get("last_name") for e in d.get("editors") or [] if e.get("last_name")]
        if not eds or SKIP_INSTRUCTORS & set(eds) or term_key(d["term_name"]) < oldest_ok: continue
        full = get_json(f"/api2/doc-full-page-get?code={d['code']}"); time.sleep(0.3)
        labs = find_labs(plain(" \n ".join(strings(full))))
        sec = d["title"].split()[-1]
        for e in eds:
            p = profs.setdefault(e, {"term": d["term_name"], "sections": [], "labs": set(), "code": d["code"]})
            if p["term"] != d["term_name"]: continue  # older term for this professor
            p["sections"].append(sec); p["labs"].update(labs)

    order = list(NAMES)
    out = []
    for last, p in sorted(profs.items(), key=lambda kv: (-term_key(kv[1]["term"])[0], -term_key(kv[1]["term"])[1], kv[0])):
        if not p["labs"]:
            print(f"  {last}: no labs found in the syllabus, skipped (students can still choose labs)"); continue
        out.append({"key": re.sub(r"[^a-z]", "", last.lower()), "name": f"Professor {last}",
                    "term": f"{TERM_NAME.get(p['term'][4:], '')} {p['term'][:4]}", "sections": sorted(set(p["sections"])),
                    "syllabus": f"{BASE}/en-US/doc/{p['code']}", "labs": sorted(p["labs"], key=order.index)})
        print(f"  {last} ({p['term']}): {', '.join(out[-1]['labs'])}")

    js = OUT.read_text(encoding="utf-8")
    body = "\n".join("    " + json.dumps(o, ensure_ascii=False) + ("," if i < len(out) - 1 else "") for i, o in enumerate(out))
    new = re.sub(r"window\.SR_CLASSES = \{.*?\n\};", "window.SR_CLASSES = {\n  updated: '" + time.strftime("%Y-%m-%d") +
                 "',\n  source: '" + BASE + "/en-US/syllabus-library',\n  profs: [\n" + body + "\n  ]\n};", js, flags=re.S)
    OUT.write_text(new, encoding="utf-8")
    print(f"Saved {len(out)} professors to {OUT.name}. Check it, then push the labpractical repo.")


if __name__ == "__main__":
    main()
