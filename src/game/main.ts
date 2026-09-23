import Phaser from 'phaser'
import '../style.css'
import { audio } from './audio/sfx'
import { initialBridgeState, installBridge } from './debug/bridge'
import { VIEW_H, VIEW_W } from './render'
import { BootScene } from './scenes/BootScene'
import { GameScene } from './scenes/GameScene'
import { HudScene } from './scenes/HudScene'
import { GameCompleteScene } from './scenes/GameCompleteScene'
import { GameOverScene } from './scenes/GameOverScene'
import { ResultScene } from './scenes/ResultScene'
import { SelectScene } from './scenes/SelectScene'
import { TitleScene } from './scenes/TitleScene'
import { StyleFrameScene } from './scenes/StyleFrameScene'

const params = new URLSearchParams(window.location.search)

const bridgeState = initialBridgeState(params.get('autopilot') === '1')
installBridge(bridgeState)

const config: Phaser.Types.Core.GameConfig = {
  // Automated runs pass ?renderer=canvas to avoid headless WebGL flakiness;
  // real play uses AUTO (WebGL with canvas fallback).
  type: params.get('renderer') === 'canvas' ? Phaser.CANVAS : Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#000000',
  // Three active pointers so a thumb can hold a direction while the other
  // thumb taps attack. Phaser tracks one by default, which would make the
  // on-screen controls feel broken in exactly the moments that matter.
  input: { activePointers: 3 },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // The canvas is RENDER_SCALE times the logical 480x270 the game is authored
    // in; every camera zooms to match. See src/game/render.ts.
    width: VIEW_W,
    height: VIEW_H,
  },
  // HudScene runs in parallel with GameScene and must be listed after it so it
  // renders on top; it is launched by GameScene, never started on its own.
  scene: [BootScene, TitleScene, SelectScene, GameScene, HudScene, ResultScene, GameOverScene, GameCompleteScene, StyleFrameScene],
}

const game = new Phaser.Game(config)
game.registry.set('bridge', bridgeState)

// Exposed for e2e/debug probing (read-only introspection; game-driving goes
// through the __DW__ bridge).
declare global {
  interface Window {
    __DW_GAME__?: Phaser.Game
  }
}
window.__DW_GAME__ = game

/**
 * Re-fit the canvas when the viewport changes shape.
 *
 * Phaser polls its parent every `resizeInterval` and refits when the bounds
 * change, which is why a desktop window resize has always worked. An
 * orientation change does not go through that path: `ScaleManager`'s own
 * resize listener calls `updateBounds()` and THEN marks itself dirty, so the
 * poll that follows asks `getParentBounds()` again, finds the recorded bounds
 * already equal to the DOM, returns false and never calls `refresh()`. The new
 * size is recorded without the canvas being resized to match.
 *
 * Measured on a Pixel 7 profile, turning the handset: `scale.parentSize`
 * reads a correct 915x412 while `scale.displaySize` is still the portrait
 * 412x232, and one `refresh()` by hand fixes it. Left alone, rotating back to
 * portrait leaves a landscape-sized canvas overflowing a portrait viewport,
 * with four of the seven on-screen controls off the edge.
 *
 * Deferred a frame because a listener fires before layout has settled, and a
 * refresh that reads mid-reflow would just record the wrong size confidently.
 */
const refit = (): void => {
  requestAnimationFrame(() => game.scale.refresh())
}
window.addEventListener('resize', refit)
window.addEventListener('orientationchange', refit)
window.screen?.orientation?.addEventListener?.('change', refit)

// Global mute toggle (M), mirrored into the debug bridge for tests.
window.addEventListener('keydown', (event) => {
  if (event.key === 'm' || event.key === 'M') {
    audio.muted = !audio.muted
    bridgeState.muted = audio.muted
  }
})
