import type { ChunkType, WorldChunk } from '#shared/types/chunk'
import type { BiomeType } from '@chatgame/sprites'
import type { Game } from '../types'
import { CLEARING_NAMES, FIELD_NAMES, FOREST_LENGTH, FOREST_NAMES, VILLAGE_LENGTH, VILLAGE_NAMES } from '#shared/types/chunk'
import { getRandInteger } from '#shared/utils/random'
import { createBush, PALETTE } from '@chatgame/sprites'
import { createId } from '@paralleldrive/cuid2'
import { Container, Graphics, Sprite, Text } from 'pixi.js'
import { TargetPoint } from '../objects/targetPoint'
import { NpcObject } from '../objects/unit/npcObject'
import { MoveToTargetScript } from '../scripts/moveToTargetScript'

const BIOMES: BiomeType[] = ['GREEN', 'BLUE', 'STONE', 'TEAL', 'TOXIC', 'VIOLET']
const FORESTS_BETWEEN_VILLAGES = [2, 3] // 2 or 3 forests between villages
const GENERATE_AHEAD = 15000 // generate chunks this far ahead of wagon
const REMOVE_BEHIND = 5000

export class GameChunkService {
  chunks: WorldChunk[] = []
  private nextX = 0
  private biomeIndex = 0
  private villageIndex = 0
  private forestsSinceVillage = 0
  private forestsUntilVillage = 2
  private bushes: Container[] = []

  private initialized = false

  private wheatStalks: Container[] = []
  /** All spawned objects per chunk — for cleanup */
  private chunkObjects = new Map<string, { containers: Container[], npcs: NpcObject[], tickers: (() => void)[] }>()

  constructor(readonly game: Game) {
    this.forestsUntilVillage = FORESTS_BETWEEN_VILLAGES[getRandInteger(0, 1)]!
    this.nextX = -500 // start before wagon so ground behind is covered
  }

  update() {
    if (!this.initialized) {
      this.initialized = true
      // Start in a village, like production
      this.generateChunk('village')
      this.forestsSinceVillage = 0
    }
    const wagonX = this.game.wagonService.wagon?.x ?? 0

    // Generate chunks ahead: clearing → forest → forest → village → clearing → ...
    while (this.nextX < wagonX + GENERATE_AHEAD) {
      if (this.forestsSinceVillage >= this.forestsUntilVillage) {
        this.generateChunk('village')
        this.forestsSinceVillage = 0
        this.forestsUntilVillage = FORESTS_BETWEEN_VILLAGES[getRandInteger(0, 1)]!
      } else if (this.forestsSinceVillage === 0) {
        // First chunk after village — clearing or field
        this.generateChunk(getRandInteger(0, 1) === 0 ? 'clearing' : 'field')
        this.forestsSinceVillage++
      } else {
        this.generateChunk('forest')
        this.forestsSinceVillage++
      }
    }

    // Remove old chunks + cleanup their objects
    const removedChunks = this.chunks.filter((c) => c.endX <= wagonX - REMOVE_BEHIND)
    for (const rc of removedChunks) {
      this.cleanupChunk(rc.id)
    }
    this.chunks = this.chunks.filter((c) => c.endX > wagonX - REMOVE_BEHIND)

    // Remove old bushes
    this.bushes = this.bushes.filter((b) => {
      if (b.destroyed || b.x < wagonX - REMOVE_BEHIND) {
        if (!b.destroyed) {
          b.destroy({ children: true })
        }
        return false
      }
      return true
    })
  }

  private cleanupChunk(chunkId: string) {
    const tracked = this.chunkObjects.get(chunkId)
    if (!tracked) {
      return
    }

    // Destroy containers (houses, signs, fire, benches, wheat walls)
    for (const c of tracked.containers) {
      if (!c.destroyed) {
        c.destroy({ children: true })
      }
    }

    // Destroy NPCs
    for (const npc of tracked.npcs) {
      if (!npc.destroyed) {
        npc.destroy()
      }
    }

    // Remove tickers
    for (const ticker of tracked.tickers) {
      this.game.app.ticker.remove(ticker)
    }

    this.chunkObjects.delete(chunkId)
  }

  /** Track a container for cleanup when chunk is removed */
  private track(chunkId: string, container: Container) {
    this.chunkObjects.get(chunkId)?.containers.push(container)
  }

  private trackNpc(chunkId: string, npc: NpcObject) {
    this.chunkObjects.get(chunkId)?.npcs.push(npc)
  }

  private trackTicker(chunkId: string, ticker: () => void) {
    this.chunkObjects.get(chunkId)?.tickers.push(ticker)
  }

  getCurrentChunk(): WorldChunk | null {
    const wagonX = this.game.wagonService.wagon?.x ?? 0
    return this.chunks.find((c) => wagonX >= c.startX && wagonX < c.endX) ?? null
  }

  getNextVillageChunk(): WorldChunk | null {
    const wagonX = this.game.wagonService.wagon?.x ?? 0
    return this.chunks.find((c) => c.type === 'village' && c.startX > wagonX) ?? null
  }

  private generateChunk(type: ChunkType) {
    // Fields always use TOXIC biome (yellow/olive ground)
    const biome = type === 'field'
      ? 'TOXIC' as BiomeType
      : BIOMES[this.biomeIndex % BIOMES.length]! as BiomeType
    const length = type === 'village' ? VILLAGE_LENGTH : type === 'field' ? 3500 : FOREST_LENGTH
    const startX = this.nextX
    const endX = startX + length

    const chunk: WorldChunk = {
      id: createId(),
      type,
      name: this.generateName(type, biome),
      biome,
      startX,
      endX,
    }

    this.chunks.push(chunk)
    this.chunkObjects.set(chunk.id, { containers: [], npcs: [], tickers: [] })
    this.nextX = endX

    // Generate content
    if (type === 'forest') {
      this.populateForest(chunk)
      this.biomeIndex++
    } else if (type === 'clearing') {
      this.populateClearing(chunk)
      this.biomeIndex++
    } else if (type === 'field') {
      this.populateField(chunk)
      this.biomeIndex++
    } else {
      this.populateVillage(chunk)
    }
  }

  private generateName(type: ChunkType, biome: BiomeType): string {
    if (type === 'village') {
      const name = VILLAGE_NAMES[this.villageIndex % VILLAGE_NAMES.length]!
      this.villageIndex++
      return name
    }
    if (type === 'clearing') {
      const names = CLEARING_NAMES[biome] ?? CLEARING_NAMES.GREEN
      return names[getRandInteger(0, names.length - 1)]!
    }
    if (type === 'field') {
      return FIELD_NAMES[getRandInteger(0, FIELD_NAMES.length - 1)]!
    }
    const names = FOREST_NAMES[biome] ?? FOREST_NAMES.GREEN
    return names[getRandInteger(0, names.length - 1)]!
  }

  private populateClearing(chunk: WorldChunk) {
    const treeCount = getRandInteger(12, 18)
    const bushCount = getRandInteger(6, 10)

    for (let i = 0; i < treeCount; i++) {
      const x = chunk.startX + getRandInteger(100, chunk.endX - chunk.startX - 100)
      this.game.treeService.create({
        id: createId(),
        x,
        variant: chunk.biome as BiomeType,
        size: getRandInteger(50, 90),
        maxSize: getRandInteger(70, 120),
      })
    }

    this.spawnBushes(chunk, bushCount)
  }

  private populateForest(chunk: WorldChunk) {
    const treeCount = getRandInteger(45, 55)
    const bushCount = getRandInteger(12, 18)

    // Trees — spread across chunk
    for (let i = 0; i < treeCount; i++) {
      const x = chunk.startX + getRandInteger(100, chunk.endX - chunk.startX - 100)
      this.game.treeService.create({
        id: createId(),
        x,
        variant: chunk.biome as BiomeType,
        size: getRandInteger(60, 100),
        maxSize: getRandInteger(80, 150),
      })
    }

    this.spawnBushes(chunk, bushCount)
  }

  private spawnBushes(chunk: WorldChunk, count: number) {
    for (let i = 0; i < count; i++) {
      const x = chunk.startX + getRandInteger(200, chunk.endX - chunk.startX - 200)

      const tooClose = this.bushes.some((b) => !b.destroyed && Math.abs(b.x - x) < 120)
      if (tooClose) {
        continue
      }

      const bushGraphics = createBush({ biome: chunk.biome })
      const texture = this.game.app.renderer.generateTexture({
        target: bushGraphics,
        textureSourceOptions: { scaleMode: 'nearest' },
      })
      bushGraphics.destroy({ children: true })

      const bush = new Sprite(texture)
      bush.anchor.set(0.5, 1)
      bush.scale.set(4)
      bush.x = x
      bush.y = this.game.bottomY
      bush.zIndex = getRandInteger(-8, -4)

      this.game.worldContainer.addChild(bush)
      this.bushes.push(bush)
      this.track(chunk.id, bush)
    }
  }

  private populateField(chunk: WorldChunk) {
    const P = PALETTE
    const chunkWidth = chunk.endX - chunk.startX

    // Layer 1: Dense wheat wall — wide chunks, smooth gradient
    const wheatChunkSize = 96
    const wheatChunks = Math.ceil(chunkWidth / wheatChunkSize)

    // Color bands from bottom to top
    const bottomColors = [P.darkBrown, P.brown1, P.brown2]
    const midColors = [P.brown2, P.brownOrange, P.orange2]
    const upperColors = [P.orange2, P.brownOrange, P.gold, P.yellow1]
    const topColors = [P.gold, P.yellow1, P.paleYellow]
    const tipColors = [P.paleYellow, P.cream, P.yellow1]

    for (let c = 0; c < wheatChunks; c++) {
      const cx = chunk.startX + c * wheatChunkSize
      const g = new Graphics()

      const totalH = 55

      // Columns in pairs (2px wide) — prevents subpixel flicker
      for (let s = 0; s < wheatChunkSize; s += 2) {
        const colH = totalH + ((s * 13 + c * 7) % 10) - 3
        const seed = s * 31 + c * 17

        // Bottom band (0-30%) — dark
        const botH = Math.floor(colH * 0.3)
        g.rect(s, -botH, 2, botH).fill(bottomColors[seed % 3]!)

        // Mid band (30-55%) — orange transition
        const midH = Math.floor(colH * 0.55)
        g.rect(s, -midH, 2, midH - botH).fill(midColors[(seed + 1) % 3]!)

        // Upper band (55-80%) — gold
        const upH = Math.floor(colH * 0.8)
        g.rect(s, -upH, 2, upH - midH).fill(upperColors[(seed + 2) % 4]!)

        // Top band (80-100%) — bright yellow
        g.rect(s, -colH, 2, colH - upH).fill(topColors[seed % 3]!)

        // Grain tip
        g.rect(s, -colH - 2, 2, 2).fill(tipColors[(seed + 1) % 3]!)
      }

      // Shimmer specks
      for (let sp = 0; sp < 20; sp++) {
        const sx = (c * 11 + sp * 17) % wheatChunkSize
        const sy = -((c * 5 + sp * 13) % (totalH - 10)) - 10
        g.rect(sx, sy, 1, 1).fill(P.paleYellow)
      }

      const texture = this.game.app.renderer.generateTexture({
        target: g,
        textureSourceOptions: { scaleMode: 'nearest' },
      })
      g.destroy()

      const sprite = new Sprite(texture)
      sprite.anchor.set(0, 1)
      sprite.roundPixels = true
      sprite.x = Math.round(cx)
      sprite.y = this.game.bottomY - 4
      sprite.zIndex = -10
      this.game.worldContainer.addChild(sprite)
      this.track(chunk.id, sprite)
    }

    // Layer 3: Foreground animated stalks — baked to textures, rotated as Sprites
    const stalkVariants: Sprite[] = []

    // Pre-bake 6 stalk texture variants
    for (let v = 0; v < 6; v++) {
      const g = new Graphics()
      const h = 30 + v * 3
      const stemColor = [P.gold, P.yellow1, P.orange2][v % 3]!
      const grainColor = [P.paleYellow, P.yellow1, P.cream][v % 3]!

      // Stem
      g.rect(0, -h, 2, h).fill(stemColor)

      // Wheat ear — oval head with grain kernels on sides
      // Center column
      g.rect(0, -h - 8, 2, 8).fill(grainColor)
      // Left kernels
      g.rect(-2, -h - 7, 2, 2).fill(grainColor)
      g.rect(-2, -h - 4, 2, 2).fill(grainColor)
      // Right kernels
      g.rect(2, -h - 6, 2, 2).fill(grainColor)
      g.rect(2, -h - 3, 2, 2).fill(grainColor)
      // Tip
      g.rect(0, -h - 10, 2, 2).fill(P.cream)
      // Awns (whiskers)
      g.rect(-1, -h - 11, 1, 2).fill(P.paleYellow)
      g.rect(2, -h - 10, 1, 2).fill(P.paleYellow)
      const tex = this.game.app.renderer.generateTexture({ target: g, textureSourceOptions: { scaleMode: 'nearest' } })
      g.destroy()
      const template = new Sprite(tex)
      stalkVariants.push(template)
    }

    const animatedCount = getRandInteger(180, 250)
    const stalks: { sprite: Sprite, phase: number, speed: number, amp: number }[] = []

    for (let i = 0; i < animatedCount; i++) {
      const x = chunk.startX + getRandInteger(20, chunkWidth - 20)
      const variant = stalkVariants[i % stalkVariants.length]!
      const sprite = new Sprite(variant.texture)
      sprite.anchor.set(0.5, 1)
      sprite.scale.set(1.5)
      sprite.roundPixels = true
      sprite.x = Math.round(x)
      sprite.y = this.game.bottomY
      sprite.zIndex = getRandInteger(-6, -2)
      this.game.worldContainer.addChild(sprite)
      this.track(chunk.id, sprite)

      stalks.push({
        sprite,
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.4,
        amp: 2.5 + Math.random() * 2.5,
      })
    }

    // Single ticker for ALL stalks
    const stalkTickerFn = () => {
      const t = performance.now() / 1000
      for (const s of stalks) {
        if (s.sprite.destroyed) {
          continue
        }
        s.sprite.angle = Math.sin(t * s.speed + s.phase) * s.amp + Math.sin(t * 1.5 + s.phase * 2) * 1.0
      }
    }
    this.game.app.ticker.add(stalkTickerFn)
    this.trackTicker(chunk.id, stalkTickerFn)

    // A few scattered trees at edges (not blocking)
    for (let i = 0; i < 3; i++) {
      const x = i === 0 ? chunk.startX + getRandInteger(50, 200) : chunk.endX - getRandInteger(50, 200)
      this.game.treeService.create({
        id: createId(),
        x,
        variant: chunk.biome as BiomeType,
        size: getRandInteger(40, 70),
        maxSize: getRandInteger(60, 80),
        zIndex: -20,
      })
    }
  }

  private populateVillage(chunk: WorldChunk) {
    const centerX = (chunk.startX + chunk.endX) / 2
    const P = PALETTE
    const groundY = this.game.bottomY

    // ── Trade shop ────────────────────────────────────
    const shop = new Graphics()

    // Back wall — muted dark
    shop.rect(-16, -30, 32, 30).fill(P.darkBrown)
    shop.rect(-16, -30, 32, 1).fill(P.darkPurple)
    shop.rect(-16, -30, 1, 30).fill(P.darkPurple)
    shop.rect(15, -30, 1, 30).fill(P.darkPurple)

    // Shelves on back wall
    shop.rect(-14, -26, 28, 1).fill(P.brown1)
    shop.rect(-14, -20, 28, 1).fill(P.brown1)
    // Goods on shelves — muted tones
    shop.rect(-12, -29, 3, 3).fill(P.red1)
    shop.rect(-8, -29, 2, 3).fill(P.darkGreen)
    shop.rect(-5, -28, 4, 2).fill(P.brownOrange)
    shop.rect(1, -29, 3, 3).fill(P.brown2)
    shop.rect(5, -28, 3, 2).fill(P.darkTeal)
    shop.rect(9, -29, 4, 3).fill(P.plum)
    // Lower shelf
    shop.rect(-12, -23, 4, 3).fill(P.brown2)
    shop.rect(-7, -23, 3, 3).fill(P.red1)
    shop.rect(-3, -22, 5, 2).fill(P.tan)
    shop.rect(4, -23, 3, 3).fill(P.olive)
    shop.rect(8, -22, 5, 2).fill(P.brownOrange)

    // Counter — dark wood
    shop.rect(-18, -14, 36, 3).fill(P.brown1)
    shop.rect(-18, -11, 36, 11).fill(P.brown2)
    // Counter front detail
    shop.rect(-17, -10, 2, 9).fill(P.darkBrown)
    shop.rect(-12, -10, 2, 9).fill(P.darkBrown)
    shop.rect(-4, -10, 2, 9).fill(P.darkBrown)
    shop.rect(4, -10, 2, 9).fill(P.darkBrown)
    shop.rect(12, -10, 2, 9).fill(P.darkBrown)
    // Counter top items — subtle
    shop.rect(-15, -17, 4, 3).fill(P.brownOrange)
    shop.rect(-14, -18, 2, 1).fill(P.silver)
    shop.rect(-7, -16, 3, 2).fill(P.red1)
    shop.rect(-3, -17, 2, 3).fill(P.darkGreen)
    shop.rect(2, -16, 5, 2).fill(P.brown2)
    shop.rect(9, -17, 3, 3).fill(P.tan)

    // Awning poles
    shop.rect(-19, -38, 2, 38).fill(P.brown1)
    shop.rect(17, -38, 2, 38).fill(P.brown1)
    shop.rect(-19, -38, 38, 2).fill(P.brown1)

    // Striped awning — muted stripes
    for (let i = 0; i < 10; i++) {
      const awningColor = i % 2 === 0 ? P.tan : P.mauve
      shop.rect(-20 + i * 4, -40, 4, 4).fill(awningColor)
    }
    for (let i = 0; i < 20; i++) {
      const fringeColor = i % 2 === 0 ? P.tan : P.mauve
      shop.rect(-20 + i * 2, -36, 2, 1).fill(fringeColor)
    }
    shop.rect(-20, -41, 40, 1).fill(P.brown1)

    // Crate stack (left)
    shop.rect(-26, -8, 7, 8).fill(P.brown2)
    shop.rect(-26, -9, 7, 1).fill(P.darkBrown)
    shop.rect(-25, -7, 1, 6).fill(P.brown1)
    shop.rect(-21, -7, 1, 6).fill(P.brown1)
    shop.rect(-25, -14, 6, 5).fill(P.darkBrown)
    shop.rect(-25, -15, 6, 1).fill(P.brown1)

    // Barrel (right)
    shop.rect(20, -10, 6, 10).fill(P.darkBrown)
    shop.rect(20, -11, 6, 1).fill(P.brown1)
    shop.rect(20, -6, 6, 1).fill(P.brown1)
    shop.rect(20, -1, 6, 1).fill(P.brown1)
    shop.rect(22, -10, 2, 10).fill(P.brown2)

    // Sack
    shop.rect(27, -6, 5, 6).fill(P.tan)
    shop.rect(28, -7, 3, 1).fill(P.brown2)

    shop.scale.set(4)
    shop.x = centerX + 250
    shop.y = groundY
    shop.zIndex = -8
    this.game.worldContainer.addChild(shop)
    this.track(chunk.id, shop)

    // ── Animated campfire ────────────────────────────
    // Campfire — logs + animated flame + smoke
    const fireX = centerX

    // Logs base (static)
    const fireBase = new Graphics()
    // Stones ring
    fireBase.rect(-8, -2, 3, 2).fill(P.grayGreen1)
    fireBase.rect(5, -2, 3, 2).fill(P.grayGreen1)
    fireBase.rect(-6, -1, 2, 1).fill(P.darkGray)
    fireBase.rect(4, -1, 2, 1).fill(P.darkGray)
    // Logs
    fireBase.rect(-5, -4, 10, 3).fill(P.darkBrown)
    fireBase.rect(-4, -5, 8, 1).fill(P.brown2)
    // Cross logs
    fireBase.rect(-7, -3, 5, 2).fill(P.brown1)
    fireBase.rect(2, -3, 5, 2).fill(P.brown1)
    fireBase.scale.set(3)
    fireBase.x = fireX
    fireBase.y = groundY
    fireBase.zIndex = 3
    this.game.worldContainer.addChild(fireBase)
    this.track(chunk.id, fireBase)

    // Flame (animated) — starts from top of logs (-5 * 3 = -15px)
    const flame = new Graphics()
    flame.scale.set(3)
    flame.x = fireX
    flame.y = groundY
    flame.zIndex = 4
    this.game.worldContainer.addChild(flame)

    // Smoke
    const smokeContainer = new Container()
    smokeContainer.x = fireX
    smokeContainer.y = groundY - 30
    smokeContainer.zIndex = 1
    this.game.worldContainer.addChild(smokeContainer)
    this.track(chunk.id, smokeContainer)

    // Pre-drawn fire frames — hand-crafted pixel art, cycled as animation
    const frames: [number, number, number][][] = [
      // Frame 1
      [[-3, -6, P.darkRed], [-2, -6, P.darkRed], [-1, -6, P.darkRed], [0, -6, P.darkRed], [1, -6, P.darkRed], [2, -6, P.darkRed], [-3, -7, P.brightRed], [-2, -7, P.brightRed], [-1, -7, P.orange1], [0, -7, P.brightRed], [1, -7, P.brightRed], [2, -7, P.brightRed], [-2, -8, P.brightRed], [-1, -8, P.orange1], [0, -8, P.orange2], [1, -8, P.brightRed], [-2, -9, P.orange1], [-1, -9, P.orange2], [0, -9, P.gold], [1, -9, P.orange1], [-1, -10, P.orange2], [0, -10, P.gold], [1, -10, P.orange2], [-1, -11, P.gold], [0, -11, P.yellow1], [0, -12, P.paleYellow]],
      // Frame 2
      [[-3, -6, P.darkRed], [-2, -6, P.darkRed], [-1, -6, P.darkRed], [0, -6, P.darkRed], [1, -6, P.darkRed], [2, -6, P.darkRed], [-2, -7, P.brightRed], [-1, -7, P.brightRed], [0, -7, P.orange1], [1, -7, P.brightRed], [2, -7, P.brightRed], [-2, -8, P.orange1], [-1, -8, P.orange2], [0, -8, P.gold], [1, -8, P.orange1], [2, -8, P.brightRed], [-1, -9, P.orange2], [0, -9, P.gold], [1, -9, P.orange2], [2, -9, P.orange1], [-1, -10, P.gold], [0, -10, P.yellow1], [1, -10, P.gold], [0, -11, P.yellow1], [1, -11, P.paleYellow], [0, -12, P.cream]],
      // Frame 3
      [[-3, -6, P.darkRed], [-2, -6, P.darkRed], [-1, -6, P.darkRed], [0, -6, P.darkRed], [1, -6, P.darkRed], [2, -6, P.darkRed], [-3, -7, P.brightRed], [-2, -7, P.orange1], [-1, -7, P.brightRed], [0, -7, P.brightRed], [1, -7, P.orange1], [2, -7, P.brightRed], [-3, -8, P.brightRed], [-2, -8, P.orange2], [-1, -8, P.gold], [0, -8, P.orange1], [1, -8, P.brightRed], [-2, -9, P.orange2], [-1, -9, P.gold], [0, -9, P.orange2], [-2, -10, P.gold], [-1, -10, P.yellow1], [0, -10, P.orange2], [-1, -11, P.yellow1], [0, -11, P.gold], [-1, -12, P.paleYellow]],
      // Frame 4
      [[-2, -6, P.darkRed], [-1, -6, P.darkRed], [0, -6, P.darkRed], [1, -6, P.darkRed], [2, -6, P.darkRed], [3, -6, P.darkRed], [-2, -7, P.brightRed], [-1, -7, P.brightRed], [0, -7, P.orange1], [1, -7, P.brightRed], [2, -7, P.brightRed], [-1, -8, P.brightRed], [0, -8, P.orange2], [1, -8, P.gold], [2, -8, P.orange1], [-1, -9, P.orange1], [0, -9, P.gold], [1, -9, P.orange2], [0, -10, P.gold], [1, -10, P.yellow1], [0, -11, P.yellow1], [1, -11, P.paleYellow], [1, -12, P.cream]],
    ]

    // Bake frames into textures
    const fireTextures = frames.map((pixels) => {
      const fg = new Graphics()
      for (const [x, y, color] of pixels) {
        fg.rect(x, y, 1, 1).fill(color)
      }
      const tex = this.game.app.renderer.generateTexture({ target: fg, textureSourceOptions: { scaleMode: 'nearest' } })
      fg.destroy()
      return tex
    })

    // Replace Graphics flame with animated Sprite
    flame.destroy()
    const fireSprite = new Sprite(fireTextures[0]!)
    fireSprite.anchor.set(0.5, 1)
    fireSprite.scale.set(5)
    fireSprite.x = fireX
    fireSprite.y = groundY - 4
    fireSprite.zIndex = 4
    this.game.worldContainer.addChild(fireSprite)
    this.track(chunk.id, fireSprite)

    let fireFrame = 0
    let fireTick = 0
    const fireTickerFn = () => {
      fireTick++
      if (fireTick % 10 === 0) {
        fireFrame = (fireFrame + 1) % fireTextures.length
        fireSprite.texture = fireTextures[fireFrame]!
      }
    }
    this.game.app.ticker.add(fireTickerFn)
    this.trackTicker(chunk.id, fireTickerFn)

    // Pre-bake smoke textures (3 variants)
    const smokeTex = [0, 1, 2].map((v) => {
      const sg = new Graphics()
      const offsets = [
        [[0, 0, 2, 2], [2, -1, 2, 2], [-1, -1, 2, 1], [1, -2, 1, 1]],
        [[0, 0, 3, 2], [-1, -1, 2, 2], [2, -2, 1, 1], [0, -2, 2, 1]],
        [[0, 0, 2, 3], [2, 0, 1, 2], [-1, -1, 2, 1], [1, -2, 2, 1], [-1, 1, 1, 1]],
      ][v]!
      for (const [x, y, w, h] of offsets) {
        sg.rect(x!, y!, w!, h!).fill({ color: P.silver, alpha: 0.3 })
      }
      const tex = this.game.app.renderer.generateTexture({ target: sg, textureSourceOptions: { scaleMode: 'nearest' } })
      sg.destroy()
      return tex
    })

    const smokeTickerFn = () => {
      if (Math.random() > 0.88) {
        const puff = new Sprite(smokeTex[Math.floor(Math.random() * smokeTex.length)]!)
        puff.anchor.set(0.5)
        puff.x = (Math.random() - 0.5) * 6
        puff.y = 0
        puff.scale.set(3)
        smokeContainer.addChild(puff)

        let life = 0
        const drift = (Math.random() - 0.5) * 0.15
        const puffTick = () => {
          life++
          puff.x += drift
          puff.y -= 0.3
          puff.alpha -= 0.003
          if (puff.alpha <= 0 || life > 200) {
            this.game.app.ticker.remove(puffTick)
            puff.destroy()
          }
        }
        this.game.app.ticker.add(puffTick)
      }
    }
    this.game.app.ticker.add(smokeTickerFn)
    this.trackTicker(chunk.id, smokeTickerFn)

    // ── Houses — far from center ─────────────────────
    const housePositions = [-500, -380, 380, 500]
    for (let i = 0; i < housePositions.length; i++) {
      const house = this.createHouse(i)
      house.x = centerX + housePositions[i]!
      house.y = groundY
      house.zIndex = -25
      this.game.worldContainer.addChild(house)
      this.track(chunk.id, house)
    }

    // ── Signpost — wooden post with hanging sign board ──
    const sign = new Graphics()

    // Main pole — thicker
    sign.rect(-2, -36, 4, 36).fill(P.darkBrown)
    sign.rect(-3, -37, 6, 1).fill(P.brown2) // cap
    sign.rect(-3, 0, 6, 2).fill(P.darkBrown) // base

    // Hanging arm (horizontal beam)
    sign.rect(2, -34, 26, 2).fill(P.darkBrown)
    sign.rect(27, -35, 1, 3).fill(P.brown2) // end cap

    // Sign board — hanging from arm
    sign.rect(-1, -31, 30, 10).fill(P.brown2)
    sign.rect(-1, -31, 30, 1).fill(P.darkBrown)
    sign.rect(-1, -22, 30, 1).fill(P.darkBrown)
    sign.rect(-1, -31, 1, 10).fill(P.darkBrown)
    sign.rect(28, -31, 1, 10).fill(P.darkBrown)
    sign.rect(0, -30, 28, 8).fill(P.cream)
    // Hanging chains
    sign.rect(4, -32, 1, 1).fill(P.silver)
    sign.rect(22, -32, 1, 1).fill(P.silver)

    // Decorative lantern on top
    sign.rect(-2, -40, 1, 3).fill(P.darkBrown)
    sign.rect(-3, -41, 3, 1).fill(P.brown2)
    sign.rect(-3, -43, 3, 2).fill(P.gold)
    sign.rect(-3, -44, 3, 1).fill(P.darkBrown)

    sign.scale.set(4)
    sign.x = centerX - 350
    sign.y = groundY
    sign.zIndex = 2
    this.game.worldContainer.addChild(sign)
    this.track(chunk.id, sign)

    // Village name on sign
    const signName = new Text({
      text: chunk.name,
      style: {
        fontFamily: 'serif',
        fontSize: 20,
        fontWeight: '700',
        fill: '#4C3E24',
        align: 'center',
      },
    })
    signName.anchor.set(0.5, 0.5)
    signName.x = centerX - 350 + 56
    signName.y = groundY - 106
    signName.zIndex = 3
    this.game.worldContainer.addChild(signName)
    this.track(chunk.id, signName)

    // ── Decorative trees ─────────────────────────────
    const treePositions = [-600, -550, 550, 600]
    for (const tx of treePositions) {
      this.game.treeService.create({
        id: createId(),
        x: centerX + tx,
        variant: chunk.biome as BiomeType,
        size: getRandInteger(50, 80),
        maxSize: getRandInteger(70, 100),
        zIndex: -20,
      })
    }

    // ── Bench near campfire ──────────────────────────
    const bench = new Graphics()
    bench.rect(-8, -5, 16, 2).fill(P.brown2)
    bench.rect(-7, -3, 2, 4).fill(P.darkBrown)
    bench.rect(5, -3, 2, 4).fill(P.darkBrown)
    bench.scale.set(3)
    bench.x = centerX - 60
    bench.y = groundY
    bench.zIndex = 1
    this.game.worldContainer.addChild(bench)
    this.track(chunk.id, bench)

    // ── Village NPCs ─────────────────────────────────
    for (let i = 0; i < 3; i++) {
      const npc = new NpcObject({
        game: this.game,
        x: centerX + getRandInteger(-200, 200),
        y: groundY,
      })
      npc.zIndex = -1
      npc.initNpc()
      this.trackNpc(chunk.id, npc)

      // Override wander to stay near village center
      const origLive = npc.live.bind(npc)
      let idleCount = 0
      npc.live = () => {
        if (!npc.script) {
          idleCount++
          if (idleCount > getRandInteger(150, 400)) {
            idleCount = 0
            const target = new TargetPoint(
              centerX + getRandInteger(-300, 300),
              groundY,
            )
            npc.script = new MoveToTargetScript({ object: npc, target })
          }
        }
        origLive()
      }
    }
  }

  private createHouse(variant: number): Graphics {
    const P = PALETTE
    const g = new Graphics()
    const w = 24 + variant * 4
    const h = 18 + variant * 3
    const roofH = Math.floor(w * 0.4) // roof proportional to width

    // Dark muted colors
    const wallColor = [P.purple1, P.darkViolet, P.purple2, P.plum][variant % 4]!
    const roofColor = [P.darkPurple, P.darkBrown, P.purple1, P.darkViolet][variant % 4]!
    const winColor = [P.darkBlue, P.blue1, P.darkViolet][variant % 3]!

    // Walls
    g.rect(-w / 2, -h, w, h).fill(wallColor)
    // Foundation
    g.rect(-w / 2 - 1, -2, w + 2, 2).fill(P.darkPurple)

    // Roof — gentle slope
    for (let i = 0; i < roofH; i++) {
      const indent = Math.floor(i * (w + 4) / roofH / 2)
      g.rect(-w / 2 - 2 + indent, -h - i - 1, w + 4 - indent * 2, 1).fill(roofColor)
    }
    // Roof overhang
    g.rect(-w / 2 - 2, -h - 1, w + 4, 1).fill(roofColor)

    // Door — centered, proportional
    const doorW = Math.floor(w * 0.18)
    const doorH = Math.floor(h * 0.4)
    g.rect(-doorW / 2, -doorH, doorW, doorH).fill(P.darkPurple)

    // Windows — small, proportional, spaced
    const winW = 3
    const winH = 3
    const winY = -h + Math.floor(h * 0.3)
    g.rect(-w / 2 + 4, winY, winW, winH).fill(winColor)
    g.rect(w / 2 - 4 - winW, winY, winW, winH).fill(winColor)

    g.scale.set(3)
    return g
  }
}
