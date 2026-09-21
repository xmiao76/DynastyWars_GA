import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Unit tests cover the pure game core (src/core) and run in Node:
    // no DOM, no canvas, no Phaser imports.
    environment: 'node',
    include: ['test/**/*.test.ts'],
  },
})
