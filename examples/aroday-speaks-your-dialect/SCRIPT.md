# SCRIPT — aroday-speaks-your-dialect (Arabic)

**Voice:** Charon (Gemini TTS) — the user's pick; Gemini speaks Arabic.
**Voice settings:** style prompt in ad.config.mjs (Egyptian Arabic, confident and friendly, lightly upbeat; the brand said in English). saidAs feeds TTS "arrow dot day" for «أرو دوت داي».
**Language:** ar (RTL subtitles; Whisper's multilingual model for timings).
Spoken brand is written "أرو دوت داي" (aro dot day); subtitles show aro.day.

Facts the lines rely on (the real app, Arabic UI, catppuccin-latte theme): typing
«مكالمة العميل بكرة ٣ العصر لمدة ساعة» creates the card «مكالمة العميل» scheduled tomorrow 15:00
with a one-hour estimate (quick-parse-ar.ts: بكرة/بكره/بكرا/باكر/باچر/غدا, العصر, لمدة ساعة —
Egyptian, Gulf, Levantine, Maghrebi words and MSA).

English gloss per line is in brackets — not spoken.

---

## Line 1 — Hook (Frame 1)

**Delivery:** A light, knowing question.

    بتكتب «بكرة» ولا «غدًا»؟

[Do you write "bukra" or "ghadan"?]

## Line 2 — Brand (Frame 2)

**Delivery:** Confident, a smile.

    أرو دوت داي فاهم الاتنين.

[aro.day understands both.] — at a sentence start TTS garbled the brand 7 of 7 single takes: it is recorded as its own segment and joined (regen-line.mjs "arrow dot day. || فاهم الاتنين.").

## Line 3 — Type it (Frame 3)

**Delivery:** Reading what's typed, as it's typed.

    اكتب زي ما بتتكلم: مكالمة العميل، بكرة، تلاتة العصر، لمدة ساعة.

[Type like you talk: client call, tomorrow, three in the afternoon, for an hour.]

## Line 4 — Payoff (Frame 4)

**Delivery:** Satisfied.

    اتحطت على بكرة الساعة تلاتة، ومدتها ساعة.

[It's set for tomorrow at three, an hour long.]

## Line 5 — Dialects (Frame 5)

**Delivery:** A quick, proud list.

    مصري، خليجي، شامي، مغربي، أو فصحى. كله مفهوم.

[Egyptian, Gulf, Levantine, Maghrebi, or MSA. All understood.]

## Line 6 — CTA (Frame 6)

**Delivery:** Warm, final.

    ابدأ مجانًا على أرو دوت داي.

[Start free at aro.day.]
