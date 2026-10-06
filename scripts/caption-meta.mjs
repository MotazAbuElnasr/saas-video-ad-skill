// Writes audio_meta.captions.json for captions.mjs. The voice is fed TTS-friendly
// spellings ("aro dot day" so the dot is pronounced) but subtitles must show the brand
// as written ("aro.day"). config.captionMerge = [{ spoken: ['aro','dot','day'], show: 'aro.day' }]
// Run (cwd = project root): node <skill>/scripts/caption-meta.mjs
//   then: captions.mjs build --audio-meta ./audio_meta.captions.json ...
import { readFileSync, writeFileSync } from 'node:fs';
import { config } from './timing.mjs';

const meta = JSON.parse(readFileSync('audio_meta.json', 'utf8'));
const bare = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
const rules = config.captionMerge ?? [];
for (const v of meta.voices) {
  const out = [];
  for (let i = 0; i < v.words.length; i++) {
    const rule = rules.find((r) => r.spoken.every((s, k) => v.words[i + k] && bare(v.words[i + k].text) === bare(s)));
    if (!rule) { out.push(v.words[i]); continue; }
    const last = v.words[i + rule.spoken.length - 1];
    const trailing = last.text.match(/[^a-z0-9]+$/i)?.[0] ?? ''; // keep "day." → "aro.day."
    out.push({ ...v.words[i], text: rule.show + trailing, end: last.end });
    i += rule.spoken.length - 1;
  }
  v.words = out;
}
writeFileSync('audio_meta.captions.json', JSON.stringify(meta, null, 2));
console.log(`✓ caption-meta: ${rules.length} merge rule(s) → audio_meta.captions.json`);
