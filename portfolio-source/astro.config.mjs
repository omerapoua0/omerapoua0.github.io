// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://omerapoua0.github.io',
  output: 'static',
  build: { format: 'file' },
  // No React integration: no page uses React any more, and the integration
  // would still emit an unreferenced React client chunk. @astrojs/react stays
  // declared in package.json so the lockfile is unchanged.
  integrations: [
    sitemap({
      filter: (page) => !page.endsWith('/viewports/'),
    }),
  ],
});
