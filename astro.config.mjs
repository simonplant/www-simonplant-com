// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  vite: {
    // @ts-ignore - vite version mismatch between astro (v7) and @tailwindcss/vite (v8)
    plugins: [tailwindcss()],
  },
});
