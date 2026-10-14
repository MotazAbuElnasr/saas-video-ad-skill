#!/usr/bin/env bash
# gemini-ask.sh <brief.md> <reply.md> [title] [model=pro|flash|flash_lite]
# Sends one brief to Gemini in the running Antigravity app (its own sign-in, no API key) as a NEW conversation,
# waits for the answer and writes the reply text to <reply.md>. How and when to use it: references/writers.md.
# Needs ANTIGRAVITY_PROJECT_ID = one of YOUR Antigravity projects (the `projectId` in
#   gemini-ask.sh --meta <conversation-id>   of any conversation you started in the app).
set -uo pipefail
S="$(cd "$(dirname "$0")" && pwd)"
LS=/Applications/Antigravity.app/Contents/Resources/bin/language_server

# agentapi talks to the app's local language server; its CSRF token is read from the process args (never printed).
agy() {
  local pid args out port
  pid=$(pgrep -f "language_server --standalone" | head -1)
  [ -z "$pid" ] && { echo "Antigravity is not running: open it first." >&2; return 1; }
  args=$(ps -o args= -p "$pid")
  export ANTIGRAVITY_CSRF_TOKEN=$(echo "$args" | sed -E 's/.*--csrf_token ([^ ]+).*/\1/')
  # the server listens on several ports and only one answers agentapi: try each
  for port in $(lsof -nP -a -p "$pid" -iTCP -sTCP:LISTEN 2>/dev/null | awk 'NR>1{split($9,a,":");print a[2]}'); do
    export ANTIGRAVITY_LS_ADDRESS="127.0.0.1:$port"
    out=$("$LS" agentapi "$@" 2>&1)
    echo "$out" | grep -qiE "connection refused|EOF|malformed|http: server gave" || { echo "$out"; return 0; }
  done
  return 1
}

if [ "${1:-}" = "--meta" ]; then agy get-conversation-metadata "$2" | grep -v -i token; exit; fi
[ $# -lt 2 ] && { sed -n '2,6p' "$0"; exit 2; }
[ -z "${ANTIGRAVITY_PROJECT_ID:-}" ] && { echo "Set ANTIGRAVITY_PROJECT_ID (see the header)." >&2; exit 2; }
BRIEF="$1"; REPLY="$2"; TITLE="${3:-brief}"; MODEL="${4:-pro}"

# new-conversation can hang: run it in the background, give it up to 60s to print the id, then stop it
agy new-conversation --model="$MODEL" --title="$TITLE" "$(cat "$BRIEF")" > "$REPLY.start" 2>&1 & p=$!
for _ in $(seq 1 30); do sleep 2; grep -q '"conversationId"' "$REPLY.start" && break; done
kill $p 2>/dev/null
cid=$(grep -o '"conversationId": "[^"]*"' "$REPLY.start" | cut -d'"' -f4)
[ -z "$cid" ] && { echo "No conversation started:"; cat "$REPLY.start"; exit 1; }
rm -f "$REPLY.start"

# step status 3 = finished. A last step with status 8 = it stopped (capacity, or a tool it tried): retry in a new conversation
for _ in $(seq 1 50); do
  sleep 6
  out=$(python3 -I "$S/gemini-read.py" "$cid" 2>&1)
  echo "$out" | grep -q "status 3$" && break
done
echo "$out" > "$REPLY"
echo "cid=$cid -> $REPLY"
