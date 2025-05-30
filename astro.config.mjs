import { defineConfig } from 'astro/config';
import viteCesium from 'vite-plugin-cesium';

export default defineConfig({
  vite: {
    plugins: [viteCesium()],
  },
});
