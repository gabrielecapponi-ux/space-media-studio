import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const catalogPath = fileURLToPath(new URL('./data/menu.json', import.meta.url));

export default defineConfig({
  base: './',
  plugins: [{
    name: 'public-menu-fields',
    enforce: 'pre',
    transform(source, id) {
      if (id !== catalogPath) return;
      // Keep local attachment provenance in the source catalog only.
      const products = JSON.parse(source).map(({ source_file, ...product }) => product);
      return { code: JSON.stringify(products), map: null };
    },
  }],
  build: { outDir: 'dist', chunkSizeWarningLimit: 750, rollupOptions: { input: { main: 'index.html', order: 'ordina.html', variantA: 'versione-a.html', variantB: 'versione-b.html', orderA: 'ordina-a.html', orderB: 'ordina-b.html' } } },
});
