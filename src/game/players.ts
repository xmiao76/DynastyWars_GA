import { CHARACTER_ORDER } from '../core/characters'

/**
 * Who player two plays as. A drop-in join has no select screen of its own, so
 * it takes the first hero player one did NOT pick. Handing them the same hero
 * would put two identical figures on the screen, which is exactly the problem
 * the distinct headgear, beards and weapons exist to avoid.
 *
 * Shared by GameScene (which applies it on join) and SelectScene (which shows
 * it as the 2P preview tag), so the preview cannot drift from what happens.
 */
export function secondPlayerCharacter(firstCharId: string): string {
  return CHARACTER_ORDER.find((id) => id !== firstCharId) ?? CHARACTER_ORDER[0] ?? 'guanyu'
}
