// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

const NOINDEX_PATHS = ['/register/', '/thank-you/'];

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || 'https://layeracademy.ge',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  i18n: {
    defaultLocale: 'ka',
    locales: ['ka'],
  },
  integrations: [
    sitemap({
      filter: (page) => !NOINDEX_PATHS.some((path) => page.includes(path)),
    }),
  ],
});
