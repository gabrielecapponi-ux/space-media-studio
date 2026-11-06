#!/usr/bin/env node
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {renderMenuBoardSection} from '../src/menu-board.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/** Replace only this section; preserve surrounding source and nested sections. */
export function replaceMenuBoardSection(html, section) {
  const openings = [...html.matchAll(/<section\b(?=[^>]*\bid\s*=\s*["']menu-board["'])[^>]*>/g)];
  if (openings.length !== 1) throw new Error('Expected exactly one section#menu-board.');
  const start = openings[0].index;
  const tags = /<\/?section\b[^>]*>/g;
  tags.lastIndex = start;
  let depth = 0;
  for (let tag = tags.exec(html); tag; tag = tags.exec(html)) {
    depth += tag[0].startsWith('</') ? -1 : 1;
    if (depth === 0) return html.slice(0, start) + section.trim() + html.slice(tags.lastIndex);
  }
  throw new Error('section#menu-board has no matching closing tag.');
}

async function run(args) {
  const products = JSON.parse(await readFile(path.join(root, 'data/menu.json'), 'utf8'));
  const section = renderMenuBoardSection(products);
  const outputPath = path.join(root, 'outputs/menu-board-section.html');
  if (!args.includes('--stdout')) {
    await mkdir(path.dirname(outputPath), {recursive:true});
    await writeFile(outputPath, section + '\n');
  }
  if (args.includes('--write')) {
    const indexPath = path.join(root, 'index.html');
    const html = await readFile(indexPath, 'utf8');
    const next = replaceMenuBoardSection(html, section);
    if (next !== html) await writeFile(indexPath, next);
  }
  if (args.includes('--stdout')) process.stdout.write(section + '\n');
  else console.log(`Rendered ${products.length} menu-board rows → outputs/menu-board-section.html${args.includes('--write') ? ' and index.html' : ''}`);
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) {
  await run(process.argv.slice(2));
}
