// Run after assemble-index.mjs. The assembler appends hoisted frame videos after the
// scene hosts, so footage paints OVER each frame's DOM and overlay text is hidden.
// Lifting the scene hosts above the videos keeps footage full-screen underneath and the
// frame's overlays on top (footage frames are built with no background).
// Run (cwd = project root): node <skill>/scripts/post-assemble.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const p = 'index.html';
let html = readFileSync(p, 'utf8');
const marker = '/* post-assemble: scenes above hoisted footage */';
if (html.includes(marker)) {
  console.log('· post-assemble: already applied');
} else {
  const next = html.replace(/(\.scene\s*\{)/, `$1\n        ${marker}\n        z-index: 2;`);
  if (next === html) throw new Error('post-assemble: no .scene rule in index.html — did assemble-index change?');
  writeFileSync(p, next);
  console.log('✓ post-assemble: scenes lifted above hoisted footage');
}
