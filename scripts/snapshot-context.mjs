import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const paths = ['AGENTS.md', 'LINK-SITES.md'];
function collect(relative) {
  if (!existsSync(join(root, relative))) return;
  for (const entry of readdirSync(join(root, relative), { withFileTypes: true })) {
    const path = `${relative}/${entry.name}`;
    // Work contains private creative masters, not the operational context.
    if (path === '.agency/work') continue;
    if (entry.isDirectory()) collect(path);
    else if (entry.isFile() && entry.name.endsWith('.md')) paths.push(path);
  }
}
collect('.agency');
const createdAt = new Date().toISOString();
const destination = join(root, 'outputs/context-backups', createdAt.replaceAll(':', '-'));
mkdirSync(destination, { recursive: true });
const files = [];
for (const path of paths.sort()) {
  if (!existsSync(join(root, path))) continue;
  const bytes = readFileSync(join(root, path));
  const target = join(destination, path);
  mkdirSync(dirname(target), { recursive: true });
  // Write the bytes we hashed, even if another chat updates the source meanwhile.
  writeFileSync(target, bytes, { flag: 'wx' });
  const sha256 = createHash('sha256').update(bytes).digest('hex');
  if (createHash('sha256').update(readFileSync(target)).digest('hex') !== sha256) {
    throw new Error(`Snapshot verification failed: ${path}`);
  }
  files.push({ path, bytes: bytes.length, sha256 });
}
writeFileSync(join(destination, 'manifest.json'), JSON.stringify({ createdAt, scope: 'Local operational Markdown context; excludes creative masters and credentials.', files }, null, 2) + '\n');
console.log(`Saved and verified ${files.length} context files: ${destination}`);
