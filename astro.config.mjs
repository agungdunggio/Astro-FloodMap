// astro.config.mjs
import { defineConfig } from 'astro/config';
import cesium from 'vite-plugin-cesium'; // Pastikan nama impor ini benar

export default defineConfig({
  vite: {
    plugins: [
      cesium()
    ]
  }
});