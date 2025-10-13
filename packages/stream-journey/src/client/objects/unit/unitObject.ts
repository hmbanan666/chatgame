import type {
  Game,
  GameObject,
  GameObjectUnit,
} from './../../../types'
import { createId } from '@paralleldrive/cuid2'
import { AnimatedSprite, Assets, Container, Graphics, Text } from 'pixi.js'
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

    this.dialogue = {
      messages: [],
    }

    this.initInterfaces()
  }

  override live() {
    this.handleMessages()

    if (this.script) {
      return this.script.live()
    }
  }

  async initVisual(codename: string | undefined | null = 'twitchy'): Promise<void> {
    if (this.animationIdle) {
      this.removeChild(this.animationIdle)
      this.animationIdle = undefined
    }
    if (this.animationMoving) {
      this.removeChild(this.animationMoving)
      this.animationMoving = undefined
    }

    try {
      const idle = await Assets.load(`https://storage.yandexcloud.net/chatgame-assets/units/${codename}/idle.json`)
      const idleSprite = new AnimatedSprite(idle.animations.main)
      idleSprite.anchor.set(0.5, 1)
      idleSprite.scale.set(4)
      this.animationIdle = idleSprite
      this.addChild(this.animationIdle)
    } catch (error) {
      console.error('Error loading idle animation:', error)
    }

    try {
      const moving = await Assets.load(`https://storage.yandexcloud.net/chatgame-assets/units/${codename}/moving.json`)
      const movingSprite = new AnimatedSprite(moving.animations.main)
      movingSprite.anchor.set(0.5, 1)
      movingSprite.scale.set(4)
      this.animationMoving = movingSprite
      this.addChild(this.animationMoving)
    } catch (error) {
      console.error('Error loading moving animation:', error)
    }
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

    this.zIndex = Math.round(this.y + 1)

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
      this.animationMoving.animationSpeed = 0
      this.animationMoving.currentFrame = 0
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

  drawUserName(name: string) {
    if (!name) {
      return
    }

    const container = new Container()

    const basicText = new Text({
      text: name,
      style: {
        fontFamily: 'Noto Serif',
        fontSize: 15,
        fontWeight: '600',
        fill: 0x451A03,
        align: 'center',
      },
    })

    const graphics = new Graphics()
    graphics.rect(-6, -2, basicText.width + 12, basicText.height + 4)
    graphics.fill(0xFEF3C7)

    container.addChild(graphics, basicText)

    const containerWidth = container.width / 2 - 12
    container.x = -containerWidth
    container.y = -120

    this.addChild(container)
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
