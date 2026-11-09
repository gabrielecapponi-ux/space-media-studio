import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {buildGraph,injectStructuredData,loadInputs,openingHoursSchema,root,pages} from './build-structured-data.mjs';
import {OPENING_HOURS,openingStatus} from '../src/opening-hours.js';
import {productUnitCents,GLOVO_URL,PICKUP_PHONE} from '../src/cart.js';

const inputs = await loadInputs();
const graph = buildGraph(inputs);
const restaurant = graph['@graph'][0], menu = graph['@graph'][1];
const items = menu.hasMenuSection.flatMap(section => section.hasMenuItem);

test('restaurant details match the local business and actual order channels', () => {
  assert.equal(restaurant['@type'],'Restaurant');
  assert.equal(restaurant.name,'Mr Smeet');
  assert.equal(restaurant.telephone,PICKUP_PHONE);
  assert.equal(restaurant.address.streetAddress,'Via D’Azeglio 84/A');
  assert.equal(restaurant.address.addressLocality,'Parma');
  assert.equal(restaurant.address.addressCountry,'IT');
  assert.ok(restaurant.sameAs.includes('https://mrsmeet.it/'));
});

test('all ten products occur once, in the approved three sections and order', () => {
  assert.deepEqual(menu.hasMenuSection.map(section => section.name),['Menù completi','Panini','Contorni']);
  assert.deepEqual(menu.hasMenuSection.map(section => section.hasMenuItem.length),[3,4,3]);
  assert.equal(items.length,10);
  assert.equal(new Set(items.map(item => item['@id'])).size,10);
  assert.deepEqual(menu.hasMenuSection[2].hasMenuItem.map(item => item.name),['Sweet Fries','Classic Fries','Nuggets di pollo']);
  for (const [index,group] of inputs.presentation.group_order.entries()) {
    assert.deepEqual(menu.hasMenuSection[index].hasMenuItem.map(item => item['@id'].split('#menu-item-')[1]),inputs.presentation.product_order[group]);
  }
});

test('names, descriptions and offer prices are the same data used by the UI and cart', () => {
  for (const item of items) {
    const product = inputs.products.find(product => item['@id'].endsWith('#menu-item-'+product.id));
    assert.equal(item.name,product.name);
    assert.equal(item.description,product.description);
    assert.equal(item.offers.price,(productUnitCents(product)/100).toFixed(2));
    assert.equal(item.offers.priceCurrency,'EUR');
    assert.equal(item.offers.url,GLOVO_URL);
  }
  assert.equal(items.find(item => item.name==='Classic Smash Menù').offers.price,'14.40');
  assert.equal(items.find(item => item.name==='Classic Smash Burger Triplo').offers.price,'12.80');
});

test('regular hours share the UI source, including Monday closure and split service', () => {
  assert.deepEqual(restaurant.openingHoursSpecification,openingHoursSchema());
  const mon = restaurant.openingHoursSpecification.find(x => x.dayOfWeek.endsWith('/Monday'));
  assert.equal(mon.opens,'00:00');assert.equal(mon.closes,'00:00');
  const fri = restaurant.openingHoursSpecification.filter(x => x.dayOfWeek.endsWith('/Friday'));
  assert.deepEqual(fri.map(x => [x.opens,x.closes]),[['12:00','14:30'],['19:00','23:30']]);
  assert.equal(restaurant.openingHoursSpecification.length,12);
  assert.equal(openingStatus(new Date('2026-11-09T12:00:00+01:00')).open,false);
  assert.equal(openingStatus(new Date('2026-11-10T12:00:00+01:00')).open,true);
  assert.equal(openingStatus(new Date('2026-11-10T14:30:00+01:00')).open,false);
  assert.equal(OPENING_HOURS.Sun.length,1);
});

test('all marked-up images are existing local assets with absolute crawlable URLs', async () => {
  for (const image of [restaurant.image,restaurant.logo,...items.map(item => item.image)]) {
    assert.ok(image.startsWith(inputs.business.siteUrl));
    const relative = image.slice(inputs.business.siteUrl.length);
    assert.ok((await stat(path.join(root,'public',relative))).size>0);
  }
});

test('only the explicitly vegan item receives a dietary statement; unsupported claims are absent', () => {
  assert.deepEqual(items.filter(item => item.suitableForDiet).map(item => item.name),['100% vegano']);
  const text = JSON.stringify(graph);
  for (const key of ['availability','aggregateRating','review','founder','foundingDate','priceValidUntil','nutrition','potentialAction','OrderAction','BuyAction','postalCode','geo']) {
    assert.ok(!text.includes('"'+key+'"'),key);
  }
  assert.ok(!text.includes('/tmp/') && !text.includes('/Users/'));
});

test('order pages link to the menu without asserting a hidden ten-product catalog', () => {
  const orderGraph = buildGraph(inputs,{includeMenu:false});
  assert.equal(orderGraph['@graph'].length,1);
  assert.equal(orderGraph['@graph'][0].hasMenu,inputs.business.siteUrl+'#menu');
  assert.ok(!JSON.stringify(orderGraph).includes('MenuItem'));
});

test('injection is idempotent and preserves every body element on all six pages', async () => {
  for (const page of pages) {
    const html = await readFile(path.join(root,page),'utf8');
    const pageGraph = buildGraph(inputs,{includeMenu:!page.startsWith('ordina')});
    const once = injectStructuredData(html,pageGraph), twice = injectStructuredData(once,pageGraph);
    assert.equal(once,twice,page);
    assert.equal(once.split(/<body/i)[1],html.split(/<body/i)[1],page);
    assert.equal((once.match(/id="mrsmeet-structured-data"/g)||[]).length,1);
    assert.deepEqual(JSON.parse(once.match(/<script id="mrsmeet-structured-data" type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]),pageGraph);
  }
});

test('catalog script-breaking characters are escaped while JSON content round-trips', () => {
  const payload = {'@context':'https://schema.org',name:'A </script><script>alert(1)</script> & B'};
  const html = injectStructuredData('<html><head></head><body>Keep</body></html>',payload);
  assert.equal((html.match(/<script/g)||[]).length,1);
  assert.deepEqual(JSON.parse(html.match(/type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]),payload);
});
