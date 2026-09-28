import Phaser from 'phaser'
import '../style.css'
import { audio } from './audio/sfx'
import { initialBridgeState, installBridge } from './debug/bridge'
import { VIEW_H, VIEW_W } from './render'
import { rotateBlocked } from './ui/orientation'
import { LIVE_STACK } from './ui/theme'
import { BootScene } from './scenes/BootScene'
import { GameScene } from './scenes/GameScene'
import { HudScene } from './scenes/HudScene'
import { GameCompleteScene } from './scenes/GameCompleteScene'
import { GameOverScene } from './scenes/GameOverScene'
import { ResultScene } from './scenes/ResultScene'
import { SelectScene } from './scenes/SelectScene'
import { TitleScene } from './scenes/TitleScene'

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
  scene: [BootScene, TitleScene, SelectScene, GameScene, HudScene, ResultScene, GameOverScene, GameCompleteScene],
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

/**
 * UIR-7 (V-9, owner decision 1): the rotate-your-phone overlay. A touch
 * device held in portrait gets a full-screen themed overlay (phone icon +
 * text in the display font on the letterbox gradient) over the game, and
 * gameplay pauses behind it (GameScene.update returns early while
 * rotateBlocked()). Rotating back to landscape removes the overlay and the
 * game resumes where it froze. Desktop and landscape never see it. DOM, not
 * canvas: it must cover the letterbox too, and stay crisp at any density.
 */
const rotateOverlay = document.createElement('div')
rotateOverlay.id = 'rotate-overlay'
rotateOverlay.setAttribute('role', 'alert')
rotateOverlay.style.cssText = [
  'position:fixed',
  'inset:0',
  'display:none',
  'flex-direction:column',
  'align-items:center',
  'justify-content:center',
  'gap:22px',
  'background:linear-gradient(180deg,#0a0a0a 0%,#1a1424 55%,#0a0a0a 100%)',
  'z-index:100',
  `font-family:${LIVE_STACK}`,
  'color:#e8b820',
  'text-align:center',
  'padding:24px',
  'box-sizing:border-box',
].join(';')
rotateOverlay.innerHTML =
  '<svg width="76" height="76" viewBox="0 0 76 76" fill="none" aria-hidden="true">' +
  '<rect x="22" y="8" width="32" height="56" rx="7" stroke="#e8b820" stroke-width="4"/>' +
  '<rect x="33" y="56" width="10" height="3" rx="1.5" fill="#e8b820"/>' +
  '<path d="M60 52 A 22 22 0 0 1 60 30" stroke="#e8b820" stroke-width="4" stroke-linecap="round"/>' +
  '<path d="M60 24 L60 34 L52 29 Z" fill="#e8b820"/>' +
  '</svg>' +
  '<div style="font-size:26px;font-weight:900;letter-spacing:2px">ROTATE YOUR PHONE</div>' +
  '<div style="font-size:15px;color:#d8c8a0;max-width:340px">This game is played in landscape. Turn your phone sideways to keep playing.</div>'
document.body.appendChild(rotateOverlay)

const syncRotateOverlay = (): void => {
  const blocked = rotateBlocked()
  rotateOverlay.style.display = blocked ? 'flex' : 'none'
  rotateOverlay.setAttribute('aria-hidden', blocked ? 'false' : 'true')
}
window.addEventListener('resize', syncRotateOverlay)
window.addEventListener('orientationchange', syncRotateOverlay)
window.screen?.orientation?.addEventListener?.('change', syncRotateOverlay)
syncRotateOverlay()
