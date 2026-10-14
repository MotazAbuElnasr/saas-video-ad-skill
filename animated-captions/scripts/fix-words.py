# fix-words.py <project-dir> — audio.json + fixes.json → words.json
# fixes.json = [["source words", "target words"], ...] applied IN SPOKEN ORDER, each matched after the previous one.
#   target prefixes: "!" = emphasis colour, "^" = force a new caption at this word.
#   1:1 word swaps keep the real per-word timings; N:M rewrites spread the span evenly.
# Run: python3 -I fix-words.py <dir>   (prints the corrected line: ‖ = forced break, * = emphasis)
import json, sys, os

d = sys.argv[1]
src = [w for s in json.load(open(os.path.join(d, "audio.json")))["segments"] for w in s["words"]]
for i, w in enumerate(src):  # alignment leaves some words untimed: borrow the neighbours' edges
    if "start" not in w:
        w["start"] = src[i - 1]["end"] if i else 0
        w["end"] = next((x["start"] for x in src[i + 1:] if "start" in x), w["start"] + 0.3)
fixes = json.load(open(os.path.join(d, "fixes.json"))) if os.path.exists(os.path.join(d, "fixes.json")) else []

toks = [w["word"] for w in src]
out, i = [], 0
plain = lambda ws: [{"w": w["word"], "s": round(w["start"], 3), "e": round(w["end"], 3)} for w in ws]
for a, b in fixes:
    a = a.split(); n = len(a)
    j = next((k for k in range(i, len(toks)) if toks[k:k + n] == a), None)
    if j is None:
        sys.exit(f"fix not found after word #{i}: {' '.join(a)!r} — check spelling/order against audio.json")
    out += plain(src[i:j])
    seg, B = src[j:j + n], b.split()
    s0, e0 = seg[0]["start"], seg[-1]["end"]
    for m, t in enumerate(B):
        s, e = (seg[m]["start"], seg[m]["end"]) if len(B) == n else (s0 + (e0 - s0) * m / len(B), s0 + (e0 - s0) * (m + 1) / len(B))
        w = {"w": t.lstrip("!^"), "s": round(s, 3), "e": round(e, 3)}
        if "!" in t[:2]: w["key"] = True
        if t.startswith("^"): w["br"] = True
        out.append(w)
    i = j + n
out += plain(src[i:])
json.dump(out, open(os.path.join(d, "words.json"), "w"), ensure_ascii=False, indent=0)
print(" ".join(("‖" if w.get("br") else "") + ("*" if w.get("key") else "") + w["w"] for w in out))
