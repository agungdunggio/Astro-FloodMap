// astro.config.mjs
import { defineConfig } from 'astro/config';
import cesium from 'vite-plugin-cesium';
import vue from '@astrojs/vue';

export default defineConfig({
  integrations: [vue()],
  vite: {
    plugins: [
      cesium(),
    ]
  }
});