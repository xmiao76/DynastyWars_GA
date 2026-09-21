/**
 * Build-time flags frozen into the bundle by vite.config.ts.
 *
 * `__HAS_BAKED_ART__` is true only when this build actually ships
 * `public/assets/manifest.json`. A build that carries no baked art must never
 * go looking for one: a stale manifest left in a CDN cache or an older
 * deployment would otherwise pull placeholder art back over the real art.
 */
declare const __HAS_BAKED_ART__: boolean
