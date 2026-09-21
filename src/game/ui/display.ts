import type Phaser from 'phaser'

/**
 * Destroy every object a scene has on its display list.
 *
 * This exists because `scene.children.removeAll(true)` reads like "remove them
 * all and destroy them" and is neither: `Phaser.Structs.List.removeAll` takes
 * SKIPCALLBACK, not `destroyChild`. The `true` only suppresses the list's own
 * remove callback, so every object is unlinked from the display list and left
 * alive - still holding its textures, still registered with the input plugin.
 *
 * That is not a theoretical difference. `GameScene` builds the on-screen touch
 * controls into the HUD scene, `HudScene.create` then swept the list, and the
 * result shipped: the d-pad and the A/B/C buttons stopped being DRAWN while
 * their hit zones stayed live, so a phone player had to find invisible buttons
 * by feel. No gate saw it, because every touch test drives the input system,
 * which was working the whole time.
 *
 * `destroy()` unlinks the object itself, so the list is copied before iterating.
 */
export function destroyAllChildren(scene: Phaser.Scene): void {
  for (const child of [...scene.children.list]) child.destroy()
}
