import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

/**
 * Whether this build ships baked art. Decided HERE, at build time, and frozen
 * into the bundle - the app must never decide it by probing the network.
 *
 * The deployed game once looked completely different from the same bundle run
 * locally: `public/assets` had been deleted, but Cloudflare's edge cache kept
 * serving the old `assets/manifest.json` (s-maxage 604800 - seven days) along
 * with the placeholder sprites it named. BootScene fetched that stale manifest
 * and loaded the old art over the good art. The appearance of a build must not
 * depend on a file being ABSENT from a server, because caches and previous
 * deployments can keep such a file alive long after it is gone from the repo.
 */
const hasBakedArt = existsSync(fileURLToPath(new URL('public/assets/manifest.json', import.meta.url)))

export default defineConfig({
  // Relative base so the static build works from any mount path on Cloudflare Pages.
  base: './',
  define: {
    __HAS_BAKED_ART__: JSON.stringify(hasBakedArt),
  },
  build: {
    // Phaser is ~1.2 MB minified; this is expected for a game bundle.
    chunkSizeWarningLimit: 1600,
  },
  server: {
    port: 5176,
    strictPort: true,
  },
})
