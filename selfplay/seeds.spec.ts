import { expect, test } from '@playwright/test'
import { driveStageClear } from './harness'

// Multi-seed sweep: the canonical stage-1 clear must hold beyond seed 42.
// These seeds were verified against the Node-side policy replay first.
test.describe('seed sweep', () => {
  for (const seed of [7, 1337, 2024]) {
    test(`zhaoyun clears stage 1 with seed ${seed}`, async ({ page }, testInfo) => {
      test.setTimeout(300_000)
      const result = await driveStageClear(page, 'zhaoyun', seed)
      await testInfo.attach('selfplay-report', {
        body: JSON.stringify(result, null, 2),
        contentType: 'application/json',
      })
      console.log('SELFPLAY SEED', JSON.stringify(result))

      expect(result.violations).toEqual([])
      expect(result.pageErrors).toEqual([])
      expect(result.cleared).toBe(true)
    })
  }
})
