// Self-check for the one-take cutter (gemini-voice.mjs): node scripts/check-split.mjs → "ok" or a throw.
// Pins the two bugs that shipped: a pause log read from the wrong stream (none parsed → guessed
// cuts), and a cut snapped to an in-line pause instead of the paragraph break.
import assert from 'node:assert/strict';
import { parseSilences, splitFrom } from './gemini-voice.mjs';

// ffmpeg's silencedetect lines (what stderr carries)
const log = `[silencedetect @ 0x1] silence_start: 2.6676
[silencedetect @ 0x1] silence_end: 3.2832 | silence_duration: 0.6156
[silencedetect @ 0x1] silence_start: 4.10
[silencedetect @ 0x1] silence_end: 4.30 | silence_duration: 0.2
[silencedetect @ 0x1] silence_start: 6.264
[silencedetect @ 0x1] silence_end: 7.3738 | silence_duration: 1.11`;
const sil = parseSilences(log);
assert.equal(sil.length, 3);
assert.deepEqual(sil[0], { start: 2.6676, end: 3.2832 });

// three lines; Whisper's word ends run late (a word "ends" inside the pause after it)
const lines = [['Ten', 'tasks.'], ['plans', 'it', 'in', 'one', 'click.'], ['Give', 'hours.']];
const w = (start, end) => ({ start, end });
const al = [w(0.2, 0.6), w(0.6, 2.9), /* line 2 */ w(3.3, 3.6), w(3.6, 3.9), w(3.9, 4.12), w(4.3, 4.8), w(4.8, 6.9), /* line 3 */ w(7.4, 7.9), w(7.9, 8.6)];
const cuts = splitFrom(al, lines, sil);
assert.equal(cuts.length, 2);
assert.ok(cuts[0] > 2.66 && cuts[0] < 3.29, `cut 1 inside the first paragraph pause, got ${cuts[0]}`);
assert.ok(cuts[1] > 6.26 && cuts[1] < 7.38, `cut 2 inside the long pause (not the 0.2s one in line 2), got ${cuts[1]}`);
console.log('ok', cuts);
