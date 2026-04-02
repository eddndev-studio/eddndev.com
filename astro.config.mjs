// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

import mdx from '@astrojs/mdx';

// https://astro.build/config
export default defineConfig({
  site: 'https://eddndev.com',
  vite: {
    plugins: [tailwindcss()],
    build: {
      rollupOptions: {
        output: {
          entryFileNames: '_astro/[hash].js',
          chunkFileNames: '_astro/[hash].js',
          assetFileNames: '_astro/[hash][extname]',
        },
      },
    },
  },

  integrations: [mdx(), sitemap()]
});