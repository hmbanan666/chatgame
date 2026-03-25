import type { AnimatedSprite } from 'pixi.js'
import type {
  Game,
  GameObject,
  GameObjectUnit,
  GameUnitCodename,
} from '../../types'
import { createId } from '@paralleldrive/cuid2'
import { Container, Graphics, Text } from 'pixi.js'
import { BaseObject } from '../baseObject'
import { getRandInteger } from './../../utils/random'
import { DialogueInterface } from './dialogueInterface'

interface UnitObjectOptions {
  game: Game
  id?: string
  x: number
  y: number
  type: GameObject['type']
}

export class UnitObject extends BaseObject implements GameObjectUnit {
  override name!: GameObjectUnit['name']
  visual!: GameObjectUnit['visual']
  coins = 0
  dialogue: GameObjectUnit['dialogue']

  private dialogueInterface!: DialogueInterface
  private animationIdle!: AnimatedSprite | undefined
  private animationMoving!: AnimatedSprite | undefined

  constructor({ game, x, y, id, type }: UnitObjectOptions) {
    super({ game, x, y, id, type })

    this.coins = 0
    this.state = 'IDLE'

    this.zIndex = Math.round(this.y + 1)

    this.dialogue = {
      messages: [],
    }

    this.initInterfaces()
  }

  override live() {
    super.live()

    this.handleMessages()

    if (this.script) {
      return this.script.live()
    }
  }

  async initVisual(codename: string | undefined | null): Promise<void> {
    if (this.animationIdle) {
      this.removeChild(this.animationIdle)
      this.animationIdle = undefined
    }
    if (this.animationMoving) {
      this.removeChild(this.animationMoving)
      this.animationMoving = undefined
    }

    if (!codename) {
      codename = 'twitchy'
    }

    try {
      this.animationIdle = await this.game.assetService.getAnimatedSprite(codename as GameUnitCodename, 'idle')
    } catch {
      this.animationIdle = await this.game.assetService.getAnimatedSprite('twitchy', 'idle')
    }
    this.addChild(this.animationIdle)

    try {
      this.animationMoving = await this.game.assetService.getAnimatedSprite(codename as GameUnitCodename, 'moving')
    } catch {
      this.animationMoving = await this.game.assetService.getAnimatedSprite('twitchy', 'moving')
    }
    this.addChild(this.animationMoving)
  }

  addMessage(message: string): void {
    const MAX_CHARS = 100
    const messagePrepared = message.trim().slice(0, MAX_CHARS) + (message.length > MAX_CHARS ? '...' : '')

    this.dialogue.messages.push({
      id: createId(),
      text: messagePrepared,
    })
  }

  override animate() {
    if (
      !this.children?.length
      || !this.animationIdle
      || !this.animationMoving
    ) {
      return
    }

    super.animate()

    if (this.state === 'MOVING') {
      this.animationIdle.visible = false
      this.animationMoving.animationSpeed = 0.1
      this.animationMoving.visible = true

      if (this.direction === 'RIGHT') {
        this.animationMoving.scale.x = 4
        this.animationMoving.play()
      }
      if (this.direction === 'LEFT') {
        this.animationMoving.scale.x = -4
        this.animationMoving.play()
      }
    }

    if (
      this.state === 'IDLE'
      || this.state === 'CHOPPING'
      || this.state === 'MINING'
    ) {
      this.animationMoving.animationSpeed = 0
      this.animationMoving.currentFrame = 0
      this.animationMoving.visible = false

      this.animationIdle.animationSpeed = 0.05
      this.animationIdle.visible = true

      if (this.direction === 'LEFT') {
        this.animationIdle.scale.x = 4
        this.animationIdle.play()
      }
      if (this.direction === 'RIGHT') {
        this.animationIdle.scale.x = -4
        this.animationIdle.play()
      }
    }

    this.dialogueInterface.animate()
  }

  drawUserName(name: string, level = 1) {
    if (!name) {
      return
    }

    const formattedText = name.trim().slice(0, 18)

    const container = new Container()

    // Level badge
    const badge = this.createLevelBadge(level)
    container.addChild(badge)

    const basicText = new Text({
      text: formattedText,
      style: {
        fontFamily: 'monospace',
        fontSize: 19,
        fontWeight: '700',
        fill: '#ffffff',
        stroke: {
          color: '#2e222f',
          width: 4,
          alignment: 0,
        },
        align: 'center',
      },
    })

    basicText.x = badge.width + 4
    badge.y = (basicText.height - badge.height) / 2 + 2
    container.addChild(basicText)

    container.x = -container.width / 2
    container.y = 0

    this.addChild(container)
  }

  private createLevelBadge(level: number): Container {
    const badge = new Container()

    const text = new Text({
      text: `${level}`,
      style: {
        fontFamily: 'monospace',
        fontSize: 14,
        fontWeight: '900',
        fill: '#ffffff',
        align: 'center',
      },
    })

    const padX = 6
    const padY = 3
    const w = text.width + padX * 2
    const h = text.height + padY * 2

    const bg = new Graphics()
    bg.roundRect(0, 0, w, h, 4)
    bg.fill(0x905EA9)
    bg.stroke({ color: 0x45293F, width: 2 })
    badge.addChild(bg)

    text.x = padX
    text.y = padY
    badge.addChild(text)

    return badge
  }

  private initInterfaces() {
    this.dialogueInterface = new DialogueInterface(this)
    this.addChild(this.dialogueInterface)
  }

  private handleMessages() {
    const random = getRandInteger(1, 200)
    if (random === 1) {
      this.dialogue?.messages?.splice(0, 1)
    }
  }
}
