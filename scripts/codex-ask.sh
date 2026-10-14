#!/usr/bin/env bash
# codex-ask.sh <brief.md> <reply.md> [extra codex args…]
# One fresh, read-only Codex session per brief (a blind second reviewer); the final answer goes to <reply.md>.
# It may read files next to the brief (its working dir), never write. How and when: references/writers.md.
set -euo pipefail
[ $# -lt 2 ] && { sed -n '2,4p' "$0"; exit 2; }
BRIEF="$1"; REPLY="$2"; shift 2
# </dev/null: without it codex exec waits on stdin forever
codex exec --skip-git-repo-check --ephemeral -s read-only -C "$(cd "$(dirname "$BRIEF")" && pwd)" \
  -o "$REPLY" "$@" "$(cat "$BRIEF")" < /dev/null > "$REPLY.log" 2>&1
echo "-> $REPLY (log: $REPLY.log)"
