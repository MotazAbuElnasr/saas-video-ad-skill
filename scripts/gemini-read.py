#!/usr/bin/env python3
# Prints the model's text from an Antigravity conversation db (protobuf blobs): the longest UTF-8 string per step after the last user message.
# usage: gemini-read.py <conversation_id>   (called by gemini-ask.sh; works on any past conversation too)
import os, shutil, sqlite3, sys, tempfile

def strings_in(buf, out, depth=0):
    i = 0
    while i < len(buf) and depth < 12:
        key, i = varint(buf, i)
        if key is None: return
        wt = key & 7
        if wt == 0:
            _, i = varint(buf, i)
        elif wt == 1: i += 8
        elif wt == 5: i += 4
        elif wt == 2:
            n, i = varint(buf, i)
            if n is None or i + n > len(buf): return
            chunk = buf[i:i + n]; i += n
            try:
                s = chunk.decode("utf-8")
                if s.isprintable() or "\n" in s: out.append(s)
            except UnicodeDecodeError:
                pass
            strings_in(chunk, out, depth + 1)
        else:
            return

def varint(b, i):
    r = s = 0
    while i < len(b):
        c = b[i]; i += 1
        r |= (c & 0x7f) << s; s += 7
        if not c & 0x80: return r, i
        if s > 63: break
    return None, i

cid = sys.argv[1]
src = os.path.expanduser(f"~/.gemini/antigravity/conversations/{cid}.db")
tmp = tempfile.mkdtemp()
for ext in ("", "-wal", "-shm"):
    if os.path.exists(src + ext): shutil.copy(src + ext, os.path.join(tmp, cid + ".db" + ext))
db = sqlite3.connect(os.path.join(tmp, cid + ".db"))
rows = db.execute("select idx, step_type, status, step_payload from steps order by idx").fetchall()
last_user = max((r[0] for r in rows if r[1] == 14), default=-1)
for idx, typ, status, payload in rows:
    if idx <= last_user or not payload: continue
    found = []; strings_in(payload, found)
    found = [s for s in found if len(s) > 20]
    if found: print(f"--- step {idx} type {typ} status {status}\n{max(found, key=len)}")
