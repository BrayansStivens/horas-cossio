// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';

const repo = 'horas-cossio';
// eslint-disable-next-line no-undef
const isProd = /** @type {any} */ (globalThis).process?.env?.NODE_ENV === 'production';

export default defineConfig({
  site: 'https://brayansstivens.github.io',
  base: isProd ? `/${repo}/` : '/',
  integrations: [svelte()],
  vite: {
    plugins: [tailwindcss()],
  },
});
