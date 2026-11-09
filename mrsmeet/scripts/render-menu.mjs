#!/usr/bin/env node
// Render only products supported by data/menu.json. Run with --write to replace
// the existing menu section in index.html; without it, emit a reviewable partial.
// --stdout returns HTML without touching index.html, outputs or source data.
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
if (args.some(arg => !['--write','--stdout'].includes(arg)) || args.includes('--write') && args.includes('--stdout')) {
  throw new Error('Usage: node scripts/render-menu.mjs [--write | --stdout]');
}
const products = JSON.parse(await readFile(path.join(root, 'data/menu.json'), 'utf8'));
// Presentation metadata never overrides catalog names, ingredients or prices.
const presentation = JSON.parse(await readFile(path.join(root, 'data/menu-presentation.json'), 'utf8'));
const appetiteMedia = JSON.parse(await readFile(path.join(root, 'data/appetite-media.json'), 'utf8'));
if (!Array.isArray(products) || !products.length) throw new Error('data/menu.json must contain a non-empty product array.');

const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));
const currency = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
const euro = value => currency.format(value);
const slug = value => String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const definitions = [
  { id: 'burger', label: 'Burger', aliases: ['burger'] },
  { id: 'menu', label: 'Menù completi', aliases: ['menu', 'menu-completi', 'combo'] },
  { id: 'fries', label: 'Contorni', aliases: ['contorni', 'sfizi', 'fries'] },
  { id: 'dolci', label: 'Dolci', aliases: ['dolci', 'dessert'] },
  { id: 'bevande', label: 'Bevande', aliases: ['bevande', 'drinks'] }
];
const groups = new Map();
const productIds = new Set();
for (const product of products) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.id) || productIds.has(product.id)) {
    throw new Error(`Product id must be a unique lowercase slug: ${product.id}`);
  }
  productIds.add(product.id);
  for (const field of ['name', 'description', 'category', 'source_file']) {
    if (typeof product[field] !== 'string' || !product[field].trim()) throw new Error(`Missing ${field} on ${product.id}`);
  }
  if (!Number.isFinite(product.regular_price_eur) || product.regular_price_eur <= 0) throw new Error(`Invalid regular price: ${product.id}`);
  if (product.observed_promo_price != null && (!Number.isFinite(product.observed_promo_price) || product.observed_promo_price <= 0 || product.observed_promo_price >= product.regular_price_eur)) {
    throw new Error(`Invalid promotional price: ${product.id}`);
  }
  const categorySlug = slug(product.category);
  if (!categorySlug) throw new Error(`Invalid category: ${product.id}`);
  const definition = definitions.find(category => category.aliases.includes(categorySlug)) || { id: categorySlug, label: product.category };
  if (!groups.has(definition.id)) groups.set(definition.id, { ...definition, products: [] });
  groups.get(definition.id).products.push(product);
}
const groupOrder = presentation.group_order || definitions.map(category => category.id);
const categories = [...groups.values()].sort((a, b) => {
  const index = id => { const found = groupOrder.indexOf(id); return found < 0 ? groupOrder.length : found; };
  return index(a.id) - index(b.id);
});
for (const category of categories) {
  const ids = presentation.product_order?.[category.id] || [];
  if (!Array.isArray(ids) || new Set(ids).size !== ids.length) throw new Error(`Invalid presentation order: ${category.id}`);
  const rank = new Map(ids.map((id,index) => [id,index]));
  // Sort only real catalog records. Missing variants are never manufactured;
  // newly approved records without a rank retain their source order at the end.
  category.products.sort((a,b) => (rank.get(a.id) ?? ids.length) - (rank.get(b.id) ?? ids.length));
}
const orderURL = './ordina.html';
const campaignPhotos = presentation.campaign_photos || {};
for (const [id,photo] of Object.entries(campaignPhotos)) {
  if (!productIds.has(id) || typeof photo !== 'string' || !/^\.\/images\/campaign\/[a-z0-9-]+\.webp$/.test(photo)) {
    throw new Error(`Invalid campaign photo: ${id}`);
  }
}
function productCard(product) {
  const promotional = product.observed_promo_price != null;
  const discount = promotional ? Math.round((1 - product.observed_promo_price / product.regular_price_eur) * 100) : 0;
  const originalPhoto = `./images/menu/${product.id}.webp`;
  const campaignPhoto = campaignPhotos[product.id];
  const appetite = appetiteMedia[product.id];
  if (appetite && (!/^\.\/images\/(?:appetite|menu-unified)\/[a-z0-9-]+\.webp$/.test(appetite.poster) || !/^\.\/images\/(?:appetite|menu-unified)\/[a-z0-9-]+-640\.webp$/.test(appetite.posterSmall))) throw new Error(`Invalid appetite photo: ${product.id}`);
  const photo = appetite?.poster || campaignPhoto || originalPhoto;
  const familyLabel = presentation.product_labels?.[product.id];
  const foodScene = presentation.product_scenes?.[product.id];
  if (foodScene && !['emerald','rose','mint','butter'].includes(foodScene)) throw new Error(`Invalid food scene: ${product.id}`);
  const photoWidth = presentation.campaign_photo_widths?.[product.id];
  if (campaignPhoto && (!Number.isInteger(photoWidth) || photoWidth <= 640)) throw new Error(`Invalid campaign photo width: ${product.id}`);
  const photoSizes = '(max-width: 760px) clamp(88px, 28vw, 128px), (max-width: 1040px) 116px, 144px';
  const imageAttributes = `alt="${escapeHTML(product.name)}" loading="lazy" decoding="async"`;
  const sceneAttributes = appetite ? ' data-appetite-motion' : '';
  const motionSizes = `sizes="${photoSizes}"`;
  const staticMedia = '(prefers-reduced-motion: reduce), (prefers-reduced-data: reduce), (scripting: none)';
  let picture;
  if (appetite?.motionPosterSmall && appetite?.motionPoster) {
    const still = `srcset="${escapeHTML(appetite.posterSmall)} 640w, ${escapeHTML(appetite.poster)} 960w"`;
    const retina = appetite.motionPosterRetina ? `, ${escapeHTML(appetite.motionPosterRetina)} 960w` : '';
    const first = `srcset="${escapeHTML(appetite.motionPosterSmall)} 320w, ${escapeHTML(appetite.motionPoster)} 640w${retina}"`;
    picture = `<picture class="food-film-poster"><source data-food-static media="${staticMedia}" ${still} ${motionSizes} /><img data-appetite-still src="${escapeHTML(appetite.motionPosterSmall)}" ${first} ${motionSizes} ${imageAttributes} width="640" height="640" /></picture>`;
  } else {
    const candidates = appetite ? `${appetite.posterSmall} 640w, ${appetite.poster} 960w` : campaignPhoto ? `${campaignPhoto.replace(/\.webp$/, '-640.webp')} 640w, ${campaignPhoto} ${photoWidth}w` : '';
    const sourceSet = candidates ? ` srcset="${escapeHTML(candidates)}" ${motionSizes}` : '';
    picture = `<img src="${escapeHTML(photo)}"${sourceSet}${appetite ? ' data-appetite-still' : ''} ${imageAttributes} width="${appetite ? 960 : 800}" height="${appetite ? 960 : 800}" />`;
  }
  const badges = [
    promotional ? `<span class="promo-badge">−${discount}% su Glovo</span>` : '',
    product.diet_label ? `<span class="diet-badge">${escapeHTML(product.diet_label)}</span>` : ''
  ].filter(Boolean).join('');
  const optionText = (product.observed_options || []).map(option => {
    if (typeof option.name !== 'string' || !Number.isFinite(option.additional_price_eur) || option.additional_price_eur < 0) throw new Error(`Invalid option: ${product.id}`);
    return `${option.name} +${euro(option.additional_price_eur)}`;
  }).join(' · ');
  return `            <article class="product-card${campaignPhoto ? ' campaign-product' : ''}" data-menu-product="${escapeHTML(product.id)}"${campaignPhoto ? ` data-photo-original="${escapeHTML(originalPhoto)}"` : ''}>
              <a class="product-photo" href="${orderURL}" data-product-photo="${escapeHTML(product.id)}" aria-label="Foto e dettagli di ${escapeHTML(product.name)}"${sceneAttributes}>
                ${picture}
                <span class="simple-photo-detail${foodScene ? ' ingredient-invitation' : ''}" aria-hidden="true">${foodScene ? 'Guarda da vicino <b>↗</b>' : '＋'}</span>
              </a>
              <div class="product-info product-content">
                ${badges ? `<div class="product-badges">${badges}</div>` : ''}
                ${familyLabel ? `<p class="product-options product-family">${escapeHTML(familyLabel)}</p>` : ''}
                <h3 class="product-name"><a href="${orderURL}" data-product-photo="${escapeHTML(product.id)}">${escapeHTML(product.name)}</a></h3>
                <p class="product-description">${escapeHTML(product.description)}</p>
                ${optionText ? `<p class="product-options">${escapeHTML(optionText)}</p>` : ''}
              </div>
              <div class="product-footer">
                  <div class="product-price">${promotional ? `<s class="price-original">${escapeHTML(euro(product.regular_price_eur))}</s> ` : ''}<strong class="price-current">${escapeHTML(euro(promotional ? product.observed_promo_price : product.regular_price_eur))}</strong></div>
                  <a class="product-action" href="${orderURL}" data-add-to-cart="${escapeHTML(product.id)}" aria-label="Aggiungi ${escapeHTML(product.name)} al sacchetto">Aggiungi <span aria-hidden="true">+</span></a>
              </div>
            </article>`;
}
const filterLabels = {menu:'Menù completi', burger:'Panini'};
const filters = categories.map(category => ({id:category.id, label:filterLabels[category.id] || category.label}));
filters.push({id:'all', label:'Tutto'});
const buttons = filters.map(filter => `            <button type="button" data-menu-filter="${escapeHTML(filter.id)}" aria-pressed="${filter.id === 'all'}" aria-controls="simple-menu-groups" disabled>${escapeHTML(filter.label)}</button>`).join('\n');
const panels = categories.map(category => `          <section class="simple-menu-group" data-menu-group="${escapeHTML(category.id)}" aria-labelledby="group-${escapeHTML(category.id)}-title">
            <div class="simple-group-heading"><h3 id="group-${escapeHTML(category.id)}-title">${escapeHTML(category.label)}</h3><span>${category.products.length} ${category.products.length === 1 ? 'proposta' : 'proposte'}</span></div>
            <div class="simple-product-grid">
${category.products.map(productCard).join('\n')}
            </div>
          </section>`).join('\n');
const section = `      <section class="menu-section simple-menu section-pad" id="menu" aria-labelledby="menu-title">
        <div class="section-heading"><h2 id="menu-title">Il menù</h2></div>
        <div class="catalog-tools">
          <div class="simple-menu-filters" role="group" aria-label="Filtra il menù per categoria">
${buttons}
          </div>
          <a class="catalog-bag" href="${orderURL}" data-cart-open>Sacchetto <b data-cart-count>0</b></a>
        </div>
        <p class="simple-filter-status" role="status" aria-live="polite" aria-atomic="true"></p>
        <div id="simple-menu-groups">
${panels}
        </div>
        <div class="menu-meta menu-price-note"><p><strong>Su Glovo, gli stessi prezzi dei prodotti in negozio.</strong></p><p>Promozioni soggette a disponibilità. Verifica su Glovo il prezzo finale, la consegna e le eventuali commissioni.</p></div>
      </section>`.replace(/[ \t]+$/gm, '');

const outputPath = path.join(root, 'outputs/menu-section.html');
if (!args.includes('--stdout')) {
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, section + '\n');
}

if (args.includes('--write')) {
  const indexPath = path.join(root, 'index.html');
  const html = await readFile(indexPath, 'utf8');
  const opening = /<section\b(?=[^>]*\bclass=["'][^"']*\bmenu-section\b[^"']*["'])(?=[^>]*\bid=["']menu["'])[^>]*>/g;
  const match = opening.exec(html);
  if (!match || opening.exec(html)) throw new Error('Expected exactly one menu section in index.html.');
  const sectionTags = /<\/?section\b[^>]*>/g;
  sectionTags.lastIndex = match.index;
  let depth = 0;
  let ending;
  for (let tag = sectionTags.exec(html); tag; tag = sectionTags.exec(html)) {
    depth += tag[0].startsWith('</') ? -1 : 1;
    if (depth === 0) { ending = sectionTags.lastIndex; break; }
  }
  if (!ending) throw new Error('Menu section has no closing section tag.');
  await writeFile(indexPath, html.slice(0, match.index) + section.trimStart() + html.slice(ending));
}
if (args.includes('--stdout')) process.stdout.write(section + '\n');
else console.log(`Rendered ${products.length} products in ${categories.length} categories → ${path.relative(root, outputPath)}${args.includes('--write') ? ' and index.html' : ''}`);
