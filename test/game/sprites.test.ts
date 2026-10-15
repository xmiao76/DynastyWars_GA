import { describe, expect, it } from 'vitest'
import { isPropKind, textureKeyFor, portraitKeyFor } from '../../src/game/adapters/sprites'
import { artBoxFor, propKinds } from '../../src/game/art/registry'
describe('shared sprite registry', () => {
  it('owns exactly the four single-texture props, never humanoids', () => {
    expect(propKinds().sort()).toEqual(['arrow', 'crate', 'meat', 'sword'])
    for (const kind of propKinds()) { expect(isPropKind(kind)).toBe(true); expect(artBoxFor(kind)).toBeDefined(); expect(textureKeyFor(kind)).toBe('entity:' + kind) }
    expect(isPropKind('guanyu')).toBe(false); expect(artBoxFor('guanyu')).toBeUndefined()
    expect(portraitKeyFor('guanyu')).toBe('portrait:guanyu')
  })
})
