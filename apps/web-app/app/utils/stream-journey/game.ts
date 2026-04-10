import type { Game, GameObject, GameUnitCodename } from './types'
import { PALETTE } from '@chatgame/sprites'
import { createId } from '@paralleldrive/cuid2'
import { Application, Container, Graphics, Sprite } from 'pixi.js'
import { NpcObject } from './objects/unit/npcObject'
import { GameCaravanService, GameChunkService, GameEventService, GamePlayerService, GameTreeService, GameWagonService } from './services'

interface StreamJourneyGameOptions {
  roomId?: string
  demo?: boolean
  demoNames?: string[]
}

const FALLBACK_DEMO_NAMES = ['kungfux010', 'sava5621', 'BezSovesty', 'flack_zombi', 'player_mmcm', 'PeregonStream', 'derailon', 'sloghniy']
const DEMO_CODENAMES: GameUnitCodename[] = ['twitchy', 'banana', 'burger', 'catchy', 'claw', 'gentleman', 'marshmallow', 'pioneer', 'pup', 'santa', 'shape', 'sharky', 'woody', 'wooly']
const DEMO_MESSAGES = [
  'Привет всем! Как дела на стриме?',
  'Го рубить деревья, надо путь расчистить!',
  'Кто-нибудь знает куда мы едем вообще?',
  'Красота какая, лес густой!',
  'Вперёд! Машина не ждёт!',
  'Я новенький, подскажите что делать',
  'Ку! Давно не заходил, что нового?',
  'GG, срубили дерево за 2 секунды',
  'А можно на вагон залезть?',
  'Погнали! Сегодня далеко уедем',
  'Классная игра, залипаю уже час',
  'Топор мой, никому не давам',
  'Сколько деревьев мы уже срубили?',
  'Помогите, я застрял за деревом!',
  'Всем привет с ночного стрима!',
]

export class StreamJourneyGame extends Container implements Game {
  id: Game['id']
  tick: Game['tick'] = 0
  bottomY: Game['bottomY'] = 270

  app: Application
  override children: GameObject[] = []

  eventService: GameEventService
  wagonService: GameWagonService
  playerService: GamePlayerService
  treeService: GameTreeService
  chunkService: GameChunkService
  caravanService: GameCaravanService

  /** Container that holds everything in the world — camera moves this */
  worldContainer: Container

  get currentBiome(): string {
    return this.treeService.getBiomeAt(this.wagonService.wagon?.x ?? 0)
  }

  get caravanProgress(): number {
    return this.caravanService.progress
  }

  get currentChunkName(): string {
    return this.chunkService.getCurrentChunk()?.name ?? ''
  }

  private demoMode: boolean
  private demoNames: string[]
  private demoCodenames = new Map<string, string>()
  private demoInterval: ReturnType<typeof setInterval> | undefined

  private groundGraphics: Container | undefined

  constructor({ roomId, demo, demoNames }: StreamJourneyGameOptions) {
    super()

    this.id = createId()
    this.app = new Application()
    this.worldContainer = new Container()
    this.demoMode = demo ?? false
    this.demoNames = demoNames?.length ? demoNames : FALLBACK_DEMO_NAMES

    this.eventService = new GameEventService(this, roomId ?? '')
    this.treeService = new GameTreeService(this)
    this.wagonService = new GameWagonService(this)
    this.playerService = new GamePlayerService(this)
    this.chunkService = new GameChunkService(this)
    this.caravanService = new GameCaravanService(this)
  }

  async init({ width }: { width: number }) {
    await this.app.init({
      backgroundAlpha: 0,
      antialias: false,
      roundPixels: false,
      resolution: 1,
      width,
      height: 300,
    })

    this.app.ticker.maxFPS = 60

    // Init chunks BEFORE drawing ground so biomes are consistent
    this.chunkService.update()
    this.drawGround()
    this.wagonService.init()

    this.worldContainer.sortableChildren = true
    this.worldContainer.addChild(this.groundGraphics!)
    this.worldContainer.addChild(this)
    this.app.stage.addChild(this.worldContainer)
    this.app.ticker.add(this.baseTicker, 'baseTicker')

    if (this.demoMode) {
      this.startDemo()
    }
  }

  private baseTicker = () => {
    this.tick = this.app.ticker.FPS

    this.wagonService.update()
    this.playerService.update()
    this.chunkService.update()
    this.treeService.update()
    this.caravanService.update()
    this.updateObjects()
  }

  /** Add any Container as decoration (bushes, particles, etc.) */
  addDecoration(child: Container) {
    super.addChild(child)
  }

  removeObject(id: string) {
    const obj = this.findObject(id)
    if (!obj) {
      return
    }

    this.removeChild(obj)
    obj.destroy()
  }

  override destroy() {
    if (this.demoInterval) {
      clearInterval(this.demoInterval)
    }

    this.eventService.destroy()
    this.app.destroy()
    super.destroy()
  }

  findObject(id: string): GameObject | undefined {
    return this.children.find((obj) => obj.id === id)
  }

  rebuildScene() {
    for (const obj of this.children) {
      obj.state = 'DESTROYED'
    }

    this.wagonService.init()

    this.app.ticker.remove(this.baseTicker, 'baseTicker')
    this.app.ticker.add(this.baseTicker, 'baseTicker')
  }

  private startDemo() {
    // Spawn a few players immediately
    for (let i = 0; i < 2; i++) {
      setTimeout(() => this.spawnDemoPlayer(), i * 1200)
    }

    // Then keep spawning every 8-15 seconds
    this.demoInterval = setInterval(() => {
      if (this.playerService.activePlayers.length < 4) {
        this.spawnDemoPlayer()
      } else {
        this.sendDemoMessage()
      }
    }, 8000 + Math.random() * 7000)
  }

  private async spawnDemoPlayer() {
    const activeIds = new Set(this.playerService.activePlayers.map((p) => p.id))
    const available = this.demoNames.filter((n) => !activeIds.has(`demo-${n}`))
    if (!available.length) {
      return
    }

    // Clean up codenames of destroyed players
    for (const [id, _] of this.demoCodenames) {
      if (!activeIds.has(id)) {
        this.demoCodenames.delete(id)
      }
    }

    const usedCodenames = new Set(this.demoCodenames.values())
    const availableCodenames = DEMO_CODENAMES.filter((c) => !usedCodenames.has(c))
    if (!availableCodenames.length) {
      return
    }

    const name = available[Math.floor(Math.random() * available.length)]!
    const codename = availableCodenames[Math.floor(Math.random() * availableCodenames.length)]!
    const message = DEMO_MESSAGES[Math.floor(Math.random() * DEMO_MESSAGES.length)]!

    const playerId = `demo-${name}`
    this.demoCodenames.set(playerId, codename)
    const level = Math.floor(Math.random() * 12) + 1
    const player = await this.playerService.init(playerId, name, codename, level)
    player.addMessage(message)
  }

  private sendDemoMessage() {
    const players = this.playerService.activePlayers
    if (!players.length) {
      return
    }

    const player = players[Math.floor(Math.random() * players.length)]!
    const message = DEMO_MESSAGES[Math.floor(Math.random() * DEMO_MESSAGES.length)]!
    player.addMessage(message)
  }

  private async spawnNpc() {
    const spawnPoint = this.wagonService.getRandomNearPoint()
    const npc = new NpcObject({
      game: this,
      x: spawnPoint.x,
      y: spawnPoint.y,
    })
    await npc.initNpc()
  }

  private drawGround() {
    const ground = new Container()
    const chunkSize = 48
    const totalChunks = 800
    const startX = -500

    const P = PALETTE
    // Ground palettes per biome: [grass1, grass2, dirt1, dirt2]
    const GROUND_BIOMES: Record<string, [number, number, number, number]> = {
      GREEN: [P.lightGreen, P.green2, P.brown2, P.brown1],
      BLUE: [P.blue3, P.blue2, P.brown2, P.brown1],
      STONE: [P.grayGreen3, P.grayGreen2, P.brown2, P.brown1],
      TEAL: [P.teal3, P.teal2, P.brown2, P.brown1],
      TOXIC: [P.lime, P.yellowGreen, P.brown2, P.brown1],
      VIOLET: [P.violet3, P.violet2, P.brown2, P.brown1],
    }

    for (let i = 0; i < totalChunks; i++) {
      const x = startX + i * chunkSize
      const biome = this.treeService.getBiomeAt(x)
      const [grass1, grass2, dirt1, dirt2] = GROUND_BIOMES[biome] ?? GROUND_BIOMES.GREEN!

      const g = new Graphics()

      // Grass top with random height variation
      const grassH = 4 + Math.floor(Math.random() * 4)
      g.rect(0, -grassH, chunkSize, grassH).fill(grass1)

      // Grass line
      g.rect(0, 0, chunkSize, 4).fill(grass2)

      // Dirt
      g.rect(0, 4, chunkSize, 10).fill(dirt1)
      g.rect(0, 14, chunkSize, 20).fill(dirt2)

      // Random dirt specks
      for (let s = 0; s < 3; s++) {
        const sx = Math.floor(Math.random() * (chunkSize - 4))
        const sy = 6 + Math.floor(Math.random() * 16)
        g.rect(sx, sy, 3, 2).fill(P.brownOrange)
      }

      // Random grass tufts on top
      if (Math.random() > 0.5) {
        const tx = Math.floor(Math.random() * (chunkSize - 6))
        g.rect(tx, -grassH - 2, 2, 3).fill(grass1)
        g.rect(tx + 3, -grassH - 3, 2, 4).fill(grass2)
      }

      // Bake into texture
      const bounds = g.getLocalBounds()
      const texture = this.app.renderer.generateTexture({
        target: g,
        textureSourceOptions: { scaleMode: 'nearest' },
      })
      g.destroy()

      const chunk = new Sprite(texture)
      chunk.pivot.set(-bounds.x, -bounds.y)
      chunk.x = x
      chunk.y = this.bottomY
      ground.addChild(chunk)
    }

    ground.zIndex = -100
    this.groundGraphics = ground
  }

  private updateObjects() {
    // Reverse iteration — lets objects remove themselves in live() without
    // shifting indices or allocating a snapshot of this.children each frame.
    for (let i = this.children.length - 1; i >= 0; i--) {
      const object = this.children[i]
      if (!object || object.destroyed) {
        continue
      }
      object.animate()
      object.live()
    }
  }
}
