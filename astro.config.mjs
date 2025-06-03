// astro.config.mjs
import { defineConfig } from 'astro/config';
import cesium from 'vite-plugin-cesium'; // Pastikan nama impor ini benar
import vue from '@astrojs/vue';

export default defineConfig({
  integrations: [vue()],
  vite: {
    plugins: [
      cesium(),
    ]
  }
});