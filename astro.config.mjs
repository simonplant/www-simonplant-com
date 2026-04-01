// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://www.simonplant.com',
  output: 'static',
  vite: {
    // @ts-ignore - vite version mismatch between astro (v7) and @tailwindcss/vite (v8)
    plugins: [tailwindcss()],
  },
});
