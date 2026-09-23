import js from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['dist/', 'playwright-report/', 'test-results/', 'artifacts/', 'node_modules/'],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Architectural keystone: the game core must stay pure TypeScript so it
    // runs under Node for unit tests and deterministic replay. Any Phaser or
    // presentation import inside src/core is a lint error.
    files: ['src/core/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: ['phaser', '**/game/**'] }],
      /*
       * The OTHER half of that keystone, which was documented everywhere and
       * enforced nowhere.
       *
       * PROJECT.md: "no `Math.random` or wall-clock time in core logic", and
       * `rng.ts` opens with "The simulation must never call Math.random".
       * Every seeded test, the whole signal suite and the replay guarantee
       * rest on it - and until this rule existed, breaking it produced no lint
       * error and no crash. It produced a seeded run that quietly stopped
       * reproducing, which is the most expensive kind of bug this project can
       * have and the hardest to trace back to its cause.
       */
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'src/core must be deterministic: draw from the injected sim.rng instead.',
        },
        {
          object: 'Date',
          property: 'now',
          message: 'src/core must be deterministic: use sim.tick, not the wall clock.',
        },
        {
          object: 'performance',
          property: 'now',
          message: 'src/core must be deterministic: use sim.tick, not the wall clock.',
        },
      ],
      // Catches `new Date()` as well as bare references; core has no business
      // with either.
      'no-restricted-globals': [
        'error',
        {
          name: 'Date',
          message: 'src/core must be deterministic: use sim.tick, not the wall clock.',
        },
      ],
    },
  },
  {
    // Node-side tooling scripts (bake pipeline etc.) run outside the browser.
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
        Buffer: 'readonly',
        fetch: 'readonly',
      },
    },
  },
)
