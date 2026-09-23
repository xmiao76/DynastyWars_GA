import Phaser from 'phaser'
import { RENDER_SCALE } from '../render'
import { publishHeroArt, queueHeroArt } from '../adapters/hero-art'
import { loadDisplayFont } from '../ui/type'
import displayFontUrl from '../assets/fonts/zcool-qingke-huangyou-subset.woff2?url'
import titleKeyartUrl from '../assets/title/keyart-backdrop.jpg?url'

interface ArtManifest {
  sprites?: Record<string, string[]>
  portraits?: string[]
}

/**
 * Boot scene: preloads baked art in the background but never blocks the app.
 * The manifest JSON is loaded in the preload phase (safe even if this scene is
 * later shut down); the image batch is queued here and started here. It only
 * transitions to title AFTER every batched image has completed or errored, so
 * the loader stays alive while it works. Any missing texture still gets the
 * pixel fallback in GameScene/SelectScene.
 */
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
    // Title key art: a missing file only costs the photo backdrop - TitleScene
    // paints the procedural dusk battle instead (same atomic-art philosophy).
    this.load.image('ui:keyart-photo', titleKeyartUrl)
  }

  create(): void {
    publishHeroArt(this)
    this.generateFxTextures()
    // Display face before the first text-bearing scene. Bounded and silent on
    // failure: every live style already names the system fallback, so a
    // blocked font only costs the letterforms, never the boot.
    void loadDisplayFont(displayFontUrl, 2500).then(() => this.enterTitle())
  }

  private enterTitle(): void {
    // A build that ships no baked art never asks the server for a manifest.
    // This used to be decided by fetching and seeing what came back, which
    // made the game's appearance depend on a file being ABSENT: after
    // `public/assets` was deleted, Cloudflare's edge cache went on serving the
    // old manifest and its placeholder sprites for days, so the deployed game
    // loaded the old art over the new while the identical bundle looked
    // correct locally. The build decides now, and the answer is in the bundle.
    // `?bakedart=1` forces the lookup so e2e can still exercise the pipeline
    // against a served fixture while no baked art ships. It is a debug switch
    // in the same family as ?autopilot=1; nothing in normal play sets it.
    const forced = new URLSearchParams(window.location.search).get('bakedart') === '1'
    if (!__HAS_BAKED_ART__ && !forced) {
      this.scene.start('title')
      return
    }
    // Plain fetch, not this.load.json: a missing manifest is answered with an
    // index.html fallback by both the dev server and Pages, and the JSON
    // loader throws "Unexpected token '<'" as an uncaught page error.
    void this.loadManifest().then((manifest) => this.startPreload(manifest))
  }

  private async loadManifest(): Promise<ArtManifest | null> {
    try {
      const res = await fetch('assets/manifest.json')
      if (!res.ok) return null
      if (!(res.headers.get('content-type') ?? '').includes('json')) return null
      return (await res.json()) as ArtManifest
    } catch {
      return null
    }
  }

  private startPreload(manifest: ArtManifest | null): void {
    const toLoad: Array<[string, string]> = []
    if (manifest) {
      for (const [kind, poses] of Object.entries(manifest.sprites ?? {})) {
        for (const pose of poses) toLoad.push([`entity:${kind}:${pose}`, `assets/sprites/${kind}/${pose}.png`])
      }
      for (const charId of manifest.portraits ?? []) toLoad.push([`portrait:${charId}`, `assets/portraits/${charId}.png`])
    }
    if (toLoad.length === 0) {
      this.scene.start('title')
      return
    }
    for (const [key, url] of toLoad) this.load.image(key, url)
    this.load.once('complete', () => this.scene.start('title'))
    this.load.start()
  }

  /**
   * Impact textures, baked on canvas so they carry the same ink-and-light
   * treatment as everything else. The old pair were a plain square and a plain
   * circle from `Graphics.generateTexture` - fine as placeholders, but they
   * were the last things on screen with no relationship to the art around them.
   */
  private generateFxTextures(): void {
    bake(this, 'fx:spark', 16, 16, (ctx) => {
      // A four-point star: the shape a hit spark reads as even at two pixels.
      ctx.translate(8, 8)
      ctx.fillStyle = 'rgba(255, 236, 170, 0.95)'
      ctx.beginPath()
      for (let i = 0; i < 8; i += 1) {
        const r = i % 2 === 0 ? 8 : 2.4
        const a = (i / 8) * Math.PI * 2
        const x = Math.cos(a) * r
        const y = Math.sin(a) * r
        if (i === 0) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(0, 0, 2.6, 0, Math.PI * 2)
      ctx.fill()
    })

    bake(this, 'fx:dust', 12, 12, (ctx) => {
      const g = ctx.createRadialGradient(6, 6, 0, 6, 6, 6)
      g.addColorStop(0, 'rgba(226, 214, 186, 0.85)')
      g.addColorStop(0.6, 'rgba(198, 184, 152, 0.4)')
      g.addColorStop(1, 'rgba(198, 184, 152, 0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, 12, 12)
    })
  }
}
