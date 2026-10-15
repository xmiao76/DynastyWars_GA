import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  // Relative base so the static build works from any mount path on Cloudflare Pages.
  base: './',
  build: {
    // Phaser is ~1.2 MB minified; this is expected for a game bundle.
    chunkSizeWarningLimit: 1600,
  },
  server: {
    port: 5176,
    strictPort: true,
    // Offline authoring/review output is not served by Vite. On Windows,
    // subscribing its many files blocks cold requests in native fs.watch.
    // Keep src/public/config watching (and HMR) intact.
    watch: {
      ignored: ['art/', 'artifacts/', 'test-results/', 'playwright-report/'].map(
        (directory) => `${fileURLToPath(new URL(directory, import.meta.url)).replace(/\\/g, '/')}**`,
      ),
    },
  },
})
