# Writing the script

The script is locked before footage or TTS: new numbers mean a re-shoot, new words mean
paid TTS. Present every draft as a table — **on screen | voice | why** — and let the user
edit words directly.

## Shape (20–30s)

| Beat | Job | Length |
|---|---|---|
| Hook | a feeling or question the viewer recognises — not a feature | 3s |
| Answer | name the product + the one idea, on the real UI | 5–6s |
| Demo 1 | the everyday action, one continuous take | 3–4s |
| Demo 2 | the consequence the product surfaces | 3s |
| Resolution | the fix, plus a 1–1.5s hold so it reads | 3.5–4s |
| Brand | name + promise + URL | 3–3.5s |

## Research targets (best-practices.md)
- Value proposition on screen by **3s**, hook resolved by 6s; the first 5s must work alone (YouTube Skip).
- **Say the brand by 5s**, while its logo is on screen.
- ≈ **150 wpm** ≈ 75 words per 30s. Count words; cut words rather than speeding the voice.
- End: brand + promise + **CTA on screen**; a spoken CTA with an offer ("Start free at …") is
  recommended by research — propose it, the user decides.
- One message per ad; plan 6 / 15 / 30s versions.

## Hooks — offer 5–7, the user picks
Write them in different registers so the choice is real:
- a relatable feeling: "Another day. Half the to-do list still there?" (the one picked)
- a plain question: "How much can you really get done today?"
- a statement with a timestamp: "Half your list. Still there at six."
- a visual cold open: "When this turns red, your day doesn't fit."
- a tagline-style promise: "Plan the day you actually have."
Then offer variations of the chosen one (word swaps, clipped vs question form).

**Never** open with a comparison to other products or "your to-do list doesn't know…" — the
user rejected comparison openers outright. **Avoid** stock AI phrasing: "seamless",
"unlock", "streamline", "not at 6 p.m." flourishes, rhetorical contrasts that add nothing.
Short, concrete, spoken like a person.

## Numbers must add up — in whole numbers
The viewer does the arithmetic. "Six hours between meetings, four and a half planned" was
heard as 6 + 4.5 = 10.5. Rules:
- whole numbers only (7h for work, 1h free, +2h → over by 1h);
- say what's LEFT, not two totals the ear will add;
- every number spoken must be the number on screen — seed the app so the real UI shows it,
  then re-shoot if the script changes the numbers.

## Spoken vs written
- Spell the brand for TTS ("aro dot day" — "aro.day" was read as "aro day") and add a
  `captionMerge` rule so subtitles show "aro.day".
- Write numbers as words in the voice line ("seven hours") and as figures on screen ("7h").

## Sync lines to events
A line that names an event must be heard just AFTER the event is visible ("Over by an
hour" after the meter turns red). Use a `lead` pad, computed from the measured mark, never
a guessed number. A payoff line ("Done.") gets a `tail` pad of 1–1.5s.

## Per-line delivery notes
Add a one-line delivery note per line in `SCRIPT.md` (weary → lift; crisp brand; two beats
then release). Speed 1.0.
