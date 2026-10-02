// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://omerapoua0.github.io',
  output: 'static',
  build: { format: 'file' },
  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.endsWith('/viewports/'),
    }),
  ],
});
