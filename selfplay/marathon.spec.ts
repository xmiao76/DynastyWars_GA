import { expect, test } from '@playwright/test'
import { CHARACTER_ORDER } from '../src/core/characters'
import { driveMarathon } from './harness'

// Marathon: zhaoyun runs all nine stages; every other hero clears
// stages 1-2 back to back. Sequentially: parallel headless browsers starve
// each other's rAF and flake the tick-drain polls.
test.describe('marathon', () => {
  for (const hero of CHARACTER_ORDER) {
    const stageCount = hero === 'zhaoyun' ? 9 : 2
    test(`${hero} clears ${stageCount} stage(s)`, async ({ page }, testInfo) => {
      test.setTimeout(900_000)
      const result = await driveMarathon(page, hero, 42, stageCount)
      await testInfo.attach('selfplay-report', {
        body: JSON.stringify(result, null, 2),
        contentType: 'application/json',
      })
      console.log('SELFPLAY MARATHON', JSON.stringify(result))

      expect(result.pageErrors).toEqual([])
      for (const stage of result.stages) {
        expect(stage.violations).toEqual([])
      }
      expect(result.completed).toBe(true)
      // Score must carry across stages.
      const scores = result.stages.map((s) => s.stats.score)
      for (let i = 1; i < scores.length; i += 1) {
        expect(scores[i]).toBeGreaterThan(scores[i - 1] ?? 0)
      }
    })
  }
})
