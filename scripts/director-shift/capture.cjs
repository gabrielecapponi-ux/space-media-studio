/** Capture the studio's five real demo pages with their own fonts and images resolved. */
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require(process.env.SHIFT_PLAYWRIGHT || 'playwright');

const root = path.resolve(__dirname, '../..');
const output = path.join(root, 'outputs/flagship-20261106/shift/screens');
const base = process.env.SHIFT_DEMO_URL || 'http://127.0.0.1:5213/showcase/index.html';
const scenes = ['shift', 'vela', 'nude', 'basilico', 'oltre'];

(async () => {
  const browser = await chromium.launch({ ...(process.env.CHROMIUM_EXECUTABLE_PATH && { executablePath: process.env.CHROMIUM_EXECUTABLE_PATH }), headless: true });
  try {
    const page = await browser.newPage({ deviceScaleFactor: 1 });
    for (const [profile, width, height] of [['desktop', 1920, 1080], ['mobile', 720, 900]]) {
      const directory = path.join(output, profile);
      await fs.mkdir(directory, { recursive: true });
      await page.setViewportSize({ width, height });
      for (const scene of scenes) {
        const url = new URL(base);
        url.searchParams.set('scene', scene);
        url.searchParams.set('capture', '1');
        await page.goto(url.href);
        const ready = await page.evaluate(() => window.__showcaseReady);
        assert.equal(ready.scene, scene);
        assert.ok(ready.images.every(image => image.complete));
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await page.screenshot({ path: path.join(directory, `${scene}.jpg`), type: 'jpeg', quality: 96, animations: 'disabled' });
      }
    }
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
