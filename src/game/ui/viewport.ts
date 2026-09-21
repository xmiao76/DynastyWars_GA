import Phaser from 'phaser'
import { RENDER_SCALE } from '../render'

/**
 * Camera setup for drawing the logical 480x270 game onto the RENDER_SCALE-times
 * larger canvas.
 *
 * These live apart from the RENDER_SCALE constant itself because that constant
 * is imported by `adapters/sprites.ts`, which the Node unit tests pull in. A
 * value import of Phaser there fails outside a browser, so the module holding
 * the number stays free of one.
 */

/**
 * Render every Text in this scene at RENDER_SCALE.
 *
 * A Text draws itself into its own canvas at its font size and is then scaled
 * by the camera like any other texture, so under a 2x camera it would be an
 * upscaled bitmap - soft, and softest on exactly the small labels the HUD is
 * made of. Phaser forces an unset resolution to 1 in the Text constructor, and
 * the game config no longer carries a global one, so it has to be set per
 * object. Hooking `addedtoscene` catches objects created later too - the stage
 * banner, player two's panel - which a one-off sweep over the display list
 * would miss.
 */
export function useCrispText(scene: Phaser.Scene): void {
  const onAdd = (obj: Phaser.GameObjects.GameObject): void => {
    if (!(obj instanceof Phaser.GameObjects.Text)) return
    obj.setResolution(RENDER_SCALE)
    // `setResolution` re-renders the text into a canvas RENDER_SCALE times
    // larger but does NOT update `frame.source.resolution`, which Phaser only
    // ever assigns in the Text constructor - where the resolution is still the
    // default 1. The canvas renderer divides the frame size by that field to
    // get its draw size, so it drew every label at twice the intended size;
    // the WebGL renderer never reads it and was correct throughout.
    //
    // Renderer-specific for the third time in this project, and the same shape
    // as the others: the automated suites default to `?renderer=canvas`, so the
    // gates would have measured 2x text that no player ever sees. The parity
    // gate caught it - "GAME OVER" overflowing its panel under canvas and
    // fitting under WebGL - which is exactly the job it exists for.
    obj.frame.source.resolution = RENDER_SCALE
  }
  scene.events.on(Phaser.Scenes.Events.ADDED_TO_SCENE, onAdd)
  // Paired teardown, and not optional. Phaser reuses a scene INSTANCE across
  // restarts and its event emitter outlives a shutdown, so registering without
  // removing adds another listener every time a scene starts. Measured before
  // fixing: six restarts left six listeners on `game`, `hud` and `result`
  // alike, so every object added did six times the work and every Text
  // re-rendered its canvas six times. It degrades gradually rather than
  // breaking, which is why it showed up as the visual suite timing out rather
  // than as anything failing.
  scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
    scene.events.off(Phaser.Scenes.Events.ADDED_TO_SCENE, onAdd)
  })
}

/**
 * Show the logical 480x270 area on the larger canvas, for scenes with no world
 * to scroll: the menus and the HUD.
 *
 * `setOrigin(0, 0)` is the load-bearing part. A Phaser camera zooms about its
 * origin, which is its CENTRE by default, so at zoom 2 on a 960x540 camera the
 * transform is `(p - scroll * scrollFactor - 480) * 2 + 480`. With no scroll
 * that puts logical (0, 0) at device -480, and it displaces scrollFactor-0
 * objects differently from scrollFactor-1 ones - which would quietly break
 * every panel, since `drawSlab` and `addVignette` pin themselves to the
 * camera. Anchoring the origin at the top-left reduces the transform to
 * `(p - scroll * scrollFactor) * 2`, so with zero scroll every object lands at
 * exactly twice its logical position whatever its scroll factor, and all the
 * existing coordinates keep working untouched.
 */
export function useLogicalViewport(scene: Phaser.Scene): void {
  const cam = scene.cameras.main
  cam.setOrigin(0, 0)
  cam.setZoom(RENDER_SCALE)
  useCrispText(scene)
}
