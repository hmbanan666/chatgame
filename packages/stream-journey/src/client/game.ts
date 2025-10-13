import type { Game, GameObject } from './../types'
import { createId } from '@paralleldrive/cuid2'
import { Application, Container, TextureStyle } from 'pixi.js'
import { GameAssetService, GameEventService, GamePlayerService, GameTreeService, GameWagonService } from './services'

interface StreamJourneyGameOptions {
  eventsUrl: string
}

export class StreamJourneyGame extends Container implements Game {
  id: Game['id']
  tick: Game['tick'] = 0
  bottomY: Game['bottomY'] = 0

  app: Application
  override children: GameObject[] = []

  assetService: GameAssetService
  eventService: GameEventService
  wagonService: GameWagonService
  playerService: GamePlayerService
  treeService: GameTreeService

  constructor({ eventsUrl }: StreamJourneyGameOptions) {
    super()

    this.id = createId()
    this.app = new Application()

    this.eventService = new GameEventService(this, eventsUrl)
    this.assetService = new GameAssetService(this)
    this.wagonService = new GameWagonService(this)
    this.playerService = new GamePlayerService(this)
    this.treeService = new GameTreeService(this)
  }

  async init() {
    await this.app.init({
      backgroundAlpha: 0,
      antialias: false,
      roundPixels: false,
      resolution: 1,
      resizeTo: window,
    })

    await this.assetService.load()

    TextureStyle.defaultOptions.scaleMode = 'nearest'
    this.app.ticker.maxFPS = 60
    this.bottomY = this.app.screen.height - 100

    // this.app.screen.width = window.innerWidth
    // this.app.screen.height = window.innerHeight

    this.wagonService.init()

    this.app.stage.addChild(this)

    this.app.ticker.add(this.baseTicker, 'baseTicker')
  }

  private baseTicker = () => {
    this.tick = this.app.ticker.FPS

    this.playerService.update()
    this.treeService.update()
    this.updateObjects()

    this.wagonService.updateCameraPosition()
  }

  removeObject(id: string) {
    const obj = this.findObject(id)
    if (!obj) {
      return
    }

    const index = this.children.indexOf(obj)
    this.children.splice(index, 1)

    this.removeChild(obj)
  }

  override destroy() {
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

  private updateObjects() {
    for (const object of this.children) {
      if (object.state === 'DESTROYED') {
        this.removeObject(object.id)
      }

      object.animate()
      object.live()
    }
  }
}
