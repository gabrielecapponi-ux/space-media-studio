import { copyFileSync, lstatSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const defaultRoot = fileURLToPath(new URL('../', import.meta.url));
const assetPattern = /(?:films|images|models|fonts|showcase)\/[A-Za-z0-9_./-]+\.(?:mp4|webm|jpg|jpeg|webp|png|svg|glb|woff2|ttf|html|css|js|txt)\b/g;

function safePath(root, name) {
  if (typeof name !== 'string' || !name || name.includes('\\') || name.split('/').some(part => !part || part === '.' || part === '..') || isAbsolute(name)) {
    throw new Error(`Unsafe asset path: ${name}`);
  }
  const path = resolve(root, name);
  for (let current = path; current !== root; current = dirname(current)) {
    if (lstatSync(current).isSymbolicLink()) throw new Error(`Symlink is not an asset: ${name}`);
  }
  if (!lstatSync(path).isFile()) throw new Error(`Asset is not a file: ${name}`);
  return path;
}

/** Follow the site's explicit HTML and JS imports, including lazy imports. */
export function activeSources(root, entries) {
  const visited = new Set();
  const pending = [...entries];
  while (pending.length) {
    const name = pending.pop();
    if (visited.has(name)) continue;
    const path = safePath(root, name);
    visited.add(name);
    const source = readFileSync(path, 'utf8');
    const imports = name.endsWith('.js')
      ? [...source.matchAll(/(?:import\s*(?:[^;\n]*?\sfrom\s*)?|import\s*\()\s*['"]([^'"]+)['"]/g)].map(match => match[1])
      : name.endsWith('.html')
        ? [...source.matchAll(/(?:src|href)=['"]([^'"]+\.(?:js|css))['"]/g)].map(match => match[1])
        : [...source.matchAll(/@import\s+['"]([^'"]+)['"]/g)].map(match => match[1]);
    for (const imported of imports) {
      if (imported.startsWith('/src/')) pending.push(imported.slice(1));
      else if (imported.startsWith('.')) {
        const dependency = relative(root, resolve(dirname(path), imported)).split(sep).join('/');
        pending.push(dependency);
      }
    }
  }
  return [...visited].sort();
}

export function inspectActiveAssets(root = defaultRoot) {
  root = resolve(root);
  const manifest = JSON.parse(readFileSync(resolve(root, 'config/agency-assets.json'), 'utf8'));
  if (manifest.version !== 1 || !Array.isArray(manifest.files) || !Array.isArray(manifest.entrypoints) || !Array.isArray(manifest.dynamicReferences)) throw new Error('Unsupported active asset manifest.');
  const allowed = new Set(manifest.files);
  if (allowed.size !== manifest.files.length) throw new Error('Duplicate asset paths in manifest.');
  const publicRoot = resolve(root, 'public');
  let bytes = 0;
  for (const name of manifest.files) bytes += lstatSync(safePath(publicRoot, name)).size;
  const sources = activeSources(root, manifest.entrypoints);
  // Standalone demo files are served directly, outside Vite's import graph.
  sources.push(...manifest.files.filter(name => /\.(html|css|js)$/.test(name)).map(name => `public/${name}`));
  for (const name of sources) {
    const source = readFileSync(resolve(root, name), 'utf8');
    for (const match of source.matchAll(assetPattern)) {
      if (!allowed.has(match[0])) throw new Error(`Asset referenced by ${name} is missing from manifest: ${match[0]}`);
    }
    // The unbundled showcase uses paths such as ./phase-01/hero.webp.
    if (name.startsWith('public/')) {
      for (const match of source.matchAll(/['"]((?:\.\.?\/)[^'"\s<>]+\.(?:mp4|webm|jpg|jpeg|webp|png|svg|glb|woff2|ttf|html|css|js))(?:[?#][^'"]*)?['"]/g)) {
        const target = relative(publicRoot, resolve(root, dirname(name), match[1])).split(sep).join('/');
        if (!allowed.has(target)) throw new Error(`Asset referenced by ${name} is missing from manifest: ${target}`);
      }
    }
    for (const template of source.matchAll(/`([^`]*(?:films|images|models|fonts|showcase)\/[^`]*\$\{[^`]+)`/g)) {
      if (!manifest.dynamicReferences.some(item => item.source === name && template[1].includes(item.expression))) {
        throw new Error(`Unreviewed dynamic asset reference in ${name}: ${template[1]}`);
      }
    }
  }
  for (const item of manifest.dynamicReferences) {
    if (!sources.includes(item.source) || !readFileSync(resolve(root, item.source), 'utf8').includes(item.expression)) throw new Error(`Stale dynamic asset declaration: ${item.source}`);
    if (!item.files?.length || item.files.some(name => !allowed.has(name))) throw new Error(`Dynamic asset variants missing from manifest: ${item.source}`);
  }
  return { manifest, sources, files: manifest.files.length, bytes };
}

export function activeAssetsPlugin() {
  let config;
  let inventory;
  let failed = false;
  return {
    name: 'space-media-active-assets',
    apply: 'build',
    configResolved(value) {
      config = value;
      const output = resolve(config.root, config.build.outDir);
      const publicRoot = resolve(config.root, 'public');
      const publicRelative = relative(publicRoot, output);
      const rootRelative = relative(output, config.root);
      if (!publicRelative || (!publicRelative.startsWith(`..${sep}`) && publicRelative !== '..' && !isAbsolute(publicRelative)) || !rootRelative || (!rootRelative.startsWith(`..${sep}`) && rootRelative !== '..' && !isAbsolute(rootRelative))) {
        throw new Error('Build output must not overwrite public assets or contain the source root.');
      }
    },
    buildStart() { inventory = inspectActiveAssets(config.root); },
    buildEnd(error) { failed = Boolean(error); },
    closeBundle() {
      if (failed) return;
      const output = resolve(config.root, config.build.outDir);
      const publicRoot = resolve(config.root, 'public');
      // Revalidate before copying if an asset changed during the build.
      inventory = inspectActiveAssets(config.root);
      for (const name of inventory.manifest.files) {
        const target = resolve(output, name);
        mkdirSync(dirname(target), { recursive: true });
        copyFileSync(safePath(publicRoot, name), target);
      }
      console.log(`Active public assets: ${inventory.files} files, ${(inventory.bytes / 1024 / 1024).toFixed(2)} MiB. Historical sources preserved in public/.`);
    },
  };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const { files, bytes, sources } = inspectActiveAssets();
  console.log(JSON.stringify({ files, bytes, sources }, null, 2));
}
