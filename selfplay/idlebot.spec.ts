import { expect, test } from '@playwright/test'
import { driveIdleToGameover } from './harness'

// Death-path probe: a player who never acts MUST die and reach the
// game-over phase. If this ever passes while enemies deal no damage, or
// hangs forever, something regressed in enemy AI or the lifecycle.
test('idle bot dies and reaches game over', async ({ page }, testInfo) => {
  const result = await driveIdleToGameover(page, 'zhaoyun', 42)
  await testInfo.attach('selfplay-report', {
    body: JSON.stringify(result, null, 2),
    contentType: 'application/json',
  })
  console.log('SELFPLAY IDLE', JSON.stringify(result))

  expect(result.pageErrors).toEqual([])
  expect(result.gameover).toBe(true)
})
