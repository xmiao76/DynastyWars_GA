import { defineConfig } from 'vitest/config'

// Scratch config for rendering review sheets offline (artifacts/ is gitignored).
export default defineConfig({
  test: {
    environment: 'node',
    include: ['artifacts/look/**/*.sheet.ts'],
    testTimeout: 120_000,
  },
})
