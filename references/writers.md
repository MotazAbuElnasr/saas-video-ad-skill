# Writers and second opinions: Gemini and Codex

Two outside models help with ads, each from its own session so it sees only the brief:

| Who | For | How |
|---|---|---|
| **Gemini Pro** in the Antigravity app | writing scripts, above all in another language or dialect (Egyptian Arabic, etc.) and comedy | `scripts/gemini-ask.sh` (the app's own sign-in, no API key) |
| **Codex** (`codex` CLI) | a blind reviewer: scores or critiques a script, a caption, a storyboard | `scripts/codex-ask.sh` (read-only, nothing saved between runs) |
| Gemini API (paid key) | hearing the voice takes (`listen.mjs`) and TTS (`gemini-voice.mjs`) | the `gemini-api-key` keychain item |

Use them only where the user wants them, and say which one wrote what.

## Rules learned the hard way

- **One writer per script, used verbatim.** When the user picks Gemini's script, its lines, its picture
  descriptions (they ARE the animation and edit plan) and its SFX all stand. Don't pass it through a
  second model "to polish": Codex once rewrote a Gemini episode and the user threw the result out.
- **A brief gives facts, not lines.** The series, the topic, the audience, the format, the length, the
  pace, and the product's REAL features (say "nothing else may be attributed to it"). When the user wants
  the writer's own ideas, add nothing else: no example jokes, no structure ("ابدع").
- **Review = name the problems, never write the fix.** Send the writer back its problems (a line about a
  feature the app doesn't have, music in an SFX column, a tip that's in the notes but never spoken) and
  let it rewrite. Your own phrasing in a critique leaks into the next draft, and users spot it.
- **A new conversation per brief.** Follow-ups in an old one drift toward the old draft.
- **Show the user before voicing or building.** Number the options so they can pick by number.

## Gemini in Antigravity: `gemini-ask.sh`

Setup, once:
1. Install Antigravity, sign in, keep the app open (the script talks to its local server).
2. Start any conversation in the app, then read its metadata to get your project id:
   `bash scripts/gemini-ask.sh --meta <conversation-id>` → the `"projectId"` field.
   (A conversation id is the file name in `~/.gemini/antigravity/conversations/`.)
3. `export ANTIGRAVITY_PROJECT_ID=<that id>` (your own; never commit it).

Then: `bash scripts/gemini-ask.sh brief.md reply.md "title" [pro|flash|flash_lite]` → ~1–4 min.
`python3 -I scripts/gemini-read.py <cid>` re-reads any past conversation.

Gotchas:
- **Start every brief with the language and a no-tools line**, e.g. «رد بالعامية المصرية بس، والرد كله
  هنا في الشات. متستخدمش أي أدوات ومتكتبش ملفات.» Without it Gemini sometimes answers in English or
  as an outline, or starts running tools in whatever workspace the project has open.
- **Don't ask it to write a file.** It may write into the open workspace, or not at all. The reply is read
  from its conversation database.
- **Garbled, English, or stopped** (the last step shows `status 8`): start a NEW conversation with the
  same brief. `MODEL_CAPACITY_EXHAUSTED`: wait, or use `flash`.
- The reader keeps strings over 20 characters, so a one-word reply ("ok") comes back as an id. Briefs
  that ask for real text are fine.
- It is an undocumented local API (`language_server agentapi`), so an app update can break it. The
  script prints the server's error; check `agentapi --help` for renamed commands.

## Codex: `codex-ask.sh`

`bash scripts/codex-ask.sh brief.md reply.md [--model …]` → a fresh, read-only session in the brief's
folder (put any file it should read next to the brief); the final answer is written to `reply.md`, the
full log to `reply.md.log`.

- `</dev/null` is built in: without it `codex exec` waits on stdin forever.
- Good jobs: "score these 5 hooks 1–10 for a cold scroller, one line each", "list every claim in this
  script the app's feature list doesn't support". Bad job: rewriting another writer's script.
- Each run is ephemeral: give it everything in the brief (the script, the feature list, the audience).
