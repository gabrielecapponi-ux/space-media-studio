/** Reproduce both active posters from the same geometry as the running film.
 * Run: node scripts/export-funding-journey.mjs
 * No network, font, renderer or external artwork is needed.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fundingJourneySvg } from '../src/funding-journey.js';

const root = new URL('../', import.meta.url);
const sha256 = value => createHash('sha256').update(value).digest('hex');
const master = await readFile(new URL('src/funding-journey.js', root));
const exports = [
  ['public/images/funding-journey.svg', false, 1600, 900],
  ['public/images/funding-journey-mobile.svg', true, 800, 1000],
];
const assets = [];
for (const [path, portrait, width, height] of exports) {
  const body = `${fundingJourneySvg(portrait, true)}\n`;
  await writeFile(new URL(path, root), body);
  assets.push({ path, width, height, bytes: Buffer.byteLength(body), sha256: sha256(body) });
}
const output = new URL('outputs/iphone-funding-20261109/funding/', root);
await mkdir(output, { recursive: true });
await writeFile(new URL('asset-manifest.json', output), `${JSON.stringify({
  master: 'src/funding-journey.js', masterSha256: sha256(master),
  recipe: 'node scripts/export-funding-journey.mjs',
  artwork: 'Original Space Media SVG: bulb, collaboration, application dossier, civic building',
  palette: { paper: '#dfff00', ink: '#101110' },
  motion: { seconds: 22, staticPoster: 'Complete overview, also used without JavaScript' },
  previous: 'Git history and outputs/iphone-funding-20261109/funding/before/',
  assets,
}, null, 2)}\n`);
console.log(JSON.stringify({ master: 'src/funding-journey.js', assets }));
