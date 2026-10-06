import { expect, test } from '@playwright/test'
import { decideBotScript } from './bot'
import { checkInvariants } from './invariants'
import { bootGame } from './harness'
import { neutralInput, type InputState } from '../src/core/types'

/**
 * THE CO-OP LOGIC SIGNAL.
 *
 * The existing signal drives one player through three stages and asserts the
 * invariants hold. Co-op changed the sim underneath it - a second player
 * entity, nearest-target enemies, a lead-player camera, shared continues - and
 * none of that had any long-run coverage: only unit tests and short e2e.
 *
 * That is the same gap this project keeps finding in itself, one level up: the
 * gate exercised a path the game no longer only has. This drives BOTH players
 * through a real stage clear and holds them to the same invariants.
 */

/** Player two mirrors player one's script, offset so they are not a clone. */
function secondScript(primary: InputState[]): InputState[] {
  return primary.map((input, i) => ({
    ...neutralInput(),
    // Follow roughly, but lag and attack on a different beat, so the two are
    // genuinely separate actors rather than one player counted twice.
    right: input.right && i % 4 !== 0,
    left: input.left,
    up: input.up,
    down: input.down,
    attackPressed: i % 7 === 0,
  }))
}

test('co-op: two players clear stage 1 together with no invariant violations', async ({ page }) => {
  test.setTimeout(300_000)
  const pageErrors = await bootGame(page, 'zhaoyun', 42, 'stage1')

  // Drop player two in through the bridge, as a second person would.
  const joined = await page.evaluate(() => window.__DW__?.joinP2('guanyu') ?? false)
  expect(joined, 'player two failed to join').toBe(true)
  expect(await page.evaluate(() => window.__DW__?.getSnapshot().sim?.char2Id)).toBe('guanyu')

  let cleared = false
  let continuesUsed = 0
  const violations: ReturnType<typeof checkInvariants> = []

  for (let i = 0; i < 800 && !cleared && violations.length === 0; i += 1) {
    const snapshot = await page.evaluate(() => window.__DW__?.getSnapshot())
    if (!snapshot) break
    violations.push(...checkInvariants(snapshot))
    const sim = snapshot.sim
    if (!sim) break

    if (sim.phase === 'clear') {
      cleared = true
      break
    }
    if (sim.phase === 'gameover') {
      if (sim.lives <= 0) break
      continuesUsed += 1
      await page.keyboard.press('Enter')
      await expect
        .poll(() => page.evaluate(() => window.__DW__?.getSnapshot().sim?.phase), { timeout: 5_000 })
        .toBe('fight')
      continue
    }

    const script = decideBotScript(snapshot)
    const tickBefore: number = snapshot.tick
    await page.evaluate(
      ([p1, p2]) => window.__DW__?.run(p1 as InputState[], p2 as InputState[]),
      [script, secondScript(script)],
    )
    await page.waitForFunction(
      (t) => t !== undefined && (window.__DW__?.getSnapshot()?.tick ?? -1) >= t,
      tickBefore + script.length,
    )
  }

  const final = await page.evaluate(() => window.__DW__?.getSnapshot().sim)
  console.log(
    'COOP SIGNAL',
    JSON.stringify({
      cleared,
      continuesUsed,
      char2Id: final?.char2Id,
      p2Hp: final?.player2?.hp,
      score: final?.stats.score,
      violations,
      pageErrors,
    }),
  )

  // Player two was still in the game at the end - not quietly dropped, which
  // is how a co-op regression would most plausibly hide.
  expect(final?.char2Id, 'player two vanished during the run').toBe('guanyu')
  expect(final?.player2, 'player two vanished during the run').not.toBeNull()
  expect(violations, 'invariants broke during a co-op run').toEqual([])
  expect(pageErrors).toEqual([])
  expect(cleared, 'two players could not clear stage 1').toBe(true)
})
