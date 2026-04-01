// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://www.simonplant.com',
  output: 'static',
  integrations: [sitemap()],
  vite: {
    // @ts-ignore - vite version mismatch between astro (v7) and @tailwindcss/vite (v8)
    plugins: [tailwindcss()],
  },
});
