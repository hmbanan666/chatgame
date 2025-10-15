import type { Game, GameObject } from './../types'
import { createId } from '@paralleldrive/cuid2'
import { Application, Container } from 'pixi.js'
import { GameAssetService, GameEventService, GamePlayerService, GameTreeService, GameWagonService } from './services'

interface StreamJourneyGameOptions {
  eventsUrl: string
}

export class StreamJourneyGame extends Container implements Game {
  id: Game['id']
  tick: Game['tick'] = 0
  bottomY: Game['bottomY'] = 300

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
    this.treeService = new GameTreeService(this)
    this.wagonService = new GameWagonService(this)
    this.playerService = new GamePlayerService(this)
  }

  async init({ width }: { width: number }) {
    await this.app.init({
      backgroundAlpha: 0,
      antialias: false,
      roundPixels: false,
      resolution: 1,
      width,
      height: this.bottomY,
    })

    await this.assetService.load()

    this.app.ticker.maxFPS = 60

    this.wagonService.init()

    this.app.stage.addChild(this)
    this.app.ticker.add(this.baseTicker, 'baseTicker')
  }

  private baseTicker = () => {
    this.tick = this.app.ticker.FPS

    this.wagonService.update()
    this.playerService.update()
    this.treeService.update()
    this.updateObjects()
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
