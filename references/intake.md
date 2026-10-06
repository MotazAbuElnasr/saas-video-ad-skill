# Intake — the questions, asked once

Ask these before writing anything. Plain text with lettered options (A/B/C…) — a popup
question UI got dismissed twice in the session this skill came from. Recommend one option
per question and say why in one line. If the user already answered something, don't ask it.
End with a summary that separates **what they said** from **what you inferred** — the
inferred list is where corrections happen.

## 1. Product and the one idea
- What's the product, and where does it run? (repo path → film the production build; public URL → `site` mode, public pages only)
- What ONE thing should a viewer remember? One ad = one idea. Several ideas → several ads (offer a series).
- Who is it for? Keep copy industry-neutral unless the product isn't.

## 2. Storyline / script — theirs first
- Do you have a script, storyline, or key lines? → **verbatim** (segment it into beats, don't change words) or **restructure** (use as source material).
- None → you draft it (see `script.md`) and offer 5–7 hook variants to pick from.
- Any must-say lines, numbers, or claims? Any words to avoid?

## 3. Format
- Where will it run? A) YouTube / site embed 16:9 · B) LinkedIn / X feed 1:1 · C) Shorts / Reels / TikTok 9:16 · D) several
- Length? Default 20–30s. Ads under 15s carry one beat; over 40s need a second idea.

## 4. Style
Offer three, with the reason each fits; let them pick or describe their own:
- **A) Product brand** — the app's own theme tokens (read them from the codebase: CSS variables / theme file). Usually the right call.
- **B) A HyperFrames preset** — e.g. `broadside` (huge bold type, flat two-colour, CircleCI-like), `creative-mode` (neo-brutalist), `blue-professional` (calm, executive). Show the preset's `frame-showcase.html` if they want to see it.
- **C) Reference ads** — "like CircleCI's ads", "like Linear's launch videos": ask what they like about it (pace? type? colour?) and map that to A/B.

## 5. Colours
- A) From the app (recommended: read the real hex from the theme — never from memory)
- B) Their hex values: ink / background, text, accent, alert (for a red state), muted
- C) The preset's palette
Check: text on the accent colour passes contrast (ink-on-blue failed at ~3:1 once; use light text).

## 6. Voice
- On or off? (Off = music + SFX + captions only.)
- Provider: HeyGen (signed in; better voices) or Kokoro (offline). Run `npx hyperframes auth status` and show it.
- Gender / tone / a named voice. List 3 matching voices with their one-line descriptions; recommend one.
- Speed: default **1.0**. 1.12 sounded rushed and "AI-ish".
- Brand pronunciation: how is the name said? Spell it for TTS ("aro dot day").

## 7. Sound
- A) Ambient bed + a few UI sounds (recommended — calm, premium; the voice carries the energy)
- B) Driving music track (energetic; fights the voice more)
- C) SFX only / D) silent

## 8. Subtitles, brand, ending
- Subtitles on? (Default yes — many ads play muted.)
- Brand on screen throughout? (Default: corner logo on non-app frames; the app's own logo shows in footage.)
- End card: line + URL/CTA; background ink (default) or accent fill?
- Spoken CTA? Research says say it + show it, ideally with an offer ("Start free at …"). Default: propose it; the user decides.
- Formats: research says ship 16:9 + 9:16 + 1:1 (vertical lifted Shorts view rate > 40%). Only 16:9 is built today — say so.
- Thumbnail: frame 0 is composed as the thumbnail by default — any preference for what it shows?

## 9. Run shape
- Review the storyboard (and an optional sketch sheet) before building? (Default yes.)
- How many variations / angles? Build the first, get notes, then the rest reuse the pipeline.

## The confirmation
"Here's the brief: [what you said] · [what I inferred — correct anything]". Build only after yes.
