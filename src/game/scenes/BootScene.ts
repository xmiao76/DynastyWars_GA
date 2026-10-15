import Phaser from 'phaser'
import { RENDER_SCALE } from '../render'
import { FX_BURST, FX_DUST, FX_SPARK, paintBurst, paintDust, paintSpark } from '../art/fx'
import { publishHeroArt, queueHeroArt } from '../adapters/hero-art'
import { publishBodyArt, queueBodyArt } from '../adapters/body-art'
import { publishWeaponArt, queueWeaponArt } from '../adapters/weapon-art'
import { loadDisplayFont } from '../ui/type'
import displayFontUrl from '../assets/fonts/zcool-qingke-huangyou-subset.woff2?url'
import titleKeyartUrl from '../assets/title/keyart-backdrop.jpg?url'

/** Bake a small FX texture at device density. */
function bake(
  scene: Phaser.Scene,
  key: string,
  w: number,
  h: number,
  paint: (ctx: CanvasRenderingContext2D) => void,
): void {
  if (scene.textures.exists(key)) return
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * RENDER_SCALE)
  canvas.height = Math.round(h * RENDER_SCALE)
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.scale(RENDER_SCALE, RENDER_SCALE)
  paint(ctx)
  scene.textures.addCanvas(key, canvas)
}

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot')
  }

  preload(): void {
    queueHeroArt(this)
    queueBodyArt(this)
    queueWeaponArt(this)
    // Motion packs are stage-scoped: nothing downloads at boot.
    // Title key art: a missing file only costs the photo backdrop - TitleScene
    // paints the procedural dusk battle instead (same atomic-art philosophy).
    this.load.image('ui:keyart-photo', titleKeyartUrl)
  }

  create(): void {
    publishHeroArt(this)
    publishBodyArt(this)
    publishWeaponArt(this)
    this.generateFxTextures()
    // Display face before the first text-bearing scene. Bounded and silent on
    // failure: every live style already names the system fallback, so a
    // blocked font only costs the letterforms, never the boot.
    void loadDisplayFont(displayFontUrl, 2500).then(() => this.scene.start('title'))
  }

  /**
   * Impact textures, baked on canvas so they carry the same ink-and-light
   * treatment as everything else. The painters live in art/fx so the unit
   * suite can render and assert on them directly.
   */
  private generateFxTextures(): void {
    bake(this, 'fx:spark', FX_SPARK.width, FX_SPARK.height, paintSpark)
    bake(this, 'fx:burst', FX_BURST.width, FX_BURST.height, paintBurst)
    bake(this, 'fx:dust', FX_DUST.width, FX_DUST.height, paintDust)
  }
}
